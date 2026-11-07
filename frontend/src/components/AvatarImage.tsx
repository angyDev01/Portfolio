import { useState, useEffect, type ReactElement } from 'react'
import { User } from 'lucide-react'

export interface AvatarImageProps {
  src?: string | null
  alt?: string
  className?: string
  iconClassName?: string
  initials?: string
}

export default function AvatarImage({
  src,
  alt = 'Avatar',
  className = 'size-10',
  iconClassName = 'w-1/2 h-1/2',
  initials,
}: AvatarImageProps): ReactElement {
  const [hasError, setHasError] = useState<boolean>(false)

  // Réinitialise l'erreur immédiatement dès que l'URL change
  useEffect(() => {
    setHasError(false)
  }, [src])

  const hasValidSrc = typeof src === 'string' && src.trim().length > 0 && !hasError

  // État 2 : Secours (Fallback) ultra-soigné sans balise <img> cassée
  if (!hasValidSrc) {
    return (
      <div
        className={`rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 select-none overflow-hidden ${className}`}
        aria-hidden="true"
      >
        {initials ? (
          <span className="font-bold font-mono text-xs">{initials}</span>
        ) : (
          <User className={iconClassName} />
        )}
      </div>
    )
  }

  // État 1 : Image valide et chargée
  return (
    <div className={`relative rounded-full overflow-hidden shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-full"
        onError={() => setHasError(true)}
      />
    </div>
  )
}

