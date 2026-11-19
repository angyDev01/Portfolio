import { supabase } from '../lib/supabase'
import type { DbProject } from '../types/database'
import { portfolioCache, invalidateCache } from './cache'

interface RawProjectSkillJoin {
  skills?: { name?: string } | null
}

interface RawProjectRow extends Omit<DbProject, 'skills' | 'status' | 'images'> {
  status?: DbProject['status'] | null
  images?: string[] | null
  project_skills?: RawProjectSkillJoin[] | null
}

export const projectService = {
  async getProjects(): Promise<DbProject[]> {
    if (portfolioCache.projects) return portfolioCache.projects

    portfolioCache.projects = (async () => {
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
          return (data as RawProjectRow[]).map((item) => {
            const skills = item.project_skills
              ? item.project_skills
                  .map((ps) => ps.skills?.name)
                  .filter((n): n is string => Boolean(n))
              : []
            const cover_image_url =
              item.cover_image_url || (Array.isArray(item.images) && item.images[0]) || null
            return {
              ...item,
              status: item.status || 'completed',
              cover_image_url,
              images: item.images || (cover_image_url ? [cover_image_url] : []),
              skills,
            } as DbProject
          })
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      }

      return []
    })()

    return portfolioCache.projects
  },

  async createProject(
    project: Omit<DbProject, 'id' | 'created_at' | 'updated_at' | 'skills'>,
    skillIds: string[] = []
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('projects')
      const cover_image_url =
        project.cover_image_url || (Array.isArray(project.images) && project.images[0]) || null
      const images = cover_image_url ? [cover_image_url] : project.images || []

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
        const { error: relError } = await supabase.from('project_skills').insert(relations)
        if (relError) {
          invalidateCache('projects')
          return {
            ok: false,
            error: `Projet créé mais erreur lors de l'association des compétences : ${relError.message}`,
          }
        }
      }

      invalidateCache('projects')
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
      invalidateCache('projects')
      const cover_image_url =
        project.cover_image_url !== undefined
          ? project.cover_image_url
          : (Array.isArray(project.images) && project.images[0]) || null
      const images = cover_image_url ? [cover_image_url] : project.images || []

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
        const { error: delError } = await supabase
          .from('project_skills')
          .delete()
          .eq('project_id', id)
        if (delError) {
          return { ok: false, error: `Erreur synchronisation compétences : ${delError.message}` }
        }
        if (skillIds.length > 0) {
          const relations = skillIds.map((sId) => ({
            project_id: id,
            skill_id: sId,
          }))
          const { error: insError } = await supabase.from('project_skills').insert(relations)
          if (insError) {
            return { ok: false, error: `Erreur liaison compétences : ${insError.message}` }
          }
        }
      }

      invalidateCache('projects')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur modification projet'
      return { ok: false, error: msg }
    }
  },

  async deleteProject(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('projects')
      await supabase.from('project_skills').delete().eq('project_id', id)
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      invalidateCache('projects')
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression projet'
      return { ok: false, error: msg }
    }
  },
}
