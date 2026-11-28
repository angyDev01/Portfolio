import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react'
import Icon from '../Icon'
import LinkInsertControl from './LinkInsertControl'
import {
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  type CreatePollInput,
} from '../../services/pollService'
import { fromDatetimeLocalValue } from '../../utils/dateTime'

interface PollModalProps {
  isOpen: boolean
  saving: boolean
  onClose: () => void
  onCreatePoll: (input: CreatePollInput) => Promise<boolean>
}

export default function PollModal({
  isOpen,
  saving,
  onClose,
  onCreatePoll,
}: PollModalProps): ReactElement | null {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [formError, setFormError] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setQuestion('')
    setDescription('')
    setClosesAt('')
    setOptions(['', ''])
    setFormError(null)
  }, [isOpen])

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

  const handleOptionChange = (index: number, value: string): void => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)))
  }

  const handleAddOption = (): void => {
    setOptions((prev) => (prev.length >= MAX_POLL_OPTIONS ? prev : [...prev, '']))
  }

  const handleRemoveOption = (index: number): void => {
    setOptions((prev) =>
      prev.length <= MIN_POLL_OPTIONS ? prev : prev.filter((_, i) => i !== index)
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (saving) return

    const trimmedQuestion = question.trim()
    const cleanedOptions = options.map((opt) => opt.trim()).filter(Boolean)

    if (!trimmedQuestion) {
      setFormError('La question du sondage est obligatoire.')
      return
    }
    if (cleanedOptions.length < MIN_POLL_OPTIONS) {
      setFormError(`Renseignez au moins ${MIN_POLL_OPTIONS} choix de réponse.`)
      return
    }

    setFormError(null)

    const ok = await onCreatePoll({
      question: trimmedQuestion,
      description: description.trim() || null,
      closes_at: fromDatetimeLocalValue(closesAt),
      options: cleanedOptions,
    })

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
      aria-labelledby="poll-modal-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header sticky */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icon name="analytics" className="size-4" />
            </div>
            <div>
              <h2
                id="poll-modal-title"
                className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100"
              >
                Nouveau sondage
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Collectez l’avis de vos visiteurs ({MIN_POLL_OPTIONS} à {MAX_POLL_OPTIONS} choix).
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
          id="poll-modal-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
        >
          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="poll-question" className={labelCls}>
              Question <span className="text-red-500">*</span>
            </label>
            <input
              id="poll-question"
              type="text"
              required
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ex. Quel sujet technique souhaitez-vous approfondir ?"
              className={inputCls}
            />
          </div>

          <div>
            <LinkInsertControl
              label="Contexte (optionnel)"
              htmlFor="poll-description"
              labelClassName="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              fieldRef={descriptionRef}
              value={description}
              onChange={setDescription}
            />
            <textarea
              ref={descriptionRef}
              id="poll-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ajoutez quelques précisions pour aider au vote..."
              className={`${inputCls} resize-y`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Options de réponse ({options.length}/{MAX_POLL_OPTIONS})
              </span>
              {options.length < MAX_POLL_OPTIONS && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Icon name="plus" className="size-3.5" />
                  <span>Ajouter un choix</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400 w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    required={index < MIN_POLL_OPTIONS}
                    value={opt}
                    onChange={(event) => handleOptionChange(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    aria-label={`Option ${index + 1}`}
                    className={inputCls}
                  />
                  {options.length > MIN_POLL_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      aria-label={`Supprimer l’option ${index + 1}`}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Icon name="trash" className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="poll-closes-at" className={labelCls}>
              Date de clôture automatique (optionnel)
            </label>
            <input
              id="poll-closes-at"
              type="datetime-local"
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
              className={inputCls}
            />
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
            form="poll-modal-form"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Publication...' : 'Publier le sondage'}
          </button>
        </div>
      </div>
    </div>
  )
}
