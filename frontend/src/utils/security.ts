import { z } from 'zod'
import { sanitizePlainText, sanitizeUserText, containsLink } from './urlSecurity'

export {
  sanitizePlainText,
  sanitizeUrl,
  isSafeUrl,
  sanitizeUserText,
  containsLink,
  hasUnallowedLink,
} from './urlSecurity'

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
