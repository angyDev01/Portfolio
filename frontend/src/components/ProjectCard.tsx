import { useState, useEffect, type ReactElement } from 'react'
import type { DbProject } from '../types/database'
import ProjectCoverBadges from './ProjectCoverBadges'
import ShareButton from './ShareButton'
import TechLogo from './TechLogo'
import { sanitizeUrl, isSafeUrl } from '../utils/urlSecurity'
import type { ShareItem } from '../utils/shareUtils'

interface ProjectCardProps {
  project: DbProject
  variant?: 'feature' | 'row' | 'tile'
  headingLevel?: 'h2' | 'h3'
  className?: string
  onClick?: (project: DbProject) => void
}

export default function ProjectCard({
  project,
  variant = 'tile',
  headingLevel = 'h3',
  className = '',
  onClick,
}: ProjectCardProps): ReactElement {
  const {
    id,
    slug,
    title,
    tagline,
    description,
    summary,
    category,
    skills = [],
    demo_url,
    repo_url,
    cover_image_url,
    images = [],
    is_featured,
    status,
  } = project
  const cover = cover_image_url || images[0]
  const [coverFailed, setCoverFailed] = useState(false)

  useEffect(() => {
    setCoverFailed(false)
  }, [cover])

  const hasCover = Boolean(cover && !coverFailed)
  const HeadingTag = headingLevel

  const projectShareItem: ShareItem = {
    kind: 'project',
    id,
    slug,
    title,
    subtitle: tagline,
    description: summary || description,
    badge: is_featured ? 'À la une' : category,
    secondaryBadge: status === 'in_progress' ? 'En cours' : undefined,
    imageUrl: cover,
    metaItems: skills.slice(0, 4),
  }

  const handleCardClick = (): void => {
    if (onClick) onClick(project)
  }

  const renderTitle = (titleClass: string, isRow = false): ReactElement => {
    const content = isRow ? <span className="block line-clamp-2 md:truncate">{title}</span> : title
    if (!onClick) {
      return <HeadingTag className={titleClass}>{content}</HeadingTag>
    }
    return (
      <HeadingTag className={titleClass}>
        <button
          type="button"
          onClick={handleCardClick}
          aria-label={`Voir les détails du projet ${title}`}
          className="inline-flex items-center max-w-full min-h-[44px] sm:min-h-0 -my-2 sm:my-0 text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-indigo focus-visible:after:outline-offset-4 focus-visible:after:rounded-lg cursor-pointer"
        >
          {content}
        </button>
      </HeadingTag>
    )
  }

  const renderLinks = (compact = false, includeShare = true): ReactElement | null => {
    const hasDemo = Boolean(demo_url && isSafeUrl(demo_url))
    const hasRepo = Boolean(repo_url && isSafeUrl(repo_url))
    if (!hasDemo && !hasRepo && !includeShare) return null

    const linkHitClass =
      'inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 -my-2 sm:my-0 px-1.5 sm:px-0 sm:py-1.5'

    return (
      <div
        className={`relative z-10 flex items-center gap-1 sm:gap-4 text-sm font-medium shrink-0 ${compact ? 'text-xs' : ''}`}
      >
        {hasDemo && (
          <a
            href={sanitizeUrl(demo_url!)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkHitClass} text-indigo hover:underline underline-offset-4`}
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
            className={`${linkHitClass} text-muted hover:text-ink hover:underline underline-offset-4 transition-colors`}
            aria-label={`Code source de ${title}`}
          >
            Code
          </a>
        )}
        {includeShare && <ShareButton item={projectShareItem} compact={compact} />}
      </div>
    )
  }

  // Variante 1 : Projet vedette (accueil, 1er projet)
  if (variant === 'feature') {
    return (
      <article className={`relative group grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10 ${className}`}>
        {hasCover && (
          <div className="lg:col-span-7 relative aspect-video w-full rounded-lg overflow-hidden bg-surface border border-line">
            <img
              src={cover!}
              alt={title}
              className="w-full h-full object-contain object-center transition-all duration-300 group-hover:brightness-95"
              loading="lazy"
              onError={() => setCoverFailed(true)}
            />
            <ProjectCoverBadges isFeatured={is_featured} status={status} />
          </div>
        )}

        <div className={`${hasCover ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-4`}>
          <div>
            {!hasCover && (
              <ProjectCoverBadges isFeatured={is_featured} status={status} overlay={false} />
            )}
            {renderTitle(
              'text-[28px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink group-hover:text-indigo transition-colors'
            )}
            {tagline && <p className="text-sm text-muted mt-1.5">{tagline}</p>}
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
              <span aria-hidden="true" className="text-xs font-medium text-muted group-hover:text-ink transition-colors">
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
        className={`relative group border-t border-line py-5 sm:py-6 grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-6 items-baseline transition-transform duration-150 md:hover:translate-x-1 ${className}`}
      >
        <div className="md:col-span-4 min-w-0">
          {renderTitle('text-lg font-semibold text-ink group-hover:text-indigo transition-colors', true)}
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
          {renderLinks(true, false)}
        </div>
      </article>
    )
  }

  // Variante 3 : Tuile épurée (page Projets)
  return (
    <article className={`relative group flex flex-col justify-between gap-4 ${className}`}>
      <div>
        {hasCover && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-surface border border-line mb-5">
            <img
              src={cover!}
              alt={title}
              className="w-full h-full object-contain object-center transition-all duration-300 group-hover:brightness-95"
              loading="lazy"
              onError={() => setCoverFailed(true)}
            />
            <ProjectCoverBadges isFeatured={is_featured} status={status} />
          </div>
        )}

        {!hasCover && (
          <ProjectCoverBadges isFeatured={is_featured} status={status} overlay={false} />
        )}

        <div className="flex items-baseline justify-between gap-4 mb-2">
          {renderTitle('text-xl font-semibold text-ink group-hover:text-indigo transition-colors min-w-0')}
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
