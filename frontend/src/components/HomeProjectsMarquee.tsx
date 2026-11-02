import { useEffect, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { DbProject } from '../types/database'
import ProjectCard from './ProjectCard'
import EmptyState from './EmptyState'
import Icon from './Icon'

export default function HomeProjectsMarquee(): ReactElement {
  const [projects, setProjects] = useState<DbProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    portfolioService.getProjects().then((data) => {
      if (mounted) {
        setProjects(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const featured = projects.filter((p) => p.is_featured).slice(0, 5)
  const displayItems = featured.length > 0 ? featured : projects.slice(0, 5)

  return (
    <section id="projets-phares" aria-labelledby="marquee-projects-title" className="py-20 border-t border-zinc-200 dark:border-zinc-900 overflow-hidden">
      <div className="container-custom mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
            Vitrine
          </p>
          <h2 id="marquee-projects-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Projets Phares
          </h2>
        </div>
        {displayItems.length > 0 && (
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            * Survolez pour figer le défilement
          </p>
        )}
      </div>

      {loading ? (
        <div className="container-custom grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-48 glass-card animate-pulse" />
          <div className="h-48 glass-card animate-pulse hidden md:block" />
          <div className="h-48 glass-card animate-pulse hidden md:block" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="container-custom">
          <EmptyState
            title="Aucun projet pour le moment"
            description="La base de données vient d'être préparée. Les projets seront publiés prochainement."
          />
        </div>
      ) : (
        <div className="marquee-container relative w-full overflow-hidden py-4">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-zinc-50 dark:from-zinc-950 to-transparent z-10" />

          {/* Défilement infini */}
          <div className="marquee-track flex gap-6 w-max animate-[marquee_28s_linear_infinite] will-change-transform">
            {displayItems.concat(displayItems).map((project, index) => (
              <div key={`${project.id}-${index}`} className="w-[310px] sm:w-[380px] shrink-0">
                <ProjectCard project={project} className="h-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container-custom mt-10 text-center">
        <Link
          to="/projets"
          onMouseEnter={() => portfolioService.prefetch('projects')}
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 text-sm font-semibold hover:border-indigo-500/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-white transition-all shadow-xs"
        >
          <span>Explorer tous les projets</span>
          <Icon name="arrowRight" className="size-4 text-indigo-500 dark:text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  )
}
