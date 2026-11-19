import type { ReactElement } from 'react'
import type { DbProject } from '../types/database'
import TechLogo from './TechLogo'
import { sanitizeUrl, isSafeUrl } from '../utils/security'

interface ProjectCardProps {
  project: DbProject
  variant?: 'feature' | 'row' | 'tile'
  className?: string
  onClick?: (project: DbProject) => void
}

export default function ProjectCard({
  project,
  variant = 'tile',
  className = '',
  onClick,
}: ProjectCardProps): ReactElement {
  const {
    title,
    tagline,
    description,
    summary,
    skills = [],
    demo_url,
    repo_url,
    cover_image_url,
    images = [],
  } = project
  const cover = cover_image_url || images[0]

  const handleCardClick = (): void => {
    if (onClick) onClick(project)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(project)
    }
  }

  const renderLinks = (compact = false): ReactElement | null => {
    const hasDemo = Boolean(demo_url && isSafeUrl(demo_url))
    const hasRepo = Boolean(repo_url && isSafeUrl(repo_url))
    if (!hasDemo && !hasRepo) return null

    return (
      <div
        className={`flex items-center gap-4 text-sm font-medium shrink-0 ${compact ? 'text-xs' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {hasDemo && (
          <a
            href={sanitizeUrl(demo_url!)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="py-1.5 text-indigo hover:underline underline-offset-4"
            aria-label={`Démo en ligne de ${title}`}
          >
            Démo
          </a>
        )}
        {hasRepo && (
          <a
            href={sanitizeUrl(repo_url!)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="py-1.5 text-muted hover:text-ink hover:underline underline-offset-4 transition-colors"
            aria-label={`Code source de ${title}`}
          >
            Code
          </a>
        )}
      </div>
    )
  }

  // Variante 1 : Projet vedette (accueil, 1er projet)
  if (variant === 'feature') {
    return (
      <article
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `Voir les détails du projet ${title}` : undefined}
        className={`group grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10 ${onClick ? 'cursor-pointer' : ''
          } ${className}`}
      >
        {cover && (
          <div className="lg:col-span-7 relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-surface border border-line">
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-95"
              loading="lazy"
              onError={(e) => {
                ; (e.target as HTMLImageElement).parentElement!.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className={`${cover ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-4`}>
          <div>
            <h3 className="text-[28px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink group-hover:text-indigo transition-colors">
              {title}
            </h3>
            {tagline && (
              <p className="text-sm text-muted mt-1.5">{tagline}</p>
            )}
          </div>

          <p className="text-base text-muted leading-[1.6] max-w-[55ch]">
            {summary || description}
          </p>

          {skills.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1" aria-label="Technologies du projet">
              {skills.slice(0, 5).map((tech) => (
                <li
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-line text-xs font-medium text-ink"
                >
                  <TechLogo name={tech} size={13} />
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 flex items-center justify-between gap-4">
            {renderLinks()}
            {onClick && (
              <span className="text-xs font-medium text-muted group-hover:text-ink transition-colors">
                Détails
              </span>
            )}
          </div>
        </div>
      </article>
    )
  }

  // Variante 2 : Ligne éditoriale (accueil, projets suivants)
  if (variant === 'row') {
    return (
      <article
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `Voir les détails du projet ${title}` : undefined}
        className={`group border-t border-line py-5 sm:py-6 grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-6 items-baseline transition-transform duration-150 md:hover:translate-x-1 ${onClick ? 'cursor-pointer' : ''
          } ${className}`}
      >
        <div className="md:col-span-4 min-w-0">
          <h3 className="text-lg font-semibold text-ink group-hover:text-indigo transition-colors line-clamp-2 md:truncate">
            {title}
          </h3>
        </div>

        <p className="md:col-span-4 text-sm text-muted line-clamp-1">
          {tagline || summary || description}
        </p>

        <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-4">
          {skills.length > 0 && (
            <span className="text-xs text-muted truncate">
              {skills.slice(0, 3).join(', ')}
            </span>
          )}
          {renderLinks(true)}
        </div>
      </article>
    )
  }

  // Variante 3 : Tuile épurée (page Projets)
  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Voir les détails du projet ${title}` : undefined}
      className={`group flex flex-col justify-between gap-4 ${onClick ? 'cursor-pointer' : ''
        } ${className}`}
    >
      <div>
        {cover && (
          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-surface border border-line mb-5">
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-95"
              loading="lazy"
              onError={(e) => {
                ; (e.target as HTMLImageElement).parentElement!.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h3 className="text-xl font-semibold text-ink group-hover:text-indigo transition-colors">
            {title}
          </h3>
          {renderLinks(true)}
        </div>

        <p className="text-sm text-muted leading-[1.6] line-clamp-3 mb-4 max-w-[55ch]">
          {summary || description}
        </p>
      </div>

      {skills.length > 0 && (
        <ul className="pt-3 border-t border-line flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Technologies du projet">
          {skills.slice(0, 5).map((tech) => (
            <li key={tech} className="inline-flex items-center gap-1.5">
              <TechLogo name={tech} size={12} />
              <span>{tech}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
