import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL

let pool = null

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })

  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err)
  })
}

/**
 * Exécute une requête SQL paramétrée sur la base de données.
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres sécurisés contre les injections SQL
 */
export async function query(text, params) {
  if (!pool) {
    throw new Error('La base de données n’est pas initialisée. Veuillez configurer DATABASE_URL.')
  }
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV === 'development') {
    console.log('Query exécutée', { text: text.slice(0, 50), duration: `${duration}ms`, rows: res.rowCount })
  }
  return res
}

export function isDbConnected() {
  return pool !== null
}

export default {
  query,
  isDbConnected
}

