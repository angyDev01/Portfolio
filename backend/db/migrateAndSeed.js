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
      INSERT INTO profile (name, alias, role, short_bio, full_bio, email, github_url, linkedin_url, is_available, status_label)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT DO NOTHING
    `, [
      'Yao Jean Angoa',
      'Angy',
      'Développeur Full-Stack Web',
      'Développeur autodidacte passionné par la conception d’applications web réactives, modulaires et performantes.',
      JSON.stringify([
        'Développeur autodidacte passionné par l’ingénierie logicielle web moderne. Je conçois des interfaces nettes, accessibles et des architectures serveur robustes.',
        'Spécialisé dans l’écosystème React, Vite, Node.js et TypeScript, j’accorde une attention méticuleuse à l’ergonomie, aux performances et à la qualité du code.',
        'Constamment en veille technologique, j’aime transformer des exigences complexes en composants réutilisables et faciles à maintenir.'
      ]),
      'contact@angy.dev',
      'https://github.com/angyDev01',
      'https://linkedin.com/in/angydev',
      true,
      'Disponible pour de nouvelles opportunités'
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
        summary: 'Plateforme de visualisation métrique en temps réel avec graphiques interactifs haute performance.',
        description: 'OmniPulse agrège des flux analytiques pour offrir une vue consolidée des performances système et d’affaires. Conçu avec React, Recharts et Node.js.',
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
        summary: 'Marketplace mettant en relation artisans locaux et acheteurs avec catalogue réactif et géolocalisation.',
        description: 'Plateforme e-commerce complète avec gestion des commandes, panier d’achat, interface d’administration artisan et paiement sécurisé.',
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
        tagline: 'Espace collaboratif développeurs',
        category: 'Frontend',
        summary: 'Espace d’entraide technique et de partage de snippets de code pour développeurs indépendants.',
        description: 'Application collaborative intégrant la coloration syntaxique, les avis de code en temps réel et la messagerie instantanée.',
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

