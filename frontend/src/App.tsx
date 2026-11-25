import { lazy, Suspense, useEffect, type MouseEvent, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import HomePage from './pages/HomePage'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext'
import { trackVisit } from './utils/visitorTracker'

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SkillsPage = lazy(() => import('./pages/SkillsPage'))
const UpdatesPage = lazy(() => import('./pages/UpdatesPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function PageFallback(): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] flex items-center justify-center bg-paper text-muted text-sm"
    >
      Chargement…
    </div>
  )
}

interface RouteMeta {
  title: string
  description: string
  canonical: string
}

const ROUTE_SEO: Record<string, RouteMeta> = {
  '/': {
    title: 'Yao Jean Angoa (Angy) | Développeur Full-Stack Web',
    description: "Portfolio de Yao Jean Angoa (Angy), développeur Full-Stack Web. Conception d'applications web réactives, robustes et centrées utilisateur avec React, TypeScript, Node.js et PostgreSQL.",
    canonical: 'https://angydev.me/',
  },
  '/a-propos': {
    title: 'À Propos | Yao Jean Angoa (Angy)',
    description: "Parcours, vision du développement et méthode de travail de Yao Jean Angoa (Angy), développeur Full-Stack passionné d'architecture web.",
    canonical: 'https://angydev.me/a-propos',
  },
  '/projets': {
    title: 'Projets & Réalisations | Yao Jean Angoa (Angy)',
    description: "Découvrez mes réalisations complètes d'applications web : démos interactives, architectures serveur et code source ouvert.",
    canonical: 'https://angydev.me/projets',
  },
  '/competences': {
    title: 'Compétences & Stack Technologique | Yao Jean Angoa (Angy)',
    description: "Stack technique maîtrisée par Yao Jean Angoa : React, TypeScript, Node.js, PostgreSQL, Tailwind CSS, REST APIs et Docker.",
    canonical: 'https://angydev.me/competences',
  },
  '/actualites': {
    title: 'Actualités, Projets en cours & Sondages | Yao Jean Angoa (Angy)',
    description: "Suivez mes projets en préparation, événements à venir, commentaires et sondages communautaires.",
    canonical: 'https://angydev.me/actualites',
  },
  '/contact': {
    title: 'Contact & Échange | Yao Jean Angoa (Angy)',
    description: "Prendre contact avec Yao Jean Angoa (Angy) pour une mission, une opportunité ou un échange technique. Réponse sous 24h.",
    canonical: 'https://angydev.me/contact',
  },
  '/admin/login': {
    title: 'Espace Administrateur | Yao Jean Angoa (Angy)',
    description: "Connexion sécurisée à l'espace d'administration du portfolio.",
    canonical: 'https://angydev.me/admin/login',
  },
  '/dashboard': {
    title: 'Tableau de Bord Administrateur | Yao Jean Angoa (Angy)',
    description: "Gestion des projets, compétences et messages du portfolio.",
    canonical: 'https://angydev.me/dashboard',
  },
}

const DEFAULT_META: RouteMeta = {
  title: 'Yao Jean Angoa (Angy) | Développeur Full-Stack Web',
  description: "Portfolio de Yao Jean Angoa (Angy), développeur Full-Stack Web. Conception d'applications web réactives, robustes et centrées utilisateur avec React, TypeScript, Node.js et PostgreSQL.",
  canonical: 'https://angydev.me/',
}

// Défilement automatique en haut & enregistrement automatique page_views (Analytics) + SEO dynamique
function PageWatcher(): null {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Mise à jour dynamique du SEO et des métadonnées de page
    const meta: RouteMeta = ROUTE_SEO[pathname] ?? DEFAULT_META
    document.title = meta.title

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', meta.description)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', meta.title)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', meta.description)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', meta.canonical)

    // Suivi de visite avec exclusion de l'administrateur et temporisation 24h
    trackVisit(pathname)
  }, [pathname])

  // Raccourci Clavier Global : Ctrl + Shift + A (ou Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        navigate('/admin/login')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return null
}

function MainLayout(): ReactElement {
  const { pathname } = useLocation()
  const isAdminLogin = pathname === '/admin/login'

  const skipToMain = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault()
    document.getElementById('main')?.focus()
  }

  return (
    <div className="min-h-screen bg-paper text-muted flex flex-col font-sans transition-colors duration-150">
      <a
        href="#main"
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:text-paper focus:px-4 focus:py-2 focus:text-xs font-medium"
      >
        Aller au contenu principal
      </a>

      {/* Navbar visible partout sauf sur la page de connexion dédiée */}
      {!isAdminLogin && <Navbar />}

      {/* Conteneur principal routé */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Routes Publiques */}
            <Route path="/" element={<HomePage />} />
            <Route path="/a-propos" element={<HomePage />} />
            <Route path="/projets" element={<ProjectsPage />} />
            <Route path="/competences" element={<SkillsPage />} />
            <Route path="/actualites" element={<UpdatesPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Connexion Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Routes d'Administration Verrouillées par ProtectedRoute */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Redirection /dashboard vers /admin */}
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

            {/* Fallback 404 vers l'accueil */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bouton retour en haut de page */}
      <BackToTop />

      {/* Footer avec le déclencheur tactile secret */}
      {!isAdminLogin && <Footer />}
    </div>
  )
}

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <PageWatcher />
        <MainLayout />
      </BrowserRouter>
    </ThemeProvider>
  )
}
