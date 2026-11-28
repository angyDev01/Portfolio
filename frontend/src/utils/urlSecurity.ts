/**
 * Protocoles stricts et autorisés pour les liens externes et les redirections
 */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:'])

/**
 * Nettoie une chaîne de texte de tout balisage HTML ou tentative d'injection de balises
 */
export function sanitizePlainText(text: string): string {
  if (typeof text !== 'string') return ''
  return text
    .replace(/<[^>]*>/g, '') // Supprime les balises HTML/XML
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Supprime les caractères de contrôle non imprimables
    .trim()
}

/**
 * Valide et assainit une URL pour bloquer formellement tout schéma dangereux (ex: javascript:, data:, vbscript:)
 *
 * @param url URL à vérifier
 * @param fallback URL de repli sécurisée par défaut ('#')
 * @returns L'URL validée si elle est saine, sinon le fallback
 */
export function sanitizeUrl(url?: string | null, fallback = '#'): string {
  if (!url || typeof url !== 'string') return fallback
  const trimmed = url.trim()
  if (!trimmed) return fallback

  // Liens d'ancrage valides (#section) ou chemins relatifs simples (/about)
  if (trimmed.startsWith('#')) return trimmed
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed

  try {
    const parsed = new URL(trimmed)
    const protocol = parsed.protocol.toLowerCase()

    if (ALLOWED_PROTOCOLS.has(protocol)) {
      return trimmed
    }
    return fallback
  } catch {
    return fallback
  }
}

/**
 * Prédicat booléen pour tester si une URL utilise un schéma sécurisé
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('#')) return true
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true

  try {
    const parsed = new URL(trimmed)
    return ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())
  } catch {
    return false
  }
}

/**
 * Nettoyage léger du texte saisi par les visiteurs (commentaires).
 * Retire uniquement les caractères de contrôle et normalise les espaces :
 * les chevrons sont conservés ("a < b", "<3") car React échappe déjà le rendu
 * (aucun dangerouslySetInnerHTML n'est utilisé).
 */
export function sanitizeUserText(text: string, options: { multiline?: boolean } = {}): string {
  if (typeof text !== 'string') return ''
  const withoutControls = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
  if (options.multiline) {
    return withoutControls
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  return withoutControls.replace(/\s+/g, ' ').trim()
}

/**
 * Détecte la présence d'un lien dans un texte saisi par un visiteur.
 */
export function containsLink(text: string): boolean {
  return /(https?:\/\/|www\.)/i.test(text)
}

export const hasUnallowedLink = containsLink

