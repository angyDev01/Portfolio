import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://bemwrrgnquvnuuxjghhm.supabase.co'

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_SpSllH6khfzhvjIceQPOZA_WPlckQAV'

// Vérification de sécurité au démarrage du client Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY est introuvable dans le fichier .env'
  )
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
