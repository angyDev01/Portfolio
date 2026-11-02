/**
 * Types des entités de la base de données.
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
}

export interface DbSkill {
  id: string
  name: string
  category: 'frontend' | 'backend' | 'tools'
  icon: string
  description?: string
  is_featured: boolean
  display_order: number
}

export interface DbProject {
  id: string
  slug: string
  title: string
  tagline: string
  category: 'Full-Stack' | 'Frontend' | 'APIs'
  summary: string
  description: string
  images: string[]
  demo_url?: string
  repo_url?: string
  is_featured: boolean
  display_order: number
  skills?: string[]
}

export interface DbContactMessage {
  name: string
  email: string
  message: string
}

