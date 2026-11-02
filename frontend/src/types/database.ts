/**
 * Modèles TypeScript stricts des entités de la base de données distante Supabase.
 */

export interface DbProfile {
  id: string
  name: string
  alias: string
  role: string
  short_bio: string
  full_bio: string[]
  email: string
  github_url: string
  linkedin_url: string
  is_available: boolean
  status_label: string
  created_at?: string
  updated_at?: string
}

export type SkillCategoryType = 'frontend' | 'backend' | 'tools'

export interface DbSkill {
  id: string
  name: string
  category: SkillCategoryType
  icon: string
  description?: string
  is_featured: boolean
  display_order: number
  created_at?: string
}

export type ProjectCategoryType = 'Full-Stack' | 'Frontend' | 'APIs'

export interface DbProject {
  id: string
  slug: string
  title: string
  tagline: string
  category: ProjectCategoryType
  summary: string
  description: string
  images: string[]
  demo_url?: string | null
  repo_url?: string | null
  is_featured: boolean
  display_order: number
  skills: string[]
  created_at?: string
  updated_at?: string
}

export interface ContactMessagePayload {
  name: string
  email: string
  message: string
}
