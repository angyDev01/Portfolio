import { useEffect, type ReactElement } from 'react'
import type { DbProject } from '../types/database'
import Icon from './Icon'
import TechLogo from './TechLogo'
import { sanitizeUrl, isSafeUrl } from '../utils/security'

interface ProjectDetailModalProps {
  project: DbProject | null
  isOpen: boolean
  onClose: () => void
}

export default function ProjectDetailModal({
  project,
  isOpen,
  onClose,
}: ProjectDetailModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !project) return null

  const {
    title,
    tagline,
    summary,
    description,
    category,
    status,
    is_featured,
    cover_image_url,
    images = [],
    skills = [],
    demo_url,
    repo_url,
  } = project

  const cover = cover_image_url || images[0]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md modal-backdrop-animate"
      onClick={onClose}
    >
      <div
        className="bg-surface border-t sm:border border-line rounded-t-2xl sm:rounded-xl max-h-[92dvh] sm:max-h-[90vh] w-full sm:max-w-[780px] flex flex-col overflow-hidden text-muted shadow-2xl sheet-dialog-animate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée discrète sur mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* En-tête collant : métadonnées + bouton Fermer toujours accessible */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-3.5 sm:py-4 border-b border-line shrink-0 bg-surface">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-muted min-w-0">
            <span className="inline-flex items-center gap-1.5 text-ink">
              <span
                className={`size-2 rounded-full ${status === 'completed' ? 'bg-mango' : 'bg-indigo'
                  }`}
                aria-hidden="true"
              />
              {status === 'completed' ? 'Terminé' : 'En cours'}
            </span>

            {category && (
              <span className="px-2 py-0.5 rounded-md bg-paper border border-line text-ink">
                {category}
              </span>
            )}

            {is_featured && (
              <span className="text-indigo">Sélection</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-tactile shrink-0 size-10 sm:size-9 rounded-md border border-line bg-paper text-muted hover:text-ink hover:border-ink/30 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer la boîte de dialogue"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto px-5 sm:px-8 pt-5 sm:pt-6 pb-safe">
          {cover && (
            <div className="relative aspect-[16/10] w-full rounded-lg border border-line bg-paper overflow-hidden mb-6">
              <img
                src={cover}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2
            id="modal-project-title"
            className="text-2xl sm:text-[32px] font-bold text-ink leading-[1.15] tracking-[-0.025em] mb-2"
          >
            {title}
          </h2>

          {tagline && (
            <p className="text-sm text-muted mb-5">{tagline}</p>
          )}

          {summary && (
            <p className="text-base text-ink leading-[1.6] mb-6 pb-6 border-b border-line max-w-[65ch]">
              {summary}
            </p>
          )}

          <div className="mb-7">
            <h3 className="text-sm font-semibold text-ink mb-2.5">
              À propos du projet
            </h3>
            <div className="text-sm sm:text-base text-muted leading-[1.65] space-y-3 whitespace-pre-line max-w-[65ch]">
              {description ||
                summary ||
                "Cette réalisation dispose d'un aperçu condensé ci-dessus. Vous pouvez tester la démo en ligne ou consulter le code source."}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mb-8 pt-6 border-t border-line">
              <h3 className="text-sm font-semibold text-ink mb-3">
                Technologies utilisées
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((tech) => (
                  <div
                    key={tech}
                    className="px-3 py-1.5 rounded-md bg-paper border border-line text-ink flex items-center gap-2 text-xs font-medium"
                  >
                    <TechLogo name={tech} size={13} />
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 pt-6 border-t border-line">
            {demo_url && isSafeUrl(demo_url) && (
              <a
                href={sanitizeUrl(demo_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors"
              >
                <span>Voir la démo</span>
                <Icon name="external" className="size-3.5" />
              </a>
            )}

            {repo_url && isSafeUrl(repo_url) && (
              <a
                href={sanitizeUrl(repo_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-paper hover:border-ink/30 text-ink text-sm font-medium transition-colors border border-line"
              >
                <Icon name="github" className="size-3.5" />
                <span>Code source</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex ml-auto px-3 py-2 text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
