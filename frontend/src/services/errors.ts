interface SupabaseLikeError {
  code?: string | null
  message?: string | null
}

const MISSING_SCHEMA_CODES = new Set([
  'PGRST205', // table absente du cache de schéma
  'PGRST202', // fonction RPC absente
  '42P01', // undefined_table
  '42703', // undefined_column
  '42883', // undefined_function
])

/**
 * Détecte une erreur due à une migration SQL non appliquée
 * (table, colonne ou fonction inexistante).
 */
export function isMissingSchemaError(error?: SupabaseLikeError | null): boolean {
  if (!error) return false
  if (error.code && MISSING_SCHEMA_CODES.has(error.code)) return true
  const message = (error.message ?? '').toLowerCase()
  return (
    message.includes('schema cache') ||
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('function') && message.includes('does not exist'))
  )
}

/**
 * Formate un message d'erreur Supabase pour affichage utilisateur/admin.
 */
export function formatSupabaseError(
  error: SupabaseLikeError | null | undefined,
  fallback = 'Une erreur est survenue lors de l’opération.'
): string {
  if (!error) return fallback
  return error.message || fallback
}
