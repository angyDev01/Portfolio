import type { ReactElement } from 'react'
import type { DbSkill } from '../types/database'
import TechLogo from './TechLogo'

interface TechCardProps {
  skill: DbSkill
  variant?: 'chip' | 'detail'
  compact?: boolean
  showDescription?: boolean
}

export default function TechCard({
  skill,
  variant,
  compact = false,
  showDescription = false,
}: TechCardProps): ReactElement {
  const mode = variant ?? (compact ? 'chip' : 'detail')

  if (mode === 'chip') {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line text-sm font-medium text-ink">
        <TechLogo name={skill.name} size={15} />
        <span>{skill.name}</span>
      </span>
    )
  }

  return (
    <div className="py-4 border-t border-line flex items-start gap-3.5">
      <div className="size-9 rounded-md border border-line bg-surface flex items-center justify-center shrink-0 mt-0.5">
        <TechLogo name={skill.name} size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-ink tracking-[-0.015em] truncate">
            {skill.name}
          </h3>
          {skill.is_featured && (
            <span className="text-xs font-medium text-indigo shrink-0">
              Principal
            </span>
          )}
        </div>
        {showDescription && skill.description ? (
          <p className="text-sm text-muted mt-1 leading-relaxed">
            {skill.description}
          </p>
        ) : (
          <span className="text-xs text-muted capitalize mt-0.5 block">
            {skill.category}
          </span>
        )}
      </div>
    </div>
  )
}
