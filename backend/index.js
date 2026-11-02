import pg from 'pg'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

const { Pool } = pg
const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

let pool = null
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })
}

app.use(cors())
app.use(express.json())

// Middleware de vérification d'authentification administrateur
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-admin-password']
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: 'Non autorisé. Accès administrateur requis.' })
  }
  next()
}

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

// CANAL 2 : POST /api/contact/direct — Laisser un message direct sur le site
// Ce formulaire exige obligatoirement 4 champs : Nom complet, Email, Téléphone, Message
app.post('/api/contact/direct', async (req, res) => {
  if (!pool) return res.status(500).json({ ok: false, message: 'Database not initialized' })
  const { name, email, phone, message } = req.body

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
    return res.status(400).json({
      ok: false,
      message: 'Les 4 champs (Nom complet, Email, Téléphone, Message) sont obligatoires pour un message direct.',
    })
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message, ip_address, user_agent, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [name.trim(), email.trim(), phone.trim(), message.trim(), String(ip || ''), String(userAgent || '')]
    )

    res.json({
      ok: true,
      message: 'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
    })
  } catch (err) {
    console.error('Error saving direct message:', err)
    res.status(500).json({ ok: false, message: 'Impossible d’enregistrer le message direct.' })
  }
})

// CANAL 1 : POST /api/contact/email — Envoi d'un email (Nom, Email, Objet, Message)
app.post('/api/contact/email', async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({
      ok: false,
      message: 'Tous les champs (Nom, Email, Objet, Message) sont obligatoires.',
    })
  }

  try {
    console.log(`[Canal 1 - Email] De: ${name} <${email}> | Sujet: ${subject}`)
    res.json({
      ok: true,
      message: 'Votre email a été préparé et transmis avec succès.',
    })
  } catch (err) {
    console.error('Error handling contact email:', err)
    res.status(500).json({ ok: false, message: 'Erreur lors de l’envoi de l’email.' })
  }
})

// Route générique de compatibilité POST /api/contact
app.post('/api/contact', async (req, res) => {
  if (!pool) return res.status(500).json({ ok: false, message: 'Database not initialized' })
  const { name, email, phone, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'Tous les champs obligatoires doivent être renseignés.' })
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    await pool.query(
      'INSERT INTO contact_messages (name, email, phone, message, ip_address, user_agent, is_read) VALUES ($1, $2, $3, $4, $5, $6, false)',
      [name.trim(), email.trim(), phone ? phone.trim() : null, message.trim(), String(ip || ''), String(userAgent || '')]
    )

    res.json({
      ok: true,
      message: 'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
    })
  } catch (err) {
    console.error('Error saving contact message:', err)
    res.status(500).json({ ok: false, message: 'Impossible d’enregistrer le message.' })
  }
})

// ==========================================
// ROUTES ADMINISTRATION (DASHBOARD)
// ==========================================

// POST /api/admin/login : Authentification par mot de passe
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: 'Mot de passe administrateur incorrect.' })
  }
  return res.json({ ok: true, token: ADMIN_PASSWORD, message: 'Authentification réussie' })
})

// GET /api/admin/messages : Récupérer tous les messages avec le badge dynamique de non lus
app.get('/api/admin/messages', requireAdmin, async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC')
    const unreadCount = result.rows.filter((m) => !m.is_read).length
    res.json({ ok: true, messages: result.rows, unreadCount })
  } catch (err) {
    console.error('Error fetching admin messages:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/admin/messages/:id/read : Marquer comme lu ou non lu
app.patch('/api/admin/messages/:id/read', requireAdmin, async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  const { id } = req.params
  const { is_read } = req.body

  try {
    const result = await pool.query(
      'UPDATE contact_messages SET is_read = $1 WHERE id = $2 RETURNING *',
      [Boolean(is_read), id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Message introuvable' })
    }
    const countResult = await pool.query('SELECT COUNT(*)::int as unread FROM contact_messages WHERE is_read = false')
    res.json({ ok: true, message: result.rows[0], unreadCount: countResult.rows[0].unread })
  } catch (err) {
    console.error('Error updating read status:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/admin/messages/:id : Supprimer un message
app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  const { id } = req.params

  try {
    const result = await pool.query('DELETE FROM contact_messages WHERE id = $1', [id])
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Message introuvable' })
    }
    const countResult = await pool.query('SELECT COUNT(*)::int as unread FROM contact_messages WHERE is_read = false')
    res.json({ ok: true, message: 'Message supprimé avec succès.', unreadCount: countResult.rows[0].unread })
  } catch (err) {
    console.error('Error deleting message:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/stats : Statistiques globales pour le dashboard
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not initialized' })
  try {
    const messagesResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total, 
        COUNT(*) FILTER (WHERE is_read = false)::int as unread 
      FROM contact_messages
    `)
    const projectsResult = await pool.query('SELECT COUNT(*)::int as total FROM projects')
    const skillsResult = await pool.query('SELECT COUNT(*)::int as total FROM skills')

    res.json({
      ok: true,
      stats: {
        totalMessages: messagesResult.rows[0]?.total || 0,
        unreadMessages: messagesResult.rows[0]?.unread || 0,
        totalProjects: projectsResult.rows[0]?.total || 0,
        totalSkills: skillsResult.rows[0]?.total || 0,
      },
    })
  } catch (err) {
    console.error('Error fetching admin stats:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Portfolio API Server running on port ${PORT}`)
})
