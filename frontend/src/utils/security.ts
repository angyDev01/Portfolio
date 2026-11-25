import { z } from 'zod'

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
    // Si ce n'est pas parsable en URL absolue valide
    return fallback
  }
}

/**
 * Prédicat boolean pour tester si une URL utilise un schéma sécurisé
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
 * Récupère le premier message d'erreur d'une validation Zod
 */
export function getZodErrorMessage(error: z.ZodError): string {
  const firstIssue = error.issues?.[0]
  if (firstIssue?.message) {
    return firstIssue.message
  }
  const anyErr = error as unknown as { errors?: Array<{ message: string }> }
  const firstLegacy = anyErr.errors?.[0]
  if (firstLegacy?.message) {
    return firstLegacy.message
  }
  return 'Veuillez vérifier les informations saisies.'
}

/**
 * Expression régulière pour la validation des numéros de téléphone internationaux
 * Accepte formats: +225 07000000, 07 00 00 00, +33 6 12 34 56 78, (123) 456-7890
 */
export const PHONE_REGEX = /^\+?[0-9\s().-]{6,30}$/

/**
 * Schéma Zod de validation stricte pour le Message Direct (Canal 2 Supabase)
 */
export const directMessageSchema = z.object({
  name: z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères.')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères.')
    ),
  email: z
    .string()
    .trim()
    .email("Format d'adresse email invalide.")
    .max(255, "L'email ne peut pas dépasser 255 caractères."),
  phone: z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(6, 'Le numéro de téléphone doit comporter au moins 6 chiffres.')
        .max(30, 'Le numéro de téléphone ne peut pas dépasser 30 caractères.')
        .regex(
          PHONE_REGEX,
          'Format de téléphone invalide (ex: +225 07 00 00 00 00 ou +33 6 12 34 56 78).'
        )
    ),
  message: z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(5, 'Le message doit contenir au moins 5 caractères.')
        .max(2000, 'Le message ne peut pas dépasser 2000 caractères.')
    ),
})

export type ValidatedDirectMessage = z.infer<typeof directMessageSchema>

/**
 * Schéma Zod de validation stricte pour le Formulaire d'Email (Canal 1)
 */
export const emailContactSchema = z.object({
  name: z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères.')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères.')
    ),
  email: z
    .string()
    .trim()
    .email("Format d'adresse email invalide.")
    .max(255, "L'email ne peut pas dépasser 255 caractères."),
  subject: z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(2, "L'objet doit contenir au moins 2 caractères.")
        .max(150, "L'objet ne peut pas dépasser 150 caractères.")
    ),
  message: z
    .string()
    .transform(sanitizePlainText)
    .pipe(
      z
        .string()
        .min(5, 'Le message doit contenir au moins 5 caractères.')
        .max(2000, 'Le message ne peut pas dépasser 2000 caractères.')
    ),
})

export type ValidatedEmailContact = z.infer<typeof emailContactSchema>

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

const NO_LINK_MESSAGE = 'Les liens ne sont pas autorisés dans les commentaires.'

/**
 * Schéma Zod de validation stricte pour les commentaires d'annonces
 */
export const announcementCommentSchema = z.object({
  author_name: z
    .string()
    .transform((value) => sanitizeUserText(value))
    .pipe(
      z
        .string()
        .min(2, 'Votre nom doit contenir au moins 2 caractères.')
        .max(80, 'Votre nom ne peut pas dépasser 80 caractères.')
        .refine((value) => !containsLink(value), NO_LINK_MESSAGE)
    ),
  content: z
    .string()
    .transform((value) => sanitizeUserText(value, { multiline: true }))
    .pipe(
      z
        .string()
        .min(2, 'Le commentaire doit contenir au moins 2 caractères.')
        .max(1500, 'Le commentaire ne peut pas dépasser 1500 caractères.')
        .refine((value) => !containsLink(value), NO_LINK_MESSAGE)
    ),
})

export type ValidatedAnnouncementComment = z.infer<typeof announcementCommentSchema>
