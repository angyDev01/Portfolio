import React, {useState, useEffect} from 'react'
import './index.css'
import Header from './components/Header'
import ProjectCard from './components/ProjectCard'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'

// Fonction utilitaire pour interpréter le hash de l'URL et charger la bonne page
function parseRoute(hash){
  const path = hash.toLowerCase().replace(/^#/, '')
  if(path.startsWith('/blog/')){
    return {page:'post', slug:path.replace('/blog/', '')}
  }
  if(path === '/blog' || path === '/blog/'){
    return {page:'blog', slug:null}
  }
  return {page:'home', slug:null}
}

export default function App(){
  // État du message de validation du formulaire de contact
  const [status, setStatus] = useState({ type:'', message:'' })
  const [loading, setLoading] = useState(false)
  // État du routeur simple basé sur le hash de l'URL
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  // Données fictives des articles du mini-blog
  const posts = [
    {
      slug: 'portfolio-react',
      title: 'Comment structurer un portfolio React',
      date: '12 juin 2026',
      excerpt: 'Un guide simple pour organiser vos sections, créer des composants réutilisables et afficher vos projets avec style.',
      tags: ['React', 'UI', 'Design'],
      link: '#/blog/portfolio-react',
      content: [
        'Structurer un portfolio React commence par définir des sections claires : à propos, compétences, projets, contact. Le but est de rendre l’information lisible tout en gardant un design cohérent.',
        'Utilisez des composants réutilisables pour chaque bloc, comme des cartes de projet et des sections de contenu, puis centralisez les données dans un tableau ou un fichier JSON.',
        'Pour la navigation, choisissez une structure simple et évitez les surcharges. Un portfolio doit donner une première impression rapide tout en proposant une expérience fluide.'
      ]
    },
    {
      slug: 'css-moderne',
      title: '3 astuces pour un CSS moderne',
      date: '01 mai 2026',
      excerpt: 'Astuces de mise en page, animations légères et thèmes sombres pour rendre vos interfaces plus professionnelles.',
      tags: ['CSS', 'Animation', 'Thème'],
      link: '#/blog/css-moderne',
      content: [
        'La première astuce est de travailler avec des variables CSS pour garder un thème cohérent et facile à ajuster. Les variables permettent de modifier l’ambiance globale en un seul endroit.',
        'Ensuite, utilisez des transitions et animations légères pour rendre l’interface plus fluide, mais évitez l’excès : un effet subtil suffit souvent à améliorer la perception utilisateur.',
        'Enfin, soignez la typographie et l’espacement. Un bon espacement entre les éléments et une hiérarchie typographique claire font partie des détails les plus importants.'
      ]
    },
    {
      slug: 'html-css-vers-react',
      title: 'Passer de HTML/CSS à React',
      date: '18 avril 2026',
      excerpt: 'Conseils pour transformer un site statique en application React rapide et accessible, sans perdre en clarté.',
      tags: ['React', 'Transition', 'Front-end'],
      link: '#/blog/html-css-vers-react',
      content: [
        'Commencez par identifier les parties statiques de votre page et transformez-les en composants. Chaque section devient un composant React simple et réutilisable.',
        'Gérez ensuite l’état local pour les interactions : formulaires, menus, filtres. React facilite cette gestion sans casser la structure initiale du HTML.',
        'Enfin, veillez à l’accessibilité et à la performance : utilisez des attributs ARIA quand nécessaire, réduisez le CSS inutile et privilégiez des images optimisées.'
      ]
    }
  ]

  // Effet d'apparition au scroll : les éléments .reveal deviennent visibles quand ils entrent dans l'écran
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal:not(.visible)')
    if(!revealElements.length) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {threshold: 0.12, rootMargin: '0px 0px -10% 0px'}
    )

    revealElements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [route])

  // Effet pour écouter les changements de hash et mettre à jour la route courante
  useEffect(() => {
    function handleRoute(){
      setRoute(parseRoute(window.location.hash))
    }

    window.addEventListener('hashchange', handleRoute)
    handleRoute()
    return () => window.removeEventListener('hashchange', handleRoute)
  }, [])

  // Envoi du formulaire de contact vers l'API backend
  async function handleSubmit(e){
    e.preventDefault()
    setLoading(true)
    setStatus({type:'', message:''})

    const form = new FormData(e.target)
    const data = {
      name: form.get('name'),
      email: form.get('email'),
      message: form.get('message')
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    console.log("URL de l'API appelée :", apiUrl); // <--- Ajoute ça ici
    try{
      const res = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if(res.ok){
        setStatus({type:'success', message: result.message || 'Merci, votre message a bien été envoyé.'})
        e.target.reset()
      } else {
        setStatus({type:'error', message: result.message || "Erreur lors de l'envoi."})
      }
    }catch(err){
      setStatus({type:'error', message: 'Impossible de joindre le serveur.'})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-root">
      <Header />
      {/* Rend le contenu selon la route : accueil, page blog ou page article */}
      {route.page === 'blog' ? (
        <BlogPage posts={posts} />
      ) : route.page === 'post' ? (
        <BlogPostPage post={posts.find(post => post.slug === route.slug)} />
      ) : (
        <>
          <main>
            <section className="hero gradient" id="home">
              <div className="container hero-inner">
                <div className="hero-text">
                  <h1>Salut — je suis <strong>Angoa Yao Jean</strong></h1>
                  <p className="lead">Développeur front-end spécialisé en HTML/CSS/JS, en transition vers React. Backend: Django, Express.js.</p>
                  <div className="cta">
                    <a className="btn primary" href="#projects">Mes projets</a>
                    <a className="btn outline" href="#contact">Contact</a>
                  </div>
                  <div className="skills-badges">
                    <span>React</span>
                    <span>HTML</span>
                    <span>CSS</span>
                    <span>Django</span>
                    <span>Express</span>
                  </div>
                </div>
                <div className="hero-shot">
                  <img src="/assets/avatar.svg" alt="Illustration fictive de profil" />
                </div>
              </div>
            </section>

            <section className="about reveal" id="about">
              <div className="container">
                <h2>À propos</h2>
                <p>Je crée des interfaces propres et performantes, avec attention à l'accessibilité et à l'expérience utilisateur. J'aime prototyper en React et construire des APIs fiables côté serveur.</p>
              </div>
            </section>

            <section className="skills reveal" id="skills">
              <div className="container">
                <h2>Compétences</h2>
                <ul className="skill-list">
                  <li>HTML5 & CSS3 (Responsive, Flexbox, Grid)</li>
                  <li>JavaScript (ES6+), Fetch API</li>
                  <li>React (hooks, composants)</li>
                  <li>Django (REST) & Express.js</li>
                  <li>Git / GitHub</li>
                </ul>
              </div>
            </section>

            <section className="projects reveal" id="projects">
              <div className="container">
                <h2>Projets</h2>
                <div className="grid projects-grid">
                  <ProjectCard featured image="/assets/projects/portfolio.svg" title="Portfolio React" desc="Version React du portfolio avec Vite, responsive et accessible." tech="React, Vite" />
                  <ProjectCard image="/assets/projects/todo-thumb.svg" title="Todo App" desc="Application TODO en React avec stockage local et tests basiques." tech="React" />
                  <ProjectCard image="/assets/projects/api-thumb.svg" title="API Django" desc="API REST simple avec DRF pour gérer ressources et authentification." tech="Django, DRF" />
                </div>
              </div>
            </section>

            <section className="contact reveal" id="contact">
              <div className="container">
                <h2>Contact</h2>
                <p>Envie de collaborer ? Écris-moi un message.</p>
                <form id="contact-form" className="contact-form" onSubmit={handleSubmit}>
                  <label>Nom<input type="text" name="name" required /></label>
                  <label>Email<input type="email" name="email" required /></label>
                  <label>Message<textarea name="message" rows="5" required></textarea></label>
                  <div className="form-actions">
                    <button className="btn primary" type="submit" disabled={loading} aria-busy={loading}>
                      {loading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                  {status.message && (
                    <p className={`note ${status.type === 'success' ? 'success' : 'error'}`}>
                      {status.message}
                    </p>
                  )}
                </form>
              </div>
            </section>
          </main>
        </>
      )}

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© 2026 Angoa Yao Jean — <a href="#">Angy.Dev</a></p>
          <nav className="social">
            <a href="#">GitHub</a>
            <a href="#">LinkedIn</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
