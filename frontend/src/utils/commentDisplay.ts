const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

/**
 * Extrait 1 à 2 initiales lisibles à partir du nom d'un auteur de commentaire.
 */
export function getAuthorInitials(name?: string | null): string {
  const cleaned = (name ?? '').trim()
  if (!cleaned) return '?'

  const words = cleaned.split(/\s+/).filter(Boolean)
  const firstWord = words[0]
  if (!firstWord) return '?'

  const firstChar = Array.from(firstWord)[0] ?? '?'
  if (words.length === 1) {
    return firstChar.toUpperCase()
  }

  const lastWord = words[words.length - 1] ?? ''
  const lastChar = Array.from(lastWord)[0] ?? ''
  return `${firstChar}${lastChar}`.toUpperCase()
}

/**
 * Retourne un index déterministe [0, paletteSize - 1] pour colorer l'avatar d'un auteur.
 */
export function getAvatarToneIndex(name?: string | null, paletteSize = 5): number {
  if (paletteSize <= 0) return 0
  const normalized = (name ?? '').trim().toLowerCase()
  if (!normalized) return 0

  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }
  return hash % paletteSize
}

/**
 * Formate la date d'un commentaire (relatif récent en français, sinon date courte lisible).
 */
export function formatCommentDate(iso?: string | null, referenceNow?: number): string {
  if (!iso) return ''
  const date = new Date(iso)
  const time = date.getTime()
  if (Number.isNaN(time)) return ''

  const now = referenceNow ?? Date.now()
  const diffMs = now - time

  if (diffMs >= 0 && diffMs < MINUTE_MS) {
    return 'À l’instant'
  }
  if (diffMs >= MINUTE_MS && diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS)
    return `Il y a ${minutes} min`
  }
  if (diffMs >= HOUR_MS && diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS)
    return `Il y a ${hours} h`
  }
  if (diffMs >= DAY_MS && diffMs < 7 * DAY_MS) {
    const days = Math.floor(diffMs / DAY_MS)
    return `Il y a ${days} j`
  }

  const refYear = new Date(now).getFullYear()
  const sameYear = date.getFullYear() === refYear

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
