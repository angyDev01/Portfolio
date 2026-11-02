import type { DbProfile, DbProject, DbSkill, DbContactMessage } from '../types/database'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Service API côté frontend pour consommer les données issues de la base PostgreSQL.
 */
export const portfolioApiClient = {
  /**
   * Récupère le profil du portfolio depuis la table 'profile'
   */
  async getProfile(): Promise<DbProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  /**
   * Récupère la liste de tous les projets depuis la table 'projects'
   */
  async getProjects(): Promise<DbProject[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`)
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },

  /**
   * Récupère toutes les compétences depuis la table 'skills'
   */
  async getSkills(): Promise<DbSkill[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/skills`)
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },

  /**
   * Enregistre un message dans la table 'contact_messages'
   */
  async submitContact(data: DbContactMessage): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      return { ok: res.ok, message: result.message }
    } catch {
      return { ok: false, message: 'Impossible de joindre le serveur.' }
    }
  },
}

