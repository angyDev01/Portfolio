import { useState, type FormEvent, type ReactElement } from 'react'
import { portfolioService } from '../../services/portfolioService'
import type { DirectMessagePayload } from '../../types/database'
import { directMessageSchema, getZodErrorMessage } from '../../utils/security'
import Icon from '../Icon'

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-md bg-paper border border-line text-ink text-base sm:text-sm focus:border-indigo focus:outline-none placeholder:text-muted/70 transition-colors'

interface DirectMessageFormProps {
  acceptDirectMessages: boolean
}

export default function DirectMessageForm({
  acceptDirectMessages,
}: DirectMessageFormProps): ReactElement {
  const [form, setForm] = useState<DirectMessagePayload>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    const validation = directMessageSchema.safeParse(form)
    if (!validation.success) {
      setSubmitting(false)
      setFeedback({ type: 'error', text: getZodErrorMessage(validation.error) })
      return
    }

    const result = await portfolioService.submitDirectMessage(validation.data)
    setSubmitting(false)

    if (result.ok) {
      setFeedback({
        type: 'success',
        text: 'Votre message a été transmis avec succès. Je vous répondrai dans les plus brefs délais.',
      })
      setForm({ name: '', email: '', phone: '', message: '' })
    } else {
      setFeedback({ type: 'error', text: result.message })
    }
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-ink tracking-[-0.015em]">
          Laisser un message direct
        </h2>
        <p className="text-sm text-muted mt-1">
          Transmis instantanément sur mon espace de travail.
        </p>
      </div>

      {!acceptDirectMessages ? (
        <div className="p-4 rounded-md border border-line bg-paper text-sm text-muted">
          La messagerie directe est temporairement en pause. Écrivez-moi par email ou sur WhatsApp.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="direct-name" className="block text-xs font-medium text-ink mb-1.5">
              Nom complet *
            </label>
            <input
              id="direct-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jean Dupont"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="direct-email" className="block text-xs font-medium text-ink mb-1.5">
              Adresse email *
            </label>
            <input
              id="direct-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jean.dupont@entreprise.com"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="direct-phone" className="block text-xs font-medium text-ink mb-1.5">
              Numéro de téléphone *
            </label>
            <input
              id="direct-phone"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78 ou WhatsApp"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="direct-message" className="block text-xs font-medium text-ink mb-1.5">
              Votre message *
            </label>
            <textarea
              id="direct-message"
              rows={4}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Précisez votre demande ou besoin..."
              className={`${INPUT_CLASS} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-tactile mt-2 w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Transmission...' : 'Envoyer le message'}</span>
            <Icon name="send" className="size-4" />
          </button>

          {feedback && (
            <div
              role="status"
              className={`text-sm p-3.5 rounded-md border ${
                feedback.type === 'success'
                  ? 'text-indigo bg-paper border-indigo/40'
                  : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </form>
      )}
    </div>
  )
}
