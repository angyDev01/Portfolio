import type { ReactElement } from 'react'
import Icon from './Icon'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: 'folder' | 'code' | 'sparkles'
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({
  title = 'Aucune donnée disponible',
  description = 'Les informations sont en cours de mise à jour sur la base de données.',
  actionLabel,
  actionHref,
}: EmptyStateProps): ReactElement {
  return (
    <div className="glass-card p-10 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center">
      <div className="size-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
        <Icon name="sparkles" className="size-5 text-indigo-500 dark:text-indigo-400/60" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-200 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-mono dark:text-zinc-200 transition-colors"
        >
          <span>{actionLabel}</span>
          <Icon name="arrowRight" className="size-3" />
        </a>
      )}
    </div>
  )
}

