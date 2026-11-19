import { useEffect, useState } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile, DbProject, DbSkill } from '../types/database'

/**
 * Charge le profil actif et se synchronise automatiquement sur `portfolio:profile-updated`.
 */
export function useProfile(): { profile: DbProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    portfolioService.getProfile().then((data) => {
      if (mounted) {
        setProfile(data)
        setLoading(false)
      }
    })

    const handleProfileUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<Partial<DbProfile>>
      if (customEvent.detail) {
        setProfile((prev) => (prev ? { ...prev, ...customEvent.detail } : prev))
      }
      portfolioService.getProfile().then((fresh) => {
        if (mounted && fresh) setProfile(fresh)
      })
    }

    window.addEventListener('portfolio:profile-updated', handleProfileUpdated)
    return () => {
      mounted = false
      window.removeEventListener('portfolio:profile-updated', handleProfileUpdated)
    }
  }, [])

  return { profile, loading }
}

export function useProjects(): { projects: DbProject[]; loading: boolean } {
  const [projects, setProjects] = useState<DbProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    portfolioService.getProjects().then((data) => {
      if (mounted) {
        setProjects(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { projects, loading }
}

export function useSkills(): { skills: DbSkill[]; loading: boolean } {
  const [skills, setSkills] = useState<DbSkill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    portfolioService.getSkills().then((data) => {
      if (mounted) {
        setSkills(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { skills, loading }
}
