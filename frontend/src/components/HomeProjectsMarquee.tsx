import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { portfolioData } from '../data/portfolioData'
import ProjectCard from './ProjectCard'
import Icon from './Icon'

export default function HomeProjectsMarquee(): ReactElement {
  const { projects } = portfolioData
  // Les 3 projets phares (featured)
  const featuredProjects = projects.items.filter((p) => p.featured).slice(0, 3)

  return (
    <section id="projets-phares" aria-labelledby="marquee-projects-title" className="py-20 border-t border-zinc-900 overflow-hidden">
      <div className="container-custom mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            Vitrine
          </p>
          <h2 id="marquee-projects-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Projets Phares
          </h2>
        </div>
        <p className="text-xs font-mono text-zinc-400">
          * Survolez pour figer le défilement
        </p>
      </div>

      {/* Infinite Marquee Container */}
      <div className="marquee-container relative w-full overflow-hidden py-4">
        {/* Masques de fondu latéraux */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

        {/* Piste en défilement infini (doublée pour la boucle fluide) */}
        <div className="marquee-track flex gap-6 w-max animate-[marquee_28s_linear_infinite] will-change-transform">
          {featuredProjects.concat(featuredProjects).map((project, index) => (
            <div key={`${project.id}-${index}`} className="w-[310px] sm:w-[380px] shrink-0">
              <ProjectCard project={project} className="h-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Bouton CTA vers /projets */}
      <div className="container-custom mt-10 text-center">
        <Link
          to="/projets"
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-200 text-sm font-semibold hover:border-indigo-500/40 hover:bg-zinc-800/80 hover:text-white transition-all shadow-sm"
        >
          <span>Explorer tous les projets</span>
          <Icon name="arrowRight" className="size-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  )
}

