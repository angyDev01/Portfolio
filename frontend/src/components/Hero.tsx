import { useEffect, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile } from '../types/database'
import Icon from './Icon'

export default function Hero(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) {
        setProfile(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section id="home" aria-labelledby="hero-title" className="relative isolate pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
      {/* Halos décoratifs Vercel */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-140 h-88 max-w-full bg-indigo-600/15 rounded-full blur-[120px] -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/3 -translate-x-1/2 w-80 h-60 bg-violet-600/10 rounded-full blur-[100px] -z-10"
        aria-hidden="true"
      />

      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Badge de disponibilité dynamique à 3 états */}
          {(() => {
            const status = profile?.availability_status || (profile?.is_available ? 'available' : 'employed')
            if (status === 'employed') {
              return (
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono text-indigo-300 shadow-sm mb-6 backdrop-blur-md">
                  <span className="relative flex size-2" aria-hidden="true">
                    <span className="absolute inline-flex size-full motion-safe:animate-ping rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-indigo-500" />
                  </span>
                  <span>{profile?.status_label || 'En poste / Actuellement en mission'}</span>
                </div>
              )
            }
            if (status === 'unavailable') {
              return (
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 shadow-sm mb-6 backdrop-blur-md">
                  <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                  <span>{profile?.status_label || 'Non disponible pour le moment'}</span>
                </div>
              )
            }
            // Par défaut : 'available'
            return (
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 shadow-sm mb-6 backdrop-blur-md">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inline-flex size-full motion-safe:animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>{profile?.status_label || 'Disponible'}</span>
              </div>
            )
          })()}

          {/* Salutation, Rôle & Nom */}
          <div className="flex flex-col items-center gap-1.5 mb-3">
            <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-medium tracking-wide uppercase">
              Bonjour, je suis{' '}
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{profile?.name || 'Angoa Yao Jean'}</span>
              {profile?.alias ? ` (${profile.alias})` : " (Angy's)"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold">
                {profile?.role || 'Développeur Full-Stack Junior'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="sparkles" className="size-3 text-indigo-500" />
                {profile?.location || "Abidjan, Côte d'Ivoire (Ouvert au télétravail / remote)"}
              </span>
            </div>
          </div>

          <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.12] mb-6">
            Concevoir des architectures web{' '}
            <span className="bg-linear-to-r from-indigo-500 via-indigo-400 to-violet-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
              performantes & fluides.
            </span>
          </h1>

          {/* Bio dynamique */}
          {loading ? (
            <div className="w-full max-w-xl mx-auto space-y-2 mb-9 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800/80 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800/50 rounded w-4/5 mx-auto" />
            </div>
          ) : (
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-9">
              {profile?.short_bio ||
                "Développeur Full-Stack autodidacte passionné par la conception d'applications web modernes, réactives et performantes sous React, Vite et Node.js."}
            </p>
          )}

          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/projets"
              onMouseEnter={() => portfolioService.prefetch('projects')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold text-sm dark:hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group cursor-pointer"
            >
              <span>Voir mes projets</span>
              <Icon
                name="arrowRight"
                className="size-4 group-hover:translate-x-0.5 transition-transform duration-200"
              />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer"
            >
              <span>Me contacter</span>
            </Link>
          </div>

          {/* Métriques / Badges en monospace */}
          <div className="mt-14 pt-8 border-t border-zinc-200 dark:border-zinc-900/80 grid grid-cols-3 gap-6 sm:gap-12 w-full max-w-lg">
            <div className="flex flex-col items-center">
              <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">Supabase</span>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Database</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">100%</span>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">TypeScript</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg sm:text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">Fast</span>
              <span className="text-[11px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Vite & Tailwind</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
