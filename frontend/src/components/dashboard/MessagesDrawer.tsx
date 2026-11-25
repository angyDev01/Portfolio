import { useState, useMemo, useEffect, type ReactElement } from 'react'
import Icon from '../Icon'
import { sanitizeUrl } from '../../utils/security'
import type { ContactMessage, DbProfile } from '../../types/database'

interface MessagesDrawerProps {
  isOpen: boolean
  onClose: () => void
  profile: DbProfile | null
  messages: ContactMessage[]
  unreadMessagesCount: number
  onToggleAcceptMessages: () => Promise<boolean>
  onToggleRead: (msg: ContactMessage) => Promise<void>
  onDeleteMessage: (msg: ContactMessage) => Promise<boolean>
}

export default function MessagesDrawer({
  isOpen,
  onClose,
  profile,
  messages,
  unreadMessagesCount,
  onToggleAcceptMessages,
  onToggleRead,
  onDeleteMessage,
}: MessagesDrawerProps): ReactElement {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState<string>('')

  // Fermeture du slide-over au clavier (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filter === 'unread' && m.is_read) return false
      if (filter === 'read' && !m.is_read) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      )
    })
  }, [messages, filter, search])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Messagerie Directe"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Icon name="bell" className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Messages Directs
                </h2>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                    {unreadMessagesCount} non lu{unreadMessagesCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Canal 2 (site)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm cursor-pointer transition-colors"
            aria-label="Fermer le panneau"
          >
            ✕
          </button>
        </div>

        {/* Drawer Controls : Réception switch + Filtres + Recherche */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 space-y-3">
          {/* Switch Réception */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
              Réception des messages :
            </span>
            <button
              type="button"
              onClick={onToggleAcceptMessages}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                profile?.accept_direct_messages !== false
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  profile?.accept_direct_messages !== false ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span>{profile?.accept_direct_messages !== false ? 'Actif' : 'Suspendu'}</span>
            </button>
          </div>

          {/* Filtres & Recherche */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="inline-flex rounded-lg bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  filter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Tous ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Non lus ({unreadMessagesCount})
              </button>
            </div>

            <div className="relative flex-1 max-w-[170px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none font-sans"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des Messages (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-2.5">
                <Icon name="messageSquare" className="size-5" />
              </div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {search
                  ? 'Aucun résultat pour cette recherche'
                  : filter === 'unread'
                  ? 'Aucun message non lu. Tout est à jour !'
                  : 'Aucun message reçu pour le moment.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(msg.created_at))

              const cleanPhone = (msg.phone || '').replace(/[^0-9+]/g, '')
              const whatsappUrl = cleanPhone.startsWith('+')
                ? `https://wa.me/${cleanPhone.replace('+', '')}`
                : `https://wa.me/225${cleanPhone.replace(/^0/, '')}`

              return (
                <article
                  key={msg.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    !msg.is_read
                      ? 'border-indigo-500/40 bg-indigo-500/5 dark:bg-zinc-800/80 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40'
                  }`}
                >
                  {/* Top Row : Nom, Badge lu/non-lu, Date */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {msg.name}
                        </h4>
                        {!msg.is_read && (
                          <span className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        {formattedDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleRead(msg)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs transition-colors cursor-pointer"
                        title={msg.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      >
                        <Icon name={msg.is_read ? 'eyeOff' : 'check'} className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(msg)}
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs transition-colors cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Icon name="trash" className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Coordonnées : Email et Téléphone */}
                  <div className="space-y-1 mb-2.5 text-xs font-mono">
                    <div className="text-zinc-600 dark:text-zinc-400 break-all flex items-center gap-1.5">
                      <Icon name="mail" className="size-3 text-indigo-500 shrink-0" />
                      <span>{msg.email}</span>
                    </div>
                    {msg.phone && (
                      <div className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Icon name="phone" className="size-3 text-emerald-500 shrink-0" />
                        <span>{msg.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Contenu du message */}
                  <div className="p-3 rounded-lg bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans mb-3">
                    {msg.message}
                  </div>

                  {/* 3 Boutons d'Action Rapide en 1 clic */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* WhatsApp */}
                    <a
                      href={msg.phone ? sanitizeUrl(whatsappUrl) : undefined}
                      target={msg.phone ? '_blank' : undefined}
                      rel={msg.phone ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (!msg.phone) e.preventDefault()
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-mono transition-all ${
                        msg.phone
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed border border-transparent'
                      }`}
                      title={msg.phone ? 'Ouvrir WhatsApp' : 'Téléphone non fourni'}
                    >
                      <Icon name="messageSquare" className="size-3" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Appeler */}
                    <a
                      href={msg.phone ? sanitizeUrl(`tel:${msg.phone}`) : undefined}
                      onClick={(e) => {
                        if (!msg.phone) e.preventDefault()
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-mono transition-all ${
                        msg.phone
                          ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed border border-transparent'
                      }`}
                      title={msg.phone ? 'Composer le numéro' : 'Téléphone non fourni'}
                    >
                      <Icon name="phone" className="size-3" />
                      <span>Appeler</span>
                    </a>

                    {/* Email */}
                    <a
                      href={sanitizeUrl(
                        `mailto:${encodeURIComponent(
                          msg.email
                        )}?subject=${encodeURIComponent(
                          'Suite à votre message sur le portfolio Angy.dev'
                        )}`
                      )}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-mono bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-all"
                    >
                      <Icon name="mail" className="size-3" />
                      <span>Email</span>
                    </a>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
