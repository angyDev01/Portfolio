import type { ReactElement } from 'react'
import type { ProjectStatusType } from '../types/database'

interface ProjectCoverBadgesProps {
  isFeatured?: boolean
  status?: ProjectStatusType
  overlay?: boolean
}

export default function ProjectCoverBadges({
  isFeatured = false,
  status,
  overlay = true,
}: ProjectCoverBadgesProps): ReactElement | null {
  const isInProgress = status === 'in_progress'
  if (!isFeatured && !isInProgress) return null

  const wrapperClass = overlay
    ? 'pointer-events-none absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex flex-wrap items-center gap-1.5'
    : 'flex flex-wrap items-center gap-1.5 mb-2'

  return (
    <div className={wrapperClass}>
      {isFeatured && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo text-indigo-fg text-xs font-semibold shadow-sm">
          <span>À la une</span>
        </span>
      )}
      {isInProgress && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-mango text-mango-fg text-xs font-semibold shadow-sm">
          <span className="size-1.5 rounded-full bg-mango-fg shrink-0" aria-hidden="true" />
          <span>En cours</span>
        </span>
      )}
    </div>
  )
}
