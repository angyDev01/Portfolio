import { useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_PROFILE_CONTACT } from '../config/defaults'
import { useProfile } from '../hooks/usePortfolioData'
import { portfolioService } from '../services/portfolioService'

const PUBLIC_STACK = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS']

export default function Hero(): ReactElement {
  const { profile, loading } = useProfile()
  const [showData, setShowData] = useState(false)

  const status = profile?.availability_status || (profile?.is_available ? 'available' : 'employed')
  const statusLabel =
    profile?.status_label ||
    (status === 'employed'
      ? 'En poste / En mission'
      : status === 'unavailable'
        ? 'Non disponible'
        : 'Disponible')

  const locationLabel = profile?.location || DEFAULT_PROFILE_CONTACT.location

  const publicRecord = {
    name: profile?.name || 'Angoa Yao Jean',
    alias: profile?.alias || "Angy's",
    role: profile?.role || 'Développeur Full-Stack Web',
    location: locationLabel,
    availability_status: status,
    stack: PUBLIC_STACK,
  }

  const statusDot = (
    <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
      {status === 'available' && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mango opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full size-2.5 ${status === 'available'
            ? 'bg-mango'
            : status === 'employed'
              ? 'bg-indigo'
              : 'bg-muted'
          }`}
      />
    </span>
  )

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="pt-24 pb-12 md:pt-36 md:pb-24 border-b border-line transition-colors"
    >
      <div className="container-custom">
        {/* Bandeau de statut compact visible d'emblée sur mobile */}
        <div className="lg:hidden hero-reveal-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mb-6 pb-4 border-b border-line">
          <span className="inline-flex items-center gap-2 font-medium text-ink">
            {statusDot}
            <span>{statusLabel}</span>
          </span>
          <span className="text-muted">{locationLabel}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* Colonne principale : identité ou vue Données */}
          <div className="lg:col-span-9 min-w-0">
            {!showData ? (
              <div key="ui-view" className="hero-view-enter">
                <h1
                  id="hero-title"
                  style={{ fontVariationSettings: "'opsz' 96" }}
                  className="hero-reveal-1 text-[clamp(2.75rem,11vw,6.75rem)] font-bold leading-[0.94] tracking-[-0.04em] text-ink mb-6 sm:mb-8"
                >
                  <span className="block">Yao Jean</span>
                  <span className="block">
                    Angoa<span className="text-indigo">.</span>
                  </span>
                </h1>

                <div className="hero-reveal-2 max-w-[60ch]">
                  <p className="text-lg sm:text-2xl font-medium text-ink leading-[1.35] tracking-[-0.015em] mb-3.5 sm:mb-4">
                    {profile?.role || 'Développeur Full-Stack Web'}. Je relie des bases PostgreSQL solides à des interfaces React agréables à utiliser.
                  </p>

                  {loading ? (
                    <div className="w-full max-w-lg space-y-2.5 mb-8 sm:mb-9">
                      <div className="h-4 bg-line/70 rounded w-full animate-pulse" />
                      <div className="h-4 bg-line/60 rounded w-4/5 animate-pulse" />
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-muted leading-[1.65] mb-8 sm:mb-9">
                      {profile?.short_bio ||
                        "J'accompagne les équipes et porteurs de projets de la modélisation des données jusqu'aux finitions d'interface avec React, TypeScript, Node.js et PostgreSQL."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div
                key="data-view"
                className="hero-view-enter rounded-lg bg-surface border border-line p-4 sm:p-8 mb-8 sm:mb-9"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-line font-mono text-[11px] sm:text-xs text-muted">
                  <span className="truncate max-w-full">
                    supabase.from(&apos;profile&apos;).select(&apos;public_fields&apos;).single()
                  </span>
                  <span className="text-indigo shrink-0">200 OK</span>
                </div>

                <pre className="font-mono text-[11px] sm:text-sm leading-6 sm:leading-7 overflow-x-auto whitespace-pre-wrap break-words sm:whitespace-pre text-ink">
                  <code>
                    <span className="text-muted">{'{'}</span>
                    {'\n'}
                    {Object.entries(publicRecord).map(([key, value], idx, arr) => {
                      const isLast = idx === arr.length - 1
                      const formattedValue = Array.isArray(value)
                        ? `[${value.map((v) => `"${v}"`).join(', ')}]`
                        : `"${String(value)}"`
                      return (
                        <span key={key} className="block pl-3 sm:pl-4">
                          <span className="text-indigo">&quot;{key}&quot;</span>
                          <span className="text-muted">: </span>
                          <span className={key === 'availability_status' ? 'text-mango font-medium' : 'text-ink'}>
                            {formattedValue}
                          </span>
                          {!isLast && <span className="text-muted">,</span>}
                        </span>
                      )
                    })}
                    <span className="text-muted">{'}'}</span>
                  </code>
                </pre>
              </div>
            )}

            {/* Actions & Bascule Interface ⇄ Données */}
            <div className="hero-reveal-2 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-5 sm:gap-6 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <Link
                  to="/projets"
                  onMouseEnter={() => portfolioService.prefetch('projects')}
                  className="btn-tactile w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors"
                >
                  Voir les projets
                </Link>

                <Link
                  to="/contact"
                  className="min-h-[44px] inline-flex items-center justify-center sm:justify-start text-sm font-medium text-ink hover:text-indigo underline underline-offset-4 decoration-line hover:decoration-indigo transition-colors"
                >
                  Me contacter
                </Link>
              </div>

              {/* Bascule Interface ⇄ Données */}
              <div className="flex items-center justify-between sm:justify-start gap-3 text-xs font-medium pt-4 sm:pt-0 border-t sm:border-t-0 border-line">
                <span className={!showData ? 'text-ink' : 'text-muted'}>Interface</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showData}
                  aria-label="Basculer entre la vue interface et la vue données Supabase"
                  onClick={() => setShowData((prev) => !prev)}
                  className={`relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${showData
                      ? 'bg-indigo border-indigo'
                      : 'bg-surface border-line'
                    }`}
                >
                  <span
                    className={`inline-block size-5 sm:size-4 rounded-full transition-transform duration-200 ${showData
                        ? 'translate-x-6 sm:translate-x-5.5 bg-indigo-fg'
                        : 'translate-x-1 bg-ink'
                      }`}
                  />
                </button>
                <span className={showData ? 'text-indigo font-mono' : 'text-muted font-mono'}>
                  Données
                </span>
              </div>
            </div>
          </div>

          {/* Encadré de statut & localisation à droite (desktop uniquement) */}
          <aside className="hidden lg:flex lg:col-span-3 lg:border-l lg:border-line lg:pl-6 flex-col gap-3 pb-1">
            <div className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
              {statusDot}
              <span>{statusLabel}</span>
            </div>

            <p className="text-sm text-muted leading-snug">
              {locationLabel}
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
