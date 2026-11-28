import { useState, useRef, useEffect, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_PROFILE_CONTACT } from '../config/defaults'
import { useProfile, useSkills } from '../hooks/usePortfolioData'
import { portfolioService } from '../services/portfolioService'
import { BANNER_OBJECT_POSITION_CLASS, getBannerPosition } from '../utils/bannerPosition'
import AvatarImage from './AvatarImage'
import RichText from './RichText'
import ShareButton from './ShareButton'
import type { ShareItem } from '../utils/shareUtils'

const PUBLIC_STACK = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS']

export default function Hero(): ReactElement {
  const { profile, loading } = useProfile()
  const { skills } = useSkills()
  const [showData, setShowData] = useState(false)
  const [lockedHeight, setLockedHeight] = useState<number | null>(null)
  const [bannerFailed, setBannerFailed] = useState(false)
  const slotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setBannerFailed(false)
  }, [profile?.banner_url])

  useEffect(() => {
    const handleResize = (): void => {
      setLockedHeight(null)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const status = profile
    ? profile.availability_status || (profile.is_available ? 'available' : 'employed')
    : 'available'

  const statusLabel =
    profile?.status_label ||
    (status === 'employed'
      ? 'En poste / En mission'
      : status === 'unavailable'
        ? 'Non disponible'
        : 'Disponible')

  const locationLabel = profile?.location || DEFAULT_PROFILE_CONTACT.location

  const sortedSkills = [...skills]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .map((s) => s.name)
    .slice(0, 6)

  const publicRecord = {
    name: profile?.name || 'Yao Jean Angoa',
    alias: profile?.alias || "Angy's",
    role: profile?.role || 'Développeur Full-Stack Web',
    location: locationLabel,
    availability_status: status,
    stack: sortedSkills.length > 0 ? sortedSkills : PUBLIC_STACK,
  }

  const profileShareItem: ShareItem = {
    kind: 'profile',
    title: publicRecord.name,
    subtitle: publicRecord.role,
    description:
      profile?.short_bio ||
      "J'accompagne les équipes et porteurs de projets de la modélisation des données jusqu'aux finitions d'interface avec React, TypeScript, Node.js et PostgreSQL.",
    badge: statusLabel,
    avatarUrl: profile?.avatar_url,
    bannerUrl: profile?.banner_url,
    metaItems: publicRecord.stack.slice(0, 4),
  }

  const handleToggleData = (): void => {
    setShowData((prev) => {
      if (!prev && slotRef.current) {
        const measured = Math.ceil(slotRef.current.getBoundingClientRect().height)
        if (measured > 0) setLockedHeight(measured)
      }
      return !prev
    })
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

  const bannerUrl = profile?.banner_url?.trim() || ''
  const hasBanner = Boolean(bannerUrl && !bannerFailed)
  const hasAvatar = Boolean(profile?.avatar_url?.trim())
  const bannerPositionClass = BANNER_OBJECT_POSITION_CLASS[getBannerPosition(bannerUrl)]

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className={`${hasBanner ? 'pt-20 md:pt-16' : 'pt-24 md:pt-36'} pb-12 md:pb-24 border-b border-line transition-colors`}
    >
      {/* Bannière pleine largeur collée sous la barre de navigation (desktop / tablette) */}
      {hasBanner && (
        <div className="hidden md:block w-full border-b border-line bg-surface">
          <div className="w-full max-w-[1600px] mx-auto aspect-[16/5] max-h-[420px] overflow-hidden">
            <img
              key={bannerUrl}
              src={bannerUrl}
              alt={`Bannière de couverture de ${profile?.name || 'Yao Jean Angoa'}`}
              loading="eager"
              decoding="async"
              onError={() => setBannerFailed(true)}
              className={`w-full h-full object-cover ${bannerPositionClass} block`}
            />
          </div>
        </div>
      )}

      <div className={`container-custom ${hasBanner ? 'md:pt-8 lg:pt-10' : ''}`}>
        {/* Carte profil mobile : bannière encadrée + avatar superposé et statut */}
        {hasBanner && (
          <div className="md:hidden hero-reveal-1 mb-6 pb-4 border-b border-line">
            <div className="relative w-full aspect-[16/6] rounded-xl overflow-hidden border border-line bg-surface">
              <img
                key={bannerUrl}
                src={bannerUrl}
                alt={`Bannière de couverture de ${profile?.name || 'Yao Jean Angoa'}`}
                loading="eager"
                decoding="async"
                onError={() => setBannerFailed(true)}
                className={`w-full h-full object-cover ${bannerPositionClass} block`}
              />
            </div>

            {hasAvatar ? (
              <div className="relative z-10 -mt-7 px-3 flex items-end gap-3.5">
                <AvatarImage
                  src={profile?.avatar_url}
                  alt={profile?.name || 'Yao Jean Angoa'}
                  className="size-16 ring-4 ring-paper border border-line bg-surface shadow-xs"
                  initials="YA"
                />
                <div className="min-w-0 flex-1 pt-8 pb-0.5 flex flex-col gap-0.5">
                  {loading ? (
                    <span className="inline-block h-4 w-36 rounded bg-line/60 animate-pulse" aria-hidden="true" />
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-ink">
                      {statusDot}
                      <span className="truncate">{statusLabel}</span>
                    </span>
                  )}
                  <span className="text-xs text-muted truncate">{locationLabel}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                {loading ? (
                  <span className="inline-block h-4 w-44 rounded bg-line/60 animate-pulse" aria-hidden="true" />
                ) : (
                  <span className="inline-flex items-center gap-2 font-medium text-ink">
                    {statusDot}
                    <span>{statusLabel}</span>
                  </span>
                )}
                <span className="text-muted">{locationLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* Bandeau de statut compact (tablette ou mobile sans bannière) */}
        <div
          className={`${hasBanner ? 'hidden md:flex lg:hidden' : 'flex lg:hidden'} hero-reveal-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mb-6 pb-4 border-b border-line`}
        >
          {loading ? (
            <span className="inline-block h-4 w-44 rounded bg-line/60 animate-pulse" aria-hidden="true" />
          ) : (
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              {statusDot}
              <span>{statusLabel}</span>
            </span>
          )}
          <span className="text-muted">{locationLabel}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* Colonne principale : identité ou vue Données */}
          <div className="lg:col-span-9 min-w-0">
            {showData && (
              <h1 id="hero-title" className="sr-only">
                Yao Jean Angoa.
              </h1>
            )}

            <div
              ref={slotRef}
              className="flow-root pb-8 sm:pb-9"
              style={showData && lockedHeight ? { minHeight: `${lockedHeight}px` } : undefined}
            >
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
                      <div className="w-full max-w-lg space-y-2.5">
                        <div className="h-4 bg-line/70 rounded w-full animate-pulse" />
                        <div className="h-4 bg-line/60 rounded w-4/5 animate-pulse" />
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-muted leading-[1.65]">
                        <RichText
                          text={
                            profile?.short_bio ||
                            "J'accompagne les équipes et porteurs de projets de la modélisation des données jusqu'aux finitions d'interface avec React, TypeScript, Node.js et PostgreSQL."
                          }
                        />
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key="data-view"
                  className="hero-view-enter rounded-lg bg-surface border border-line p-4 sm:p-8"
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
                            <span className={key === 'availability_status' ? 'text-mango-text font-medium' : 'text-ink'}>
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
            </div>

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

                <ShareButton
                  item={profileShareItem}
                  label="Partager"
                  className="btn-tactile min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surface hover:border-indigo/50 hover:text-indigo text-ink text-sm font-medium transition-colors cursor-pointer"
                />
              </div>

              {/* Bascule Interface ⇄ Données */}
              <div className="flex items-center justify-between sm:justify-start gap-3 text-xs font-medium pt-4 sm:pt-0 border-t sm:border-t-0 border-line">
                <span className={!showData ? 'text-ink' : 'text-muted'}>Interface</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showData}
                  aria-label="Basculer entre la vue interface et la vue données Supabase"
                  onClick={handleToggleData}
                  className="min-h-[44px] sm:min-h-0 -my-2 sm:my-0 inline-flex items-center justify-center rounded-full cursor-pointer shrink-0"
                >
                  <span
                    className={`relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 items-center rounded-full border transition-colors ${showData
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
                  </span>
                </button>
                <span className={showData ? 'text-indigo font-mono' : 'text-muted font-mono'}>
                  Données
                </span>
              </div>
            </div>
          </div>

          {/* Encadré de statut & localisation à droite (desktop uniquement) */}
          <aside className="hidden lg:flex lg:col-span-3 lg:border-l lg:border-line lg:pl-6 flex-col gap-3 pb-1">
            {loading ? (
              <div className="h-5 w-36 rounded bg-line/60 animate-pulse" aria-hidden="true" />
            ) : (
              <div className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
                {statusDot}
                <span>{statusLabel}</span>
              </div>
            )}

            <p className="text-sm text-muted leading-snug">
              {locationLabel}
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
