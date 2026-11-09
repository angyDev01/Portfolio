import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: './backend/.env' })

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  try {
    console.log('1. Suppression de la contrainte trop stricte skills_category_check...')
    await pool.query('ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_category_check;')

    console.log('2. Recréation de la contrainte souple avec LOWER(category)...')
    await pool.query(`
      ALTER TABLE skills ADD CONSTRAINT skills_category_check 
      CHECK (LOWER(category) IN ('frontend', 'backend', 'tools', 'database', 'devops', 'mobile', 'other'));
    `)

    console.log('✅ Contrainte skills_category_check mise à jour avec succès en base !')
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour de la contrainte :', err)
  } finally {
    await pool.end()
  }
}

run()

