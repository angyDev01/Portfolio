import { useEffect, useState, type ReactElement } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import { useTheme } from '../context/ThemeContext'
import type { DbProfile } from '../types/database'
import Icon from './Icon'
import AvatarImage from './AvatarImage'

export default function Navbar(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) setProfile(data)
    })

    const handleProfileUpdate = (e: Event): void => {
      const ce = e as CustomEvent<Partial<DbProfile>>
      if (mounted && ce.detail) {
        setProfile((prev) => (prev ? { ...prev, ...ce.detail } : (ce.detail as DbProfile)))
      }
    }
    window.addEventListener('portfolio:profile-updated', handleProfileUpdate)

    return () => {
      mounted = false
      window.removeEventListener('portfolio:profile-updated', handleProfileUpdate)
    }
  }, [])

  useEffect(() => {
    const handleScroll = (): void => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth >= 768) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const closeMenu = (): void => setIsOpen(false)
  const solid = scrolled || isOpen

  const name = profile?.name || 'Angoa Yao Jean'
  const alias = profile?.alias || "Angy's"
  const github = profile?.github_url || 'https://github.com/angyDev01'
  const linkedin = profile?.linkedin_url || 'https://www.linkedin.com/in/angy-dev-532293357'

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ease-out ${solid
        ? 'bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800/80 py-3 shadow-lg shadow-black/5 dark:shadow-black/30'
        : 'bg-transparent border-transparent py-5'
        }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo / Marque vers '/' */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-2.5 rounded-lg text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-white transition-colors"
          aria-label={`${name} — retour à l'accueil`}
        >
          <AvatarImage
            src={profile?.avatar_url}
            alt={name}
            className="size-9 border border-zinc-200 dark:border-zinc-700 shadow-xs"
          />
          <span className="flex flex-col" aria-hidden="true">
            <span className="font-semibold text-sm tracking-tight">{name}</span>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
              @{alias.toLowerCase()}
            </span>
          </span>
        </Link>

        {/* Navigation desktop avec prefetch au survol */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 px-3 py-1.5 rounded-full backdrop-blur-md shadow-inner"
        >
          <NavLink
            to="/projets"
            onMouseEnter={() => portfolioService.prefetch('projects')}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${isActive
                ? 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
              }`
            }
          >
            Projets
          </NavLink>
          <NavLink
            to="/competences"
            onMouseEnter={() => portfolioService.prefetch('skills')}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${isActive
                ? 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
              }`
            }
          >
            Compétences
          </NavLink>
          <NavLink
            to="/contact"
            onMouseEnter={() => portfolioService.prefetch('profile')}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${isActive
                ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-white'
              }`
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Sélecteur de Thème (Soleil / Lune) avec rotation douce au clic */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            aria-label="Basculer le thème clair / sombre"
          >
            <Icon
              name={theme === 'dark' ? 'sun' : 'moon'}
              className="size-4.5 transition-transform duration-300 hover:rotate-45"
            />
          </button>

          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
            aria-label="GitHub (nouvel onglet)"
          >
            <Icon name="github" className="size-4" />
          </a>

          <Link
            to="/contact"
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <span>Me contacter</span>
            <Icon name="arrowRight" className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Boutons mobile : Thème + Menu */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
            aria-label="Basculer le thème clair / sombre"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <Icon name={isOpen ? 'close' : 'menu'} className="size-5" />
          </button>
        </div>
      </div>

      {/* Tiroir mobile */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="md:hidden mt-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-5 py-6 shadow-2xl motion-safe:animate-fade-down"
        >
          <nav aria-label="Navigation mobile" className="flex flex-col gap-2">
            <NavLink
              to="/projets"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              Projets
            </NavLink>
            <NavLink
              to="/competences"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              Compétences
            </NavLink>
            <NavLink
              to="/contact"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Réseaux</span>
            <ul className="flex gap-2">
              <li>
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  aria-label="GitHub (nouvel onglet)"
                >
                  <Icon name="github" className="size-4" />
                </a>
              </li>
              <li>
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  aria-label="LinkedIn (nouvel onglet)"
                >
                  <Icon name="linkedin" className="size-4" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  )
}
