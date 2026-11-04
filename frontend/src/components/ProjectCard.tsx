import type { ReactElement } from 'react'
import type { DbProject } from '../types/database'
import Icon from './Icon'
import { sanitizeUrl, isSafeUrl } from '../utils/security'

interface ProjectCardProps {
  project: DbProject
  className?: string
}

export default function ProjectCard({ project, className = '' }: ProjectCardProps): ReactElement {
  const { title, tagline, description, summary, skills = [], demo_url, repo_url, is_featured } = project

  return (
    <article
      className={`glass-card group relative flex flex-col justify-between p-5 sm:p-6 motion-safe:hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 ${className}`}
    >
      <div>
        {/* En-tête : titre + badge + liens */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              {title}
            </h3>
            {is_featured && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Featured
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {repo_url && isSafeUrl(repo_url) && (
              <a
                href={sanitizeUrl(repo_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
                aria-label={`Code source de ${title} (nouvel onglet)`}
              >
                <Icon name="code" className="size-4" />
              </a>
            )}
            {demo_url && isSafeUrl(demo_url) && (
              <a
                href={sanitizeUrl(demo_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                aria-label={`Démo en ligne de ${title} (nouvel onglet)`}
              >
                <Icon name="external" className="size-4" />
              </a>
            )}
          </div>
        </div>

        <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-3">{tagline}</p>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 line-clamp-3">
          {summary || description}
        </p>
      </div>

      {/* Technologies */}
      {skills.length > 0 && (
        <ul className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-wrap gap-1.5" aria-label="Technologies du projet">
          {skills.map((tech) => (
            <li key={tech} className="tag-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              {tech}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
