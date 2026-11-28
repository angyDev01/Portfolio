export type BannerPosition = 'top' | 'center' | 'bottom'

export const BANNER_OBJECT_POSITION_CLASS: Record<BannerPosition, string> = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
}

export const BANNER_POSITION_OPTIONS: ReadonlyArray<{ value: BannerPosition; label: string }> = [
  { value: 'top', label: 'Haut' },
  { value: 'center', label: 'Centre' },
  { value: 'bottom', label: 'Bas' },
]

/**
 * Extrait le cadrage vertical encodé dans le fragment d'URL (`#pos=top|center|bottom`).
 * Retourne `'center'` par défaut si aucun cadrage valide n'est présent.
 */
export function getBannerPosition(url?: string | null): BannerPosition {
  if (!url || typeof url !== 'string') return 'center'
  const match = url.match(/#(?:[^#]*&)?pos=(top|center|bottom)(?:&|$)/i)
  if (!match || !match[1]) return 'center'
  return match[1].toLowerCase() as BannerPosition
}

/**
 * Supprime le fragment de cadrage d'une URL tout en conservant les query params (ex. `?t=...`).
 */
export function stripBannerPosition(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  return (url.split('#')[0] || '').trim()
}

/**
 * Encode le cadrage vertical dans l'URL de la bannière sans altérer la requête HTTP.
 * `'center'` est la valeur par défaut et n'ajoute pas de fragment.
 */
export function withBannerPosition(url: string, position: BannerPosition): string {
  const base = stripBannerPosition(url)
  if (!base) return ''
  if (position === 'center') return base
  return `${base}#pos=${position}`
}
