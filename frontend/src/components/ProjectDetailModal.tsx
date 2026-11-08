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
  // Fermeture par touche Échap
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Verrouillage du scroll d'arrière-plan lorsque la modale est active
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-zinc-950/80 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 md:p-8 text-zinc-100 shadow-2xl relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de fermeture en haut à droite */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 size-9 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-colors z-20 cursor-pointer shadow-md"
          aria-label="Fermer la boîte de dialogue"
        >
          <Icon name="close" className="size-4.5" />
        </button>

        {/* 1. Grande capture d'écran du projet en tête */}
        {cover && (
          <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-6 border border-zinc-800 bg-zinc-950 shadow-lg">
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 2. Badges : Statut, Catégorie et À la une */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Statut ("En cours" / "Terminé") */}
          {status === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <span>Terminé</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" aria-hidden="true" />
              <span>En cours</span>
            </span>
          )}

          {/* Badge "À la une" si applicable */}
          {is_featured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
              <span className="text-amber-400 text-xs" aria-hidden="true">★</span>
              <span>À la une</span>
            </span>
          )}

          {category && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
              {category}
            </span>
          )}
        </div>

        {/* Titre du projet */}
        <h2
          id="modal-project-title"
          className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight mb-1"
        >
          {title}
        </h2>

        {/* Description courte en sous-titre */}
        {tagline && (
          <p className="text-sm font-mono text-indigo-400 mb-2">{tagline}</p>
        )}
        {summary && (
          <p className="text-sm text-zinc-400 leading-relaxed mb-6 italic">
            {summary}
          </p>
        )}

        {/* 3. Section "À propos du projet" (Description Complète de la DB) */}
        <div className="mb-6 pt-5 border-t border-zinc-800">
          <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="sparkles" className="size-4 text-indigo-400" />
            <span>À propos du projet</span>
          </h3>
          <div className="text-sm sm:text-base text-zinc-300 leading-relaxed space-y-3 whitespace-pre-line font-sans">
            {description || summary || "Aucune description détaillée n'a été rédigée pour ce projet."}
          </div>
        </div>

        {/* 4. Grille des technologies associées avec leurs logos officiels */}
        {skills && skills.length > 0 && (
          <div className="mb-8 pt-5 border-t border-zinc-800">
            <h3 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Technologies associées
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((tech) => (
                <div
                  key={tech}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 flex items-center gap-2 text-xs font-mono shadow-xs"
                >
                  <TechLogo name={tech} size={15} />
                  <span>{tech}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Liens d'action : Démo en direct & Code source */}
        <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-zinc-800">
          {demo_url && isSafeUrl(demo_url) && (
            <a
              href={sanitizeUrl(demo_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              <span>Démo en direct</span>
              <Icon name="external" className="size-4" />
            </a>
          )}

          {repo_url && isSafeUrl(repo_url) && (
            <a
              href={sanitizeUrl(repo_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Icon name="github" className="size-4" />
              <span>Code source</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

