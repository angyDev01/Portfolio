import { useEffect, type MouseEvent, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import SkillsPage from './pages/SkillsPage'
import ContactPage from './pages/ContactPage'
import DashboardPage from './pages/DashboardPage'

// Défilement automatique en haut à chaque changement de page
function ScrollToTop(): null {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}

export default function App(): ReactElement {
  const skipToMain = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault()
    document.getElementById('main')?.focus()
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
        <a
          href="#main"
          onClick={skipToMain}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-zinc-100 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-950"
        >
          Aller au contenu principal
        </a>

        {/* Navigation fixe avec préchargement des données */}
        <Navbar />

        {/* Conteneur principal routé */}
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projets" element={<ProjectsPage />} />
            <Route path="/competences" element={<SkillsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  )
}
