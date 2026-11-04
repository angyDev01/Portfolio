import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile } from '../types/database'
import Icon from './Icon'

export default function Footer(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const navigate = useNavigate()

  // Références pour la détection du triple-clic et du long-press (2s)
  const clickTimestampsRef = useRef<number[]>([])
  const longPressTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) setProfile(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  const name = profile?.name || 'Angoa Yao Jean'
  const alias = profile?.alias || "Angy's"
  const github = profile?.github_url || 'https://github.com/angyDev01'
  const linkedin = profile?.linkedin_url || 'https://www.linkedin.com/in/angy-dev-532293357'
  const twitter = profile?.twitter_url || 'https://x.com/Angy656261'
  const facebook = profile?.facebook_url || 'https://www.facebook.com/share/1FGHSoJjo9/'

  // Déclencheur secret 1 : Triple-clic rapide (<= 500ms)
  const handleSecretClick = (): void => {
    const now = Date.now()
    // Conserve les clics survenus dans les 500 dernières millisecondes
    clickTimestampsRef.current = [...clickTimestampsRef.current.filter((t) => now - t < 500), now]
    if (clickTimestampsRef.current.length >= 3) {
      clickTimestampsRef.current = []
      navigate('/admin/login')
    }
  }

  // Déclencheur secret 2 : Clic maintenu / appui long de 2 secondes
  const handleTouchStart = (): void => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => {
      navigate('/admin/login')
    }, 2000)
  }

  const handleTouchEnd = (): void => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-900 py-10 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        {/* Bloc Copyright avec déclencheur tactile secret (triple-clic ou appui de 2s) sans changer le curseur */}
        <div
          onClick={handleSecretClick}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="p-2 cursor-default select-none rounded-lg flex flex-col gap-1 transition-colors"
          title=""
        >
          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
            © {new Date().getFullYear()} {name} ({alias}). Tous droits réservés.
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Fait avec beaucoup d'amour par <a href="/">{alias}</a>.
          </p>
        </div>

        {/* Réseaux sociaux exclusively (aucun lien d'admin visible) */}
        <nav aria-label="Réseaux sociaux">
          <ul className="flex items-center gap-3">
            <li>
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
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
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
                aria-label="LinkedIn (nouvel onglet)"
              >
                <Icon name="linkedin" className="size-4" />
              </a>
            </li>
            <li>
              <a
                href={twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
                aria-label="X (Twitter) (nouvel onglet)"
              >
                <Icon name="x" className="size-4" />
              </a>
            </li>
            <li>
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-xs"
                aria-label="Facebook (nouvel onglet)"
              >
                <Icon name="facebook" className="size-4" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
