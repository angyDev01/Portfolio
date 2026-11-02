import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import { portfolioData } from '../data/portfolioData'
import Icon from '../components/Icon'

export default function ContactPage(): ReactElement {
  const { contact, profile, socials, ui } = portfolioData
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(profile.contact.email)
      setCopied(true)
    } catch {
      // Fallback
    }
  }

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    setSubmitting(true)

    // Simulation d'envoi immédiat avec validation UX
    setTimeout(() => {
      setSubmitting(false)
      setSentSuccess(true)
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setSentSuccess(false), 5000)
    }, 600)
  }

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header de la page */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            {contact.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-4">
            {contact.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {contact.description}
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
                  {contact.emailLabel}
                </span>
                <span className="font-mono text-sm text-zinc-100 font-medium select-all truncate">
                  {profile.contact.email}
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
              aria-label={ui.contact.copyAria(profile.contact.email)}
            >
              <Icon name={copied ? 'check' : 'copy'} className="size-3.5" />
              <span>{copied ? ui.contact.copied : ui.contact.copy}</span>
            </button>
          </div>

          {/* Formulaire de contact centré */}
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
                placeholder={ui.contact.formName}
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
                placeholder={ui.contact.formEmail}
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
                placeholder={ui.contact.formMessage}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-white hover:shadow-lg hover:shadow-zinc-100/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? ui.contact.formSubmitting : ui.contact.formSubmit}</span>
              <Icon name="send" className="size-3.5" />
            </button>

            {sentSuccess && (
              <p
                role="status"
                className="text-xs font-mono text-emerald-400 text-center mt-2 bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg"
              >
                {ui.contact.formSuccess}
              </p>
            )}
          </form>

          {/* Réseaux sociaux */}
          <div className="glass-card p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Retrouvez-moi également sur le web
            </span>
            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.external ? '_blank' : undefined}
                  rel={social.external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all text-xs font-mono"
                  aria-label={social.label}
                >
                  <Icon name={social.icon} className="size-4 text-indigo-400" />
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

