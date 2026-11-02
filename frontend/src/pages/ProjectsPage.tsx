import { useState, useMemo, useEffect, type ReactElement } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbProject, ProjectCategoryType } from '../types/database'
import ProjectCard from '../components/ProjectCard'
import EmptyState from '../components/EmptyState'
import { ProjectCardSkeleton } from '../components/Skeletons'

const CATEGORIES: Array<'Tous' | ProjectCategoryType> = ['Tous', 'Full-Stack', 'Frontend', 'APIs']

export default function ProjectsPage(): ReactElement {
  const [projects, setProjects] = useState<DbProject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<'Tous' | ProjectCategoryType>('Tous')

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

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'Tous') return projects
    return projects.filter((p) => p.category === activeCategory)
  }, [activeCategory, projects])

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header de la page */}
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            Travaux & Réalisations
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-4">
            Catalogue des Projets
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Une sélection de projets complets alimentés par Supabase, des interfaces dynamiques aux architectures d’APIs modulaires.
          </p>
        </div>

        {/* Système de filtres par tags */}
        <div className="flex flex-wrap items-center gap-2 mb-10 border-b border-zinc-900 pb-5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
            const count = cat === 'Tous' ? projects.length : projects.filter((p) => p.category === cat).length
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md shadow-zinc-100/10'
                    : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
              >
                {cat}
                <span className="ml-2 opacity-60 text-[10px]">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Grille complète de projets ou Skeleton Loader */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun projet pour le moment"
            description="La base de données Supabase a été initialisée. Les projets ajoutés s'afficheront instantanément ici."
          />
        )}
      </div>
    </div>
  )
}
