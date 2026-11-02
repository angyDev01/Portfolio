import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  DbProfile,
  DbProject,
  DbSkill,
  ContactMessagePayload,
  DirectMessagePayload,
  EmailContactPayload,
  ContactMessage,
} from '../types/database'

// Variables Supabase déclarées côté client (Vite)
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bemwrrgnquvnuuxjghhm.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbXdycmducXV2bnV1eGpnaGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTgyNDQsImV4cCI6MjA1Njg3NDI0NH0.8M4J0fK3r88v2WfD3h3rC0d21gM2V3'

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
            return data.map((item: { project_skills?: Array<{ skills?: { name?: string } }> }) => {
              const skills = item.project_skills
                ? item.project_skills
                    .map((ps) => ps.skills?.name)
                    .filter((n): n is string => Boolean(n))
                : []
              return {
                ...item,
                skills,
              } as unknown as DbProject
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
   * CANAL 2 — Envoie un message direct stocké dans Supabase (contact_messages)
   * 4 champs obligatoires : Nom, Email, Téléphone, Message
   */
  async submitDirectMessage(payload: DirectMessagePayload): Promise<{ ok: boolean; message: string }> {
    // Validation stricte des 4 champs
    if (!payload.name.trim() || !payload.email.trim() || !payload.phone.trim() || !payload.message.trim()) {
      return {
        ok: false,
        message: 'Les 4 champs (Nom complet, Email, Téléphone, Message) sont obligatoires.',
      }
    }

    // 1. Essai via API backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (res.ok && result.ok) {
        return {
          ok: true,
          message:
            result.message ||
            'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
        }
      }
    } catch {
      /* fallback direct Supabase */
    }

    // 2. Essai direct via Supabase Client
    if (supabase) {
      try {
        const { error } = await supabase.from('contact_messages').insert([
          {
            name: payload.name.trim(),
            email: payload.email.trim(),
            phone: payload.phone.trim(),
            message: payload.message.trim(),
            is_read: false,
          },
        ])
        if (!error) {
          return {
            ok: true,
            message:
              'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
          }
        }
      } catch (err) {
        console.error('Supabase submitDirectMessage error:', err)
      }
    }

    return {
      ok: false,
      message: 'Impossible de transmettre votre message direct pour le moment. Veuillez réessayer.',
    }
  },

  /**
   * CANAL 1 — Envoi d'un email (Nom, Email, Objet, Message)
   */
  async submitEmailMessage(payload: EmailContactPayload): Promise<{ ok: boolean; message: string }> {
    if (!payload.name.trim() || !payload.email.trim() || !payload.subject.trim() || !payload.message.trim()) {
      return {
        ok: false,
        message: 'Tous les champs (Nom, Email, Objet, Message) sont obligatoires.',
      }
    }

    // 1. Notifier l'API backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        return {
          ok: true,
          message: 'Votre message a été préparé avec succès pour envoi par email.',
        }
      }
    } catch {
      /* ignore */
    }

    return {
      ok: true,
      message: 'Votre message a été préparé avec succès pour envoi par email.',
    }
  },

  /**
   * Méthode générique de contact (rétro-compatibilité)
   */
  async submitContact(payload: ContactMessagePayload): Promise<{ ok: boolean; message: string }> {
    return this.submitDirectMessage({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      message: payload.message,
    })
  },

  // ==========================================
  // SERVICES ADMINISTRATION (DASHBOARD)
  // ==========================================

  /**
   * Authentification admin
   */
  async adminLogin(password: string): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      return { ok: res.ok && data.ok, message: data.message || (res.ok ? 'Connecté' : 'Erreur de connexion') }
    } catch {
      return { ok: false, message: 'Impossible de joindre le serveur API.' }
    }
  },

  /**
   * Récupère la liste de tous les messages de contact reçus via Canal 2
   */
  async getAdminMessages(password: string): Promise<{ ok: boolean; messages: ContactMessage[]; unreadCount: number }> {
    // 1. Essai API backend avec authentification
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages`, {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        return {
          ok: true,
          messages: data.messages || [],
          unreadCount: data.unreadCount ?? (data.messages || []).filter((m: ContactMessage) => !m.is_read).length,
        }
      }
    } catch {
      /* fallback to Supabase */
    }

    // 2. Fallback Supabase client
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data)) {
          const messages = data as ContactMessage[]
          const unreadCount = messages.filter((m) => !m.is_read).length
          return { ok: true, messages, unreadCount }
        }
      } catch (err) {
        console.error('Supabase getAdminMessages error:', err)
      }
    }

    return { ok: false, messages: [], unreadCount: 0 }
  },

  /**
   * Marquer un message comme lu ou non lu
   */
  async setMessageReadStatus(
    id: string,
    is_read: boolean,
    password: string
  ): Promise<{ ok: boolean; unreadCount?: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ is_read }),
      })
      if (res.ok) {
        const data = await res.json()
        return { ok: true, unreadCount: data.unreadCount }
      }
    } catch {
      /* fallback to Supabase */
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('contact_messages').update({ is_read }).eq('id', id)
        if (!error) return { ok: true }
      } catch (err) {
        console.error('Supabase setMessageReadStatus error:', err)
      }
    }

    return { ok: false }
  },

  /**
   * Supprimer un message
   */
  async deleteMessage(id: string, password: string): Promise<{ ok: boolean; unreadCount?: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${password}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        return { ok: true, unreadCount: data.unreadCount }
      }
    } catch {
      /* fallback to Supabase */
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id)
        if (!error) return { ok: true }
      } catch (err) {
        console.error('Supabase deleteMessage error:', err)
      }
    }

    return { ok: false }
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
