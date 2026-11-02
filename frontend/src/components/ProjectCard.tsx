import type { ReactElement } from 'react'
import type { Project } from '../types/portfolio'
import Icon from './Icon'

interface ProjectCardProps {
  project: Project
  className?: string
}

export default function ProjectCard({ project, className = '' }: ProjectCardProps): ReactElement {
  const { title, tagline, description, technologies, links, featured } = project

  return (
    <article
      className={`glass-card group relative flex flex-col justify-between p-5 sm:p-6 motion-safe:hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 ${className}`}
    >
      <div>
        {/* En-tête : titre + badge + liens */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors">
              {title}
            </h3>
            {featured && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Featured
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {links.repo && (
              <a
                href={links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
                aria-label={`Code source de ${title}`}
              >
                <Icon name="code" className="size-4" />
              </a>
            )}
            {links.demo && (
              <a
                href={links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                aria-label={`Démo en ligne de ${title}`}
              >
                <Icon name="external" className="size-4" />
              </a>
            )}
          </div>
        </div>

        <p className="text-xs font-mono text-indigo-400 mb-3">{tagline}</p>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-5 line-clamp-3">{description}</p>
      </div>

      {/* Technologies */}
      <ul className="pt-3 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
        {technologies.map((tech) => (
          <li key={tech} className="tag-mono px-2 py-0.5 rounded-md bg-zinc-800/50 text-zinc-300 border border-zinc-800">
            {tech}
          </li>
        ))}
      </ul>
    </article>
  )
}
