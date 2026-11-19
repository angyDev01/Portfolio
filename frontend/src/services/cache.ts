import type { DbProfile, DbProject, DbSkill } from '../types/database'

/**
 * Cache mémoire en promesses pour des navigations instantanées et
 * déduplication des requêtes simultanées au montage.
 */
export interface PortfolioCacheStore {
  profile: Promise<DbProfile | null> | null
  projects: Promise<DbProject[]> | null
  skills: Promise<DbSkill[]> | null
}

export type CacheKey = keyof PortfolioCacheStore

export const portfolioCache: PortfolioCacheStore = {
  profile: null,
  projects: null,
  skills: null,
}

export function invalidateCache(key?: CacheKey): void {
  if (key) {
    portfolioCache[key] = null
  } else {
    portfolioCache.profile = null
    portfolioCache.projects = null
    portfolioCache.skills = null
  }
}
