import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from 'react'
import Icon from '../Icon'
import LinkInsertControl from './LinkInsertControl'
import type { AnnouncementKind, AnnouncementWithComments } from '../../types/database'
import type { SaveAnnouncementInput } from '../../services/announcementService'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../utils/dateTime'

interface AnnouncementModalProps {
  isOpen: boolean
  announcement: AnnouncementWithComments | null
  saving: boolean
  onClose: () => void
  onSave: (
    editingId: string | null,
    input: SaveAnnouncementInput,
    coverFile: File | null
  ) => Promise<boolean>
}

interface AnnouncementFormState {
  title: string
  kind: AnnouncementKind
  content: string
  cover_image_url: string
  event_date: string
  action_url: string
  action_label: string
  allow_comments: boolean
  comments_moderated: boolean
  is_pinned: boolean
  is_published: boolean
}

const KIND_OPTIONS: Array<{ value: AnnouncementKind; label: string }> = [
  { value: 'project_wip', label: 'Projet en cours' },
  { value: 'event', label: 'Événement' },
  { value: 'news', label: 'Actualité' },
]

function buildInitialState(ann: AnnouncementWithComments | null): AnnouncementFormState {
  if (!ann) {
    return {
      title: '',
      kind: 'news',
      content: '',
      cover_image_url: '',
      event_date: '',
      action_url: '',
      action_label: '',
      allow_comments: true,
      comments_moderated: false,
      is_pinned: false,
      is_published: true,
    }
  }

  return {
    title: ann.title,
    kind: ann.kind,
    content: ann.content,
    cover_image_url: ann.cover_image_url || '',
    event_date: toDatetimeLocalValue(ann.event_date),
    action_url: ann.action_url || '',
    action_label: ann.action_label || '',
    allow_comments: ann.allow_comments,
    comments_moderated: Boolean(ann.comments_moderated),
    is_pinned: ann.is_pinned,
    is_published: ann.is_published,
  }
}

