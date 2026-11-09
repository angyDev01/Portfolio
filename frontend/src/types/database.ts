/**
 * Modèles TypeScript stricts des entités de la base de données distante Supabase.
 */

export type AvailabilityStatusType = 'available' | 'employed' | 'unavailable'

export interface DbProfile {
  id: string
  name: string
  full_name?: string
  alias: string
  role: string
  title?: string
  short_bio: string
  bio_short?: string
  full_bio: string[]
  bio_full?: string
  email: string
  avatar_url?: string | null
  phone?: string
  phone_secondary?: string
  whatsapp_url?: string
  location?: string
  github_url: string
  linkedin_url: string
  twitter_url?: string
  facebook_url?: string
  is_available: boolean
  status_label: string
  availability_status: AvailabilityStatusType
  accept_direct_messages: boolean
  created_at?: string
  updated_at?: string
}

export type SkillCategoryType = 'frontend' | 'backend' | 'tools' | 'database' | 'devops' | 'mobile' | 'other'

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
export type ProjectStatusType = 'in_progress' | 'completed'

export interface DbProject {
  id: string
  slug: string
  title: string
  tagline: string
  category: ProjectCategoryType
  status: ProjectStatusType
  summary: string
  description: string
  images: string[]
  cover_image_url?: string | null
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
  avatar_url?: string | null
  phone?: string
  message: string
}

export interface DirectMessagePayload {
  name: string
  email: string
  phone: string
  message: string
}

export interface EmailContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  is_read: boolean
  created_at: string
  ip_address?: string | null
  user_agent?: string | null
}

export interface PageView {
  id: string
  visitor_id: string
  page_path: string
  view_date?: string
  referrer?: string | null
  user_agent?: string | null
  created_at: string
}

export interface AnalyticsStats {
  totalViews: number
  views7d: number
  viewsTrendPercent: number
  totalMessages: number
  unreadMessages: number
  featuredProjects: number
  inProgressProjects: number
  completedProjects: number
  chartData: Array<{
    date: string
    visites: number
    messages: number
  }>
}
