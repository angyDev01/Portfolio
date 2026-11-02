import { useEffect, useState, useMemo, type FormEvent, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { ContactMessage } from '../types/database'
import Icon from '../components/Icon'

export default function DashboardPage(): ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [password, setPassword] = useState<string>(() => localStorage.getItem('admin_pass') || '')
  const [inputPassword, setInputPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loginError, setLoginError] = useState<string>('')
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

  // Messages data
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Auto-login on mount if token/pass in localStorage
  useEffect(() => {
    if (password) {
      verifyAndLoad(password)
    }
  }, [])

  // Auto-dismiss feedback message after 4s
  useEffect(() => {
    if (!actionFeedback) return
    const timer = window.setTimeout(() => setActionFeedback(null), 4000)
    return () => window.clearTimeout(timer)
  }, [actionFeedback])

  const verifyAndLoad = async (pass: string): Promise<void> => {
    setIsLoggingIn(true)
    setLoginError('')

    const authRes = await portfolioService.adminLogin(pass)
    if (authRes.ok) {
      setIsAuthenticated(true)
      localStorage.setItem('admin_pass', pass)
      await fetchMessages(pass)
    } else {
      setIsAuthenticated(false)
      setLoginError(authRes.message || 'Mot de passe incorrect.')
      localStorage.removeItem('admin_pass')
    }
    setIsLoggingIn(false)
  }

  const fetchMessages = async (pass: string): Promise<void> => {
    setLoading(true)
    const res = await portfolioService.getAdminMessages(pass)
    if (res.ok) {
      setMessages(res.messages)
      setUnreadCount(res.unreadCount)
    }
    setLoading(false)
  }

  const handleLoginSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setPassword(inputPassword)
    await verifyAndLoad(inputPassword)
  }

  const handleLogout = (): void => {
    setIsAuthenticated(false)
    setPassword('')
    setInputPassword('')
    setMessages([])
    setUnreadCount(0)
    localStorage.removeItem('admin_pass')
  }

  const handleToggleRead = async (message: ContactMessage): Promise<void> => {
    const newStatus = !message.is_read
    // Mise à jour optimiste immédiate dans l'interface
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, is_read: newStatus } : m))
    )
    setUnreadCount((prev) => (newStatus ? Math.max(0, prev - 1) : prev + 1))

    const res = await portfolioService.setMessageReadStatus(message.id, newStatus, password)
    if (res.ok) {
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount)
      }
      setActionFeedback({
        type: 'success',
        text: newStatus ? 'Message marqué comme lu.' : 'Message marqué comme non lu.',
      })
    } else {
      // Revert if failed
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: message.is_read } : m))
      )
      setUnreadCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)))
      setActionFeedback({
        type: 'error',
        text: 'Impossible de mettre à jour le statut du message.',
      })
    }
  }

  const handleDelete = async (id: string, name: string): Promise<void> => {
    const confirmDelete = window.confirm(`Supprimer définitivement le message de ${name} ?`)
    if (!confirmDelete) return

    // Mise à jour optimiste
    const deletedMsg = messages.find((m) => m.id === id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
    if (deletedMsg && !deletedMsg.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    const res = await portfolioService.deleteMessage(id, password)
    if (res.ok) {
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount)
      }
      setActionFeedback({ type: 'success', text: 'Message supprimé avec succès.' })
    } else {
      // Revert on error
      if (deletedMsg) {
        setMessages((prev) => [deletedMsg, ...prev])
      }
      setActionFeedback({ type: 'error', text: 'Erreur lors de la suppression.' })
    }
  }

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      // Filtre statut
      if (filter === 'unread' && m.is_read) return false
      if (filter === 'read' && !m.is_read) return false

      // Filtre recherche textuelle
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      )
    })
  }, [messages, filter, searchQuery])

  // ==============================================================
  // VUE 1 : FORMULAIRE DE CONNEXION ADMIN
  // ==============================================================
  if (!isAuthenticated) {
    return (
      <div className="pt-28 pb-24 md:pt-36 min-h-[85vh] flex items-center justify-center">
        <div className="container-custom max-w-md w-full">
          <div className="glass-card p-8 text-center border-zinc-800">
            <div className="size-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Icon name="lock" className="size-6" />
            </div>

            <h1 className="text-2xl font-bold text-zinc-100 mb-2">
              Administration Portfolio
            </h1>
            <p className="text-xs text-zinc-400 mb-6">
              Saisissez le mot de passe administrateur pour accéder à la messagerie du site.
            </p>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 text-left">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-mono text-zinc-300 mb-1.5"
                >
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-4" />
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                <span>{isLoggingIn ? 'Vérification...' : 'Se connecter'}</span>
                <Icon name="arrowRight" className="size-4" />
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/"
                  className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  ← Retourner au site public
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ==============================================================
  // VUE 2 : TABLEAU DE BORD AUTHENTIFIÉ
  // ==============================================================
  return (
    <div className="pt-28 pb-24 md:pt-36 min-h-screen">
      <div className="container-custom max-w-5xl">
        {/* Header du Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest">
                Espace Sécurisé
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
              Tableau de Bord Administrateur
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Gestion centralisée des messages de contact reçus via le Canal 2 (direct).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchMessages(password)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-mono transition-all cursor-pointer"
              title="Rafraîchir les messages"
            >
              <Icon name="refresh" className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-xs font-mono transition-all cursor-pointer"
            >
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Feedback notification toast */}
        {actionFeedback && (
          <div
            className={`mb-6 p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <Icon name={actionFeedback.type === 'success' ? 'check' : 'close'} className="size-3.5" />
            <span>{actionFeedback.text}</span>
          </div>
        )}

        {/* BARRE PRINCIPALE DES STATISTIQUES AVEC L'ICÔNE ET LE BADGE DYNAMIQUE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* CARTE MESSAGERIE AVEC BADGE DYNAMIQUE */}
          <div className="glass-card p-5 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-indigo-300 uppercase tracking-wider font-semibold">
                Canal 2 — Messagerie Directe
              </span>
              <div className="relative flex items-center justify-center size-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Icon name="messageSquare" className="size-4.5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-lg shadow-rose-500/50 animate-bounce"
                    aria-label={`${unreadCount} messages non lus`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-100 font-mono">
                {unreadCount}
              </span>
              <span className="text-xs text-indigo-300/80 font-mono">
                {unreadCount <= 1 ? 'message non lu' : 'messages non lus'}
              </span>
            </div>
          </div>

          {/* TOTAL DES MESSAGES */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Total Reçus (Canal 2)
              </span>
              <div className="flex items-center justify-center size-9 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                <Icon name="inbox" className="size-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-100 font-mono">
                {messages.length}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {messages.length <= 1 ? 'transmission' : 'transmissions'}
              </span>
            </div>
          </div>

          {/* MESSAGES TRAITÉS / LUS */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Traités / Lus
              </span>
              <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Icon name="checkCircle" className="size-4.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-zinc-100 font-mono">
                {messages.length - unreadCount}
              </span>
              <span className="text-xs text-emerald-400/80 font-mono">archivés ou consultés</span>
            </div>
          </div>
        </div>

        {/* BARRE DE FILTRES ET RECHERCHE */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Onglets de filtre */}
          <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tous ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Non lus</span>
              {unreadCount > 0 && (
                <span className="size-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filter === 'read'
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Lus ({messages.length - unreadCount})
            </button>
          </div>

          {/* Recherche */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, email, tél, texte..."
              className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-400 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* LISTE DES FICHES DE MESSAGES (FICHE COMPLÈTE : NOM, EMAIL, TÉLÉPHONE, DATE, MESSAGE) */}
        {filteredMessages.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-zinc-800">
            <div className="size-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
              <Icon name="messageSquare" className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              {searchQuery
                ? 'Aucun message ne correspond à votre recherche.'
                : filter === 'unread'
                ? 'Aucun message non lu. Vous êtes à jour !'
                : 'Aucun message direct reçu pour le moment.'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Les messages soumis par les visiteurs via le Canal 2 (« Laisser un message direct ») apparaîtront automatiquement ici avec leur fiche complète.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => {
              const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short',
              }).format(new Date(msg.created_at))

              const cleanPhone = (msg.phone || '').replace(/[^0-9+]/g, '')
              const whatsappUrl = cleanPhone.startsWith('+')
                ? `https://wa.me/${cleanPhone.replace('+', '')}`
                : `https://wa.me/33${cleanPhone.replace(/^0/, '')}`

              return (
                <article
                  key={msg.id}
                  className={`glass-card p-5 sm:p-6 transition-all duration-200 ${
                    !msg.is_read
                      ? 'border-indigo-500/40 bg-zinc-900/90 shadow-md shadow-indigo-500/5'
                      : 'border-zinc-800/80 bg-zinc-900/40'
                  }`}
                >
                  {/* Ligne d'en-tête de la fiche : Nom, Statut, Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800/60 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-mono font-bold text-sm">
                        {msg.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-zinc-100">{msg.name}</h2>
                          {!msg.is_read ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
                              Non lu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700">
                              <Icon name="check" className="size-2.5" />
                              Lu
                            </span>
                          )}
                        </div>
                        <time
                          dateTime={msg.created_at}
                          className="text-xs font-mono text-zinc-400"
                        >
                          {formattedDate}
                        </time>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(msg)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          msg.is_read
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                            : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium'
                        }`}
                        title={msg.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      >
                        <Icon name={msg.is_read ? 'eyeOff' : 'check'} className="size-3.5" />
                        <span>{msg.is_read ? 'Marquer non lu' : 'Marquer comme lu'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id, msg.name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-500/30 text-xs font-mono transition-all cursor-pointer"
                        title="Supprimer ce message"
                        aria-label={`Supprimer le message de ${msg.name}`}
                      >
                        <Icon name="trash" className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Coordonnées détaillées : Email & Téléphone / WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs font-mono">
                    {/* Email */}
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-zinc-500 shrink-0">
                        <Icon name="mail" className="size-3.5 text-indigo-400" />
                      </span>
                      <span className="text-zinc-400 shrink-0">Email :</span>
                      <a
                        href={`mailto:${msg.email}?subject=Suite à votre message direct sur Angy.dev`}
                        className="text-zinc-200 hover:text-white underline decoration-zinc-700 truncate"
                        title={`Envoyer un email à ${msg.email}`}
                      >
                        {msg.email}
                      </a>
                    </div>

                    {/* Téléphone */}
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-zinc-500 shrink-0">
                        <Icon name="phone" className="size-3.5 text-indigo-400" />
                      </span>
                      <span className="text-zinc-400 shrink-0">Téléphone :</span>
                      {msg.phone ? (
                        <div className="flex items-center gap-2 truncate">
                          <a
                            href={`tel:${msg.phone}`}
                            className="text-zinc-200 hover:text-white font-medium truncate"
                          >
                            {msg.phone}
                          </a>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] shrink-0"
                            title="Ouvrir WhatsApp avec ce numéro"
                          >
                            WhatsApp ↗
                          </a>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic">Non renseigné</span>
                      )}
                    </div>
                  </div>

                  {/* Contenu du message */}
                  <div className="rounded-lg bg-zinc-950/40 border border-zinc-800/40 p-4">
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                      Message :
                    </p>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {msg.message}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
