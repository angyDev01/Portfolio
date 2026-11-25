import { useState, type FormEvent, type ReactElement } from 'react'
import type {
  AnnouncementKind,
  AnnouncementWithComments,
  PollWithResults,
} from '../../types/database'
import type { SaveAnnouncementInput } from '../../services/announcementService'
import type { CreatePollInput } from '../../services/pollService'
import { computeOptionPercentage } from '../../services/pollService'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../utils/dateTime'
import Icon from '../Icon'

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

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none'

const EMPTY_ANN_FORM: SaveAnnouncementInput = {
  title: '',
  kind: 'project_wip',
  content: '',
  cover_image_url: null,
  event_date: '',
  action_url: '',
  action_label: '',
  allow_comments: true,
  comments_moderated: false,
  is_pinned: false,
  is_published: true,
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
  // Formulaire Annonce
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null)
  const [annForm, setAnnForm] = useState<SaveAnnouncementInput>(EMPTY_ANN_FORM)
  const [annCoverFile, setAnnCoverFile] = useState<File | null>(null)
  const [savingAnn, setSavingAnn] = useState(false)

  // Formulaire Sondage
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollDescription, setPollDescription] = useState('')
  const [pollClosesAt, setPollClosesAt] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [savingPoll, setSavingPoll] = useState(false)

  const handleEditAnnouncement = (ann: AnnouncementWithComments): void => {
    setEditingAnnId(ann.id)
    setAnnCoverFile(null)
    setAnnForm({
      title: ann.title,
      kind: ann.kind,
      content: ann.content,
      cover_image_url: ann.cover_image_url ?? null,
      event_date: toDatetimeLocalValue(ann.event_date),
      action_url: ann.action_url ?? '',
      action_label: ann.action_label ?? '',
      allow_comments: ann.allow_comments,
      comments_moderated: ann.comments_moderated ?? false,
      is_pinned: ann.is_pinned,
      is_published: ann.is_published,
    })
  }

  const resetAnnForm = (): void => {
    setEditingAnnId(null)
    setAnnForm(EMPTY_ANN_FORM)
    setAnnCoverFile(null)
  }

  const handleAnnSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSavingAnn(true)
    const ok = await onSaveAnnouncement(
      editingAnnId,
      {
        ...annForm,
        event_date: fromDatetimeLocalValue(annForm.event_date),
      },
      annCoverFile
    )
    setSavingAnn(false)
    if (ok) resetAnnForm()
  }

  const handlePollSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSavingPoll(true)
    const ok = await onCreatePoll({
      question: pollQuestion,
      description: pollDescription || null,
      closes_at: fromDatetimeLocalValue(pollClosesAt),
      options: pollOptions,
    })
    setSavingPoll(false)
    if (ok) {
      setPollQuestion('')
      setPollDescription('')
      setPollClosesAt('')
      setPollOptions(['', ''])
    }
  }

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* SECTION 1 : ANNONCES (PROJETS EN COURS & ÉVÉNEMENTS)         */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleAnnSubmit}
          className="lg:col-span-5 glass-card p-5 border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Icon name="megaphone" className="size-4 text-indigo-500" />
              <span>{editingAnnId ? "Modifier l'annonce" : 'Nouvelle annonce'}</span>
            </h2>
            {editingAnnId && (
              <button
                type="button"
                onClick={resetAnnForm}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
              Titre *
            </label>
            <input
              type="text"
              required
              value={annForm.title}
              onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              placeholder="Ex. Refonte API OmniPulse v2"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                Type d'annonce
              </label>
              <select
                value={annForm.kind}
                onChange={(e) =>
                  setAnnForm({ ...annForm, kind: e.target.value as AnnouncementKind })
                }
                className={INPUT_CLASS}
              >
                <option value="project_wip">Projet en cours</option>
                <option value="event">Événement à venir</option>
                <option value="news">Actualité</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                Date d'événement (optionnel)
              </label>
              <input
                type="datetime-local"
                value={annForm.event_date || ''}
                onChange={(e) => setAnnForm({ ...annForm, event_date: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
              Contenu *
            </label>
            <textarea
              rows={4}
              required
              value={annForm.content}
              onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
              placeholder="Décrivez l'avancement du projet ou les détails de l'événement..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                Lien d'action (optionnel)
              </label>
              <input
                type="url"
                value={annForm.action_url || ''}
                onChange={(e) => setAnnForm({ ...annForm, action_url: e.target.value })}
                placeholder="https://..."
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
                Libellé du lien
              </label>
              <input
                type="text"
                value={annForm.action_label || ''}
                onChange={(e) => setAnnForm({ ...annForm, action_label: e.target.value })}
                placeholder="Voir l'aperçu"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
              Image de couverture (optionnel)
            </label>
            {annForm.cover_image_url && !annCoverFile && (
              <div className="mb-2 flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                <img
                  src={annForm.cover_image_url}
                  alt="Aperçu couverture"
                  className="h-10 w-16 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setAnnForm({ ...annForm, cover_image_url: null })}
                  className="text-red-500 hover:text-red-600 text-xs cursor-pointer"
                >
                  Retirer l'image
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAnnCoverFile(e.target.files?.[0] ?? null)}
              className="block w-full text-[11px] font-mono text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-xs font-mono text-zinc-700 dark:text-zinc-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={annForm.allow_comments}
                onChange={(e) => setAnnForm({ ...annForm, allow_comments: e.target.checked })}
                className="accent-indigo-600"
              />
              <span>Commentaires ouverts</span>
            </label>
            <label
              className="flex items-center gap-2 cursor-pointer"
              title="Les commentaires nécessitent votre validation avant affichage public"
            >
              <input
                type="checkbox"
                checked={annForm.comments_moderated}
                onChange={(e) =>
                  setAnnForm({ ...annForm, comments_moderated: e.target.checked })
                }
                className="accent-indigo-600"
              />
              <span>Modération préalable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={annForm.is_pinned}
                onChange={(e) => setAnnForm({ ...annForm, is_pinned: e.target.checked })}
                className="accent-indigo-600"
              />
              <span>Épingler</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={annForm.is_published}
                onChange={(e) => setAnnForm({ ...annForm, is_published: e.target.checked })}
                className="accent-indigo-600"
              />
              <span>Publiée</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={savingAnn}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingAnn
              ? 'Enregistrement...'
              : editingAnnId
                ? 'Mettre à jour'
                : "Publier l'annonce"}
          </button>
        </form>

        {/* Liste des annonces + modération des commentaires */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Annonces publiées & brouillons ({announcements.length})
          </h3>

          {announcements.length === 0 ? (
            <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
              Aucune annonce enregistrée pour le moment.
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="glass-card p-5 border-zinc-200 dark:border-zinc-800 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase mb-1">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {ann.kind === 'project_wip'
                          ? 'Projet en cours'
                          : ann.kind === 'event'
                            ? 'Événement'
                            : 'Actualité'}
                      </span>
                      {ann.is_pinned && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          Épinglé
                        </span>
                      )}
                      {!ann.is_published && (
                        <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                          Brouillon
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {ann.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditAnnouncement(ann)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-indigo-500 cursor-pointer"
                      title="Modifier"
                    >
                      <Icon name="pencil" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteAnnouncement(ann.id, ann.title)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 cursor-pointer"
                      title="Supprimer"
                    >
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                  {ann.content}
                </p>

                {/* Commentaires associés */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <p className="text-[11px] font-mono text-zinc-500">
                    Commentaires ({ann.comments.length})
                  </p>
                  {ann.comments.length > 0 && (
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {ann.comments.map((c) => (
                        <li
                          key={c.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                            c.is_approved
                              ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                              : 'bg-rose-500/5 border-rose-500/20 opacity-75'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {c.author_name}
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 break-words mt-0.5">
                              {c.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => void onToggleCommentApproval(c.id, !c.is_approved)}
                              title={c.is_approved ? 'Masquer' : 'Approuver'}
                              className="p-1 rounded text-zinc-400 hover:text-indigo-500 cursor-pointer"
                            >
                              <Icon name={c.is_approved ? 'eye' : 'eyeOff'} className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteComment(c.id)}
                              title="Supprimer"
                              className="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Icon name="trash" className="size-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2 : SONDAGES INTERACTIFS                             */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <form
          onSubmit={handlePollSubmit}
          className="lg:col-span-5 glass-card p-5 border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Icon name="analytics" className="size-4 text-indigo-500" />
            <span>Créer un sondage</span>
          </h2>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
              Question *
            </label>
            <input
              type="text"
              required
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ex. Quel sujet pour le prochain projet open-source ?"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
              Contexte (optionnel)
            </label>
            <input
              type="text"
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              placeholder="Précision courte..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-1">
              Date de clôture (optionnel)
            </label>
            <input
              type="datetime-local"
              value={pollClosesAt}
              onChange={(e) => setPollClosesAt(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                Options (2 à 6) *
              </label>
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="text-[11px] font-mono text-indigo-500 hover:underline cursor-pointer"
                >
                  + Ajouter une option
                </button>
              )}
            </div>

            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions]
                    next[idx] = e.target.value
                    setPollOptions(next)
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className={INPUT_CLASS}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 cursor-pointer"
                    title="Retirer cette option"
                  >
                    <Icon name="close" className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={savingPoll}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingPoll ? 'Publication...' : 'Publier le sondage'}
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Sondages actifs & archivés ({polls.length})
          </h3>

          {polls.length === 0 ? (
            <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
              Aucun sondage créé pour le moment.
            </div>
          ) : (
            polls.map((poll) => (
              <div
                key={poll.id}
                className="glass-card p-5 border-zinc-200 dark:border-zinc-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded mb-1 ${
                        poll.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {poll.is_active ? 'Ouvert' : 'Clôturé'} · {poll.total_votes} vote(s)
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {poll.question}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void onTogglePollActive(poll.id, !poll.is_active)}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 cursor-pointer"
                    >
                      {poll.is_active ? 'Clôturer' : 'Rouvrir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeletePoll(poll.id, poll.question)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 cursor-pointer"
                      title="Supprimer"
                    >
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {poll.options.map((opt) => {
                    const pct = computeOptionPercentage(opt.votes_count, poll.total_votes)
                    return (
                      <div key={opt.id} className="text-xs space-y-1">
                        <div className="flex justify-between text-zinc-700 dark:text-zinc-300 font-mono">
                          <span>{opt.label}</span>
                          <span>
                            {pct}% ({opt.votes_count})
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
