import { describe, it, expect } from 'vitest'
import { computeAnalyticsStats } from './analyticsService'

describe('computeAnalyticsStats', () => {
  const fixedNow = new Date('2026-11-19T12:00:00.000Z')

  it('déduplique les visiteurs uniques et calcule la tendance en pourcentage', () => {
    const result = computeAnalyticsStats({
      views: [
        { visitor_id: 'v1', page_path: '/', created_at: '2026-11-19T09:00:00.000Z' },
        { visitor_id: 'v1', page_path: '/projets?cat=web', created_at: '2026-11-19T10:00:00.000Z' },
        { visitor_id: 'v2', page_path: '/projets', created_at: '2026-11-18T10:00:00.000Z' },
        { visitor_id: 'v3', page_path: '/contact', created_at: '2026-11-18T11:00:00.000Z' },
      ],
      prevViews: [
        { visitor_id: 'old1', created_at: '2026-11-10T10:00:00.000Z' },
        { visitor_id: 'old2', created_at: '2026-11-11T10:00:00.000Z' },
      ],
      messages: [
        { id: 'm1', is_read: false, created_at: '2026-11-19T10:30:00.000Z' },
        { id: 'm2', is_read: true, created_at: '2026-11-18T14:00:00.000Z' },
      ],
      projects: [
        { id: 'p1', is_featured: true, status: 'completed' },
        { id: 'p2', is_featured: false, status: 'in_progress' },
      ],
      skills: [
        { id: 's1', category: 'frontend' },
        { id: 's2', category: 'frontend' },
        { id: 's3', category: 'backend' },
      ],
      rangeDays: 7,
      now: fixedNow,
    })

    expect(result.totalViews).toBe(3)
    expect(result.viewsTrendPercent).toBe(50) // (3 - 2) / 2 = +50%
    expect(result.totalMessages).toBe(2)
    expect(result.unreadMessages).toBe(1)
    expect(result.featuredProjects).toBe(1)
    expect(result.completedProjects).toBe(1)
    expect(result.inProgressProjects).toBe(1)
    expect(result.conversionRate).toBe(66.7)
    expect(result.topPages[0]).toEqual({ path: '/projets', count: 2 })
    expect(result.chartData).toHaveLength(7)

    const todayPoint = result.chartData[result.chartData.length - 1]
    expect(todayPoint).toEqual({ date: '11-19', visites: 1, messages: 1 })
  })

  it('retourne des zéros propres quand aucune donnée n’existe', () => {
    const result = computeAnalyticsStats({
      views: [],
      prevViews: [],
      messages: [],
      projects: [],
      skills: [],
      rangeDays: 7,
      now: fixedNow,
    })

    expect(result.totalViews).toBe(0)
    expect(result.viewsTrendPercent).toBe(0)
    expect(result.conversionRate).toBe(0)
    expect(result.topPages).toEqual([])
    expect(result.skillCategoryStats).toEqual([])
    expect(result.chartData).toHaveLength(7)
  })
})
