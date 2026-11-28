import { lazy, Suspense, useEffect, type MouseEvent, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import HomePage from './pages/HomePage'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext'
import { portfolioService } from './services/portfolioService'
import { trackVisit } from './utils/visitorTracker'

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SkillsPage = lazy(() => import('./pages/SkillsPage'))
const UpdatesPage = lazy(() => import('./pages/UpdatesPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

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
  canonical?: string
  robots: 'index, follow' | 'noindex, nofollow'
  trackable: boolean
}

const ADMIN_META: RouteMeta = {
  title: 'Tableau de Bord Administrateur | Yao Jean Angoa (Angy)',
  description: "Gestion des projets, compétences et messages du portfolio.",
  canonical: 'https://portfolio-vs28.vercel.app/admin',
  robots: 'noindex, nofollow',
  trackable: false,
}

const ROUTE_SEO: Record<string, RouteMeta> = {
  '/': {
    title: 'Yao Jean Angoa (Angy) | Développeur Full-Stack Web',
    description: "Portfolio de Yao Jean Angoa (Angy), développeur Full-Stack Web. Conception d'applications web réactives, robustes et centrées utilisateur avec React, TypeScript, Node.js et PostgreSQL.",
    canonical: 'https://portfolio-vs28.vercel.app/',
    robots: 'index, follow',
    trackable: true,
  },
  '/a-propos': {
    title: 'À Propos | Yao Jean Angoa (Angy)',
    description: "Parcours, vision du développement et méthode de travail de Yao Jean Angoa (Angy), développeur Full-Stack passionné d'architecture web.",
    canonical: 'https://portfolio-vs28.vercel.app/a-propos',
    robots: 'index, follow',
    trackable: true,
  },
  '/projets': {
    title: 'Projets & Réalisations | Yao Jean Angoa (Angy)',
    description: "Découvrez mes réalisations complètes d'applications web : démos interactives, architectures serveur et code source ouvert.",
    canonical: 'https://portfolio-vs28.vercel.app/projets',
    robots: 'index, follow',
    trackable: true,
  },
  '/competences': {
    title: 'Compétences & Stack Technologique | Yao Jean Angoa (Angy)',
    description: "Stack technique maîtrisée par Yao Jean Angoa : React, TypeScript, Node.js, PostgreSQL, Tailwind CSS, REST APIs et Docker.",
    canonical: 'https://portfolio-vs28.vercel.app/competences',
    robots: 'index, follow',
    trackable: true,
  },
  '/actualites': {
    title: 'Actualités, Projets en cours & Sondages | Yao Jean Angoa (Angy)',
    description: "Suivez mes projets en préparation, événements à venir, commentaires et sondages communautaires.",
    canonical: 'https://portfolio-vs28.vercel.app/actualites',
    robots: 'index, follow',
    trackable: true,
  },
  '/contact': {
    title: 'Contact & Échange | Yao Jean Angoa (Angy)',
    description: "Prendre contact avec Yao Jean Angoa (Angy) pour une mission, une opportunité ou un échange technique. Réponse sous 24h.",
    canonical: 'https://portfolio-vs28.vercel.app/contact',
    robots: 'index, follow',
    trackable: true,
  },
  '/admin/login': {
    title: 'Espace Administrateur | Yao Jean Angoa (Angy)',
    description: "Connexion sécurisée à l'espace d'administration du portfolio.",
    canonical: 'https://portfolio-vs28.vercel.app/admin/login',
    robots: 'noindex, nofollow',
    trackable: false,
  },
  '/admin': ADMIN_META,
  '/dashboard': ADMIN_META,
}

const NOT_FOUND_META: RouteMeta = {
  title: 'Page introuvable (404) | Yao Jean Angoa (Angy)',
  description: "La page demandée n'existe pas ou a été déplacée.",
  robots: 'noindex, nofollow',
  trackable: false,
}

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

function setMetaContent(selector: string, attr: string, value: string): void {
  const el = document.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Défilement automatique, ancre /a-propos, Analytics et SEO dynamique
function PageWatcher(): null {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const cleanPath = normalizePath(pathname)
    const meta: RouteMeta =
      ROUTE_SEO[cleanPath] ??
      (cleanPath.startsWith('/admin/') || cleanPath === '/admin' ? ADMIN_META : NOT_FOUND_META)

    document.title = meta.title
    setMetaContent('meta[name="description"]', 'content', meta.description)
    setMetaContent('meta[name="robots"]', 'content', meta.robots)
    setMetaContent('meta[property="og:title"]', 'content', meta.title)
    setMetaContent('meta[property="og:description"]', 'content', meta.description)
    setMetaContent('meta[name="twitter:title"]', 'content', meta.title)
    setMetaContent('meta[name="twitter:description"]', 'content', meta.description)

    const canonicalEl = document.querySelector('link[rel="canonical"]')
    if (canonicalEl) {
      if (meta.canonical) {
        canonicalEl.setAttribute('href', meta.canonical)
      } else {
        canonicalEl.removeAttribute('href')
      }
    }
    if (meta.canonical) {
      setMetaContent('meta[property="og:url"]', 'content', meta.canonical)
    }

    if (meta.trackable) {
      trackVisit(cleanPath)
    }

    const targetId = cleanPath === '/a-propos' ? 'about' : hash ? hash.slice(1) : ''
    const scrollBehavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'

    if (!targetId) {
      window.scrollTo({ top: 0, behavior: scrollBehavior })
      return undefined
    }

    let cancelled = false
    const cancelOnUserScroll = (): void => {
      cancelled = true
    }
    window.addEventListener('wheel', cancelOnUserScroll, { passive: true, once: true })
    window.addEventListener('touchstart', cancelOnUserScroll, { passive: true, once: true })
    window.addEventListener('keydown', cancelOnUserScroll, { once: true })

    const scrollToTarget = (behavior: ScrollBehavior): void => {
      if (cancelled) return
      const targetEl = document.getElementById(targetId)
      if (targetEl) {
        targetEl.scrollIntoView({ behavior, block: 'start' })
      }
    }

    const rafId = window.requestAnimationFrame(() => scrollToTarget(scrollBehavior))

    Promise.allSettled([
      portfolioService.getProfile(),
      portfolioService.getProjects(),
      portfolioService.getSkills(),
      portfolioService.getAnnouncements(),
      portfolioService.getPollsWithResults(),
    ]).then(() => {
      if (!cancelled) {
        window.requestAnimationFrame(() => scrollToTarget('auto'))
      }
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('wheel', cancelOnUserScroll)
      window.removeEventListener('touchstart', cancelOnUserScroll)
      window.removeEventListener('keydown', cancelOnUserScroll)
    }
  }, [pathname, hash])

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

function ShareRedirect({
  kind,
}: {
  kind: 'project' | 'announcement' | 'poll' | 'profile'
}): ReactElement {
  const { id } = useParams<{ id: string }>()
  if (kind === 'project' && id) {
    return <Navigate to={`/projets?projet=${encodeURIComponent(id)}`} replace />
  }
  if (kind === 'announcement' && id) {
    return <Navigate to={`/actualites?annonce=${encodeURIComponent(id)}`} replace />
  }
  if (kind === 'poll' && id) {
    return <Navigate to={`/actualites?sondage=${encodeURIComponent(id)}`} replace />
  }
  return <Navigate to="/" replace />
}

function MainLayout(): ReactElement {
  const { pathname } = useLocation()
  const isAdminLogin = normalizePath(pathname) === '/admin/login'

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

            {/* Liens de partage courts (repli client si non traités par /api/share) */}
            <Route path="/s/projet/:id" element={<ShareRedirect kind="project" />} />
            <Route path="/s/actualite/:id" element={<ShareRedirect kind="announcement" />} />
            <Route path="/s/sondage/:id" element={<ShareRedirect kind="poll" />} />
            <Route path="/s/profil" element={<ShareRedirect kind="profile" />} />

            {/* Page 404 */}
            <Route path="*" element={<NotFoundPage />} />
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
