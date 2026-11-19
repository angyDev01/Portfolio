import { supabase } from '../lib/supabase'
import type { DbSkill, SkillCategoryType } from '../types/database'
import { ALL_SKILL_CATEGORIES } from '../config/defaults'
import { portfolioCache, invalidateCache } from './cache'

const VALID_CATEGORY_SET = new Set<string>(ALL_SKILL_CATEGORIES)

export function normalizeSkillCategory(category?: string | null): SkillCategoryType {
  const clean = (category || 'frontend').toLowerCase().trim()
  return (VALID_CATEGORY_SET.has(clean) ? clean : 'other') as SkillCategoryType
}

export function formatSkillError(rawMessage: string): string {
  if (
    rawMessage.includes('skills_category_check') ||
    rawMessage.includes('check constraint')
  ) {
    return 'Catégorie non reconnue. Veuillez sélectionner une catégorie valide (Frontend, Backend, Outils & Méthodes, Base de données, DevOps / Cloud, Mobile, Autre).'
  }
  return rawMessage
}

export const skillService = {
  async getSkills(): Promise<DbSkill[]> {
    if (portfolioCache.skills) return portfolioCache.skills

    portfolioCache.skills = (async () => {
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('*')
          .order('display_order', { ascending: true })

        if (!error && Array.isArray(data)) {
          return data as DbSkill[]
        }
      } catch (err) {
        console.error('Error fetching skills:', err)
      }

      return []
    })()

    return portfolioCache.skills
  },

  async createSkill(
    skill: Omit<DbSkill, 'id' | 'created_at'>
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('skills')
      const normalizedSkill = {
        ...skill,
        category: normalizeSkillCategory(skill.category),
      }
      const { error } = await supabase.from('skills').insert([normalizedSkill])
      if (error) {
        return { ok: false, error: formatSkillError(error.message) }
      }
      invalidateCache('skills')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création compétence'
      return { ok: false, error: msg }
    }
  },

  async updateSkill(
    id: string,
    skill: Partial<DbSkill>
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('skills')
      const normalizedSkill = {
        ...skill,
        ...(skill.category !== undefined
          ? { category: normalizeSkillCategory(skill.category) }
          : {}),
      }
      const { error } = await supabase.from('skills').update(normalizedSkill).eq('id', id)
      if (error) {
        return { ok: false, error: formatSkillError(error.message) }
      }
      invalidateCache('skills')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour compétence'
      return { ok: false, error: msg }
    }
  },

  async deleteSkill(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('skills')
      await supabase.from('project_skills').delete().eq('skill_id', id)
      const { error } = await supabase.from('skills').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      invalidateCache('skills')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression compétence'
      return { ok: false, error: msg }
    }
  },
}
