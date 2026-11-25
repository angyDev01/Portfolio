import { supabase } from '../lib/supabase'
import type {
  AnnouncementKind,
  AnnouncementListItem,
  AnnouncementWithComments,
  DbAnnouncement,
  DbAnnouncementComment,
} from '../types/database'
import { announcementCommentSchema, getZodErrorMessage, sanitizeUrl } from '../utils/security'
import { getOrCreateVisitorId } from '../utils/visitorTracker'
import { formatSupabaseError, isMissingSchemaError } from './errors'
import { invalidateCache, portfolioCache } from './cache'

export type CommentStatus =
  | 'ok'
  | 'pending'
  | 'rate_limited'
  | 'duplicate'
  | 'link_rejected'
  | 'closed'
  | 'invalid'

const COMMENT_STATUSES: readonly CommentStatus[] = [
  'ok',
  'pending',
  'rate_limited',
  'duplicate',
  'link_rejected',
  'closed',
  'invalid',
]

export const COMMENT_STATUS_MESSAGES: Record<CommentStatus, string> = {
  ok: 'Merci ! Votre commentaire a été publié.',
  pending: 'Merci ! Votre commentaire sera visible après validation.',
  rate_limited: 'Vous commentez trop vite. Réessayez dans quelques minutes.',
  duplicate: 'Ce commentaire a déjà été envoyé.',
  link_rejected: 'Les liens ne sont pas autorisés dans les commentaires.',
  closed: 'Les commentaires sont fermés sur cette annonce.',
  invalid: 'Veuillez vérifier votre nom et votre commentaire.',
}

const COMMENT_COLUMNS = 'id, announcement_id, author_name, content, is_approved, created_at'
export const COMMENTS_PAGE_SIZE = 50
const ADMIN_COMMENTS_LIMIT = 200

/**
 * Interprète la réponse JSON de la RPC post_announcement_comment.
 */
export function parseCommentResponse(data: unknown): {
  status: CommentStatus
  comment: DbAnnouncementComment | null
} {
  let parsed: unknown = data
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      return { status: 'invalid', comment: null }
    }
  }
  if (!parsed || typeof parsed !== 'object') return { status: 'invalid', comment: null }
  const raw = parsed as { status?: unknown; comment?: unknown }
  const status = COMMENT_STATUSES.includes(raw.status as CommentStatus)
    ? (raw.status as CommentStatus)
    : 'invalid'
  const comment =
    raw.comment && typeof raw.comment === 'object' ? (raw.comment as DbAnnouncementComment) : null
  return { status, comment }
}

interface RawAnnouncementRow extends DbAnnouncement {
  announcement_comments?: Array<{ count: number }> | null
}

interface RawAdminAnnouncementRow extends DbAnnouncement {
  announcement_comments?: DbAnnouncementComment[] | null
}

function toListItem(row: RawAnnouncementRow): AnnouncementListItem {
  const { announcement_comments, ...rest } = row
  return { ...rest, comments_count: announcement_comments?.[0]?.count ?? 0 }
}

export interface SaveAnnouncementInput {
  title: string
  kind: AnnouncementKind
  content: string
  cover_image_url?: string | null
  event_date?: string | null
  action_url?: string | null
  action_label?: string | null
  allow_comments: boolean
  comments_moderated: boolean
  is_pinned: boolean
  is_published: boolean
}

