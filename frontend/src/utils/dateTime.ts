function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Convertit une date ISO (UTC) en valeur compatible <input type="datetime-local">
 * exprimée en heure LOCALE (évite le décalage horaire à chaque édition).
 */
export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/**
 * Convertit la valeur d'un <input type="datetime-local"> (heure locale)
 * en date ISO UTC, ou null si vide / invalide.
 */
export function fromDatetimeLocalValue(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
