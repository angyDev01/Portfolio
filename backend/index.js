import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Chargement des variables d'environnement depuis backend/.env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Initialisation du client Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log('Supabase client initialized successfully.')
} else {
  console.warn('Supabase URL or Key missing in environment variables. Database routes will fail.')
}

// Middleware CORS pour autoriser le frontend
app.use(cors())
// Middleware JSON pour parser les requêtes entrantes
app.use(express.json())

// Middleware de vérification de l'administrateur
function verifyAdmin(req, res, next) {
  const password = req.headers['authorization'] || req.headers['x-admin-password']
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  
  // Supprime le préfixe "Bearer " si présent
  const cleanPassword = password && password.startsWith('Bearer ') ? password.slice(7) : password
  
  if (cleanPassword === expected) {
    next()
  } else {
    res.status(401).json({ ok: false, message: 'Non autorisé. Veuillez fournir le mot de passe administrateur correct.' })
  }
}

// --- ROUTES PUBLIQUES ---

// Route de santé simple
app.get('/', (req, res) => res.send('Angy.Dev API - Supabase Connected'))

// GET /api/projects : Récupérer tous les projets
app.get('/api/projects', async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    // Formater pour la compatibilité avec le frontend (description -> desc)
    const mapped = data.map(p => ({
      id: p.id,
      title: p.title,
      desc: p.description,
      tech: p.tech,
      image: p.image,
      featured: p.featured,
      created_at: p.created_at
    }))
    
    res.json(mapped)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la récupération des projets.' })
  }
})

// GET /api/posts : Récupérer tous les articles de blog
app.get('/api/posts', async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    // Formater pour correspondre aux attentes du frontend
    const mapped = data.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      date: p.date_str,
      excerpt: p.excerpt,
      tags: p.tags,
      content: p.content,
      created_at: p.created_at,
      link: `#/blog/${p.slug}`
    }))
    
    res.json(mapped)
  } catch (error) {
    console.error('Error fetching posts:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la récupération des articles.' })
  }
})

// POST /api/contact : Enregistrer un message de contact dans Supabase
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'Tous les champs sont requis.' })
  }
  
  if (!supabase) {
    return res.status(500).json({ ok: false, message: 'Base de données non configurée.' })
  }

  try {
    const { error } = await supabase
      .from('messages')
      .insert([{ 
        name: name.trim(), 
        email: email.trim(), 
        message: message.trim() 
      }])
    
    if (error) throw error
    
    res.json({ ok: true, message: 'Votre message a bien été envoyé et enregistré.' })
  } catch (error) {
    console.error('Erreur lors de l’enregistrement du message:', error)
    res.status(500).json({ ok: false, message: 'Erreur serveur lors de l’enregistrement.' })
  }
})

// Intercepte les requêtes GET sur la route de contact
app.get('/api/contact', (req, res) => {
  res.status(405).json({ 
    ok: false, 
    message: "Méthode non autorisée. Cette route n'accepte que les requêtes POST." 
  })
})

// POST /api/visits : Incrémenter le compteur de visites
app.post('/api/visits', async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  try {
    // Essayer de lire le compteur de visites existant
    let { data, error } = await supabase
      .from('stats')
      .select('count')
      .eq('id', 'visits')
      .maybeSingle()
      
    if (error) throw error

    let newCount = 1
    if (data) {
      newCount = data.count + 1
      const { error: updateError } = await supabase
        .from('stats')
        .update({ count: newCount })
        .eq('id', 'visits')
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('stats')
        .insert([{ id: 'visits', count: 1 }])
      if (insertError) throw insertError
    }
    
    res.json({ ok: true, count: newCount })
  } catch (error) {
    console.error('Error updating visits:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors du comptage de la visite.' })
  }
})

// --- ROUTES D'ADMINISTRATION (SÉCURISÉES) ---

// POST /api/admin/login : Validation de mot de passe
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  if (password === expected) {
    res.json({ ok: true, message: 'Authentification réussie.' })
  } else {
    res.status(401).json({ ok: false, message: 'Mot de passe incorrect.' })
  }
})

// GET /api/admin/stats : Récupérer statistiques globales + messages de contact
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  try {
    // 1. Visites
    const { data: statsData, error: statsError } = await supabase
      .from('stats')
      .select('count')
      .eq('id', 'visits')
      .maybeSingle()
      
    if (statsError) throw statsError
    const visits = statsData ? statsData.count : 0
    
    // 2. Messages de contact
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (messagesError) throw messagesError
    
    res.json({ 
      ok: true, 
      stats: { 
        visits, 
        messagesCount: messagesData.length 
      }, 
      messages: messagesData 
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la récupération des données administrateur.' })
  }
})

// POST /api/projects : Créer un nouveau projet
app.post('/api/projects', verifyAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  const { title, desc, tech, image, featured } = req.body
  if (!title || !desc || !tech) {
    return res.status(400).json({ ok: false, message: 'Le titre, la description et les technologies sont requis.' })
  }
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        title, 
        description: desc, 
        tech, 
        image: image || null, 
        featured: !!featured 
      }])
      .select()
      
    if (error) throw error
    res.json({ ok: true, message: 'Projet créé avec succès.', data: data[0] })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la création du projet.' })
  }
})

// DELETE /api/projects/:id : Supprimer un projet
app.delete('/api/projects/:id', verifyAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  const { id } = req.params
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    res.json({ ok: true, message: 'Projet supprimé avec succès.' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la suppression du projet.' })
  }
})

// POST /api/posts : Créer un nouvel article de blog
app.post('/api/posts', verifyAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  const { title, slug, excerpt, tags, content } = req.body
  if (!title || !slug || !excerpt || !tags || !content) {
    return res.status(400).json({ ok: false, message: 'Tous les champs sont requis.' })
  }
  
  // Formatage de la date en français (ex: "5 août 2026")
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  const dateStr = new Date().toLocaleDateString('fr-FR', options)
  
  const parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)
  const parsedContent = Array.isArray(content) ? content : content.split('\n\n').map(p => p.trim()).filter(Boolean)

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
        title, 
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'), 
        date_str: dateStr, 
        excerpt, 
        tags: parsedTags, 
        content: parsedContent
      }])
      .select()
      
    if (error) throw error
    res.json({ ok: true, message: 'Article créé avec succès.', data: data[0] })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la création de l\'article.' })
  }
})

// DELETE /api/posts/:id : Supprimer un article
app.delete('/api/posts/:id', verifyAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ ok: false, message: 'Database not initialized.' })
  const { id } = req.params
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    res.json({ ok: true, message: 'Article supprimé avec succès.' })
  } catch (error) {
    console.error('Error deleting post:', error)
    res.status(500).json({ ok: false, message: 'Erreur lors de la suppression de l\'article.' })
  }
})

// Démarrage du serveur Express
const server = app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`))
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} est déjà utilisé. Arrêtez le serveur existant ou changez le port dans backend/.env.`)
    process.exit(1)
  }
  throw error
})
