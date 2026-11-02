import React, { useState, useEffect } from 'react'

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState(() => localStorage.getItem('admin_pass') || '')
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState({ visits: 0, messagesCount: 0 })
  const [messages, setMessages] = useState([])
  const [projects, setProjects] = useState([])
  const [posts, setPosts] = useState([])
  
  // Loading & Notification states
  const [loading, setLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' })
  
  // Form states for new project
  const [projectForm, setProjectForm] = useState({
    title: '',
    desc: '',
    tech: '',
    image: '',
    featured: false
  })

  // Form states for new post
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    tags: '',
    content: ''
  })

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  // If password already in localStorage, verify on mount
  useEffect(() => {
    if (password) {
      verifyPassword(password)
    }
  }, [])

  // Fetch admin data once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData()
    }
  }, [isAuthenticated])

  async function verifyPassword(pass) {
    setLoginError('')
    try {
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setIsAuthenticated(true)
        localStorage.setItem('admin_pass', pass)
      } else {
        setIsAuthenticated(false)
        setLoginError(data.message || 'Mot de passe incorrect.')
        localStorage.removeItem('admin_pass')
      }
    } catch (err) {
      setLoginError('Impossible de contacter le serveur.')
    }
  }

  async function fetchAdminData() {
    try {
      // 1. Stats and Messages
      const statsRes = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${password}` }
      })
      const statsData = await statsRes.json()
      if (statsRes.ok) {
        setStats(statsData.stats)
        setMessages(statsData.messages)
      }

      // 2. Fetch projects list
      const projRes = await fetch(`${apiUrl}/api/projects`)
      const projData = await projRes.json()
      if (projRes.ok) setProjects(projData)

      // 3. Fetch posts list
      const postsRes = await fetch(`${apiUrl}/api/posts`)
      const postsData = await postsRes.json()
      if (postsRes.ok) setPosts(postsData)
    } catch (err) {
      console.error('Error fetching admin data:', err)
    }
  }

  function handleLoginSubmit(e) {
    e.preventDefault()
    const pass = e.target.password.value
    setPassword(pass)
    verifyPassword(pass)
  }

  function handleLogout() {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('admin_pass')
  }

  // Handle input changes
  const handleProjectChange = (e) => {
    const { name, value, type, checked } = e.target
    setProjectForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePostChange = (e) => {
    const { name, value } = e.target
    setPostForm(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-generate slug from title if slug was empty or matches old title
      if (name === 'title' && !prev.slug) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }
      return updated
    })
  }

  // Create Project
  async function handleCreateProject(e) {
    e.preventDefault()
    setLoading(true)
    setActionStatus({ type: '', message: '' })

    try {
      const res = await fetch(`${apiUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify(projectForm)
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setActionStatus({ type: 'success', message: 'Projet créé avec succès !' })
        setProjectForm({ title: '', desc: '', tech: '', image: '', featured: false })
        fetchAdminData() // refresh lists
      } else {
        setActionStatus({ type: 'error', message: data.message || 'Erreur lors de la création.' })
      }
    } catch (err) {
      setActionStatus({ type: 'error', message: 'Erreur réseau.' })
    } finally {
      setLoading(false)
    }
  }

  // Create Post
  async function handleCreatePost(e) {
    e.preventDefault()
    setLoading(true)
    setActionStatus({ type: '', message: '' })

    try {
      const res = await fetch(`${apiUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify(postForm)
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setActionStatus({ type: 'success', message: 'Article créé avec succès !' })
        setPostForm({ title: '', slug: '', excerpt: '', tags: '', content: '' })
        fetchAdminData()
      } else {
        setActionStatus({ type: 'error', message: data.message || 'Erreur lors de la création.' })
      }
    } catch (err) {
      setActionStatus({ type: 'error', message: 'Erreur réseau.' })
    } finally {
      setLoading(false)
    }
  }

  // Delete Project
  async function handleDeleteProject(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer ce projet ?')) return
    try {
      const res = await fetch(`${apiUrl}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${password}` }
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Post
  async function handleDeletePost(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer cet article ?')) return
    try {
      const res = await fetch(`${apiUrl}/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${password}` }
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-login reveal visible">
          <div className="container" style={{ maxWidth: '450px', padding: '100px 20px' }}>
            <div className="login-card card">
              <h2>Connexion Admin</h2>
              <p className="subtitle">Entrez le mot de passe administrateur pour accéder au tableau de bord.</p>
              <form onSubmit={handleLoginSubmit}>
                <label>
                  Mot de passe
                  <input type="password" name="password" required placeholder="Mot de passe" />
                </label>
                {loginError && <p className="note error">{loginError}</p>}
                <div style={{ marginTop: '20px' }}>
                  <button className="btn primary block" type="submit">Se connecter</button>
                  <a className="btn outline block" href="#/" style={{ marginTop: '10px', textAlign: 'center' }}>Retour au site</a>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header reveal visible">
        <div className="container">
          <div className="dashboard-title-row">
            <div>
              <p className="section-tag">Administration</p>
              <h1>Tableau de Bord</h1>
              <p className="section-subtitle">Gérez vos projets, articles, et suivez les statistiques du site.</p>
            </div>
            <div className="actions">
              <a className="btn outline" href="#/">Voir le site</a>
              <button className="btn primary" onClick={handleLogout} style={{ marginLeft: '10px' }}>Déconnexion</button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-content container">
        {/* STATS SECTION */}
        <div className="dashboard-stats-grid">
          <div className="stat-card card">
            <h3>{stats.visits}</h3>
            <p>Visites totales</p>
          </div>
          <div className="stat-card card">
            <h3>{stats.messagesCount}</h3>
            <p>Messages reçus</p>
          </div>
          <div className="stat-card card">
            <h3>{projects.length}</h3>
            <p>Projets affichés</p>
          </div>
          <div className="stat-card card">
            <h3>{posts.length}</h3>
            <p>Articles de blog</p>
          </div>
        </div>

        {actionStatus.message && (
          <div className={`notification-banner ${actionStatus.type === 'success' ? 'success' : 'error'}`}>
            {actionStatus.message}
          </div>
        )}

        <div className="dashboard-two-cols">
          {/* LEFT COL: CREATION FORMS */}
          <div className="dashboard-form-col">
            {/* ADD PROJECT */}
            <div className="card form-container">
              <h2>Ajouter un Projet</h2>
              <form onSubmit={handleCreateProject}>
                <label>
                  Titre du projet *
                  <input type="text" name="title" value={projectForm.title} onChange={handleProjectChange} required />
                </label>
                <label>
                  Description *
                  <textarea name="desc" value={projectForm.desc} onChange={handleProjectChange} rows="3" required></textarea>
                </label>
                <label>
                  Technologies * (ex: React, Node.js)
                  <input type="text" name="tech" value={projectForm.tech} onChange={handleProjectChange} required />
                </label>
                <label>
                  Lien de l'image (URL)
                  <input type="text" name="image" value={projectForm.image} onChange={handleProjectChange} placeholder="/assets/projects/... ou url externe" />
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" name="featured" checked={projectForm.featured} onChange={handleProjectChange} />
                  Mettre en vedette (Featured)
                </label>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le projet'}
                </button>
              </form>
            </div>

            {/* ADD POST */}
            <div className="card form-container" style={{ marginTop: '30px' }}>
              <h2>Ajouter un Article</h2>
              <form onSubmit={handleCreatePost}>
                <label>
                  Titre de l'article *
                  <input type="text" name="title" value={postForm.title} onChange={handlePostChange} required />
                </label>
                <label>
                  Slug (URL) *
                  <input type="text" name="slug" value={postForm.slug} onChange={handlePostChange} required />
                </label>
                <label>
                  Extrait / Résumé *
                  <input type="text" name="excerpt" value={postForm.excerpt} onChange={handlePostChange} required />
                </label>
                <label>
                  Tags (séparés par des virgules) *
                  <input type="text" name="tags" value={postForm.tags} onChange={handlePostChange} placeholder="React, CSS, Django" required />
                </label>
                <label>
                  Contenu * (Séparez les paragraphes par un double saut de ligne)
                  <textarea name="content" value={postForm.content} onChange={handlePostChange} rows="10" placeholder="Paragraphe 1...&#10;&#10;Paragraphe 2..." required></textarea>
                </label>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer l\'article'}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COL: MESSAGES & MANAGING LISTS */}
          <div className="dashboard-list-col">
            {/* MESSAGES LIST */}
            <div className="card messages-list-card">
              <h2>Messages de Contact</h2>
              {messages.length === 0 ? (
                <p className="empty-text">Aucun message pour le moment.</p>
              ) : (
                <div className="messages-container">
                  {messages.map((m) => (
                    <div key={m.id} className="message-item">
                      <div className="msg-header">
                        <strong>{m.name}</strong>
                        <a href={`mailto:${m.email}`}>{m.email}</a>
                        <span className="msg-date">{new Date(m.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="msg-body">{m.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MANAGE PROJECTS */}
            <div className="card manage-list-card" style={{ marginTop: '30px' }}>
              <h2>Gérer les Projets</h2>
              {projects.length === 0 ? (
                <p className="empty-text">Aucun projet.</p>
              ) : (
                <ul className="manage-items-list">
                  {projects.map((p) => (
                    <li key={p.id} className="manage-item">
                      <div>
                        <strong>{p.title}</strong> <span className="tag-pill">{p.tech}</span>
                        {p.featured && <span className="featured-pill">Featured</span>}
                      </div>
                      <button className="btn-icon delete" onClick={() => handleDeleteProject(p.id)} title="Supprimer">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* MANAGE POSTS */}
            <div className="card manage-list-card" style={{ marginTop: '30px' }}>
              <h2>Gérer les Articles</h2>
              {posts.length === 0 ? (
                <p className="empty-text">Aucun article.</p>
              ) : (
                <ul className="manage-items-list">
                  {posts.map((p) => (
                    <li key={p.id} className="manage-item">
                      <div>
                        <strong>{p.title}</strong> <span className="date-pill">{p.date}</span>
                      </div>
                      <button className="btn-icon delete" onClick={() => handleDeletePost(p.id)} title="Supprimer">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
