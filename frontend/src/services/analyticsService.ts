import { supabase } from '../lib/supabase'
import { SKILL_CATEGORY_META } from '../config/defaults'
import type { AnalyticsRange, AnalyticsStats, SkillCategoryType } from '../types/database'

export interface RawPageView {
  created_at?: string | null
  view_date?: string | null
  visitor_id?: string | null
  page_path?: string | null
}

export interface RawMessageSummary {
  id: string
  is_read: boolean
  created_at?: string | null
}

export interface RawProjectSummary {
  id: string
  is_featured: boolean
  status?: string | null
}

export interface RawSkillSummary {
  id: string
  category?: string | null
}

export interface AnalyticsComputationInput {
  views: RawPageView[]
  prevViews: RawPageView[]
  messages: RawMessageSummary[]
  projects: RawProjectSummary[]
  skills: RawSkillSummary[]
  rangeDays: AnalyticsRange
  now?: Date
}

function countUniqueVisitors(rows: RawPageView[]): number {
  const unique = new Set(
    rows.map((v) => v.visitor_id).filter((id): id is string => Boolean(id))
  )
  return unique.size > 0 ? unique.size : rows.length
}

/**
 * Fonction pure d'agrégation des métriques pour le tableau de bord Analytics.
 */
export function computeAnalyticsStats({
  views,
  prevViews,
  messages,
  projects,
  skills,
  rangeDays,
  now = new Date(),
}: AnalyticsComputationInput): AnalyticsStats {
  const totalViews = countUniqueVisitors(views)
  const prevTotalViews = countUniqueVisitors(prevViews)

  const viewsTrendPercent =
    prevTotalViews > 0
      ? Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100)
      : totalViews > 0
        ? 100
        : 0

  const unreadMessages = messages.filter((m) => !m.is_read).length
  const featuredProjects = projects.filter((p) => p.is_featured).length
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length
  const completedProjects = projects.filter((p) => p.status !== 'in_progress').length

  const conversionRate =
    totalViews > 0 ? Math.min(100, Math.round((messages.length / totalViews) * 1000) / 10) : 0

  // Répartition des pages visitées
  const pathCounts: Record<string, number> = {}
  for (const v of views) {
    const p = v.page_path || '/'
    const cleanP = p.split('?')[0] || '/'
    pathCounts[cleanP] = (pathCounts[cleanP] || 0) + 1
  }
  const topPages = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Répartition des compétences par catégorie
  const catCounts: Record<string, number> = {}
  for (const s of skills) {
    const cat = (s.category || 'other').toLowerCase()
    catCounts[cat] = (catCounts[cat] || 0) + 1
  }
  const skillCategoryStats = Object.entries(catCounts).map(([cat, count]) => {
    const meta = SKILL_CATEGORY_META[cat as SkillCategoryType]
    return {
      name: meta?.shortLabel || cat,
      count,
      color: meta?.color || '#6366f1',
    }
  })

  // Construction de la série temporelle jour par jour pour Recharts
  const chartMap = new Map<string, { visites: number; messages: number }>()
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dateKey = d.toISOString().slice(5, 10) // MM-DD
    chartMap.set(dateKey, { visites: 0, messages: 0 })
  }

  const dailyUniqueVisitors = new Set<string>()
  for (const v of views) {
    const rawDate = v.view_date || v.created_at
    if (!rawDate) continue
    const k = rawDate.slice(5, 10)
    const entry = chartMap.get(k)
    if (!entry) continue

    if (v.visitor_id) {
      const visitorKey = `${k}_${v.visitor_id}`
      if (!dailyUniqueVisitors.has(visitorKey)) {
        dailyUniqueVisitors.add(visitorKey)
        entry.visites += 1
      }
    } else {
      entry.visites += 1
    }
  }

  for (const m of messages) {
    if (!m.created_at) continue
    const k = m.created_at.slice(5, 10)
    const entry = chartMap.get(k)
    if (entry) {
      entry.messages += 1
    }
  }

  const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({
    date,
    visites: data.visites,
    messages: data.messages,
  }))

  return {
    totalViews,
    views7d: totalViews,
    viewsTrendPercent,
    totalMessages: messages.length,
    unreadMessages,
    featuredProjects,
    inProgressProjects,
    completedProjects,
    conversionRate,
    topPages,
    skillCategoryStats,
    chartData,
  }
}

const EMPTY_ANALYTICS: AnalyticsStats = {
  totalViews: 0,
  views7d: 0,
  viewsTrendPercent: 0,
  totalMessages: 0,
  unreadMessages: 0,
  featuredProjects: 0,
  inProgressProjects: 0,
  completedProjects: 0,
  conversionRate: 0,
  topPages: [],
  skillCategoryStats: [],
  chartData: [],
}

export const analyticsService = {
  async getAnalyticsStats(rangeDays: AnalyticsRange = 7): Promise<AnalyticsStats> {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - rangeDays)

    const prevStartDate = new Date(now)
    prevStartDate.setDate(now.getDate() - rangeDays * 2)

    try {
      const [viewsRes, prevViewsRes, messagesRes, projectsRes, skillsRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('created_at, view_date, visitor_id, page_path')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('page_views')
          .select('created_at, view_date, visitor_id')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        supabase
          .from('contact_messages')
          .select('id, is_read, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('projects').select('id, is_featured, status'),
        supabase.from('skills').select('id, category'),
      ])

      return computeAnalyticsStats({
        views: (viewsRes.data as RawPageView[] | null) || [],
        prevViews: (prevViewsRes.data as RawPageView[] | null) || [],
        messages: (messagesRes.data as RawMessageSummary[] | null) || [],
        projects: (projectsRes.data as RawProjectSummary[] | null) || [],
        skills: (skillsRes.data as RawSkillSummary[] | null) || [],
        rangeDays,
        now,
      })
    } catch (err) {
      console.error('Analytics stats error:', err)
      return EMPTY_ANALYTICS
    }
  },
}
