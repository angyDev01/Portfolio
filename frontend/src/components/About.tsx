import { useEffect, useState, type ReactElement } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile } from '../types/database'
import AboutVideoPlayer from './AboutVideoPlayer'

export default function About(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) setProfile(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  const fullBio = profile?.full_bio && Array.isArray(profile.full_bio) && profile.full_bio.length > 0
    ? profile.full_bio
    : [
      'Développeur autodidacte passionné par l’ingénierie logicielle web moderne. Je conçois des interfaces nettes, accessibles et des architectures serveur robustes.',
      'Spécialisé dans l’écosystème React, Vite, Node.js et TypeScript, j’accorde une attention méticuleuse à l’ergonomie, aux performances et à la qualité du code.',
      'Constamment en veille technologique, j’aime transformer des exigences complexes en composants réutilisables et faciles à maintenir.',
    ]

  return (
    <section id="about" aria-labelledby="about-title" className="py-20 border-t border-zinc-200 dark:border-zinc-900">
      <div className="container-custom">
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Présentation</p>
          <h2 id="about-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
            À propos de moi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 glass-card p-6 sm:p-8 space-y-4 text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            {fullBio.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <aside aria-labelledby="about-summary-title" className="glass-card p-6 flex flex-col gap-4">
            <h3 id="about-summary-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              En résumé
            </h3>
            <dl className="space-y-3 text-xs font-mono">
              <div className="flex justify-between gap-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <dt className="text-zinc-500 dark:text-zinc-400">Rôle</dt>
                <dd className="text-right text-zinc-800 dark:text-zinc-200">{profile?.role || 'Full-Stack Web'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <dt className="text-zinc-500 dark:text-zinc-400">Stack</dt>
                <dd className="text-right text-zinc-800 dark:text-zinc-200">React, Node, TS</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <dt className="text-zinc-500 dark:text-zinc-400">Statut</dt>
                <dd className="text-right">
                  {profile?.availability_status === 'employed' ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">En poste</span>
                  ) : profile?.availability_status === 'unavailable' ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Non disponible</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Disponible</span>
                  )}
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        {/* Bloc vidéo de présentation personnelle (Lazy Loading preload="none") */}
        <AboutVideoPlayer posterUrl={profile?.avatar_url || '/videos/poster.jpg'} />
      </div>
    </section>
  )
}