export default function AnnouncementModal({
  isOpen,
  announcement,
  saving,
  onClose,
  onSave,
}: AnnouncementModalProps): ReactElement | null {
  const [form, setForm] = useState<AnnouncementFormState>(() => buildInitialState(announcement))
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setForm(buildInitialState(announcement))
    setCoverFile(null)
    setBlobPreviewUrl(null)
    setFormError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [isOpen, announcement])

  useEffect(() => {
    return () => {
      if (blobPreviewUrl) {
        URL.revokeObjectURL(blobPreviewUrl)
      }
    }
  }, [blobPreviewUrl])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, saving, onClose])

  if (!isOpen) return null

  const activePreviewUrl = blobPreviewUrl || form.cover_image_url.trim() || null

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setBlobPreviewUrl(URL.createObjectURL(file))
  }

  const handleClearCover = (): void => {
    setCoverFile(null)
    setBlobPreviewUrl(null)
    setForm((prev) => ({ ...prev, cover_image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (saving) return

    const trimmedTitle = form.title.trim()
    const trimmedContent = form.content.trim()
    if (!trimmedTitle) {
      setFormError('Le titre de l’annonce est obligatoire.')
      return
    }
    if (!trimmedContent) {
      setFormError('Le contenu de l’annonce est obligatoire.')
      return
    }

    setFormError(null)

    const payload: SaveAnnouncementInput = {
      title: trimmedTitle,
      kind: form.kind,
      content: trimmedContent,
      cover_image_url: form.cover_image_url.trim() || null,
      event_date: fromDatetimeLocalValue(form.event_date),
      action_url: form.action_url.trim() || null,
      action_label: form.action_label.trim() || null,
      allow_comments: form.allow_comments,
      comments_moderated: form.allow_comments ? form.comments_moderated : false,
      is_pinned: form.is_pinned,
      is_published: form.is_published,
    }

    const ok = await onSave(announcement?.id ?? null, payload, coverFile)
    if (ok) {
      onClose()
    }
  }

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors'
  const labelCls = 'block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-modal-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header sticky */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icon name="megaphone" className="size-4" />
            </div>
            <div>
              <h2
                id="announcement-modal-title"
                className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100"
              >
                {announcement ? 'Modifier l’annonce' : 'Nouvelle annonce'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Publiez une actualité, un événement ou un projet en cours.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>

        {/* Body scrollable */}
        <form
          id="announcement-modal-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
        >
          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="ann-title" className={labelCls}>
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                id="ann-title"
                type="text"
                required
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ex. Refonte complète du module analytique"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="ann-kind" className={labelCls}>
                Type d’annonce
              </label>
              <select
                id="ann-kind"
                value={form.kind}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, kind: event.target.value as AnnouncementKind }))
                }
                className={inputCls}
              >
                {KIND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <LinkInsertControl
              label="Contenu"
              htmlFor="ann-content"
              required
              labelClassName="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              fieldRef={contentRef}
              value={form.content}
              onChange={(nextValue) =>
                setForm((prev) => ({ ...prev, content: nextValue }))
              }
            />
            <textarea
              ref={contentRef}
              id="ann-content"
              rows={4}
              required
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Partagez les détails clés, les avancées ou le programme de l’événement..."
              className={`${inputCls} resize-y min-h-[110px]`}
            />
          </div>

          {/* Image de couverture */}
          <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Image de couverture (aperçu 16:9)
              </span>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500/60 text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer transition-colors">
                  <Icon name="image" className="size-3.5" />
                  <span>{coverFile ? 'Changer le fichier' : 'Téléverser'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                {activePreviewUrl && (
                  <button
                    type="button"
                    onClick={handleClearCover}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                  >
                    <Icon name="trash" className="size-3.5" />
                    <span>Retirer</span>
                  </button>
                )}
              </div>
            </div>

            {activePreviewUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                <img
                  src={activePreviewUrl}
                  alt="Aperçu de la couverture"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div>
              <label htmlFor="ann-cover-url" className={labelCls}>
                Ou URL directe de l’image
              </label>
              <input
                id="ann-cover-url"
                type="url"
                value={form.cover_image_url}
                onChange={(event) => {
                  const nextUrl = event.target.value
                  setCoverFile(null)
                  setBlobPreviewUrl(null)
                  setForm((prev) => ({ ...prev, cover_image_url: nextUrl }))
                }}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ann-event-date" className={labelCls}>
                Date d’événement (optionnel)
              </label>
              <input
                id="ann-event-date"
                type="datetime-local"
                value={form.event_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, event_date: event.target.value }))
                }
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="ann-action-label" className={labelCls}>
                Libellé du lien (optionnel)
              </label>
              <input
                id="ann-action-label"
                type="text"
                value={form.action_label}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, action_label: event.target.value }))
                }
                placeholder="Ex. En savoir plus"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="ann-action-url" className={labelCls}>
                URL d’action (optionnel)
              </label>
              <input
                id="ann-action-url"
                type="url"
                value={form.action_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, action_url: event.target.value }))
                }
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          </div>

          {/* Options de publication & commentaires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 cursor-pointer text-xs text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_published: event.target.checked }))
                }
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Publier sur le site</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 cursor-pointer text-xs text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_pinned: event.target.checked }))
                }
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Épingler en haut du fil</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 cursor-pointer text-xs text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={form.allow_comments}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, allow_comments: event.target.checked }))
                }
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Autoriser les commentaires</span>
            </label>

            <label
              className={`flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 text-xs ${
                form.allow_comments
                  ? 'cursor-pointer text-zinc-700 dark:text-zinc-200'
                  : 'opacity-50 cursor-not-allowed text-zinc-400'
              }`}
            >
              <input
                type="checkbox"
                disabled={!form.allow_comments}
                checked={form.allow_comments && form.comments_moderated}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, comments_moderated: event.target.checked }))
                }
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Modérer avant affichage public</span>
            </label>
          </div>
        </form>

        {/* Footer sticky */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="announcement-modal-form"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving
              ? 'Enregistrement...'
              : announcement
                ? 'Mettre à jour'
                : 'Enregistrer l’annonce'}
          </button>
        </div>
      </div>
    </div>
  )
}
