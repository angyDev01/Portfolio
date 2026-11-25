import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Charger backend/.env puis frontend/.env pour avoir à la fois DATABASE_URL et les clés VITE_SUPABASE
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '..', 'frontend', '.env') })

const DATABASE_URL = process.env.DATABASE_URL
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const { Pool } = pg

function formatMs(ms) {
  if (ms < 50) return `\x1b[32m${ms.toFixed(1)} ms\x1b[0m`
  if (ms < 200) return `\x1b[33m${ms.toFixed(1)} ms\x1b[0m`
  return `\x1b[31m${ms.toFixed(1)} ms\x1b[0m`
}

function statusBadge(ok, warn = false, labelOk = 'SAIN', labelWarn = 'ATTENTION', labelErr = 'CRITIQUE') {
  if (ok) return `\x1b[32m[✓ ${labelOk}]\x1b[0m`
  if (warn) return `\x1b[33m[! ${labelWarn}]\x1b[0m`
  return `\x1b[31m[✗ ${labelErr}]\x1b[0m`
}

async function runHealthCheck() {
  console.log('\n=============================================================')
  console.log(' 🫁 BILAN DE SANTÉ & FLUIDITÉ DE LA BASE DE DONNÉES (POSTGRESQL)')
  console.log('=============================================================\n')

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL manquante dans backend/.env')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })

  let client
  const findings = []

  try {
    const t0 = performance.now()
    client = await pool.connect()
    const connectTime = performance.now() - t0

    // -------------------------------------------------------------
    // 1. RTT & CONNECTIVITÉ
    // -------------------------------------------------------------
    const tPing = performance.now()
    const pingRes = await client.query('SELECT 1 AS ping, version();')
    const pingTime = performance.now() - tPing
    const pgVersion = pingRes.rows[0].version.split(' on ')[0]

    console.log('1. CONNECTIVITÉ & TEMPS DE RÉPONSE RÉSEAU (SQL)')
    console.log(`   - Handshake TCP/SSL Pool : ${formatMs(connectTime)}`)
    console.log(`   - RTT simple (SELECT 1)  : ${formatMs(pingTime)}`)
    console.log(`   - Version PostgreSQL     : ${pgVersion}\n`)

    // -------------------------------------------------------------
    // 2. ACTIVITÉ & SATURATION DU POOL DE CONNEXIONS
    // -------------------------------------------------------------
    console.log('2. POOL DE CONNEXIONS & CONCURRENCE (pg_stat_activity)')
    const maxConnRes = await client.query("SHOW max_connections;")
    const maxConn = parseInt(maxConnRes.rows[0].max_connections, 10)

    const connRes = await client.query(`
      SELECT 
        state,
        count(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state;
    `)

    let totalConn = 0
    let activeConn = 0
    let idleInTx = 0

    for (const r of connRes.rows) {
      const c = parseInt(r.count, 10)
      totalConn += c
      if (r.state === 'active') activeConn += c
      if (r.state && r.state.includes('idle in transaction')) idleInTx += c
    }

    const connUsagePct = ((totalConn / maxConn) * 100).toFixed(1)
    const connOk = connUsagePct < 70 && idleInTx === 0
    console.log(`   - Connexions totales    : ${totalConn} / ${maxConn} (${connUsagePct}%)`)
    console.log(`   - Requêtes actives      : ${activeConn}`)
    console.log(`   - Idle in transaction   : ${idleInTx === 0 ? '0 (aucun blocage)' : `⚠️ ${idleInTx} bloquées`}`)
    console.log(`   - Statut fluidité       : ${statusBadge(connOk, connUsagePct < 85)}\n`)

    if (idleInTx > 0) findings.push(`Attention : ${idleInTx} transaction(s) en 'idle in transaction' (risque de verrou orphelin).`)
    if (connUsagePct >= 70) findings.push(`Saturation connexions élevée (${connUsagePct}% de max_connections).`)

    // -------------------------------------------------------------
    // 3. VERROUS ACTIFS & REQUÊTES LONGUES
    // -------------------------------------------------------------
    console.log('3. ANALYSE DES VERROUS & REQUÊTES LENTES (pg_locks)')
    const locksRes = await client.query(`
      SELECT count(*) as waiting_locks
      FROM pg_locks
      WHERE NOT granted;
    `)
    const waitingLocks = parseInt(locksRes.rows[0].waiting_locks, 10)

    const slowRes = await client.query(`
      SELECT 
        pid, 
        now() - query_start AS duration, 
        query 
      FROM pg_stat_activity 
      WHERE state = 'active' 
        AND now() - query_start > interval '1000 milliseconds'
        AND pid <> pg_backend_pid();
    `)
    const slowQueries = slowRes.rows

    console.log(`   - Verrous en attente    : ${waitingLocks} ${waitingLocks === 0 ? '✓ (aucun conflit de verrou)' : '❌ ATTENTE DÉTECTÉE'}`)
    console.log(`   - Requêtes > 1000ms     : ${slowQueries.length} ${slowQueries.length === 0 ? '✓ (aucune lenteur active)' : '⚠️ requêtes lentes'}`)
    console.log(`   - Statut verrous        : ${statusBadge(waitingLocks === 0 && slowQueries.length === 0)}\n`)

    if (waitingLocks > 0) findings.push(`Alerte critique : ${waitingLocks} transaction(s) en attente de verrou !`)

    // -------------------------------------------------------------
    // 4. TAUX DE SUCCÈS EN CACHE (CACHE HIT RATIO - RAM)
    // -------------------------------------------------------------
    console.log('4. EFFICACITÉ DE LA MÉMOIRE CACHE (Buffer Cache Hit Ratio)')
    const cacheRes = await client.query(`
      SELECT 
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit)  as heap_hit,
        sum(idx_blks_read)  as idx_read,
        sum(idx_blks_hit)   as idx_hit
      FROM pg_statio_user_tables;
    `)

    const row = cacheRes.rows[0]
    const heapRead = parseFloat(row.heap_read || 0)
    const heapHit = parseFloat(row.heap_hit || 0)
    const idxRead = parseFloat(row.idx_read || 0)
    const idxHit = parseFloat(row.idx_hit || 0)

    const tableHitRatio = heapRead + heapHit > 0 ? ((heapHit / (heapRead + heapHit)) * 100) : 100
    const indexHitRatio = idxRead + idxHit > 0 ? ((idxHit / (idxRead + idxHit)) * 100) : 100
    const globalHitRatio = (heapRead + heapHit + idxRead + idxHit) > 0 
      ? (((heapHit + idxHit) / (heapRead + heapHit + idxRead + idxHit)) * 100) 
      : 100

    const cacheOk = globalHitRatio >= 98
    console.log(`   - Cache tables (Data)   : ${tableHitRatio.toFixed(2)}%`)
    console.log(`   - Cache index (Index)   : ${indexHitRatio.toFixed(2)}%`)
    console.log(`   - Cache global (RAM)    : ${globalHitRatio.toFixed(2)}% (lectures servies depuis la mémoire vive)`)
    console.log(`   - Statut mémoire        : ${statusBadge(cacheOk, globalHitRatio >= 90)}\n`)

    if (globalHitRatio < 95 && (heapRead + heapHit) > 1000) {
      findings.push(`Cache hit ratio inférieur à 95% (${globalHitRatio.toFixed(1)}%). Revoir les requêtes lisant trop de disque.`)
    }

    // -------------------------------------------------------------
    // 5. FRAGMENTATION (BLOAT) & AUTOVACUUM
    // -------------------------------------------------------------
    console.log('5. VOLUMÉTRIE, TUPLES MORTS & AUTOVACUUM (pg_stat_user_tables)')
    const bloatRes = await client.query(`
      SELECT 
        relname,
        n_live_tup,
        n_dead_tup,
        CASE WHEN (n_live_tup + n_dead_tup) > 0 
             THEN round((n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric) * 100, 1)
             ELSE 0 
        END AS dead_pct,
        last_autovacuum,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_dead_tup DESC;
    `)

    let totalLive = 0
    let totalDead = 0
    let highDeadTables = []

    for (const t of bloatRes.rows) {
      const live = parseInt(t.n_live_tup, 10)
      const dead = parseInt(t.n_dead_tup, 10)
      const deadPct = parseFloat(t.dead_pct)
      totalLive += live
      totalDead += dead
      if (dead > 50 && deadPct > 20) {
        highDeadTables.push(`${t.relname} (${deadPct}% morts)`)
      }
    }

    const overallDeadPct = totalLive + totalDead > 0 ? ((totalDead / (totalLive + totalDead)) * 100).toFixed(1) : '0.0'
    const bloatOk = highDeadTables.length === 0

    console.log(`   - Enregistrements actifs : ${totalLive} lignes`)
    console.log(`   - Tuples morts (déchets) : ${totalDead} (${overallDeadPct}%)`)
    console.log(`   - Tables fragmentées (>20%): ${highDeadTables.length === 0 ? 'Aucune ✓' : highDeadTables.join(', ')}`)
    console.log(`   - Statut autovacuum      : ${statusBadge(bloatOk, true)}\n`)

    if (highDeadTables.length > 0) {
      findings.push(`Tables nécessitant un VACUUM : ${highDeadTables.join(', ')}`)
    }

    // -------------------------------------------------------------
    // 6. CLÉS ÉTRANGÈRES NON INDEXÉES (RISQUE DE LOCK TABLE)
    // -------------------------------------------------------------
    console.log('6. VÉRIFICATION DES CLÉS ÉTRANGÈRES (FK Indexing)')
    const fkRes = await client.query(`
      SELECT
        c.conrelid::regclass AS table_name,
        c.conname AS fk_name,
        pg_get_constraintdef(c.oid) AS def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND NOT EXISTS (
          SELECT 1 FROM pg_index i
          WHERE i.indrelid = c.conrelid
            AND (i.indkey::smallint[])[0] = (c.conkey)[1]
        );
    `)

    const unindexedFks = fkRes.rows
    const fkOk = unindexedFks.length === 0
    console.log(`   - Clés étrangères orphelines d'index : ${unindexedFks.length}`)
    if (unindexedFks.length > 0) {
      for (const fk of unindexedFks) {
        console.log(`     ⚠️  Table [${fk.table_name}] : ${fk.fk_name} -> ${fk.def}`)
        findings.push(`Index recommandé sur la clé étrangère : ${fk.table_name}(${fk.fk_name})`)
      }
    } else {
      console.log('     ✓ Toutes les clés étrangères disposent d\'un index support.')
    }
    console.log(`   - Statut clés étrangères : ${statusBadge(fkOk, true)}\n`)

    // -------------------------------------------------------------
    // 7. BENCHMARK EXPLAIN ANALYZE SUR LES REQUÊTES PRINCIPALES
    // -------------------------------------------------------------
    console.log('7. LATENCE D\'EXÉCUTION DU PLANIFICATEUR (EXPLAIN ANALYZE)')

    // Vérifier si le module optionnel communauté est migré
    const hasCommunityRes = await client.query("SELECT to_regclass('public.announcements') AS tbl;")
    const hasCommunity = hasCommunityRes.rows[0].tbl !== null

    const queriesToBenchmark = [
      {
        name: 'Projets + Relations',
        sql: `EXPLAIN (ANALYZE, BUFFERS) 
              SELECT p.*, COALESCE(json_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '[]') as skills
              FROM projects p
              LEFT JOIN project_skills ps ON ps.project_id = p.id
              LEFT JOIN skills s ON s.id = ps.skill_id
              GROUP BY p.id
              ORDER BY p.is_featured DESC, p.display_order ASC;`
      },
      {
        name: 'Compétences par Catégorie',
        sql: `EXPLAIN (ANALYZE, BUFFERS)
              SELECT * FROM skills
              ORDER BY category, display_order;`
      },
      {
        name: 'Analytics Page Views (30 derniers jours)',
        sql: `EXPLAIN (ANALYZE, BUFFERS)
              SELECT view_date, count(*) as count
              FROM page_views
              WHERE view_date >= CURRENT_DATE - INTERVAL '30 days'
              GROUP BY view_date
              ORDER BY view_date ASC;`
      }
    ]

    if (hasCommunity) {
      queriesToBenchmark.push({
        name: 'Annonces & Commentaires récents',
        sql: `EXPLAIN (ANALYZE, BUFFERS)
              SELECT a.*, count(c.id) as comments_count
              FROM announcements a
              LEFT JOIN announcement_comments c ON c.announcement_id = a.id AND c.status = 'approved'
              GROUP BY a.id
              ORDER BY a.is_pinned DESC, a.created_at DESC;`
      })
      queriesToBenchmark.push({
        name: 'RPC Sondages Actifs (get_polls_with_results)',
        sql: `EXPLAIN (ANALYZE, BUFFERS)
              SELECT * FROM public.get_polls_with_results('health-check-hash');`
      })
    } else {
      console.log('   ℹ️  Module Communauté & Sondages non migré sur cette instance (Optionnel)\n')
    }

    for (const q of queriesToBenchmark) {
      try {
        const res = await client.query(q.sql)
        const planText = res.rows.map(r => r['QUERY PLAN']).join('\n')
        const execMatch = planText.match(/Execution Time: ([\d.]+) ms/)
        const planTimeMatch = planText.match(/Planning Time: ([\d.]+) ms/)
        const execTime = execMatch ? parseFloat(execMatch[1]) : 0
        const planTime = planTimeMatch ? parseFloat(planTimeMatch[1]) : 0
        const total = execTime + planTime

        console.log(`   - [${q.name}]`)
        console.log(`     Temps SQL pur : ${formatMs(total)} (Plan: ${planTime.toFixed(2)}ms | Exec: ${execTime.toFixed(2)}ms)`)
        if (planText.includes('Seq Scan') && total > 50) {
          console.log(`     ⚠️  Seq Scan détecté sur grand volume`)
        }
      } catch (err) {
        console.log(`   - [${q.name}] : Note d'exécution (${err.message.split('\n')[0]})`)
      }
    }
    console.log('')

    // -------------------------------------------------------------
    // 8. MESURE DU TEMPS DE RÉPONSE REST SUPABASE (PostgREST)
    // -------------------------------------------------------------
    console.log('8. TEST DE LATENCE BOUT-EN-BOUT REST SUPABASE (PostgREST / Frontend)')
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.log('   ⚠️ Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY absentes, test REST sauté.')
    } else {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false }
      })

      const restTests = [
        {
          name: 'Profil public (profile.select)',
          run: () => supabase.from('profile').select('id, name, alias, role').limit(1)
        },
        {
          name: 'Catalogue projets (projects.select)',
          run: () => supabase.from('projects').select('id, title, is_featured, category').limit(10)
        },
        {
          name: 'Inventaire compétences (skills.select)',
          run: () => supabase.from('skills').select('id, name, category, display_order').limit(20)
        }
      ]

      if (hasCommunity) {
        restTests.push(
          {
            name: 'Annonces communauté (announcements.select)',
            run: () => supabase.from('announcements').select('id, title, is_pinned').limit(5)
          },
          {
            name: 'RPC Sondages (get_polls_with_results)',
            run: () => supabase.rpc('get_polls_with_results', { p_visitor_hash: 'bench' })
          }
        )
      }

      for (const t of restTests) {
        const tStart = performance.now()
        const { error } = await t.run()
        const duration = performance.now() - tStart

        if (error) {
          console.log(`   - ${t.name.padEnd(42)} : \x1b[31mErreur (${error.message})\x1b[0m`)
        } else {
          console.log(`   - ${t.name.padEnd(42)} : ${formatMs(duration)}`)
        }
      }
    }
    console.log('')

    // -------------------------------------------------------------
    // SYNTHÈSE GLOBALE
    // -------------------------------------------------------------
    console.log('=============================================================')
    console.log(' 🩺 SYNTHÈSE GLOBALE DE RESPIRATION')
    console.log('=============================================================')
    if (findings.length === 0) {
      console.log(' \x1b[32m✅ LA BASE DE DONNÉES RESPIRE PARFAITEMENT :\x1b[0m')
      console.log('   - Aucune contention de verrous.')
      console.log('   - Taux de cache en mémoire optimal.')
      console.log('   - Index efficients et temps de réponse en deçà des seuils.')
      console.log('   - Aucun blocage orphelin (idle in transaction = 0).')
    } else {
      console.log(' \x1b[33m⚠️ POINTS D\'ATTENTION DÉTECTÉS :\x1b[0m')
      for (const f of findings) {
        console.log(`   - ${f}`)
      }
    }
    console.log('=============================================================\n')

  } catch (err) {
    console.error('❌ Erreur durant le bilan de santé :', err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
}

runHealthCheck()
