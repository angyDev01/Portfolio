import type { ReactElement } from 'react'
import Icon from '../Icon'
import type { AdminTab } from './DashboardTabsNav'

interface DashboardMobileNavProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  unreadMessagesCount: number
  onOpenMessages: () => void
}

export default function DashboardMobileNav({
  activeTab,
  setActiveTab,
  unreadMessagesCount,
  onOpenMessages,
}: DashboardMobileNavProps): ReactElement {
  return (
    <nav
      aria-label="Navigation mobile d'administration"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center py-2 px-2 shadow-lg transition-colors"
    >
      {/* 1. Dashboard / Stats */}
      <button
        type="button"
        onClick={() => setActiveTab('analytics')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
          activeTab === 'analytics'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        <Icon name="analytics" className="size-4.5" />
        <span>Dashboard</span>
      </button>

      {/* 2. Projets */}
      <button
        type="button"
        onClick={() => setActiveTab('projects')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
          activeTab === 'projects'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        <Icon name="projects" className="size-4.5" />
        <span>Projets</span>
      </button>

      {/* 3. Compétences */}
      <button
        type="button"
        onClick={() => setActiveTab('skills')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
          activeTab === 'skills'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        <Icon name="skills" className="size-4.5" />
        <span>Skills</span>
      </button>

      {/* 4. Messages (Drawer) */}
      <button
        type="button"
        onClick={onOpenMessages}
        className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
      >
        <div className="relative">
          <Icon name="messageSquare" className="size-4.5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </div>
        <span>Messages</span>
      </button>

      {/* 5. Profil */}
      <button
        type="button"
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
          activeTab === 'profile'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        <Icon name="user" className="size-4.5" />
        <span>Profil</span>
      </button>
    </nav>
  )
}
