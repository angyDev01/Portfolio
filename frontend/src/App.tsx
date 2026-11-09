import { useEffect, type MouseEvent, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import SkillsPage from './pages/SkillsPage'
import ContactPage from './pages/ContactPage'
import AdminLoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext'
import { trackVisit } from './utils/visitorTracker'

// Défilement automatique en haut & enregistrement automatique page_views (Analytics)
function PageWatcher(): null {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-white transition-colors duration-200">
      <a
        href="#main"
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-zinc-900 focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Aller au contenu principal
      </a>

      {/* Navbar visible partout sauf sur la page de connexion dédiée */}
      {!isAdminLogin && <Navbar />}

      {/* Conteneur principal routé */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Routes>
          {/* Routes Publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/a-propos" element={<HomePage />} />
          <Route path="/projets" element={<ProjectsPage />} />
          <Route path="/competences" element={<SkillsPage />} />
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
      </main>

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
