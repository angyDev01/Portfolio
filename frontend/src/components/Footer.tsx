import { useRef, type ReactElement } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEFAULT_PROFILE_CONTACT } from '../config/defaults'
import { useProfile } from '../hooks/usePortfolioData'

export default function Footer(): ReactElement {
  const { profile } = useProfile()
  const navigate = useNavigate()

  // Références pour la détection du triple-clic et du long-press (2s)
  const clickTimestampsRef = useRef<number[]>([])
  const longPressTimerRef = useRef<number | null>(null)

  const name = profile?.name || 'Yao Jean Angoa'
  const alias = profile?.alias || "Angy's"
  const location = profile?.location || DEFAULT_PROFILE_CONTACT.location
  const github = profile?.github_url || DEFAULT_PROFILE_CONTACT.githubUrl
  const linkedin = profile?.linkedin_url || DEFAULT_PROFILE_CONTACT.linkedinUrl
  const twitter = profile?.twitter_url || DEFAULT_PROFILE_CONTACT.twitterUrl
  const facebook = profile?.facebook_url || DEFAULT_PROFILE_CONTACT.facebookUrl

  // Déclencheur secret 1 : Triple-clic rapide (<= 500ms)
  const handleSecretClick = (): void => {
    const now = Date.now()
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

  const socialLinks = [
    { label: 'GitHub', href: github },
    { label: 'LinkedIn', href: linkedin },
    { label: 'X', href: twitter },
    { label: 'Facebook', href: facebook },
  ]

  return (
    <footer className="border-t border-line pt-10 md:pt-12 pb-safe bg-paper transition-colors">
      <div className="container-custom flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Identité & Lieu avec déclencheur secret admin */}
          <div
            onClick={handleSecretClick}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="cursor-default select-none flex flex-col gap-1"
            title=""
          >
            <p className="text-sm font-semibold text-ink">
              {name} ({alias})
            </p>
            <p className="text-sm text-muted">
              {location}
            </p>
          </div>

          {/* Réseaux sociaux en liens texte */}
          <nav aria-label="Réseaux sociaux">
            <ul className="flex flex-wrap items-center gap-x-2 sm:gap-x-6 gap-y-1 -ml-1.5 -my-2 sm:ml-0 sm:my-0 text-sm font-medium">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1.5 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1.5 text-muted hover:text-indigo transition-colors underline-offset-4 hover:underline"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="pt-6 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} {name}. Tous droits réservés.</p>

          <nav aria-label="Navigation pied de page" className="flex flex-wrap items-center gap-x-2 sm:gap-x-6 gap-y-1 -ml-1 -my-2 sm:ml-0 sm:my-0">
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1 hover:text-ink transition-colors"
            >
              Accueil
            </Link>
            <Link
              to="/projets"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1 hover:text-ink transition-colors"
            >
              Projets
            </Link>
            <Link
              to="/competences"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1 hover:text-ink transition-colors"
            >
              Compétences
            </Link>
            <Link
              to="/actualites"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1 hover:text-ink transition-colors"
            >
              Actualités
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1 hover:text-ink transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
