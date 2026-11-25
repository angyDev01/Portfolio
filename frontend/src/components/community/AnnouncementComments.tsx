import { useState, type FormEvent, type ReactElement } from 'react'
import type { DbAnnouncementComment } from '../../types/database'
import { portfolioService } from '../../services/portfolioService'
import { announcementCommentSchema, getZodErrorMessage } from '../../utils/security'
import Icon from '../Icon'

interface AnnouncementCommentsProps {
  announcementId: string
  allowComments: boolean
  comments: DbAnnouncementComment[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onCommentAdded: (comment: DbAnnouncementComment) => void
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function AnnouncementComments({
  announcementId,
  allowComments,
  comments,
  loading = false,
  hasMore = false,
  onLoadMore,
  onCommentAdded,
}: AnnouncementCommentsProps): ReactElement {
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [website, setWebsite] = useState('') // Honeypot anti-spam
  const [submitting, setSubmitting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setFeedback(null)

    const validation = announcementCommentSchema.safeParse({
      author_name: authorName,
      content,
    })
    if (!validation.success) {
      setFeedback({ type: 'error', text: getZodErrorMessage(validation.error) })
      return
    }

    setSubmitting(true)
    const res = await portfolioService.addAnnouncementComment(announcementId, {
      author_name: validation.data.author_name,
      content: validation.data.content,
      website: website || undefined,
    })
    setSubmitting(false)

    if (res.ok) {
      setAuthorName('')
      setContent('')
      setWebsite('')
      if (res.status === 'pending') {
        setFeedback({
          type: 'success',
          text: 'Merci ! Votre commentaire sera visible dès validation par le modérateur.',
        })
      } else if (res.comment) {
        onCommentAdded(res.comment)
        setFeedback({ type: 'success', text: 'Merci ! Votre commentaire a été publié.' })
      } else {
        setFeedback({ type: 'success', text: 'Commentaire enregistré.' })
      }
    } else {
      setFeedback({
        type: 'error',
        text: res.message || "Impossible d'envoyer votre commentaire pour le moment.",
      })
    }
  }

  const handleLoadMoreClick = async (): Promise<void> => {
    if (!onLoadMore || loadingMore) return
    setLoadingMore(true)
    try {
      await onLoadMore()
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-line space-y-5">
      {loading ? (
        <div className="space-y-2 py-2">
          <div className="h-12 rounded-lg bg-paper/60 animate-pulse" />
          <div className="h-12 rounded-lg bg-paper/60 animate-pulse" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-3" aria-label="Commentaires">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg bg-paper border border-line/80 px-4 py-3 text-sm space-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">{c.author_name}</span>
                  <time dateTime={c.created_at} className="text-xs text-muted">
                    {formatDateTime(c.created_at)}
                  </time>
                </div>
                <p className="text-muted leading-[1.55] whitespace-pre-line break-words">
                  {c.content}
                </p>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMoreClick}
              disabled={loadingMore}
              className="text-xs font-medium text-indigo hover:underline underline-offset-4 cursor-pointer disabled:opacity-50"
            >
              {loadingMore ? 'Chargement...' : 'Afficher les commentaires précédents'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Aucun commentaire pour le moment. Soyez le premier à réagir.
        </p>
      )}

      {allowComments ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Honeypot invisible pour les humains, piège à bots */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor={`website-hp-${announcementId}`}>Ne pas remplir ce champ</label>
            <input
              id={`website-hp-${announcementId}`}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              maxLength={80}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Votre nom ou pseudo *"
              aria-label="Votre nom ou pseudo"
              className="sm:col-span-1 w-full px-3.5 py-2.5 rounded-md bg-paper border border-line text-ink text-base sm:text-sm focus:border-indigo focus:outline-none placeholder:text-muted/70"
            />
            <input
              type="text"
              required
              maxLength={1500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Laisser un avis, une question ou un encouragement... *"
              aria-label="Votre commentaire"
              className="sm:col-span-2 w-full px-3.5 py-2.5 rounded-md bg-paper border border-line text-ink text-base sm:text-sm focus:border-indigo focus:outline-none placeholder:text-muted/70"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-tactile min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Icon name="send" className="size-3.5" />
              <span>{submitting ? 'Publication...' : 'Publier le commentaire'}</span>
            </button>

            {feedback && (
              <p
                role="status"
                className={`text-xs ${
                  feedback.type === 'success'
                    ? 'text-indigo'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {feedback.text}
              </p>
            )}
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted italic">
          Les commentaires sont désactivés sur cette annonce.
        </p>
      )}
    </div>
  )
}
