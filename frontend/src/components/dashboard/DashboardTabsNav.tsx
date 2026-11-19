import type { ReactElement } from 'react'
import Icon from '../Icon'

export type AdminTab = 'analytics' | 'projects' | 'skills' | 'profile'

interface DashboardTabsNavProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  projectsCount: number
  skillsCount: number
  unreadMessagesCount: number
  onOpenMessages: () => void
}

export default function DashboardTabsNav({
  activeTab,
  setActiveTab,
  projectsCount,
  skillsCount,
  unreadMessagesCount,
  onOpenMessages,
}: DashboardTabsNavProps): ReactElement {
  return (
    <nav
      aria-label="Onglets d'administration"
      className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 mb-8"
    >
      {/* 1. Vue d'ensemble */}
      <button
        type="button"
        onClick={() => setActiveTab('analytics')}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
          activeTab === 'analytics'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <Icon name="analytics" className="size-3.5 text-indigo-500" />
        <span>Vue d'ensemble</span>
      </button>

      {/* 2. Projets */}
      <button
        type="button"
        onClick={() => setActiveTab('projects')}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
          activeTab === 'projects'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <Icon name="projects" className="size-3.5 text-indigo-500" />
        <span>Projets ({projectsCount})</span>
      </button>

      {/* 3. Compétences */}
      <button
        type="button"
        onClick={() => setActiveTab('skills')}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
          activeTab === 'skills'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <Icon name="skills" className="size-3.5 text-indigo-500" />
        <span>Compétences ({skillsCount})</span>
      </button>

      {/* 4. Profil & Statut */}
      <button
        type="button"
        onClick={() => setActiveTab('profile')}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <Icon name="user" className="size-3.5 text-indigo-500" />
        <span>Profil & Statut</span>
      </button>

      {/* 5. Messagerie Directe (Slide-over drawer) */}
      <button
        type="button"
        onClick={onOpenMessages}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all cursor-pointer ml-auto"
      >
        <div className="relative flex items-center">
          <Icon name="messageSquare" className="size-3.5 text-indigo-500" />
          {unreadMessagesCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono animate-pulse">
              {unreadMessagesCount}
            </span>
          )}
        </div>
        <span>Messages Directs</span>
      </button>
    </nav>
  )
}
