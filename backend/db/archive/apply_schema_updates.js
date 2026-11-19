import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function apply() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log('1. Creating page_views table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        page_path VARCHAR(255) NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
    `)

    console.log('2. Adding status column to projects...')
    await pool.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'completed';
    `)

    console.log('3. Adding availability_status & accept_direct_messages to profile...')
    await pool.query(`
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'available';
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS accept_direct_messages BOOLEAN DEFAULT true;
    `)

    console.log('4. Applying RLS policies from policies.sql...')
    const sqlPath = path.join(__dirname, 'policies.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
    await pool.query(sqlContent)

    console.log('Schema updates & RLS policies successfully applied!')
  } catch (err) {
    console.error('Error applying updates:', err)
  } finally {
    await pool.end()
  }
}

apply()

