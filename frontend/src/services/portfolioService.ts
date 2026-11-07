import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { trackVisit } from '../utils/visitorTracker'
import { directMessageSchema, emailContactSchema, getZodErrorMessage } from '../utils/security'
import type {
  DbProfile,
  DbProject,
  DbSkill,
  ContactMessagePayload,
  DirectMessagePayload,
  EmailContactPayload,
  ContactMessage,
  AnalyticsStats,
} from '../types/database'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export { supabase }

/**
 * Cache mémoire pour des navigations instantanées (0 ms de latence).
 */
interface CacheStore {
  profile: Promise<DbProfile | null> | null
  projects: Promise<DbProject[]> | null
  skills: Promise<DbSkill[]> | null
}

const cache: CacheStore = {
  profile: null,
  projects: null,
  skills: null,
}

export const portfolioService = {
  // ==========================================
  // AUTHENTIFICATION SUPABASE
  // ==========================================

  async signInWithSupabase(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { ok: false, error: error.message }
      }
      return { ok: Boolean(data.session) }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion'
      return { ok: false, error: message }
    }
  },

  async signOutSupabase(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession()
      return data.session
    } catch {
      return null
    }
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return subscription
  },

  // ==========================================
  // ANALYTICS & STATS (Recharts)
  // ==========================================

  /**
   * Enregistrement automatique d'une consultation de page unique par jour
   */
  async recordPageView(path: string): Promise<void> {
    try {
      await trackVisit(path)
    } catch {
      /* ignore silencieusement pour ne pas bloquer l'expérience utilisateur */
    }
  },

  /**
   * Récupère les métriques consolidées et données pour Recharts
   */
  async getAnalyticsStats(rangeDays: 7 | 30 = 7): Promise<AnalyticsStats> {
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(now.getDate() - rangeDays)

    const prevStartDate = new Date()
    prevStartDate.setDate(now.getDate() - rangeDays * 2)

    try {
      // 1. Visites (avec visitor_id pour calcul du nombre de visiteurs uniques réels)
      const { data: viewsData } = await supabase
        .from('page_views')
        .select('created_at, view_date, visitor_id')
        .gte('created_at', startDate.toISOString())

      const { data: prevViewsData } = await supabase
        .from('page_views')
        .select('created_at, view_date, visitor_id')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      // 2. Messages
      const { data: messagesData } = await supabase
        .from('contact_messages')
        .select('id, is_read, created_at')
        .order('created_at', { ascending: false })

      // 3. Projets
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, is_featured, status')

      const views = viewsData || []
      const prevViews = prevViewsData || []
      const messages = messagesData || []
      const projects = projectsData || []

      // Calcul des visiteurs uniques réels (nettoyage des doublons / rafraîchissements multiples)
      const uniqueVisitors = new Set(
        views
          .map((v) => (v as { visitor_id?: string }).visitor_id)
          .filter((id): id is string => Boolean(id))
      )
      const totalViews = uniqueVisitors.size > 0 ? uniqueVisitors.size : views.length

      const prevUniqueVisitors = new Set(
        prevViews
          .map((v) => (v as { visitor_id?: string }).visitor_id)
          .filter((id): id is string => Boolean(id))
      )
      const prevTotalViews =
        prevUniqueVisitors.size > 0 ? prevUniqueVisitors.size : prevViews.length

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

      // Construction des données jour par jour pour Recharts
      const chartMap = new Map<string, { visites: number; messages: number }>()

      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const dateKey = d.toISOString().slice(5, 10) // MM-DD
        chartMap.set(dateKey, { visites: 0, messages: 0 })
      }

      // Déduplication des visiteurs uniques par jour
      const dailyUniqueVisitors = new Set<string>()

      for (const v of views) {
        const item = v as { view_date?: string; created_at?: string; visitor_id?: string }
        const rawDate = item.view_date || item.created_at
        if (!rawDate) continue
        const k = rawDate.slice(5, 10)
        if (chartMap.has(k)) {
          if (item.visitor_id) {
            const visitorKey = `${k}_${item.visitor_id}`
            if (!dailyUniqueVisitors.has(visitorKey)) {
              dailyUniqueVisitors.add(visitorKey)
              chartMap.get(k)!.visites += 1
            }
          } else {
            chartMap.get(k)!.visites += 1
          }
        }
      }

      for (const m of messages) {
        if (!m.created_at) continue
        const k = m.created_at.slice(5, 10)
        if (chartMap.has(k)) {
          chartMap.get(k)!.messages += 1
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
        chartData,
      }
    } catch (err) {
      console.error('Analytics stats error:', err)
      return {
        totalViews: 0,
        views7d: 0,
        viewsTrendPercent: 0,
        totalMessages: 0,
        unreadMessages: 0,
        featuredProjects: 0,
        inProgressProjects: 0,
        completedProjects: 0,
        chartData: [],
      }
    }
  },

  // ==========================================
  // PROFIL & DISPONIBILITÉ
  // ==========================================

  async getProfile(): Promise<DbProfile | null> {
    if (cache.profile) return cache.profile

    cache.profile = (async () => {
      // 1. Supabase direct
      try {
        const { data } = await supabase
          .from('profile')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          return {
            ...data,
            availability_status: data.availability_status || (data.is_available ? 'available' : 'employed'),
            accept_direct_messages: data.accept_direct_messages !== false,
          } as DbProfile
        }
      } catch {
        /* fallback to API */
      }

      // 2. API fallback
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            return {
              ...data,
              availability_status: data.availability_status || (data.is_available ? 'available' : 'employed'),
              accept_direct_messages: data.accept_direct_messages !== false,
            } as DbProfile
          }
        }
      } catch {
        /* ignore */
      }

      return null
    })()

    return cache.profile
  },

  async updateProfile(updates: Partial<DbProfile>): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('profile')
      let profile = await this.getProfile()
      
      let targetId = profile?.id
      if (!targetId) {
        try {
          const { data: row } = await supabase
            .from('profile')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          targetId = row?.id
        } catch {
          /* ignore */
        }
      }

      let updatedViaSupabase = false
      if (targetId) {
        const { data, error } = await supabase
          .from('profile')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId)
          .select()

        if (!error && Array.isArray(data) && data.length > 0) {
          updatedViaSupabase = true
        }
      }

      // Si Supabase direct a échoué ou n'a affecté aucune ligne (contrainte RLS sans session),
      // basculer sur l'API backend pour synchronisation garantie en base
      if (!updatedViaSupabase) {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          return { ok: false, error: data.message || 'Erreur lors de la mise à jour du profil' }
        }
      }

      this.invalidateCache('profile')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('portfolio:profile-updated', { detail: updates }))
      }
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour profil'
      return { ok: false, error: msg }
    }
  },

  /**
   * Téléversement d'image dans le bucket public Supabase 'portfolio'
   * Avec horodatage unique et cacheControl '0' pour cache-busting garanti
   */
  async uploadMedia(
    file: File,
    folder: 'avatars' | 'projects' = 'avatars'
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const timestamp = Date.now()
      const rand = Math.random().toString(36).substring(2, 7)
      const filePath = folder === 'avatars'
        ? `avatars/avatar-${timestamp}-${rand}.${fileExt}`
        : `projects/project-${timestamp}-${rand}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, {
          cacheControl: '0',
          upsert: true,
        })

      if (error) {
        return { ok: false, error: error.message }
      }

      const { data: publicData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(data?.path || filePath)

      const urlWithBuster = `${publicData.publicUrl}?t=${timestamp}`
      return { ok: true, url: urlWithBuster }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur téléversement média'
      return { ok: false, error: msg }
    }
  },

  /**
   * Suppression propre d'un ancien fichier média dans Supabase Storage
   */
  async deleteMedia(url?: string | null): Promise<void> {
    if (!url) return
    try {
      const cleanUrl = url.split('?')[0] || ''
      const marker = '/storage/v1/object/public/portfolio/'
      const idx = cleanUrl.indexOf(marker)
      if (idx !== -1) {
        const path = decodeURIComponent(cleanUrl.slice(idx + marker.length))
        if (path) {
          await supabase.storage.from('portfolio').remove([path])
        }
      }
    } catch {
      /* ignore silencieusement */
    }
  },

  // ==========================================
  // PROJETS (CRUD COMPLET)
  // ==========================================

  async getProjects(): Promise<DbProject[]> {
    if (cache.projects) return cache.projects

    cache.projects = (async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            project_skills (
              skills (id, name)
            )
          `)
          .order('is_featured', { ascending: false })
          .order('display_order', { ascending: true })

        if (!error && Array.isArray(data)) {
          return data.map((item) => {
            const skills = item.project_skills
              ? item.project_skills
                .map((ps: { skills?: { name?: string } }) => ps.skills?.name)
                .filter((n: string | undefined): n is string => Boolean(n))
              : []
            const cover_image_url = item.cover_image_url || (Array.isArray(item.images) && item.images[0]) || null
            return {
              ...item,
              status: item.status || 'completed',
              cover_image_url,
              images: item.images || (cover_image_url ? [cover_image_url] : []),
              skills,
            } as DbProject
          })
        }
      } catch {
        /* fallback to API */
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            return data.map((item) => {
              const cover_image_url = item.cover_image_url || (Array.isArray(item.images) && item.images[0]) || null
              return {
                ...item,
                status: item.status || 'completed',
                cover_image_url,
                images: item.images || (cover_image_url ? [cover_image_url] : []),
                skills: Array.isArray(item.skills) ? item.skills : [],
              } as DbProject
            })
          }
        }
      } catch {
        /* ignore */
      }

      return []
    })()

    return cache.projects
  },

  async createProject(
    project: Omit<DbProject, 'id' | 'created_at' | 'updated_at' | 'skills'>,
    skillIds: string[] = []
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('projects')
      const cover_image_url = project.cover_image_url || (Array.isArray(project.images) && project.images[0]) || null
      const images = cover_image_url ? [cover_image_url] : (project.images || [])

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            slug: project.slug,
            title: project.title,
            tagline: project.tagline,
            category: project.category,
            status: project.status || 'completed',
            summary: project.summary,
            description: project.description,
            cover_image_url,
            images,
            demo_url: project.demo_url || null,
            repo_url: project.repo_url || null,
            is_featured: Boolean(project.is_featured),
            display_order: Number(project.display_order) || 0,
          },
        ])
        .select('id')
        .single()

      if (error || !data) return { ok: false, error: error?.message || 'Erreur création' }

      if (skillIds.length > 0) {
        const relations = skillIds.map((sId) => ({
          project_id: data.id,
          skill_id: sId,
        }))
        await supabase.from('project_skills').insert(relations)
      }

      this.invalidateCache('projects')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création projet'
      return { ok: false, error: msg }
    }
  },

  async updateProject(
    id: string,
    project: Partial<DbProject>,
    skillIds?: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('projects')
      const cover_image_url = project.cover_image_url !== undefined
        ? project.cover_image_url
        : (Array.isArray(project.images) && project.images[0]) || null
      const images = cover_image_url ? [cover_image_url] : (project.images || [])

      const { error } = await supabase
        .from('projects')
        .update({
          slug: project.slug,
          title: project.title,
          tagline: project.tagline,
          category: project.category,
          status: project.status,
          summary: project.summary,
          description: project.description,
          cover_image_url,
          images,
          demo_url: project.demo_url || null,
          repo_url: project.repo_url || null,
          is_featured: project.is_featured,
          display_order: project.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return { ok: false, error: error.message }

      if (skillIds !== undefined) {
        // Synchroniser les compétences liées
        await supabase.from('project_skills').delete().eq('project_id', id)
        if (skillIds.length > 0) {
          const relations = skillIds.map((sId) => ({
            project_id: id,
            skill_id: sId,
          }))
          await supabase.from('project_skills').insert(relations)
        }
      }

      this.invalidateCache('projects')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur modification projet'
      return { ok: false, error: msg }
    }
  },

  async deleteProject(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('projects')
      await supabase.from('project_skills').delete().eq('project_id', id)
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      this.invalidateCache('projects')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression projet'
      return { ok: false, error: msg }
    }
  },

  // ==========================================
  // COMPÉTENCES (SKILLS - CRUD COMPLET)
  // ==========================================

  async getSkills(): Promise<DbSkill[]> {
    if (cache.skills) return cache.skills

    cache.skills = (async () => {
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('*')
          .order('display_order', { ascending: true })

        if (!error && Array.isArray(data)) {
          return data as DbSkill[]
        }
      } catch {
        /* fallback */
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/skills`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) return data
        }
      } catch {
        /* ignore */
      }

      return []
    })()

    return cache.skills
  },

  async createSkill(skill: Omit<DbSkill, 'id' | 'created_at'>): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('skills')
      const { error } = await supabase.from('skills').insert([skill])
      if (error) return { ok: false, error: error.message }
      this.invalidateCache('skills')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création compétence'
      return { ok: false, error: msg }
    }
  },

  async updateSkill(id: string, skill: Partial<DbSkill>): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('skills')
      const { error } = await supabase.from('skills').update(skill).eq('id', id)
      if (error) return { ok: false, error: error.message }
      this.invalidateCache('skills')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour compétence'
      return { ok: false, error: msg }
    }
  },

  async deleteSkill(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      this.invalidateCache('skills')
      await supabase.from('project_skills').delete().eq('skill_id', id)
      const { error } = await supabase.from('skills').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      this.invalidateCache('skills')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression compétence'
      return { ok: false, error: msg }
    }
  },

  // ==========================================
  // CANAUX DE CONTACT PUBLICS
  // ==========================================

  async submitDirectMessage(payload: DirectMessagePayload): Promise<{ ok: boolean; message: string }> {
    // 1. Validation stricte Zod et assainissement Anti-XSS
    const validation = directMessageSchema.safeParse(payload)
    if (!validation.success) {
      return {
        ok: false,
        message: getZodErrorMessage(validation.error),
      }
    }

    const cleanPayload = validation.data

    // Vérifier si la réception des messages directs est active
    const profile = await this.getProfile()
    if (profile && profile.accept_direct_messages === false) {
      return {
        ok: false,
        message:
          'La réception de messages directs est momentanément suspendue. Veuillez me contacter par email.',
      }
    }

    // 2. Supabase direct
    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          name: cleanPayload.name,
          email: cleanPayload.email,
          phone: cleanPayload.phone,
          message: cleanPayload.message,
          is_read: false,
        },
      ])
      if (!error) {
        return {
          ok: true,
          message:
            'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
        }
      }
    } catch {
      /* fallback to API */
    }

    // 3. API fallback
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      })
      const result = await res.json()
      if (res.ok && result.ok) {
        return {
          ok: true,
          message:
            result.message ||
            'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
        }
      }
    } catch {
      /* ignore */
    }

    return {
      ok: false,
      message: 'Impossible de transmettre votre message direct pour le moment. Veuillez réessayer.',
    }
  },

  async submitEmailMessage(payload: EmailContactPayload): Promise<{ ok: boolean; message: string }> {
    // Validation stricte Zod et assainissement Anti-XSS
    const validation = emailContactSchema.safeParse(payload)
    if (!validation.success) {
      return {
        ok: false,
        message: getZodErrorMessage(validation.error),
      }
    }

    const cleanPayload = validation.data

    try {
      await fetch(`${API_BASE_URL}/api/contact/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      })
    } catch {
      /* ignore */
    }

    return {
      ok: true,
      message: 'Votre message a été préparé avec succès pour envoi par email.',
    }
  },

  async submitContact(payload: ContactMessagePayload): Promise<{ ok: boolean; message: string }> {
    return this.submitDirectMessage({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      message: payload.message,
    })
  },

  // ==========================================
  // GESTION DES MESSAGES ADMIN
  // ==========================================

  async getAdminMessages(): Promise<{ ok: boolean; messages: ContactMessage[]; unreadCount: number }> {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        const messages = data as ContactMessage[]
        const unreadCount = messages.filter((m) => !m.is_read).length
        return { ok: true, messages, unreadCount }
      }
    } catch {
      /* fallback */
    }

    return { ok: false, messages: [], unreadCount: 0 }
  },

  async setMessageReadStatus(id: string, is_read: boolean): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('contact_messages').update({ is_read }).eq('id', id)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour statut'
      return { ok: false, error: msg }
    }
  },

  async deleteMessage(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression message'
      return { ok: false, error: msg }
    }
  },

  prefetch(resource: 'profile' | 'projects' | 'skills' | 'all'): void {
    if (resource === 'profile' || resource === 'all') this.getProfile()
    if (resource === 'projects' || resource === 'all') this.getProjects()
    if (resource === 'skills' || resource === 'all') this.getSkills()
  },

  invalidateCache(resource?: 'profile' | 'projects' | 'skills'): void {
    if (!resource) {
      cache.profile = null
      cache.projects = null
      cache.skills = null
    } else {
      cache[resource] = null
    }
  },
}
