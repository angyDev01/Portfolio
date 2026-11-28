import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  id: string
  title: string
  context?: string
  link?: {
    to: string
    label: string
    onMouseEnter?: () => void
  }
}

export default function SectionHeader({
  id,
  title,
  context,
  link,
}: SectionHeaderProps): ReactElement {
  return (
    <div className="rail-title flex flex-col items-start gap-3">
      <h2
        id={id}
        className="text-[28px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink"
      >
        {title}
      </h2>

      {context && (
        <p className="text-sm leading-relaxed text-muted max-w-[26ch]">
          {context}
        </p>
      )}

      {link && (
        <Link
          to={link.to}
          onMouseEnter={link.onMouseEnter}
          className="min-h-[44px] sm:min-h-0 -mt-2 -mb-3 sm:mt-1 sm:mb-0 inline-flex items-center gap-1.5 text-sm font-medium text-indigo hover:underline underline-offset-4 decoration-2 transition-colors"
        >
          <span>{link.label}</span>
        </Link>
      )}
    </div>
  )
}
