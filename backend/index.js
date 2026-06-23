import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'

// Chargement des variables d'environnement depuis backend/.env
// Par exemple PORT=4000 ou VITE_API_URL
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const storageFile = path.resolve('./messages.json')

// Enregistre un message de contact dans messages.json
// Si le fichier n'existe pas, il est créé automatiquement.
async function saveContactMessage(message){
  try{
    const existing = await fs.readFile(storageFile, 'utf-8')
    const messages = JSON.parse(existing)
    messages.push(message)
    await fs.writeFile(storageFile, JSON.stringify(messages, null, 2), 'utf-8')
  } catch(error){
    if(error.code === 'ENOENT'){
      await fs.writeFile(storageFile, JSON.stringify([message], null, 2), 'utf-8')
    } else {
      throw error
    }
  }
}

// Middleware CORS pour autoriser le frontend à accéder à l'API depuis un autre port
app.use(cors())
// Middleware JSON pour parser les requêtes entrantes au format application/json
app.use(express.json())

// Route de contact qui traite les soumissions du formulaire
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body

  // Validation minimale des champs requis
  if(!name || !email || !message){
    return res.status(400).json({ ok:false, message:'Tous les champs sont requis.' })
  }

  // Intercepte les tentatives d'accès direct par le navigateur
app.get('/api/contact', (req, res) => {
  res.status(405).json({ 
    ok: false, 
    message: "Méthode non autorisée. Cette route n'accepte que les requêtes POST via le formulaire de contact." 
  })
})

  const contactMessage = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    date: new Date().toISOString()
  }

  try{
    await saveContactMessage(contactMessage)
    console.log('Contact received:', contactMessage)
    res.json({ ok: true, message: 'Message reçu et enregistré avec succès.' })
  } catch(error){
    console.error('Erreur lors de l’enregistrement du message:', error)
    res.status(500).json({ ok:false, message:'Erreur serveur lors de l’enregistrement.' })
  }
})

// Route de santé simple pour vérifier que le serveur tourne
app.get('/', (req, res) => res.send('Angy.Dev API'))

// Démarrage du serveur Express
const server = app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`))
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} est déjà utilisé. Arrêtez le serveur existant ou changez le port dans backend/.env.`)
    process.exit(1)
  }
  throw error
})
