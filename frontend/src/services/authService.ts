import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const authService = {
  async signInWithSupabase(
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { ok: false, error: error.message }
      }
      return { ok: Boolean(data.session) }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion'
      return { ok: false, error: message }
    }
  },

  async signOutSupabase(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession()
      return data.session
    } catch {
      return null
    }
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return subscription
  },
}
