import { useState, useMemo, type ReactElement } from 'react'
import { portfolioData } from '../data/portfolioData'
import ProjectCard from '../components/ProjectCard'
import type { ProjectCategory } from '../types/portfolio'

const CATEGORIES: Array<'Tous' | ProjectCategory> = ['Tous', 'Full-Stack', 'Frontend', 'APIs']

export default function ProjectsPage(): ReactElement {
  const { projects, ui } = portfolioData
  const [activeCategory, setActiveCategory] = useState<'Tous' | ProjectCategory>('Tous')

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'Tous') return projects.items
    return projects.items.filter((p) => p.category === activeCategory)
  }, [activeCategory, projects.items])

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header de la page */}
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            {projects.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-4">
            {projects.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {projects.description}
          </p>
        </div>

        {/* Système de filtres par tags */}
        <div className="flex flex-wrap items-center gap-2 mb-10 border-b border-zinc-900 pb-5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
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
                <span className="ml-2 opacity-60 text-[10px]">
                  {cat === 'Tous'
                    ? projects.items.length
                    : projects.items.filter((p) => p.category === cat).length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Grille complète de projets */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-zinc-400 font-mono text-sm">
            {ui.projects.emptyFilter}
          </div>
        )}
      </div>
    </div>
  )
}

