import { useState, useMemo, type ReactElement } from 'react'
import type { DbProject, ProjectCategoryType } from '../types/database'
import { useProjects } from '../hooks/usePortfolioData'
import ProjectCard from '../components/ProjectCard'
import ProjectDetailModal from '../components/ProjectDetailModal'
import EmptyState from '../components/EmptyState'
import { ProjectCardSkeleton } from '../components/Skeletons'

const CATEGORIES: Array<'Tous' | ProjectCategoryType> = ['Tous', 'Full-Stack', 'Frontend', 'APIs']

export default function ProjectsPage(): ReactElement {
  const { projects, loading } = useProjects()
  const [activeCategory, setActiveCategory] = useState<'Tous' | ProjectCategoryType>('Tous')
  const [selectedProject, setSelectedProject] = useState<DbProject | null>(null)

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'Tous') return projects
    return projects.filter((p) => p.category === activeCategory)
  }, [activeCategory, projects])

  return (
    <div className="pt-24 pb-16 md:pt-36 md:pb-28">
      <div className="container-custom">
        {/* En-tête de la page */}
        <header className="max-w-[60ch] mb-10 md:mb-12">
          <h1
            style={{ fontVariationSettings: "'opsz' 72" }}
            className="text-[38px] sm:text-[57px] font-bold leading-[1.04] tracking-[-0.03em] text-ink mb-3.5 sm:mb-4"
          >
            Projets
          </h1>
          <p className="text-base sm:text-lg text-muted leading-[1.6]">
            Une sélection d&apos;applications conçues pour répondre à de vrais besoins, du schéma de base de données jusqu&apos;aux démonstrations en ligne.
          </p>
        </header>

        {/* Filtres en onglets texte (scroll horizontal sur mobile) */}
        <div
          role="tablist"
          aria-label="Filtrer les projets par catégorie"
          className="flex flex-nowrap overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 items-center gap-6 sm:gap-8 mb-10 md:mb-14 border-b border-line"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
            const count = cat === 'Tous' ? projects.length : projects.filter((p) => p.category === cat).length
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat)}
                className={`relative shrink-0 min-h-[44px] pb-3.5 pt-2 text-sm font-medium transition-colors cursor-pointer ${isActive
                    ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-indigo'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                <span>{cat}</span>
                <sup className={`ml-1 text-[11px] font-normal ${isActive ? 'text-indigo' : 'text-muted'}`}>
                  {count}
                </sup>
              </button>
            )
          })}
        </div>

        {/* Grille 2 colonnes aérée */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 md:gap-y-14">
            {[1, 2, 3, 4].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 md:gap-y-14">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant="tile"
                onClick={(p) => setSelectedProject(p)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun projet dans cette catégorie"
            description="Les réalisations de cette catégorie seront ajoutées prochainement."
          />
        )}

        <ProjectDetailModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    </div>
  )
}
