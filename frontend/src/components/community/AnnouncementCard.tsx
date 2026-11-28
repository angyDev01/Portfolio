import { lazy, Suspense, useCallback, useEffect, useState, type ReactElement } from 'react'
import type {
  AnnouncementKind,
  AnnouncementListItem,
  AnnouncementWithComments,
  DbAnnouncementComment,
} from '../../types/database'
import { portfolioService } from '../../services/portfolioService'
import { sanitizeUrl } from '../../utils/urlSecurity'
import Icon from '../Icon'
import ShareButton from '../ShareButton'

const AnnouncementComments = lazy(() => import('./AnnouncementComments'))

const KIND_BADGE: Record<AnnouncementKind, { label: string; tone: string }> = {
  project_wip: {
    label: 'Projet en cours',
    tone: 'border-indigo/30 text-indigo bg-indigo/5',
  },
  event: {
    label: 'Événement à venir',
    tone: 'border-mango/50 text-ink bg-mango/15',
  },
  news: {
    label: 'Actualité',
    tone: 'border-line text-muted bg-paper',
  },
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

interface AnnouncementCardProps {
  announcement: AnnouncementListItem | AnnouncementWithComments
  defaultExpanded?: boolean
  headingLevel?: 'h2' | 'h3'
}

export default function AnnouncementCard({
  announcement,
  defaultExpanded = false,
  headingLevel = 'h3',
}: AnnouncementCardProps): ReactElement {
  const HeadingTag = headingLevel
  const [commentsOpen, setCommentsOpen] = useState(defaultExpanded)
  const initialComments =
    'comments' in announcement && Array.isArray(announcement.comments)
      ? announcement.comments
      : null
  const initialCount =
    'comments_count' in announcement
      ? announcement.comments_count
      : (announcement.comments?.length ?? 0)

  const [comments, setComments] = useState<DbAnnouncementComment[]>(initialComments ?? [])
  const [commentsLoaded, setCommentsLoaded] = useState<boolean>(initialComments !== null)
  const [loadingComments, setLoadingComments] = useState<boolean>(false)
  const [hasMoreComments, setHasMoreComments] = useState<boolean>(false)
  const [commentsCount, setCommentsCount] = useState<number>(initialCount)

  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res = await portfolioService.getAnnouncementComments(announcement.id)
      setComments(res.comments)
      setHasMoreComments(res.hasMore)
      setCommentsLoaded(true)
    } finally {
      setLoadingComments(false)
    }
  }, [announcement.id, loadingComments])

  useEffect(() => {
    if (commentsOpen && !commentsLoaded && !loadingComments) {
      loadComments()
    }
  }, [commentsOpen, commentsLoaded, loadingComments, loadComments])

  const kindMeta = KIND_BADGE[announcement.kind] || KIND_BADGE.news
  const safeActionUrl = announcement.action_url ? sanitizeUrl(announcement.action_url, '') : ''

  const handleCommentAdded = (comment: DbAnnouncementComment): void => {
    setComments((prev) => [...prev, comment])
    setCommentsCount((prev) => prev + 1)
  }

  const handleLoadMore = async (): Promise<void> => {
    const res = await portfolioService.getAnnouncementComments(announcement.id, {
      offset: comments.length,
    })
    setComments((prev) => [...prev, ...res.comments])
    setHasMoreComments(res.hasMore)
  }

  return (
    <article className="rounded-xl bg-surface border border-line p-6 sm:p-8 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${kindMeta.tone}`}
          >
            {kindMeta.label}
          </span>
          {announcement.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-mango/40 bg-mango/10 text-ink text-[11px] font-medium">
              ★ Épinglé
            </span>
          )}
        </div>

        <time dateTime={announcement.created_at} className="text-xs text-muted">
          Publié le {formatDate(announcement.created_at)}
        </time>
      </div>

      {announcement.cover_image_url && (
        <div className="mb-5 overflow-hidden rounded-lg border border-line bg-paper">
          <img
            src={announcement.cover_image_url}
            alt={announcement.title}
            loading="lazy"
            decoding="async"
            className="w-full max-h-72 object-cover block"
          />
        </div>
      )}

      <HeadingTag className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-ink mb-2.5">
        {announcement.title}
      </HeadingTag>

      {announcement.event_date && (
        <p className="inline-flex items-center gap-2 text-xs font-medium text-indigo mb-3">
          <Icon name="calendar" className="size-3.5" />
          <span>Date prévue : {formatDate(announcement.event_date)}</span>
        </p>
      )}

      <p className="text-sm sm:text-base text-muted leading-[1.65] whitespace-pre-line">
        {announcement.content}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCommentsOpen((prev) => !prev)}
          aria-expanded={commentsOpen}
          className="btn-tactile min-h-[44px] sm:min-h-[40px] -my-1 sm:my-0 inline-flex items-center gap-2 text-xs font-medium text-ink hover:text-indigo transition-colors cursor-pointer"
        >
          <Icon name="messageSquare" className="size-4 text-indigo" />
          <span>
            {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}
          </span>
          <span className="text-muted">({commentsOpen ? 'masquer' : 'voir / commenter'})</span>
        </button>

        <div className="flex flex-wrap items-center gap-4">
          {safeActionUrl && (
            <a
              href={safeActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile min-h-[44px] sm:min-h-0 -my-2 sm:my-0 inline-flex items-center gap-1.5 text-xs font-medium text-indigo hover:underline underline-offset-4"
            >
              <span>{announcement.action_label || 'En savoir plus'}</span>
              <Icon name="external" className="size-3.5" />
            </a>
          )}

          <ShareButton
            compact
            item={{
              kind: 'announcement',
              id: announcement.id,
              title: announcement.title,
              badge: kindMeta.label,
              secondaryBadge: announcement.is_pinned ? 'Épinglé' : undefined,
              subtitle: announcement.event_date
                ? `Date prévue : ${formatDate(announcement.event_date)}`
                : undefined,
              description: announcement.content,
              imageUrl: announcement.cover_image_url,
            }}
          />
        </div>
      </div>

      {commentsOpen && (
        <Suspense
          fallback={
            <div className="mt-5 pt-5 border-t border-line space-y-2 py-2">
              <div className="h-12 rounded-lg bg-paper/60 animate-pulse" />
            </div>
          }
        >
          <AnnouncementComments
            announcementId={announcement.id}
            allowComments={announcement.allow_comments}
            comments={comments}
            loading={loadingComments}
            hasMore={hasMoreComments}
            onLoadMore={handleLoadMore}
            onCommentAdded={handleCommentAdded}
          />
        </Suspense>
      )}
    </article>
  )
}
