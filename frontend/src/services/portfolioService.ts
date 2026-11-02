import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DbProfile, DbProject, DbSkill, ContactMessagePayload } from '../types/database'

// Variables Supabase déclarées côté client (Vite)
// Le projet ID est bemwrrgnquvnuuxjghhm
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bemwrrgnquvnuuxjghhm.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbXdycmducXV2bnV1eGpnaGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTgyNDQsImV4cCI6MjA1Njg3NDI0NH0.8M4J0fK3r88v2WfD3h3rC0d21gM2V3' // fallback key template

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let supabase: SupabaseClient | null = null

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
} catch (e) {
  console.warn('Supabase client direct init fallback to API Gateway:', e)
}

/**
 * Cache mémoire pour des navigations instantanées (0 ms de latence).
 * Stocke les promesses en cours ou résolues.
 */
interface CacheStore {
  profile: Promise<DbProfile | null> | null
  projects: Promise<DbProject[]> | null
  skills: Promise<DbSkill[]> | null
}

const cache: CacheStore = {
  profile: null,
  projects: null,
  skills: null,
}

export const portfolioService = {
  /**
   * Récupère le profil distant (avec cache mémoire & double stratégie API / Supabase direct)
   */
  async getProfile(): Promise<DbProfile | null> {
    if (cache.profile) return cache.profile

    cache.profile = (async () => {
      // 1. Essai via l'API backend
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          const data = await res.json()
          if (data) return data
        }
      } catch {
        /* fallback to Supabase */
      }

      // 2. Essai direct via Supabase SDK
      if (supabase) {
        try {
          const { data } = await supabase
            .from('profile')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (data) return data as DbProfile
        } catch (err) {
          console.error('Supabase getProfile direct error:', err)
        }
      }

      return null
    })()

    return cache.profile
  },

  /**
   * Récupère la liste de tous les projets avec leurs tags compétences associés
   */
  async getProjects(): Promise<DbProject[]> {
    if (cache.projects) return cache.projects

    cache.projects = (async () => {
      // 1. Essai via l'API backend
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`, { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) return data
        }
      } catch {
        /* fallback to Supabase */
      }

      // 2. Essai direct via Supabase SDK avec jointure
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select(`
              *,
              project_skills (
                skills (name)
              )
            `)
            .order('is_featured', { ascending: false })
            .order('display_order', { ascending: true })

          if (!error && Array.isArray(data)) {
            return data.map((item: any) => {
              const skills = item.project_skills
                ? item.project_skills.map((ps: any) => ps.skills?.name).filter(Boolean)
                : []
              return {
                ...item,
                skills,
              } as DbProject
            })
          }
        } catch (err) {
          console.error('Supabase getProjects direct error:', err)
        }
      }

      return []
    })()

    return cache.projects
  },

  /**
   * Récupère toutes les compétences ordonnées
   */
  async getSkills(): Promise<DbSkill[]> {
    if (cache.skills) return cache.skills

    cache.skills = (async () => {
      // 1. Essai via l'API backend
      try {
        const res = await fetch(`${API_BASE_URL}/api/skills`, { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) return data
        }
      } catch {
        /* fallback to Supabase */
      }

      // 2. Essai direct via Supabase SDK
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('skills')
            .select('*')
            .order('display_order', { ascending: true })

          if (!error && Array.isArray(data)) {
            return data as DbSkill[]
          }
        } catch (err) {
          console.error('Supabase getSkills direct error:', err)
        }
      }

      return []
    })()

    return cache.skills
  },

  /**
   * Envoie un message de contact vers contact_messages
   */
  async submitContact(payload: ContactMessagePayload): Promise<{ ok: boolean; message: string }> {
    // 1. Essai via API backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (res.ok) return { ok: true, message: result.message || 'Message envoyé !' }
    } catch {
      /* fallback to Supabase */
    }

    // 2. Essai direct via Supabase SDK
    if (supabase) {
      try {
        const { error } = await supabase.from('contact_messages').insert([payload])
        if (!error) {
          return { ok: true, message: 'Merci pour votre message ! Je vous répondrai dans les plus brefs délais.' }
        }
      } catch {
        /* ignore */
      }
    }

    return { ok: false, message: 'Impossible d’envoyer le message pour le moment. Veuillez réessayer.' }
  },

  /**
   * Précharge les données au survol d'un lien pour assurer un chargement à 0 ms
   */
  prefetch(resource: 'profile' | 'projects' | 'skills' | 'all'): void {
    if (resource === 'profile' || resource === 'all') this.getProfile()
    if (resource === 'projects' || resource === 'all') this.getProjects()
    if (resource === 'skills' || resource === 'all') this.getSkills()
  },

  /**
   * Invalide le cache pour forcer un rafraîchissement
   */
  invalidateCache(resource?: 'profile' | 'projects' | 'skills'): void {
    if (!resource) {
      cache.profile = null
      cache.projects = null
      cache.skills = null
    } else {
      cache[resource] = null
    }
  },
}

