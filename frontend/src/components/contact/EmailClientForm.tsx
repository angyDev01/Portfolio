import { useState, type FormEvent, type ReactElement } from 'react'
import type { EmailContactPayload } from '../../types/database'
import { emailContactSchema, getZodErrorMessage } from '../../utils/security'
import Icon from '../Icon'

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-md bg-paper border border-line text-ink text-base sm:text-sm focus:border-indigo focus:outline-none placeholder:text-muted/70 transition-colors'

interface EmailClientFormProps {
  recipientEmail: string
}

export default function EmailClientForm({ recipientEmail }: EmailClientFormProps): ReactElement {
  const [form, setForm] = useState<EmailContactPayload>({
    name: '',
    email: '',
    subject: '',
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

    const validation = emailContactSchema.safeParse(form)
    if (!validation.success) {
      setSubmitting(false)
      setFeedback({ type: 'error', text: getZodErrorMessage(validation.error) })
      return
    }

    const { subject, message, name, email } = validation.data
    const bodyText = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`

    window.location.href = mailtoUrl
    setSubmitting(false)
    setFeedback({
      type: 'success',
      text: 'Client de messagerie ouvert avec votre message prérempli.',
    })
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-ink tracking-[-0.015em]">
          Écrire par client de messagerie
        </h2>
        <p className="text-sm text-muted mt-1">
          Prépare votre message dans votre application de messagerie à destination de{' '}
          {recipientEmail}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email-name" className="block text-xs font-medium text-ink mb-1.5">
            Nom complet *
          </label>
          <input
            id="email-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Votre nom"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="email-address" className="block text-xs font-medium text-ink mb-1.5">
            Adresse email *
          </label>
          <input
            id="email-address"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="votre.email@exemple.com"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="email-subject" className="block text-xs font-medium text-ink mb-1.5">
            Objet *
          </label>
          <input
            id="email-subject"
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Objet de votre message"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="email-body" className="block text-xs font-medium text-ink mb-1.5">
            Message *
          </label>
          <textarea
            id="email-body"
            rows={4}
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Votre message complet..."
            className={`${INPUT_CLASS} resize-y`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-tactile mt-2 w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <span>{submitting ? 'Préparation...' : 'Ouvrir le client de messagerie'}</span>
          <Icon name="mail" className="size-4" />
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
    </div>
  )
}