export const announcementService = {
  /**
   * Annonces publiées (lecture publique). Seul le nombre de commentaires est
   * chargé ; les commentaires le sont à la demande (getAnnouncementComments).
   */
  async getAnnouncements(): Promise<AnnouncementListItem[]> {
    if (portfolioCache.announcements) return portfolioCache.announcements

    portfolioCache.announcements = (async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*, announcement_comments(count)')
          .eq('is_published', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data)) {
          return (data as RawAnnouncementRow[]).map(toListItem)
        }
      } catch (err) {
        console.error('Error fetching announcements:', err)
      }
      // Ne pas mémoriser un échec : le prochain appel réessaiera
      portfolioCache.announcements = null
      return []
    })()

    return portfolioCache.announcements
  },

  /**
   * Annonces pour l'administration : brouillons inclus, avec les 200 derniers
   * commentaires de chaque annonce (approuvés ou en attente).
   */
  async getAnnouncementsAdmin(): Promise<{
    items: AnnouncementWithComments[]
    migrationMissing: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, announcement_comments(${COMMENT_COLUMNS})`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .order('created_at', { ascending: false, referencedTable: 'announcement_comments' })
        .limit(ADMIN_COMMENTS_LIMIT, { referencedTable: 'announcement_comments' })

      if (error) {
        return { items: [], migrationMissing: isMissingSchemaError(error) }
      }

      const items = ((data ?? []) as RawAdminAnnouncementRow[]).map((row) => {
        const { announcement_comments, ...rest } = row
        return { ...rest, comments: announcement_comments ?? [] }
      })
      return { items, migrationMissing: false }
    } catch (err) {
      console.error('Error fetching admin announcements:', err)
      return { items: [], migrationMissing: false }
    }
  },

  /**
   * Charge une page de commentaires approuvés (RLS ne renvoie que ceux-ci au public).
   */
  async getAnnouncementComments(
    announcementId: string,
    options: { offset?: number; limit?: number } = {}
  ): Promise<{ comments: DbAnnouncementComment[]; hasMore: boolean }> {
    const offset = options.offset ?? 0
    const limit = options.limit ?? COMMENTS_PAGE_SIZE

    try {
      const { data, error } = await supabase
        .from('announcement_comments')
        .select(COMMENT_COLUMNS)
        .eq('announcement_id', announcementId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit) // limit + 1 lignes pour détecter la suite

      if (error || !Array.isArray(data)) return { comments: [], hasMore: false }

      const rows = data as DbAnnouncementComment[]
      return { comments: rows.slice(0, limit), hasMore: rows.length > limit }
    } catch (err) {
      console.error('Error fetching comments:', err)
      return { comments: [], hasMore: false }
    }
  },

  async createAnnouncement(input: SaveAnnouncementInput): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('announcements')
      const safeActionUrl = input.action_url ? sanitizeUrl(input.action_url, '') : ''
      const row: Record<string, unknown> = {
        title: input.title.trim(),
        kind: input.kind,
        content: input.content.trim(),
        cover_image_url: input.cover_image_url || null,
        event_date: input.event_date || null,
        action_url: safeActionUrl || null,
        action_label: input.action_label?.trim() || null,
        allow_comments: input.allow_comments,
        comments_moderated: input.comments_moderated,
        is_pinned: input.is_pinned,
        is_published: input.is_published,
      }

      let { error } = await supabase.from('announcements').insert([row])
      // Si la colonne comments_moderated n'est pas encore ajoutée en base, on retente sans elle
      if (error && (error.code === '42703' || (error.message && error.message.includes('comments_moderated')))) {
        delete row.comments_moderated
        const retry = await supabase.from('announcements').insert([row])
        error = retry.error
      }

      if (error) {
        console.error('Error creating announcement:', error)
        return { ok: false, error: formatSupabaseError(error, 'Erreur création annonce') }
      }
      invalidateCache('announcements')
      return { ok: true }
    } catch (err: unknown) {
      console.error('Exception creating announcement:', err)
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur création annonce',
      }
    }
  },

  async updateAnnouncement(
    id: string,
    input: Partial<SaveAnnouncementInput>
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('announcements')
      const safeActionUrl =
        input.action_url !== undefined
          ? input.action_url
            ? sanitizeUrl(input.action_url, '') || null
            : null
          : undefined

      const updates: Record<string, unknown> = {
        ...input,
        ...(safeActionUrl !== undefined ? { action_url: safeActionUrl } : {}),
        updated_at: new Date().toISOString(),
      }

      let { error } = await supabase.from('announcements').update(updates).eq('id', id)
      // Si la colonne comments_moderated n'est pas encore ajoutée en base, on retente sans elle
      if (error && (error.code === '42703' || (error.message && error.message.includes('comments_moderated')))) {
        delete updates.comments_moderated
        const retry = await supabase.from('announcements').update(updates).eq('id', id)
        error = retry.error
      }

      if (error) {
        console.error('Error updating announcement:', error)
        return { ok: false, error: formatSupabaseError(error, 'Erreur mise à jour annonce') }
      }
      invalidateCache('announcements')
      return { ok: true }
    } catch (err: unknown) {
      console.error('Exception updating announcement:', err)
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur mise à jour annonce',
      }
    }
  },

  async deleteAnnouncement(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      invalidateCache('announcements')
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      invalidateCache('announcements')
      return { ok: true }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur suppression annonce',
      }
    }
  },

  /**
   * Publication d'un commentaire public via la RPC sécurisée
   * (honeypot, liens refusés, limitation de débit, modération préalable éventuelle).
   */
  async addAnnouncementComment(
    announcementId: string,
    payload: { author_name: string; content: string; website?: string }
  ): Promise<{
    ok: boolean
    status: CommentStatus | 'error'
    comment: DbAnnouncementComment | null
    message: string
  }> {
    const validation = announcementCommentSchema.safeParse({
      author_name: payload.author_name,
      content: payload.content,
    })
    if (!validation.success) {
      return {
        ok: false,
        status: 'invalid',
        comment: null,
        message: getZodErrorMessage(validation.error),
      }
    }

    try {
      const { data, error } = await supabase.rpc('post_announcement_comment', {
        p_announcement_id: announcementId,
        p_author_name: validation.data.author_name,
        p_content: validation.data.content,
        p_visitor_id: getOrCreateVisitorId(),
        p_website: payload.website ?? '',
      })

      if (error) {
        // Si la RPC post_announcement_comment n'est pas encore créée en base, fallback sur l'insertion directe
        if (error.code === 'PGRST202' || (error.message && error.message.includes('post_announcement_comment'))) {
          const { data: directComment, error: directErr } = await supabase
            .from('announcement_comments')
            .insert([
              {
                announcement_id: announcementId,
                author_name: validation.data.author_name,
                content: validation.data.content,
                is_approved: true,
              },
            ])
            .select()
            .single()

          if (!directErr && directComment) {
            invalidateCache('announcements')
            return {
              ok: true,
              status: 'ok',
              comment: directComment as DbAnnouncementComment,
              message: COMMENT_STATUS_MESSAGES.ok,
            }
          }
        }

        console.error('Error posting comment:', error)
        return {
          ok: false,
          status: 'error',
          comment: null,
          message: "Impossible d'envoyer votre commentaire pour le moment.",
        }
      }

      const { status, comment } = parseCommentResponse(data)
      invalidateCache('announcements')
      return {
        ok: status === 'ok' || status === 'pending',
        status,
        comment,
        message: COMMENT_STATUS_MESSAGES[status],
      }
    } catch (err) {
      console.error('Error posting comment:', err)
      return {
        ok: false,
        status: 'error',
        comment: null,
        message: "Impossible d'envoyer votre commentaire pour le moment.",
      }
    }
  },

  async setCommentApproval(
    commentId: string,
    isApproved: boolean
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('announcement_comments')
        .update({ is_approved: isApproved })
        .eq('id', commentId)
      if (error) return { ok: false, error: error.message }
      invalidateCache('announcements')
      return { ok: true }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur modération commentaire',
      }
    }
  },

  async deleteAnnouncementComment(commentId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('announcement_comments').delete().eq('id', commentId)
      if (error) return { ok: false, error: error.message }
      invalidateCache('announcements')
      return { ok: true }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur suppression commentaire',
      }
    }
  },
}
