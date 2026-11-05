import type { ReactElement } from 'react'
import type { DbProject } from '../types/database'
import Icon from './Icon'
import TechLogo, { getTechDetails } from './TechLogo'
import { sanitizeUrl, isSafeUrl } from '../utils/security'

interface ProjectCardProps {
  project: DbProject
  className?: string
}

export default function ProjectCard({ project, className = '' }: ProjectCardProps): ReactElement {
  const { title, tagline, description, summary, skills = [], demo_url, repo_url, is_featured, cover_image_url, images = [] } = project
  const cover = cover_image_url || images[0]

  // Détails de la technologie principale pour la lueur et le filigrane
  const primaryTech = skills[0] || ''
  const techDetails = getTechDetails(primaryTech)
  const PrimaryTechIcon = techDetails.icon
  const techColor = techDetails.color

  const featuredCardStyle: React.CSSProperties = is_featured
    ? {
      borderColor: `${techColor}35`,
      boxShadow: `0 10px 25px -5px ${techColor}15`,
    }
    : {}

  return (
    <article
      style={featuredCardStyle}
      className={`glass-card group relative flex flex-col justify-between p-5 sm:p-6 motion-safe:hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 overflow-hidden ${is_featured
        ? 'border-amber-400/40 dark:border-amber-400/25 ring-1 ring-amber-400/15'
        : 'hover:shadow-indigo-500/5'
        } ${className}`}
    >
      {/* Mise en valeur visuelle Projet à la une : Lueur & Filigrane discret du logo de la technologie principale */}
      {is_featured && (
        <>
          {/* Lueur subtile en arrière-plan */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full blur-3xl opacity-20 dark:opacity-30 group-hover:opacity-40 transition-opacity duration-500"
            style={{ background: techColor }}
            aria-hidden="true"
          />

          {/* Filigrane discret du logo en bas à droite */}
          <div
            className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.04] dark:opacity-[0.07] text-zinc-900 dark:text-zinc-100 group-hover:opacity-[0.09] dark:group-hover:opacity-[0.13] transition-all duration-500 group-hover:scale-105"
            style={{ color: techColor }}
            aria-hidden="true"
          >
            <PrimaryTechIcon size={160} />
          </div>
        </>
      )}

      <div className="relative z-10">
        {/* Badge distinctif chic pour tout projet marqué "À la une" */}
        {is_featured && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30 shadow-xs mb-3.5 backdrop-blur-xs">
            <span className="text-amber-500 dark:text-amber-400 text-xs" aria-hidden="true">★</span>
            <span>Projet à la une</span>
          </div>
        )}

        {/* Image de couverture du projet si disponible */}
        {cover && (
          <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* En-tête : titre + liens */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              {title}
            </h3>
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

      {/* Technologies avec logos officiels */}
      {skills.length > 0 && (
        <ul className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-wrap gap-1.5 relative z-10" aria-label="Technologies du projet">
          {skills.map((tech) => (
            <li
              key={tech}
              className="tag-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-[11px]"
            >
              <TechLogo name={tech} size={12} />
              <span>{tech}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
