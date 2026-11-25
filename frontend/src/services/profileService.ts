import { supabase } from '../lib/supabase'
import type { DbProfile } from '../types/database'
import { portfolioCache, invalidateCache } from './cache'
import { validateImageFile } from '../utils/mediaValidation'

export const profileService = {
  async getProfile(): Promise<DbProfile | null> {
    if (portfolioCache.profile) return portfolioCache.profile

    portfolioCache.profile = (async () => {
      try {
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          return {
            ...data,
            availability_status:
              data.availability_status || (data.is_available ? 'available' : 'employed'),
            accept_direct_messages: data.accept_direct_messages !== false,
          } as DbProfile
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }

      return null
    })()

    return portfolioCache.profile
  },

  async updateProfile(updates: Partial<DbProfile>): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('profile')
      const profile = await this.getProfile()

      let targetId = profile?.id
      if (!targetId) {
        const { data: row } = await supabase
          .from('profile')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        targetId = row?.id
      }

      if (!targetId) {
        return { ok: false, error: 'Profil introuvable en base de données.' }
      }

      const { data, error } = await supabase
        .from('profile')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select()

      if (error) {
        return { ok: false, error: error.message }
      }

      if (!Array.isArray(data) || data.length === 0) {
        return {
          ok: false,
          error: 'Mise à jour refusée. Vérifiez que votre session administrateur est active.',
        }
      }

      invalidateCache('profile')
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
   * avec horodatage unique et cacheControl '0' pour cache-busting garanti.
   */
  async uploadMedia(
    file: File,
    folder: 'avatars' | 'projects' | 'banners' | 'announcements' = 'avatars'
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    try {
      const validation = validateImageFile(file)
      if (!validation.ok) {
        return { ok: false, error: validation.error }
      }
      const fileExt = validation.ext
      const timestamp = Date.now()
      const rand = Math.random().toString(36).substring(2, 7)
      const prefixMap: Record<'avatars' | 'projects' | 'banners' | 'announcements', string> = {
        avatars: 'avatar',
        projects: 'project',
        banners: 'banner',
        announcements: 'announcement',
      }
      const filePath = `${folder}/${prefixMap[folder]}-${timestamp}-${rand}.${fileExt}`

      const { data, error } = await supabase.storage.from('portfolio').upload(filePath, file, {
        cacheControl: '0',
        upsert: true,
      })

      if (error) {
        let errorMsg = error.message
        if (
          error.message.includes('row-level security') ||
          error.message.includes('policy') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('jwt')
        ) {
          errorMsg =
            'Session expirée ou droits administrateur requis pour téléverser ce fichier. Veuillez vous reconnecter.'
        } else if (
          error.message.includes('Entity Too Large') ||
          error.message.includes('413') ||
          error.message.includes('too large')
        ) {
          errorMsg = 'Le fichier dépasse la taille maximale autorisée par le serveur.'
        }
        return { ok: false, error: errorMsg }
      }

      const { data: publicData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(data?.path || filePath)

      return { ok: true, url: `${publicData.publicUrl}?t=${timestamp}` }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur téléversement média'
      return { ok: false, error: msg }
    }
  },

  /**
   * Suppression propre d'un ancien fichier média dans Supabase Storage.
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
}
