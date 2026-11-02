import { useEffect, useState, type ReactElement } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile } from '../types/database'
import Icon from './Icon'

export default function Navbar(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) setProfile(data)
    })
    return () => {
      mounted = false
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

  const name = profile?.name || 'Yao Jean Angoa'
  const alias = profile?.alias || 'Angy'
  const github = profile?.github_url || 'https://github.com/angyDev01'
  const linkedin = profile?.linkedin_url || 'https://linkedin.com/in/angydev'

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ease-out ${
        solid
          ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-800/80 py-3 shadow-lg shadow-black/30'
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo / Marque vers '/' */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-2.5 rounded-lg text-zinc-100 hover:text-white transition-colors"
          aria-label={`${name} — retour à l'accueil`}
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold text-sm group-hover:border-indigo-400 group-hover:bg-indigo-500/20 transition-all"
            aria-hidden="true"
          >
            {alias.charAt(0)}
          </span>
          <span className="flex flex-col" aria-hidden="true">
            <span className="font-semibold text-sm tracking-tight">{name}</span>
            <span className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-300">
              @{alias.toLowerCase()}
            </span>
          </span>
        </Link>

        {/* Navigation desktop avec prefetch au survol */}
        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-full backdrop-blur-md shadow-inner"
        >
          <NavLink
            to="/projets"
            onMouseEnter={() => portfolioService.prefetch('projects')}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`
            }
          >
            Projets
          </NavLink>
          <NavLink
            to="/competences"
            onMouseEnter={() => portfolioService.prefetch('skills')}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`
            }
          >
            Compétences
          </NavLink>
          <NavLink
            to="/contact"
            onMouseEnter={() => portfolioService.prefetch('profile')}
            className={({ isActive }) =>
              `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 hover:text-white'
              }`
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200"
            aria-label="GitHub (nouvel onglet)"
          >
            <Icon name="github" className="size-4" />
          </a>
          <Link
            to="/contact"
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white hover:shadow-md hover:shadow-zinc-100/10 transition-all duration-200"
          >
            <span>Me contacter</span>
            <Icon name="arrowRight" className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="md:hidden flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          <Icon name={isOpen ? 'close' : 'menu'} className="size-5" />
        </button>
      </div>

      {/* Tiroir mobile */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="md:hidden mt-3 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl px-5 py-6 shadow-2xl motion-safe:animate-fade-down"
        >
          <nav aria-label="Navigation mobile" className="flex flex-col gap-2">
            <NavLink
              to="/projets"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`
              }
            >
              Projets
            </NavLink>
            <NavLink
              to="/competences"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`
              }
            >
              Compétences
            </NavLink>
            <NavLink
              to="/contact"
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Réseaux</span>
            <ul className="flex gap-2">
              <li>
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
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
                  className="flex size-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
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
