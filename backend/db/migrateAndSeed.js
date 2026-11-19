import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Chargement des variables d'environnement
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('\n❌ ERREUR : La variable d’environnement DATABASE_URL est manquante.')
  console.error('👉 Veuillez définir DATABASE_URL dans backend/.env ou dans vos variables système.')
  console.error('Exemple : DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/portfolio?sslmode=require\n')
  process.exit(1)
}

const { Pool } = pg

// Configuration du pool avec SSL activé pour les bases managées distantes (Neon, Supabase, Render, etc.)
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
})

async function runMigrationAndSeed() {
  const client = await pool.connect()

  try {
    console.log('\n🚀 [1/3] Connexion établie avec la base distante...')
    console.log('📦 [2/3] Exécution des migrations (création des tables)...')

    const schemaPath = path.join(__dirname, 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

    await client.query('BEGIN')
    await client.query(schemaSql)

    console.log('🌱 [3/3] Peuplement des données initiales (Seeding)...')

    // 1. Insertion du profil
    await client.query(`
      INSERT INTO profile (
        name, full_name, alias, role, title, short_bio, bio_short, full_bio, bio_full,
        location, email, phone, phone_secondary, whatsapp_url, github_url, linkedin_url,
        twitter_url, facebook_url, is_available, status_label, availability_status, accept_direct_messages
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT DO NOTHING
    `, [
      'Angoa Yao Jean',
      'Angoa Yao Jean',
      "Angy's",
      'Développeur Full-Stack Web',
      'Développeur Full-Stack Web',
      "Développeur Full-Stack curieux et pragmatique, je conçois des interfaces web fluides et des architectures fiables avec React, TypeScript et Node.js.",
      "Développeur Full-Stack curieux et pragmatique, je conçois des interfaces web fluides et des architectures fiables avec React, TypeScript et Node.js.",
      JSON.stringify([
        "Basé à Abidjan et ouvert au télétravail international, j'aime transformer des idées et des besoins métier en interfaces fluides, logiques et faciles à prendre en main.",
        "Mon approche repose sur l'autonomie, la clarté du code et une collaboration sincère et bienveillante avec les équipes."
      ]),
      "Basé à Abidjan et ouvert au télétravail international, j'aime transformer des idées et des besoins métier en interfaces fluides, logiques et faciles à prendre en main. Mon approche repose sur l'autonomie, la clarté du code et une collaboration sincère.",
      "Abidjan, Côte d'Ivoire (Disponible en remote)",
      'angynewdev@gmail.com',
      '+225 07 20 64 65 26',
      '+225 05 66 40 29 73',
      'https://wa.me/2250720646526',
      'https://github.com/angyDev01',
      'https://www.linkedin.com/in/angy-dev-532293357',
      'https://x.com/Angy656261',
      'https://www.facebook.com/share/1FGHSoJjo9/',
      true,
      'Disponible',
      'available',
      true
    ])

    // 2. Insertion des compétences
    const skillsToInsert = [
      // Frontend
      { name: 'React', category: 'frontend', icon: 'frontend', desc: 'Hooks, Context API, Patterns modulaires', is_featured: true, order: 1 },
      { name: 'TypeScript', category: 'frontend', icon: 'code', desc: 'Typage strict, inférence et refactoring sécurisé', is_featured: true, order: 2 },
      { name: 'Tailwind CSS', category: 'frontend', icon: 'frontend', desc: 'Design systems véloces et responsive mobile-first', is_featured: true, order: 3 },
      { name: 'HTML5 & CSS3', category: 'frontend', icon: 'frontend', desc: 'Sémantique standard, Flexbox, Grid', is_featured: false, order: 4 },
      { name: 'Accessibilité (A11y)', category: 'frontend', icon: 'sparkles', desc: 'Normes WCAG et navigation clavier', is_featured: false, order: 5 },
      // Backend
      { name: 'Node.js', category: 'backend', icon: 'backend', desc: 'Runtime asynchrone pour serveurs performants', is_featured: true, order: 1 },
      { name: 'Express.js', category: 'backend', icon: 'backend', desc: 'Routage REST et middlewares robustes', is_featured: true, order: 2 },
      { name: 'APIs RESTful', category: 'backend', icon: 'external', desc: 'Endpoints prédictibles et standards JSON', is_featured: false, order: 3 },
      { name: 'PostgreSQL / SQL', category: 'backend', icon: 'backend', desc: 'Modélisation relationnelle, requêtes et migrations', is_featured: false, order: 4 },
      { name: 'Supabase', category: 'backend', icon: 'backend', desc: 'Gestion de bases temps réel et auth RLS', is_featured: false, order: 5 },
      // Outils
      { name: 'Vite', category: 'tools', icon: 'tools', desc: 'Environnement de développement HMR ultra-rapide', is_featured: true, order: 1 },
      { name: 'Git & GitHub', category: 'tools', icon: 'github', desc: 'Gestion de branches, commits atomiques et PRs', is_featured: false, order: 2 },
      { name: 'Architecture Logicielle', category: 'tools', icon: 'tools', desc: 'Clean Code et séparation Données / UI', is_featured: false, order: 3 },
    ]

    const skillIdMap = new Map()

    for (const s of skillsToInsert) {
      const res = await client.query(`
        INSERT INTO skills (name, category, icon, description, is_featured, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO UPDATE SET
          category = EXCLUDED.category,
          icon = EXCLUDED.icon,
          description = EXCLUDED.description,
          is_featured = EXCLUDED.is_featured,
          display_order = EXCLUDED.display_order
        RETURNING id, name;
      `, [s.name, s.category, s.icon, s.desc, s.is_featured, s.order])

      if (res.rows[0]) {
        skillIdMap.set(res.rows[0].name, res.rows[0].id)
      }
    }

    // 3. Insertion des projets
    const projectsToInsert = [
      {
        slug: 'omnipulse',
        title: 'OmniPulse',
        tagline: 'Dashboard Analytics temps réel',
        category: 'Full-Stack',
        summary: 'Visualisation claire des métriques clés avec graphiques interactifs haute performance.',
        description: 'Face à la complexité des tableaux de bord surchargés, OmniPulse a été pensé pour offrir une lecture immédiate et fluide des indicateurs clés en temps réel. Conçu avec React, Recharts et Node.js, le projet met l\'accent sur la réactivité, le filtrage instantané et une ergonomie soignée.',
        images: ['/assets/projects/portfolio.svg'],
        demo_url: 'https://github.com/angyDev01',
        repo_url: 'https://github.com/angyDev01',
        is_featured: true,
        order: 1,
        skills: ['React', 'Tailwind CSS', 'Node.js']
      },
      {
        slug: 'artisanhub',
        title: 'ArtisanHub',
        tagline: 'Marketplace & E-commerce local',
        category: 'Full-Stack',
        summary: 'Marketplace valorisant les créateurs locaux avec catalogue réactif et géolocalisation.',
        description: 'Permettre aux artisans locaux de valoriser leur savoir-faire en ligne avec un parcours d’achat simple et intuitif. L\'application intègre la gestion des commandes, un panier d’achat réactif, une interface d’administration dédiée et un tunnel de commande sécurisé.',
        images: ['/assets/projects/todo.svg'],
        demo_url: 'https://github.com/angyDev01',
        repo_url: 'https://github.com/angyDev01',
        is_featured: true,
        order: 2,
        skills: ['React', 'TypeScript', 'Node.js']
      },
      {
        slug: 'devconnect',
        title: 'DevConnect',
        tagline: 'Espace d’entraide & partage de code',
        category: 'Frontend',
        summary: 'Plateforme collaborative de partage de snippets et d’entraide technique entre développeurs.',
        description: 'Créé pour faciliter le partage d’astuces et la résolution collaborative de blocages techniques. DevConnect propose un éditeur avec coloration syntaxique, un système d’échanges instantanés et une recherche rapide par thématique.',
        images: ['/assets/projects/api.svg'],
        demo_url: 'https://github.com/angyDev01',
        repo_url: 'https://github.com/angyDev01',
        is_featured: true,
        order: 3,
        skills: ['React', 'Vite', 'Tailwind CSS', 'Supabase']
      }
    ]

    for (const p of projectsToInsert) {
      const res = await client.query(`
        INSERT INTO projects (slug, title, tagline, category, summary, description, images, demo_url, repo_url, is_featured, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          tagline = EXCLUDED.tagline,
          category = EXCLUDED.category,
          summary = EXCLUDED.summary,
          description = EXCLUDED.description,
          images = EXCLUDED.images,
          demo_url = EXCLUDED.demo_url,
          repo_url = EXCLUDED.repo_url,
          is_featured = EXCLUDED.is_featured,
          display_order = EXCLUDED.display_order
        RETURNING id;
      `, [
        p.slug, p.title, p.tagline, p.category, p.summary, p.description,
        JSON.stringify(p.images), p.demo_url, p.repo_url, p.is_featured, p.order
      ])

      const projectId = res.rows[0].id

      // Association avec les compétences
      for (const skillName of p.skills) {
        const skillId = skillIdMap.get(skillName)
        if (skillId) {
          await client.query(`
            INSERT INTO project_skills (project_id, skill_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
          `, [projectId, skillId])
        }
      }
    }

    await client.query('COMMIT')
    console.log('\n✨ SUCCÈS TOTAL : La base distante est migrée et initialisée avec succès !')
    console.log('✅ Tables créées : profile, skills, projects, project_skills, contact_messages.')
    console.log('✅ Données de démarrage injectées.\n')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n❌ Échec de la migration/seeding :', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrationAndSeed()

