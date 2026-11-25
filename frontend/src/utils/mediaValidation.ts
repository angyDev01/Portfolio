/** Types MIME d'images acceptés (le SVG est volontairement exclu : il peut embarquer des scripts). */
export const ALLOWED_IMAGE_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/x-png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 Mo

export type ImageValidationResult =
  | { ok: true; ext: string }
  | { ok: false; error: string }

/**
 * Valide un fichier image avant téléversement vers le bucket public.
 * L'extension est dérivée du type MIME avec repli sécurisé sur l'extension du nom de fichier.
 */
export function validateImageFile(
  file: { type: string; size: number; name?: string },
  maxBytes: number = MAX_IMAGE_BYTES
): ImageValidationResult {
  let ext = ALLOWED_IMAGE_TYPES[(file.type || '').toLowerCase()]
  if (!ext && file.name) {
    const nameExt = file.name.split('.').pop()?.toLowerCase()
    if (nameExt === 'jpg' || nameExt === 'jpeg') ext = 'jpg'
    else if (nameExt === 'png') ext = 'png'
    else if (nameExt === 'webp') ext = 'webp'
    else if (nameExt === 'avif') ext = 'avif'
  }

  if (!ext) {
    return {
      ok: false,
      error: 'Format non autorisé. Utilisez une image JPG, PNG, WebP ou AVIF (le SVG est refusé pour des raisons de sécurité).',
    }
  }
  if (file.size <= 0) {
    return { ok: false, error: 'Le fichier est vide.' }
  }
  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10
    return { ok: false, error: `Image trop volumineuse (maximum ${maxMb} Mo).` }
  }
  return { ok: true, ext }
}
