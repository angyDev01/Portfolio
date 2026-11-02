import pg from 'pg'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

const { Pool } = pg
const DATABASE_URL = process.env.DATABASE_URL

let pool = null
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })
}

app.use(cors())
app.use(express.json())

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'operational', timestamp: new Date().toISOString() })
})

// GET /api/profile : Récupérer le profil actif
app.get('/api/profile', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  try {
    const result = await pool.query('SELECT * FROM profile ORDER BY created_at DESC LIMIT 1')
    res.json(result.rows[0] || null)
  } catch (err) {
    console.error('Error fetching profile:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/projects : Récupérer tous les projets avec leurs compétences jointes
app.get('/api/projects', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(s.name ORDER BY s.display_order) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as skills
      FROM projects p
      LEFT JOIN project_skills ps ON p.id = ps.project_id
      LEFT JOIN skills s ON ps.skill_id = s.id
      GROUP BY p.id
      ORDER BY p.is_featured DESC, p.display_order ASC, p.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching projects:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/skills : Récupérer toutes les compétences ordonnées
app.get('/api/skills', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY display_order ASC, created_at ASC')
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching skills:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/contact : Enregistrer un message
app.post('/api/contact', async (req, res) => {
  if (!pool) return res.status(500).json({ ok: false, message: 'Database not initialized' })
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'Tous les champs sont requis.' })
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    await pool.query(
      'INSERT INTO contact_messages (name, email, message, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [name.trim(), email.trim(), message.trim(), String(ip || ''), String(userAgent || '')]
    )

    res.json({ ok: true, message: 'Merci pour votre message ! Je vous répondrai dans les plus brefs délais.' })
  } catch (err) {
    console.error('Error saving contact message:', err)
    res.status(500).json({ ok: false, message: 'Impossible d’enregistrer le message.' })
  }
})

app.listen(PORT, () => {
  console.log(`Portfolio API Server running on port ${PORT}`)
})
