import { useState, useRef, type ReactElement } from 'react'
import { Play } from 'lucide-react'

interface AboutVideoPlayerProps {
  posterUrl?: string | null
  className?: string
}

export default function AboutVideoPlayer({
  posterUrl,
  className = '',
}: AboutVideoPlayerProps): ReactElement {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const defaultPoster = '/videos/poster.jpg'
  const activePoster = posterUrl || defaultPoster

  const handlePlayClick = (): void => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((err) => {
          console.error('Erreur lecture vidéo:', err)
        })
    }
  }

  const handleVideoPlay = (): void => {
    setIsPlaying(true)
  }

  const handleVideoPause = (): void => {
    // Si la vidéo est mise en pause manuellement, controls reste actif
  }

  const handleVideoEnded = (): void => {
    setIsPlaying(false)
  }

  return (
    <div className={`mt-8 sm:mt-10 ${className}`}>
      {/* En-tête de section vidéo */}
      <div className="flex items-center gap-2 mb-3">
        <span className="size-2 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true" />
        <h3 className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
          Présentation Vidéo
        </h3>
      </div>

      {/* Conteneur vidéo moderne Glassmorphism avec lueur indigo */}
      <div className="relative group w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900/90 shadow-xl shadow-indigo-500/5 hover:border-indigo-500/40 transition-all duration-300">
        {/* Lueur subtile en arrière-plan */}
        <div
          className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500 -z-10"
          aria-hidden="true"
        />

        <div className="relative aspect-video w-full flex items-center justify-center bg-black/95">
          <video
            ref={videoRef}
            src="/videos/presentation.mp4"
            poster={activePoster}
            preload="none"
            controls={isPlaying}
            playsInline
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover rounded-2xl"
          >
            Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
          </video>

          {/* Overlay sombre transparent et Bouton Play central avant lecture */}
          {!isPlaying && (
            <div
              onClick={handlePlayClick}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 group/overlay select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePlayClick()
                }
              }}
              aria-label="Lancer la vidéo de présentation"
            >
              {/* Bouton de lecture central élégant */}
              <div className="relative flex items-center justify-center">
                {/* Halo lumineux indigo */}
                <div className="absolute size-20 sm:size-24 rounded-full bg-indigo-500/30 blur-lg group-hover/overlay:bg-indigo-500/50 transition-all duration-300" />

                <div className="relative size-16 sm:size-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-hover/overlay:scale-105 group-hover/overlay:shadow-indigo-500/60 transition-all duration-300 border border-white/20">
                  <Play className="size-7 sm:size-8 fill-current translate-x-0.5" />
                </div>
              </div>

              {/* Titre & Invitation sous le bouton */}
              <div className="mt-4 text-center px-4">
                <p className="text-sm sm:text-base font-semibold text-white tracking-wide drop-shadow-md">
                  Découvrir mon parcours en vidéo
                </p>
                <p className="text-xs font-mono text-zinc-300/80 mt-1">
                  Cliquez pour lancer la lecture
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

