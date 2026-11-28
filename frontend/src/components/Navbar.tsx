import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { DEFAULT_PROFILE_CONTACT } from '../config/defaults'
import { useProfile } from '../hooks/usePortfolioData'
import { portfolioService } from '../services/portfolioService'
import Icon from './Icon'
import ScrollProgressBar from './ScrollProgressBar'
import { useTheme } from '../context/ThemeContext'

interface NavItem {
  to: string
  label: string
  end?: boolean
  prefetch?: 'projects' | 'skills' | 'profile' | 'announcements'
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/projets', label: 'Projets', prefetch: 'projects' },
  { to: '/competences', label: 'Compétences', prefetch: 'skills' },
  { to: '/actualites', label: 'Actualités', prefetch: 'announcements' },
]

export default function Navbar(): ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { theme, toggleTheme } = useTheme()
  const { profile } = useProfile()
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null)
  const restoreFocusOnCloseRef = useRef<boolean>(false)
  const wasOpenRef = useRef<boolean>(false)

  const closeMenu = (restoreFocus = false): void => {
    restoreFocusOnCloseRef.current = restoreFocus
    setIsOpen(false)
  }

  // Fermer automatiquement sur changement de route (y compris Retour/Avancer navigateur)
  useEffect(() => {
    restoreFocusOnCloseRef.current = false
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth >= 768) {
        restoreFocusOnCloseRef.current = false
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const mainEl = document.getElementById('main')
    const footerEl = document.querySelector('footer')

    if (!isOpen) {
      if (wasOpenRef.current && restoreFocusOnCloseRef.current) {
        menuButtonRef.current?.focus({ preventScroll: true })
      }
      wasOpenRef.current = false
      restoreFocusOnCloseRef.current = false
      return
    }

    wasOpenRef.current = true
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    mainEl?.setAttribute('inert', '')
    footerEl?.setAttribute('inert', '')

    const rafId = window.requestAnimationFrame(() => {
      firstMobileLinkRef.current?.focus({ preventScroll: true })
    })

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu(true)
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.cancelAnimationFrame(rafId)
      document.body.style.overflow = prevOverflow
      mainEl?.removeAttribute('inert')
      footerEl?.removeAttribute('inert')
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  const locationLabel = profile?.location || DEFAULT_PROFILE_CONTACT.location

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-paper/90 backdrop-blur-md border-b border-line transition-colors duration-200">
        <div className="container-custom h-16 flex items-center justify-between gap-6">
          {/* Identité typographique */}
          <Link
            to="/"
            onClick={() => closeMenu(false)}
            className="text-[20px] font-bold tracking-[-0.03em] text-ink hover:text-indigo transition-colors py-2"
            aria-label="Angy — accueil"
          >
            Angy<span className="text-indigo">.</span>
          </Link>

          {/* Navigation Desktop : texte simple, filet indigo sous l'actif */}
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onMouseEnter={item.prefetch ? () => portfolioService.prefetch(item.prefetch!) : undefined}
                className={({ isActive }) =>
                  `relative py-5 text-sm font-medium transition-colors ${isActive
                    ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-indigo'
                    : 'text-muted hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions Desktop : thème + seul bouton plein Contact */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-tactile flex size-9 items-center justify-center rounded-md border border-line bg-transparent text-muted hover:text-ink hover:border-ink/30 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-4" />
            </button>

            <Link
              to="/contact"
              onMouseEnter={() => portfolioService.prefetch('profile')}
              className="btn-tactile inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Commandes Mobiles : cibles tactiles 44x44px */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-tactile flex size-11 items-center justify-center rounded-md border border-line text-muted hover:text-ink transition-colors"
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-4" />
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => (isOpen ? closeMenu(true) : setIsOpen(true))}
              className="btn-tactile flex size-11 items-center justify-center rounded-md border border-line text-ink"
              aria-label={isOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <Icon name={isOpen ? 'close' : 'menu'} className="size-5" />
            </button>
          </div>
        </div>
        <ScrollProgressBar hidden={isOpen || isAdminRoute} />
      </header>

      {/* Menu Mobile Plein Écran (hors du header pour éviter le containing block de backdrop-blur) */}
      {isOpen && (
        <div
          id="mobile-navigation-drawer"
          className="md:hidden fixed inset-x-0 top-16 bottom-0 h-[calc(100dvh-4rem)] z-40 bg-paper border-t border-line px-6 pt-8 pb-safe flex flex-col justify-between overflow-y-auto hero-view-enter"
        >
          <nav aria-label="Navigation mobile" className="flex flex-col gap-3">
            {NAV_ITEMS.map((item, idx) => (
              <NavLink
                key={item.to}
                ref={idx === 0 ? firstMobileLinkRef : undefined}
                to={item.to}
                end={item.end}
                onClick={() => closeMenu(false)}
                className={({ isActive }) =>
                  `text-[30px] font-semibold tracking-[-0.025em] leading-tight py-2 transition-colors ${isActive ? 'text-indigo' : 'text-ink hover:text-indigo'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-line pt-6 space-y-4">
            <Link
              to="/contact"
              onClick={() => closeMenu(false)}
              className="btn-tactile w-full min-h-[48px] inline-flex items-center justify-center px-5 py-3 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors"
            >
              Écrire un message
            </Link>
            <p className="text-sm text-muted">
              {locationLabel}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
