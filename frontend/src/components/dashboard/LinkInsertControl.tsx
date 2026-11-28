import { useRef, useState, type KeyboardEvent, type ReactElement, type RefObject } from 'react'
import Icon from '../Icon'
import { insertMarkdownLink, normalizeRichLinkUrl } from '../../utils/richText'

interface LinkInsertControlProps {
  label: string
  htmlFor?: string
  required?: boolean
  labelClassName?: string
  fieldRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
  value: string
  onChange: (nextValue: string) => void
}

/**
 * Barre d'en-tête de champ texte intégrant un bouton « Insérer un lien »
 * et un mini panneau inline sans balise <form> imbriquée.
 */
export default function LinkInsertControl({
  label,
  htmlFor,
  required = false,
  labelClassName = 'text-xs font-medium text-zinc-700 dark:text-zinc-300',
  fieldRef,
  value,
  onChange,
}: LinkInsertControlProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const selectionRef = useRef<{ start: number; end: number }>({
    start: value.length,
    end: value.length,
  })

  const handleToggle = (): void => {
    if (open) {
      setOpen(false)
      setError(null)
      return
    }

    const field = fieldRef.current
    const rawStart = field?.selectionStart ?? value.length
    const rawEnd = field?.selectionEnd ?? rawStart
    const start = Math.max(0, Math.min(rawStart, value.length))
    const end = Math.max(start, Math.min(rawEnd, value.length))
    selectionRef.current = { start, end }

    const selectedText = start !== end ? value.slice(start, end) : ''
    setLinkLabel(selectedText)
    setLinkUrl('')
    setError(null)
    setOpen(true)
  }

  const handleInsert = (): void => {
    const result = insertMarkdownLink(
      value,
      selectionRef.current.start,
      selectionRef.current.end,
      linkLabel,
      linkUrl
    )

    if (!result.ok) {
      setError(result.error)
      return
    }

    onChange(result.nextValue)
    setOpen(false)
    setLinkLabel('')
    setLinkUrl('')
    setError(null)

    requestAnimationFrame(() => {
      const field = fieldRef.current
      if (!field) return
      field.focus()
      field.setSelectionRange(result.nextCursor, result.nextCursor)
    })
  }

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      handleInsert()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      setError(null)
    }
  }

  const urlTrimmed = linkUrl.trim()
  const isUrlPreviewValid = urlTrimmed.length > 0 && Boolean(normalizeRichLinkUrl(urlTrimmed))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <label htmlFor={htmlFor} className={labelClassName}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>

        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
            open
              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          <Icon name="link" className="size-3" />
          <span>{open ? 'Fermer lien' : 'Insérer un lien'}</span>
        </button>
      </div>

      {open && (
        <div className="mb-2.5 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Texte affiché (optionnel)
              </label>
              <input
                type="text"
                value={linkLabel}
                onChange={(event) => setLinkLabel(event.target.value)}
                onKeyDown={handlePanelKeyDown}
                placeholder="Ex. Voir la démo"
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                URL ou page interne *
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(event) => {
                  setLinkUrl(event.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={handlePanelKeyDown}
                placeholder="https://... ou /projets"
                autoFocus
                className={`w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none font-mono ${
                  urlTrimmed && !isUrlPreviewValid
                    ? 'border-amber-500/60 focus:border-amber-500'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              URL directe (`https://...`) ou format `[texte](url)` acceptés.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setError(null)
                }}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleInsert}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Icon name="plus" className="size-3" />
                <span>Insérer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
