import type { ReactElement } from 'react'
import Icon from '../Icon'
import AvatarImage from '../AvatarImage'
import { useTheme } from '../../context/ThemeContext'
import type { DbProfile } from '../../types/database'

interface DashboardHeaderProps {
  profile: DbProfile | null
  loading: boolean
  unreadMessagesCount: number
  onRefresh: () => void
  onOpenMessages: () => void
  onSignOut: () => void
}

export default function DashboardHeader({
  profile,
  loading,
  unreadMessagesCount,
  onRefresh,
  onOpenMessages,
  onSignOut,
}: DashboardHeaderProps): ReactElement {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800/80 mb-6">
      {/* Profil & Statut à gauche */}
      <div className="flex items-center gap-3">
        <AvatarImage
          src={profile?.avatar_url}
          alt={profile?.name || 'Admin'}
          className="size-10 border-2 border-indigo-500 shadow-xs"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`size-2 rounded-full ${
                profile?.availability_status === 'employed'
                  ? 'bg-indigo-500 animate-pulse'
                  : profile?.availability_status === 'unavailable'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
              aria-hidden="true"
            />
            <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
              {profile?.status_label || 'Connecté'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hidden sm:inline">
              Admin Studio
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Tableau de Bord
          </h1>
        </div>
      </div>

      {/* Outils & Actions à droite */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Actualiser */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="size-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-50"
          title="Rafraîchir les données"
          aria-label="Actualiser"
        >
          <Icon name="refresh" className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Mode Sombre / Clair */}
        <button
          type="button"
          onClick={toggleTheme}
          className="size-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title={theme === 'dark' ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
          aria-label="Basculer le thème"
        >
          <Icon
            name={theme === 'dark' ? 'sun' : 'moon'}
            className="size-4.5 transition-transform duration-300 hover:rotate-45"
          />
        </button>

        {/* Messagerie */}
        <button
          type="button"
          onClick={onOpenMessages}
          className="relative size-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Ouvrir le panneau de messagerie"
          aria-label="Notifications messagerie"
        >
          <Icon name="bell" className="size-4.5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs animate-pulse">
              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Déconnexion */}
        <button
          type="button"
          onClick={onSignOut}
          className="size-9 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Déconnexion sécurisée"
          aria-label="Se déconnecter"
        >
          <Icon name="logout" className="size-4" />
        </button>
      </div>
    </header>
  )
}
