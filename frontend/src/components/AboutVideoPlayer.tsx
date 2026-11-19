import { useState, useRef, useEffect, type ReactElement } from 'react'
import { Play, X } from 'lucide-react'

interface AboutVideoPlayerProps {
  posterUrl?: string | null
  className?: string
}

export default function AboutVideoPlayer({
  posterUrl,
  className = '',
}: AboutVideoPlayerProps): ReactElement {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const defaultPoster = '/videos/poster.jpg'
  const activePoster = posterUrl || defaultPoster

  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeModal()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  const openModal = (): void => {
    setIsModalOpen(true)
  }

  const closeModal = (): void => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsModalOpen(false)
  }

  return (
    <div className={`mt-10 ${className}`}>
      <div
        onClick={openModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openModal()
          }
        }}
        aria-label="Ouvrir la vidéo de présentation"
        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-surface border border-line hover:border-indigo/50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="relative size-14 rounded-lg overflow-hidden shrink-0 border border-line bg-ink">
            <img
              src={activePoster}
              alt="Miniature vidéo"
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-200"
            />
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <span className="flex size-7 rounded-full bg-indigo text-indigo-fg items-center justify-center">
                <Play className="size-3.5 fill-current translate-x-0.5" />
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-indigo mb-0.5">
              Présentation vidéo · 1 min
            </p>
            <h3 className="text-base font-semibold text-ink group-hover:text-indigo transition-colors">
              Me découvrir en une minute
            </h3>
            <p className="text-sm text-muted line-clamp-1">
              Parcours, méthode de travail et ce que j&apos;aime construire.
            </p>
          </div>
        </div>

        <div className="self-end sm:self-auto shrink-0">
          <span className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-paper text-ink border border-line group-hover:bg-indigo group-hover:text-indigo-fg group-hover:border-indigo transition-colors">
            <Play className="size-3 fill-current" />
            <span>Visionner</span>
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lecteur vidéo de présentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md modal-backdrop-animate"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-3xl rounded-xl bg-surface border border-line overflow-hidden shadow-2xl modal-dialog-animate"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-mango" />
                <h4 className="text-sm font-medium text-ink">
                  Présentation personnelle — Angoa Yao Jean
                </h4>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="btn-tactile flex size-8 items-center justify-center rounded-md border border-line bg-paper text-muted hover:text-ink transition-colors cursor-pointer"
                aria-label="Fermer la vidéo"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                src="/videos/presentation.mp4"
                poster={activePoster}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
