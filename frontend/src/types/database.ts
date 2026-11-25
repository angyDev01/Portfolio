/**
 * Modèles TypeScript stricts des entités de la base de données distante Supabase.
 */

export type AvailabilityStatusType = 'available' | 'employed' | 'unavailable'

export interface DbProfile {
  id: string
  name: string
  alias: string
  role: string
  short_bio: string
  full_bio: string[]
  email: string
  avatar_url?: string | null
  banner_url?: string | null
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

export type AnalyticsRange = 7 | 14 | 30 | 90

export interface PagePathStat {
  path: string
  count: number
}

export interface CategoryStat {
  name: string
  count: number
  color?: string
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
  conversionRate: number
  topPages: PagePathStat[]
  skillCategoryStats: CategoryStat[]
  chartData: Array<{
    date: string
    visites: number
    messages: number
  }>
}

export type AnnouncementKind = 'project_wip' | 'event' | 'news'

export interface DbAnnouncement {
  id: string
  title: string
  kind: AnnouncementKind
  content: string
  cover_image_url?: string | null
  event_date?: string | null
  action_url?: string | null
  action_label?: string | null
  allow_comments: boolean
  comments_moderated?: boolean
  is_pinned: boolean
  is_published: boolean
  created_at: string
  updated_at?: string
}

export interface DbAnnouncementComment {
  id: string
  announcement_id: string
  author_name: string
  content: string
  is_approved: boolean
  created_at: string
}

/** Annonce publique avec le nombre de commentaires approuvés (commentaires chargés à la demande). */
export interface AnnouncementListItem extends DbAnnouncement {
  comments_count: number
}

/** Annonce côté administration, avec ses commentaires (approuvés ou non). */
export interface AnnouncementWithComments extends DbAnnouncement {
  comments: DbAnnouncementComment[]
}

export interface PollOptionResult {
  id: string
  poll_id: string
  label: string
  display_order: number
  votes_count: number
}

export interface PollWithResults {
  id: string
  question: string
  description?: string | null
  is_active: boolean
  closes_at?: string | null
  created_at: string
  total_votes: number
  voted_option_id?: string | null
  options: PollOptionResult[]
}
