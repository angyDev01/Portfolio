import { useState, type FormEvent, type ReactElement } from 'react'
import type { DbAnnouncementComment } from '../../types/database'
import { portfolioService } from '../../services/portfolioService'
import { announcementCommentSchema, getZodErrorMessage } from '../../utils/security'
import { formatCommentDate, getAuthorInitials, getAvatarToneIndex } from '../../utils/commentDisplay'
import Icon from '../Icon'

interface AnnouncementCommentsProps {
  announcementId: string
  allowComments: boolean
  commentsModerated?: boolean
  comments: DbAnnouncementComment[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onCommentAdded: (comment: DbAnnouncementComment) => void
}

interface FeedbackState {
  kind: 'success' | 'info' | 'error'
  text: string
}

const PUBLIC_AVATAR_TONES = [
  'bg-indigo/12 text-indigo border-indigo/25',
  'bg-teal-500/12 text-teal-700 dark:text-teal-300 border-teal-500/25',
  'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
  'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25',
  'bg-paper text-muted border-line',
]

export default function AnnouncementComments({
  announcementId,
  allowComments,
  commentsModerated = false,
  comments,
  loading,
  hasMore,
  onLoadMore,
  onCommentAdded,
}: AnnouncementCommentsProps): ReactElement {
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const handleOpenComposer = (): void => {
    setFeedback(null)
    setIsComposerOpen(true)
  }

  const handleCloseComposer = (): void => {
    if (submitting) return
    setIsComposerOpen(false)
    setFeedback(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (submitting) return

    const validation = announcementCommentSchema.safeParse({
      author_name: authorName,
      content,
    })

    if (!validation.success) {
      setFeedback({
        kind: 'error',
        text: getZodErrorMessage(validation.error),
      })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      const res = await portfolioService.addAnnouncementComment(announcementId, {
        author_name: validation.data.author_name,
        content: validation.data.content,
        website,
      })

      if (res.ok) {
        if (res.comment && res.status === 'ok') {
          onCommentAdded(res.comment)
        }
        setAuthorName('')
        setContent('')
        setWebsite('')
        setIsComposerOpen(false)
        setFeedback({
          kind: res.status === 'pending' ? 'info' : 'success',
          text: res.message,
        })
      } else {
        setFeedback({
          kind: 'error',
          text: res.message,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-line space-y-4">
      {/* En-tête du fil et bouton d'ouverture du formulaire */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Commentaires ({comments.length})
          </h4>
          {allowComments && commentsModerated && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-paper border border-line text-muted">
              Modération préalable
            </span>
          )}
        </div>

        {allowComments && !isComposerOpen && (
          <button
            type="button"
            onClick={handleOpenComposer}
            className="btn-tactile min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg border border-line bg-paper hover:border-indigo/50 hover:text-indigo text-ink text-xs font-medium transition-colors cursor-pointer"
          >
            <Icon name="messageSquare" className="size-3.5 text-indigo" />
            <span>Écrire un commentaire</span>
          </button>
        )}
      </div>

      {/* Retour utilisateur */}
      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={`px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed ${feedback.kind === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : feedback.kind === 'info'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Formulaire révélé uniquement après clic sur "Écrire un commentaire" */}
      {allowComments && isComposerOpen && (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-xl border border-line bg-paper/75 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink">Nouveau commentaire</span>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCloseComposer}
              className="text-xs text-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
          </div>

          <div className="sr-only" aria-hidden="true">
            <label htmlFor={`comment-website-${announcementId}`}>Site web</label>
            <input
              id={`comment-website-${announcementId}`}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor={`comment-author-${announcementId}`}
              className="block text-xs font-medium text-muted mb-1"
            >
              Votre nom
            </label>
            <input
              id={`comment-author-${announcementId}`}
              type="text"
              required
              maxLength={80}
              autoFocus
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Ex. Aminata Koné"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-base sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-indigo transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor={`comment-content-${announcementId}`}
                className="text-xs font-medium text-muted"
              >
                Votre message
              </label>
              <span className="text-[11px] font-mono text-muted">
                {content.length}/1500
              </span>
            </div>
            <textarea
              id={`comment-content-${announcementId}`}
              rows={3}
              required
              maxLength={1500}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Partagez votre avis ou posez une question..."
              className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-base sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-indigo transition-colors resize-y min-h-[92px]"
            />
            <p className="mt-1 text-[11px] text-muted">
              Les liens ne sont pas autorisés dans les commentaires.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCloseComposer}
              className="min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 rounded-lg border border-line text-xs font-medium text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-tactile min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg bg-indigo hover:bg-indigo-hover text-indigo-fg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <Icon name="send" className="size-3.5" />
              <span>{submitting ? 'Envoi...' : 'Publier'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Fil éditorial des commentaires */}
      {loading && comments.length === 0 ? (
        <div className="space-y-2.5" aria-busy="true">
          <div className="h-16 rounded-xl bg-paper/60 animate-pulse" />
          <div className="h-16 rounded-xl bg-paper/60 animate-pulse" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted py-1">
          {allowComments
            ? 'Aucun commentaire pour le moment. Cliquez sur « Écrire un commentaire » pour lancer la discussion.'
            : 'Aucun commentaire pour le moment.'}
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const initials = getAuthorInitials(comment.author_name)
            const toneCls =
              PUBLIC_AVATAR_TONES[
              getAvatarToneIndex(comment.author_name, PUBLIC_AVATAR_TONES.length)
              ]

            return (
              <div
                key={comment.id}
                className="rounded-xl border border-line/75 bg-paper/45 p-3.5 sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={`size-9 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 ${toneCls}`}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-sm font-medium text-ink break-words">
                        {comment.author_name}
                      </span>
                      <time
                        dateTime={comment.created_at}
                        className="text-[11px] font-mono text-muted shrink-0"
                      >
                        {formatCommentDate(comment.created_at)}
                      </time>
                    </div>

                    <p className="mt-1.5 text-sm text-ink/90 whitespace-pre-line break-words leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className="pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={onLoadMore}
            className="min-h-[40px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 rounded-lg border border-line bg-paper hover:border-indigo/40 text-xs font-medium text-ink hover:text-indigo transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Voir plus de commentaires'}
          </button>
        </div>
      )}
    </div>
  )
}
