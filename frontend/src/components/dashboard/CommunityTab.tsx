import { useMemo, useState, type ReactElement } from 'react'
import Icon from '../Icon'
import RichText from '../RichText'
import ShareButton from '../ShareButton'
import AnnouncementModal from './AnnouncementModal'
import PollModal from './PollModal'
import type {
  AnnouncementKind,
  AnnouncementWithComments,
  PollWithResults,
} from '../../types/database'
import type { SaveAnnouncementInput } from '../../services/announcementService'
import { computeOptionPercentage, isPollOpen, type CreatePollInput } from '../../services/pollService'
import { formatCommentDate, getAuthorInitials, getAvatarToneIndex } from '../../utils/commentDisplay'

interface CommunityTabProps {
  announcements: AnnouncementWithComments[]
  polls: PollWithResults[]
  onSaveAnnouncement: (
    editingId: string | null,
    input: SaveAnnouncementInput,
    coverFile: File | null
  ) => Promise<boolean>
  onDeleteAnnouncement: (id: string, title: string) => Promise<boolean>
  onToggleCommentApproval: (commentId: string, isApproved: boolean) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onCreatePoll: (input: CreatePollInput) => Promise<boolean>
  onTogglePollActive: (pollId: string, isActive: boolean) => Promise<void>
  onDeletePoll: (pollId: string, question: string) => Promise<boolean>
}

type CommunitySectionFilter = 'all' | 'announcements' | 'polls' | 'pending_comments'

