import { useState, useRef, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'
import { useFocusTrap, FocusGuard } from '../hooks/useFocusTrap'

interface AboutVideoPlayerProps {
  posterUrl?: string | null
  profileName?: string
  className?: string
}

export default function AboutVideoPlayer({
  posterUrl,
  profileName = 'Yao Jean Angoa',
  className = '',
}: AboutVideoPlayerProps): ReactElement {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [posterFailed, setPosterFailed] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const triggerBtnRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  const defaultPoster = '/videos/poster.jpg'
  const activePoster = posterUrl || defaultPoster

  const openModal = (): void => {
    setIsModalOpen(true)
  }

  const closeModal = (): void => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsModalOpen(false)
  }

  const { focusFirst, focusLast } = useFocusTrap(dialogRef, isModalOpen, closeModal, {
    initialFocusRef: closeBtnRef,
    restoreFocusRef: triggerBtnRef,
  })

  return (
    <div className={`mt-10 ${className}`}>
      <button
        ref={triggerBtnRef}
        type="button"
        onClick={openModal}
        aria-label="Me découvrir en 20 secondes — Ouvrir la vidéo de présentation"
        className="w-full text-left group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-surface border border-line hover:border-indigo/50 cursor-pointer transition-colors"
      >
        <span className="flex items-center gap-4 min-w-0">
          <span className="relative size-14 rounded-lg overflow-hidden shrink-0 border border-line bg-ink block">
            {!posterFailed && (
              <img
                src={activePoster}
                alt="Miniature vidéo de présentation"
                onError={() => setPosterFailed(true)}
                className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-200 block"
              />
            )}
            <span className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <span className="flex size-7 rounded-full bg-indigo text-indigo-fg items-center justify-center">
                <Play className="size-3.5 fill-current translate-x-0.5" />
              </span>
            </span>
          </span>

          <span className="block min-w-0">
            <span className="block text-xs font-medium text-indigo mb-0.5">
              Présentation vidéo · 20 s
            </span>
            <span className="block text-base font-semibold text-ink group-hover:text-indigo transition-colors">
              Me découvrir en 20 secondes
            </span>
            <span className="block text-sm text-muted line-clamp-1">
              Parcours, méthode de travail et ce que j&apos;aime construire.
            </span>
          </span>
        </span>

        <span className="self-end sm:self-auto shrink-0">
          <span className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-paper text-ink border border-line group-hover:bg-indigo group-hover:text-indigo-fg group-hover:border-indigo transition-colors">
            <Play className="size-3 fill-current" />
            <span>Visionner</span>
          </span>
        </span>
      </button>

      {isModalOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md modal-backdrop-animate"
            onClick={closeModal}
          >
            <div
              ref={dialogRef}
              tabIndex={-1}
              className="relative w-full max-w-3xl rounded-xl bg-surface border border-line overflow-hidden shadow-2xl modal-dialog-animate focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <FocusGuard onFocus={focusLast} />

              <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-mango" aria-hidden="true" />
                  <h2 id="video-modal-title" className="text-sm font-medium text-ink">
                    Présentation personnelle — {profileName}
                  </h2>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={closeModal}
                  className="btn-tactile flex size-11 sm:size-9 items-center justify-center rounded-md border border-line bg-paper text-muted hover:text-ink transition-colors cursor-pointer"
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

              <FocusGuard onFocus={focusFirst} />
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
