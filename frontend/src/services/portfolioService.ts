import { supabase } from '../lib/supabase'
import { invalidateCache } from './cache'
import { authService } from './authService'
import { analyticsService } from './analyticsService'
import { profileService } from './profileService'
import { projectService } from './projectService'
import { skillService } from './skillService'
import { contactService } from './contactService'

export { supabase }

/**
 * Façade unifiée exposant l'ensemble des services Supabase du portfolio.
 */
export const portfolioService = {
  ...authService,
  ...analyticsService,
  ...profileService,
  ...projectService,
  ...skillService,
  ...contactService,
  invalidateCache,

  prefetch(target: 'profile' | 'projects' | 'skills' | 'all' = 'all'): void {
    if (target === 'profile' || target === 'all') void profileService.getProfile()
    if (target === 'projects' || target === 'all') void projectService.getProjects()
    if (target === 'skills' || target === 'all') void skillService.getSkills()
  },
}
