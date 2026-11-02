import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile } from '../types/database'
import Icon from '../components/Icon'

export default function ContactPage(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) setProfile(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const email = profile?.email || 'contact@angy.dev'
  const github = profile?.github_url || 'https://github.com/angyDev01'
  const linkedin = profile?.linkedin_url || 'https://linkedin.com/in/angydev'

  const handleCopyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
    } catch {
      // Fallback
    }
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    const result = await portfolioService.submitContact(formData)
    setSubmitting(false)

    if (result.ok) {
      setFeedback({ type: 'success', text: result.message })
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setFeedback(null), 6000)
    } else {
      setFeedback({ type: 'error', text: result.message })
    }
  }

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header de la page */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            Contact Direct
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-4">
            Démarrons un projet ensemble
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Que ce soit pour une opportunité d’embauche, un projet freelance ou une collaboration technique, n’hésitez pas à me joindre.
          </p>
        </div>

        <div className="max-w-xl mx-auto space-y-8">
          {/* Bloc de contact direct avec bouton Copie */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                <Icon name="mail" className="size-5" />
              </span>
              <div className="flex flex-col text-left truncate">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Adresse email
                </span>
                <span className="font-mono text-sm text-zinc-100 font-medium select-all truncate">
                  {email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
              aria-label={`Copier l'email ${email}`}
            >
              <Icon name={copied ? 'check' : 'copy'} className="size-3.5" />
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>

          {/* Formulaire de contact centré connecté à contact_messages */}
          <form
            onSubmit={handleSubmit}
            className="glass-card p-6 sm:p-8 flex flex-col gap-4 text-left"
          >
            <h2 className="text-lg font-bold text-zinc-100 mb-1">
              Envoyer un message direct
            </h2>

            <div>
              <label htmlFor="contact-name" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Nom complet
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Votre nom"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Adresse email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vous@exemple.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans"
              />
            </div>

            <div>
              <label htmlFor="contact-msg" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Votre message
              </label>
              <textarea
                id="contact-msg"
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Votre message..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-white hover:shadow-lg hover:shadow-zinc-100/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Envoi en cours...' : 'Envoyer le message'}</span>
              <Icon name="send" className="size-3.5" />
            </button>

            {feedback && (
              <p
                role="status"
                className={`text-xs font-mono text-center mt-2 py-2 rounded-lg border ${
                  feedback.type === 'success'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}
              >
                {feedback.text}
              </p>
            )}
          </form>

          {/* Réseaux sociaux */}
          <div className="glass-card p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Retrouvez-moi également sur le web
            </span>
            <div className="flex items-center gap-3">
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="GitHub (nouvel onglet)"
              >
                <Icon name="github" className="size-4 text-indigo-400" />
                <span>GitHub</span>
              </a>
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="LinkedIn (nouvel onglet)"
              >
                <Icon name="linkedin" className="size-4 text-indigo-400" />
                <span>LinkedIn</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="Email"
              >
                <Icon name="mail" className="size-4 text-indigo-400" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
