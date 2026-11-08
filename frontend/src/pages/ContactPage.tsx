import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile, DirectMessagePayload, EmailContactPayload } from '../types/database'
import Icon from '../components/Icon'
import { directMessageSchema, emailContactSchema, getZodErrorMessage } from '../utils/security'

type ContactChannel = 'direct' | 'email'

export default function ContactPage(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [activeChannel, setActiveChannel] = useState<ContactChannel>('direct')
  const [copied, setCopied] = useState(false)

  // État formulaire Canal 1 : Email
  const [emailForm, setEmailForm] = useState<EmailContactPayload>({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submittingEmail, setSubmittingEmail] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // État formulaire Canal 2 : Message direct (4 champs obligatoires)
  const [directForm, setDirectForm] = useState<DirectMessagePayload>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submittingDirect, setSubmittingDirect] = useState(false)
  const [directFeedback, setDirectFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const recipientEmail = profile?.email || 'angynewdev@gmail.com'
  const primaryPhone = profile?.phone || '+225 07 20 64 65 26'
  const secondaryPhone = profile?.phone_secondary || '+225 05 66 40 29 73'
  const whatsappUrl = profile?.whatsapp_url || 'https://wa.me/2250720646526'
  const location = profile?.location || "Abidjan, Côte d'Ivoire (Ouvert au télétravail / remote)"
  const github = profile?.github_url || 'https://github.com/angyDev01'
  const linkedin = profile?.linkedin_url || 'https://www.linkedin.com/in/angy-dev-532293357'
  const twitter = profile?.twitter_url || 'https://x.com/Angy656261'
  const facebook = profile?.facebook_url || 'https://www.facebook.com/share/1FGHSoJjo9/'

  const handleCopyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(recipientEmail)
      setCopied(true)
    } catch {
      // Fallback si clipboard API non autorisée
    }
  }

  // Soumission Canal 1 — Envoi d'un email
  const handleEmailSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmittingEmail(true)
    setEmailFeedback(null)

    // Validation stricte Zod et assainissement Anti-XSS
    const validation = emailContactSchema.safeParse(emailForm)
    if (!validation.success) {
      setSubmittingEmail(false)
      setEmailFeedback({
        type: 'error',
        text: getZodErrorMessage(validation.error),
      })
      return
    }

    const cleanData = validation.data

    try {
      await portfolioService.submitEmailMessage(cleanData)

      // Ouverture du client mailto pour assurer l'envoi direct vers la boîte
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
        cleanData.subject
      )}&body=${encodeURIComponent(
        `Bonjour Angy,\n\n${cleanData.message}\n\n---\nDe: ${cleanData.name}\nEmail: ${cleanData.email}`
      )}`
      window.location.href = mailtoUrl

      setEmailFeedback({
        type: 'success',
        text: `Votre client de messagerie s'est ouvert pour envoyer l'email à ${recipientEmail}. Si ce n'est pas le cas, vous pouvez lui écrire directement.`,
      })
      setEmailForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setEmailFeedback({
        type: 'error',
        text: 'Une erreur est survenue lors de la préparation de l’email.',
      })
    } finally {
      setSubmittingEmail(false)
    }
  }

  // Soumission Canal 2 — Laisser un message direct sur le site (4 champs obligatoires)
  const handleDirectSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmittingDirect(true)
    setDirectFeedback(null)

    // Validation stricte Zod et assainissement Anti-XSS
    const validation = directMessageSchema.safeParse(directForm)
    if (!validation.success) {
      setSubmittingDirect(false)
      setEmailFeedback(null)
      setDirectFeedback({
        type: 'error',
        text: getZodErrorMessage(validation.error),
      })
      return
    }

    const cleanData = validation.data
    const result = await portfolioService.submitDirectMessage(cleanData)
    setSubmittingDirect(false)

    if (result.ok) {
      setDirectFeedback({
        type: 'success',
        text: 'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
      })
      setDirectForm({ name: '', email: '', phone: '', message: '' })
    } else {
      setDirectFeedback({
        type: 'error',
        text: result.message,
      })
    }
  }

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
            Contact & Messagerie
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            Démarrons un projet ensemble
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Pour une opportunité professionnelle, un contrat freelance ou un échange technique, choisissez votre canal de contact privilégié ci-dessous.
          </p>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          {/* Bloc Coordonnées Directes & WhatsApp */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Icon name="phone" className="size-5" />
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Ligne Directe & WhatsApp
                  </span>
                  <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100 font-semibold select-all">
                    {primaryPhone}
                  </span>
                </div>
              </div>

              {/* Boutons d'Action Rapide : WhatsApp & Appel */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium transition-colors shadow-sm"
                  aria-label="Contacter sur WhatsApp (nouvel onglet)"
                >
                  <Icon name="messageSquare" className="size-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:+2250720646526"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono font-medium transition-colors"
                  aria-label="Appeler le numéro principal"
                >
                  <Icon name="phone" className="size-3.5" />
                  <span>Appeler</span>
                </a>
              </div>
            </div>

            {/* Infos complémentaires : Téléphone secondaire & Localisation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-zinc-600 dark:text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                <Icon name="phone" className="size-3.5 text-zinc-400 shrink-0" />
                <span>Secondaire : <strong className="text-zinc-800 dark:text-zinc-200">{secondaryPhone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="sparkles" className="size-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          </div>

          {/* Bloc d'adresse email avec bouton Copie */}
          <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Icon name="mail" className="size-5" />
              </span>
              <div className="flex flex-col text-left truncate">
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Boîte de réception
                </span>
                <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100 font-medium select-all truncate">
                  {recipientEmail}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${copied
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700'
                }`}
              aria-label={`Copier l'email ${recipientEmail}`}
            >
              <Icon name={copied ? 'check' : 'copy'} className="size-3.5" />
              <span>{copied ? 'Copié !' : 'Copier l’adresse'}</span>
            </button>
          </div>

          {/* SÉLECTEUR D'ONGLET DES DEUX CANAUX */}
          <div className="p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-800/80 grid grid-cols-2 gap-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveChannel('direct')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer text-xs sm:text-sm ${activeChannel === 'direct'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700/80 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                }`}
              aria-selected={activeChannel === 'direct'}
            >
              <Icon name="messageSquare" className="size-4 text-indigo-500 dark:text-indigo-400" />
              <span>Laisser un message direct</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('email')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer text-xs sm:text-sm ${activeChannel === 'email'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700/80 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                }`}
              aria-selected={activeChannel === 'email'}
            >
              <Icon name="mail" className="size-4 text-indigo-500 dark:text-indigo-400" />
              <span>M’envoyer un email</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* CANAL 2 : LAISSER UN MESSAGE DIRECT SUR LE SITE               */}
          {/* ============================================================== */}
          {activeChannel === 'direct' && (
            <div className="glass-card p-6 sm:p-8 flex flex-col gap-5 text-left border-indigo-500/20">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
                  <Icon name="messageSquare" className="size-3.5" />
                  <span>Canal 2 — Notification Directe</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Laisser un message direct sur le site
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Ce formulaire permet de m'envoyer un message directement,sans passer par mon client mail.
                </p>
              </div>

              {profile?.accept_direct_messages === false ? (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-start gap-2.5">
                  <Icon name="alert" className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Réception directe momentanément suspendue</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Veuillez utiliser le canal « M'envoyer un email » en sélectionnant l'onglet ci-dessus.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDirectSubmit} className="flex flex-col gap-4">
                  {/* 1. Nom complet */}
                  <div>
                    <label htmlFor="direct-name" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Nom complet <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <input
                      id="direct-name"
                      type="text"
                      required
                      value={directForm.name}
                      onChange={(e) => setDirectForm({ ...directForm, name: e.target.value })}
                      placeholder="Ex: Jean Dupont"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
                    />
                  </div>

                  {/* 2. Adresse email */}
                  <div>
                    <label htmlFor="direct-email" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Adresse email <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <input
                      id="direct-email"
                      type="email"
                      required
                      value={directForm.email}
                      onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })}
                      placeholder="jean.dupont@entreprise.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
                    />
                  </div>

                  {/* 3. Numéro de téléphone */}
                  <div>
                    <label htmlFor="direct-phone" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Numéro de téléphone <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="direct-phone"
                        type="tel"
                        required
                        value={directForm.phone}
                        onChange={(e) => setDirectForm({ ...directForm, phone: e.target.value })}
                        placeholder="+33 6 12 34 56 78 (ou WhatsApp)"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
                      />
                      <span className="absolute left-3 top-3 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                        <Icon name="phone" className="size-4" />
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Pour pouvoir vous recontacter directement ou via WhatsApp.
                    </p>
                  </div>

                  {/* 4. Le message */}
                  <div>
                    <label htmlFor="direct-message" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Votre message <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <textarea
                      id="direct-message"
                      rows={4}
                      required
                      value={directForm.message}
                      onChange={(e) => setDirectForm({ ...directForm, message: e.target.value })}
                      placeholder="Décrivez votre besoin, projet ou proposition..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingDirect}
                    className="mt-1 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
                  >
                    <span>{submittingDirect ? 'Transmission en cours...' : 'Transmettre le message direct'}</span>
                    <Icon name="send" className="size-4" />
                  </button>

                  {directFeedback && (
                    <div
                      role="status"
                      className={`text-xs p-3.5 rounded-lg border leading-relaxed flex items-start gap-2.5 ${directFeedback.type === 'success'
                        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
                        }`}
                    >
                      <span className="shrink-0 mt-0.5">
                        <Icon
                          name={directFeedback.type === 'success' ? 'checkCircle' : 'close'}
                          className="size-4"
                        />
                      </span>
                      <span>{directFeedback.text}</span>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* CANAL 1 : M'ENVOYER UN EMAIL (En maintenance temporaire)       */}
          {/* ============================================================== */}
          {activeChannel === 'email' && (
            <div className="glass-card p-6 sm:p-8 flex flex-col gap-5 text-left">
              {/* Bandeau informatif élégant de maintenance */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-mono flex items-start gap-3 shadow-xs">
                <span className="text-base shrink-0 select-none" aria-hidden="true">⚙️</span>
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                    Canal email temporairement en maintenance.
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Merci d'utiliser l'onglet{' '}
                    <button
                      type="button"
                      onClick={() => setActiveChannel('direct')}
                      className="underline font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer"
                    >
                      « Laisser un message direct »
                    </button>{' '}
                    juste à côté.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
                  <Icon name="mail" className="size-3.5" />
                  <span>Canal 1 — Messagerie Électronique</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  M'envoyer un email direct
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Ce formulaire transmet votre demande directement à ma boîte de réception ({recipientEmail}).
                </p>
              </div>

              {/* Structure visuelle conservée mais grisée et désactivée */}
              <div className="opacity-60 pointer-events-none select-none" aria-disabled="true">
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  {/* 1. Nom */}
                  <div>
                    <label htmlFor="email-name" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Nom complet <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <input
                      id="email-name"
                      type="text"
                      disabled
                      value={emailForm.name}
                      onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      placeholder="Votre nom"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
                    />
                  </div>

                  {/* 2. Email */}
                  <div>
                    <label htmlFor="email-address" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Adresse email <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <input
                      id="email-address"
                      type="email"
                      disabled
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      placeholder="votre.email@exemple.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
                    />
                  </div>

                  {/* 3. Objet */}
                  <div>
                    <label htmlFor="email-subject" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Objet <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <input
                      id="email-subject"
                      type="text"
                      disabled
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder="Ex: Proposition de mission / Recrutement"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
                    />
                  </div>

                  {/* 4. Message */}
                  <div>
                    <label htmlFor="email-body" className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Message <span className="text-indigo-500 dark:text-indigo-400">*</span>
                    </label>
                    <textarea
                      id="email-body"
                      rows={4}
                      disabled
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      placeholder="Votre message complet..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans resize-y"
                    />
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-1 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold text-sm shadow-md cursor-not-allowed"
                  >
                    <span>{submittingEmail ? 'Préparation de l’envoi...' : 'Envoyer l’email'}</span>
                    <Icon name="mail" className="size-4" />
                  </button>

                  {emailFeedback && (
                    <div
                      role="status"
                      className="text-xs p-3.5 rounded-lg border leading-relaxed flex items-start gap-2.5 text-zinc-400 bg-zinc-800/20 border-zinc-700/30"
                    >
                      <span>{emailFeedback.text}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Réseaux sociaux : Retrouvez-moi aussi sur le web (exclusif GitHub, LinkedIn, X, Facebook) */}
          <div className="glass-card p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Retrouvez-moi aussi sur le web
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="GitHub (nouvel onglet)"
              >
                <Icon name="github" className="size-4 text-indigo-500 dark:text-indigo-400" />
                <span>GitHub</span>
              </a>
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="LinkedIn (nouvel onglet)"
              >
                <Icon name="linkedin" className="size-4 text-indigo-500 dark:text-indigo-400" />
                <span>LinkedIn</span>
              </a>
              <a
                href={twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="X (Twitter) (nouvel onglet)"
              >
                <Icon name="x" className="size-4 text-indigo-500 dark:text-indigo-400" />
                <span>X (Twitter)</span>
              </a>
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-xs font-mono"
                aria-label="Facebook (nouvel onglet)"
              >
                <Icon name="facebook" className="size-4 text-indigo-500 dark:text-indigo-400" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