const KIND_META: Record<AnnouncementKind, { label: string; badgeCls: string }> = {
  project_wip: {
    label: 'Projet en cours',
    badgeCls:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  event: {
    label: 'Événement',
    badgeCls:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  news: {
    label: 'Actualité',
    badgeCls:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
}

const AVATAR_TONES = [
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
]

function formatShortDate(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function CommunityTab({
  announcements,
  polls,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onToggleCommentApproval,
  onDeleteComment,
  onCreatePoll,
  onTogglePollActive,
  onDeletePoll,
}: CommunityTabProps): ReactElement {
  const [sectionFilter, setSectionFilter] = useState<CommunitySectionFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | AnnouncementKind>('all')

  // Modales (même schéma que ProjectsTab -> ProjectModal)
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementWithComments | null>(
    null
  )
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  const [isPollModalOpen, setIsPollModalOpen] = useState(false)
  const [savingPoll, setSavingPoll] = useState(false)

  // Panneaux de modération des commentaires dépliés par annonce
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [busyCommentId, setBusyCommentId] = useState<string | null>(null)

  const totalPendingComments = useMemo(
    () =>
      announcements.reduce(
        (sum, ann) => sum + ann.comments.filter((comment) => !comment.is_approved).length,
        0
      ),
    [announcements]
  )

  const filteredAnnouncements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return announcements.filter((ann) => {
      if (kindFilter !== 'all' && ann.kind !== kindFilter) return false
      if (sectionFilter === 'pending_comments') {
        const hasPending = ann.comments.some((comment) => !comment.is_approved)
        if (!hasPending) return false
      }
      if (!q) return true
      return (
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        ann.comments.some(
          (comment) =>
            comment.author_name.toLowerCase().includes(q) ||
            comment.content.toLowerCase().includes(q)
        )
      )
    })
  }, [announcements, kindFilter, searchQuery, sectionFilter])

  const filteredPolls = useMemo(() => {
    if (sectionFilter === 'announcements' || sectionFilter === 'pending_comments') return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return polls
    return polls.filter(
      (poll) =>
        poll.question.toLowerCase().includes(q) ||
        (poll.description ?? '').toLowerCase().includes(q) ||
        poll.options.some((opt) => opt.label.toLowerCase().includes(q))
    )
  }, [polls, searchQuery, sectionFilter])

  const showAnnouncementsSection = sectionFilter !== 'polls'
  const showPollsSection =
    sectionFilter === 'all' || sectionFilter === 'polls'

  const openCreateAnnouncement = (): void => {
    setEditingAnnouncement(null)
    setIsAnnModalOpen(true)
  }

  const openEditAnnouncement = (ann: AnnouncementWithComments): void => {
    setEditingAnnouncement(ann)
    setIsAnnModalOpen(true)
  }

  const handleSaveAnnouncementModal = async (
    editingId: string | null,
    input: SaveAnnouncementInput,
    coverFile: File | null
  ): Promise<boolean> => {
    setSavingAnnouncement(true)
    try {
      return await onSaveAnnouncement(editingId, input, coverFile)
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleCreatePollModal = async (input: CreatePollInput): Promise<boolean> => {
    setSavingPoll(true)
    try {
      return await onCreatePoll(input)
    } finally {
      setSavingPoll(false)
    }
  }

  const toggleCommentsPanel = (announcementId: string, isCurrentlyOpen: boolean): void => {
    setExpandedComments((prev) => ({
      ...prev,
      [announcementId]: !isCurrentlyOpen,
    }))
  }

  const handleModerationAction = async (
    commentId: string,
    action: () => Promise<void>
  ): Promise<void> => {
    if (busyCommentId) return
    setBusyCommentId(commentId)
    try {
      await action()
    } finally {
      setBusyCommentId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec boutons de création (aligné sur ProjectsTab) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Communauté & Sondages
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {announcements.length} annonce{announcements.length > 1 ? 's' : ''} • {polls.length}{' '}
            sondage{polls.length > 1 ? 's' : ''}
            {totalPendingComments > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {' '}
                • {totalPendingComments} commentaire{totalPendingComments > 1 ? 's' : ''} à modérer
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPollModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium transition-colors cursor-pointer"
          >
            <Icon name="analytics" className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span>Nouveau sondage</span>
          </button>

          <button
            type="button"
            onClick={openCreateAnnouncement}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Icon name="plus" className="size-4" />
            <span>Nouvelle annonce</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'Tout voir' },
              { id: 'announcements', label: `Annonces (${announcements.length})` },
              { id: 'polls', label: `Sondages (${polls.length})` },
              ...(totalPendingComments > 0
                ? [
                  {
                    id: 'pending_comments' as const,
                    label: `À modérer (${totalPendingComments})`,
                  },
                ]
                : []),
            ] as Array<{ id: CommunitySectionFilter; label: string }>
          ).map((tab) => {
            const active = sectionFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${active
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500/40'
                  }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {showAnnouncementsSection && (
            <select
              value={kindFilter}
              onChange={(event) =>
                setKindFilter(event.target.value as 'all' | AnnouncementKind)
              }
              aria-label="Filtrer par type d’annonce"
              className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tous les types</option>
              <option value="project_wip">Projets en cours</option>
              <option value="event">Événements</option>
              <option value="news">Actualités</option>
            </select>
          )}

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher annonce, commentaire, sondage..."
            aria-label="Rechercher dans la communauté"
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Section Annonces (pleine largeur) */}
      {showAnnouncementsSection && (
        <section aria-labelledby="dashboard-announcements-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3
              id="dashboard-announcements-heading"
              className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2"
            >
              <Icon name="megaphone" className="size-4 text-indigo-500" />
              <span>Annonces ({filteredAnnouncements.length})</span>
            </h3>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="glass-card p-10 text-center border-zinc-200 dark:border-zinc-800 space-y-3">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {announcements.length === 0
                  ? 'Aucune annonce pour le moment.'
                  : 'Aucune annonce ne correspond à vos filtres.'}
              </p>
              {announcements.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateAnnouncement}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Icon name="plus" className="size-3.5" />
                  <span>Créer une annonce</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {filteredAnnouncements.map((ann) => {
                const kindMeta = KIND_META[ann.kind]
                const pendingCount = ann.comments.filter((c) => !c.is_approved).length
                const approvedCount = ann.comments.length - pendingCount
                const isPanelOpen = expandedComments[ann.id] ?? pendingCount > 0

                return (
                  <article
                    key={ann.id}
                    className="glass-card p-5 border-zinc-200 dark:border-zinc-800 flex flex-col gap-4"
                  >
                    {/* En-tête carte annonce */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${kindMeta.badgeCls}`}
                          >
                            {kindMeta.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${ann.is_published
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                              }`}
                          >
                            {ann.is_published ? 'Publiée' : 'Brouillon'}
                          </span>
                          {ann.is_pinned && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              Épinglée
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 break-words">
                          {ann.title}
                        </h4>
                      </div>

                      {ann.cover_image_url && (
                        <div className="w-20 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shrink-0">
                          <img
                            src={ann.cover_image_url}
                            alt={ann.title}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 whitespace-pre-line break-words leading-relaxed">
                      <RichText
                        text={ann.content}
                        openExternalInNewTab
                        linkClassName="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/40 hover:decoration-indigo-500 underline-offset-2 font-medium break-words transition-colors"
                      />
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Publié le {formatShortDate(ann.created_at)}</span>
                      {ann.event_date && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          <Icon name="calendar" className="size-3.5" />
                          <span>Événement : {formatShortDate(ann.event_date)}</span>
                        </span>
                      )}
                      <span>
                        {!ann.allow_comments
                          ? 'Commentaires désactivés'
                          : ann.comments_moderated
                            ? 'Modération activée'
                            : 'Commentaires ouverts'}
                      </span>
                    </div>

                    {/* Actions carte + déclencheur commentaires */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800/70">
                      <button
                        type="button"
                        onClick={() => toggleCommentsPanel(ann.id, isPanelOpen)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${pendingCount > 0
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500/40'
                          }`}
                      >
                        <Icon name="messageSquare" className="size-3.5" />
                        <span>
                          {ann.comments.length} commentaire{ann.comments.length > 1 ? 's' : ''}
                          {pendingCount > 0 ? ` (${pendingCount} en attente)` : ''}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {isPanelOpen ? 'Masquer' : 'Afficher'}
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        {ann.is_published && (
                          <ShareButton
                            adminOnly={false}
                            compact
                            label="Partager"
                            item={{
                              kind: 'announcement',
                              id: ann.id,
                              title: ann.title,
                              subtitle: ann.event_date
                                ? `Le ${formatShortDate(ann.event_date)}`
                                : undefined,
                              description: ann.content,
                              badge: kindMeta.label,
                              imageUrl: ann.cover_image_url,
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => openEditAnnouncement(ann)}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                          title="Modifier l’annonce"
                          aria-label={`Modifier ${ann.title}`}
                        >
                          <Icon name="pencil" className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteAnnouncement(ann.id, ann.title)}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-red-500/15 text-zinc-500 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                          title="Supprimer l’annonce"
                          aria-label={`Supprimer ${ann.title}`}
                        >
                          <Icon name="trash" className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Panneau de modération des commentaires */}
                    {isPanelOpen && (
                      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/70 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="font-semibold uppercase tracking-wider">
                            Fil des commentaires
                          </span>
                          <span>
                            {approvedCount} visible{approvedCount > 1 ? 's' : ''} • {pendingCount}{' '}
                            masqué{pendingCount > 1 ? 's' : ''}
                          </span>
                        </div>

                        {ann.comments.length === 0 ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">
                            Aucun commentaire reçu pour cette annonce.
                          </p>
                        ) : (
                          <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5">
                            {ann.comments.map((comment) => {
                              const initials = getAuthorInitials(comment.author_name)
                              const toneCls =
                                AVATAR_TONES[
                                getAvatarToneIndex(comment.author_name, AVATAR_TONES.length)
                                ]
                              const isBusy = busyCommentId === comment.id

                              return (
                                <div
                                  key={comment.id}
                                  className={`p-3 rounded-xl border transition-colors ${comment.is_approved
                                      ? 'bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                                      : 'bg-amber-500/5 border-amber-500/30'
                                    }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      aria-hidden="true"
                                      className={`size-8 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 ${toneCls}`}
                                    >
                                      {initials}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1.5">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                            {comment.author_name}
                                          </span>
                                          <span className="text-[11px] text-zinc-400">
                                            {formatCommentDate(comment.created_at)}
                                          </span>
                                        </div>

                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${comment.is_approved
                                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                            }`}
                                        >
                                          {comment.is_approved ? 'Approuvé' : 'En attente'}
                                        </span>
                                      </div>

                                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-line break-words leading-relaxed">
                                        {comment.content}
                                      </p>

                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() =>
                                            void handleModerationAction(comment.id, () =>
                                              onToggleCommentApproval(
                                                comment.id,
                                                !comment.is_approved
                                              )
                                            )
                                          }
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer disabled:opacity-50 ${comment.is_approved
                                              ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-amber-500/50 hover:text-amber-600'
                                              : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                        >
                                          <Icon
                                            name={comment.is_approved ? 'eyeOff' : 'eye'}
                                            className="size-3"
                                          />
                                          <span>
                                            {comment.is_approved ? 'Masquer' : 'Approuver'}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() =>
                                            void handleModerationAction(comment.id, () =>
                                              onDeleteComment(comment.id)
                                            )
                                          }
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 hover:text-red-500 text-zinc-500 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                          <Icon name="trash" className="size-3" />
                                          <span>Supprimer</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Section Sondages (pleine largeur) */}
      {showPollsSection && (
        <section aria-labelledby="dashboard-polls-heading" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3
              id="dashboard-polls-heading"
              className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2"
            >
              <Icon name="analytics" className="size-4 text-teal-500" />
              <span>Sondages ({filteredPolls.length})</span>
            </h3>
          </div>

          {filteredPolls.length === 0 ? (
            <div className="glass-card p-10 text-center border-zinc-200 dark:border-zinc-800 space-y-3">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {polls.length === 0
                  ? 'Aucun sondage créé pour le moment.'
                  : 'Aucun sondage ne correspond à votre recherche.'}
              </p>
              {polls.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsPollModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Icon name="plus" className="size-3.5" />
                  <span>Créer un sondage</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPolls.map((poll) => {
                const open = isPollOpen(poll)
                return (
                  <article
                    key={poll.id}
                    className="glass-card p-5 border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 break-words">
                          {poll.question}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${open
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                            }`}
                        >
                          {open ? 'Ouvert' : 'Clôturé'}
                        </span>
                      </div>

                      {poll.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 whitespace-pre-line">
                          <RichText
                            text={poll.description}
                            openExternalInNewTab
                            linkClassName="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/40 hover:decoration-indigo-500 underline-offset-2 font-medium break-words transition-colors"
                          />
                        </p>
                      )}

                      <div className="space-y-2 pt-1">
                        {poll.options.map((opt) => {
                          const pct = computeOptionPercentage(opt.votes_count, poll.total_votes)
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs gap-2">
                                <span className="text-zinc-700 dark:text-zinc-200 truncate">
                                  {opt.label}
                                </span>
                                <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                                  {opt.votes_count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-indigo-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800/70">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {poll.total_votes} vote{poll.total_votes > 1 ? 's' : ''}
                        {poll.closes_at ? ` • Clôture : ${formatShortDate(poll.closes_at)}` : ''}
                      </span>

                      <div className="flex items-center gap-2">
                        <ShareButton
                          adminOnly={false}
                          compact
                          label="Partager"
                          item={{
                            kind: 'poll',
                            id: poll.id,
                            title: poll.question,
                            description: poll.description || undefined,
                            badge: open ? 'Sondage ouvert' : 'Sondage clôturé',
                            metaItems: poll.options.map((o) => o.label),
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => void onTogglePollActive(poll.id, !poll.is_active)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        >
                          {poll.is_active ? 'Clôturer' : 'Rouvrir'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeletePoll(poll.id, poll.question)}
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-red-500/15 text-zinc-500 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                          title="Supprimer le sondage"
                          aria-label={`Supprimer le sondage ${poll.question}`}
                        >
                          <Icon name="trash" className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Modales de création / édition */}
      <AnnouncementModal
        isOpen={isAnnModalOpen}
        announcement={editingAnnouncement}
        saving={savingAnnouncement}
        onClose={() => {
          setIsAnnModalOpen(false)
          setEditingAnnouncement(null)
        }}
        onSave={handleSaveAnnouncementModal}
      />

      <PollModal
        isOpen={isPollModalOpen}
        saving={savingPoll}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={handleCreatePollModal}
      />
    </div>
  )
}
