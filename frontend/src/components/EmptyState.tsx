import type { ReactElement } from 'react'
import { sanitizeUrl, isSafeUrl } from '../utils/urlSecurity'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: 'folder' | 'code' | 'sparkles'
  headingLevel?: 'h2' | 'h3'
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({
  title = 'Bientôt disponible',
  description = 'De nouvelles réalisations sont en cours de préparation.',
  headingLevel = 'h2',
  actionLabel,
  actionHref,
}: EmptyStateProps): ReactElement {
  const HeadingTag = headingLevel

  return (
    <div className="border-t border-b border-line py-10 flex flex-col items-start gap-2">
      <HeadingTag className="text-base font-semibold text-ink">{title}</HeadingTag>
      <p className="text-sm text-muted leading-relaxed max-w-[55ch]">{description}</p>
      {actionLabel && actionHref && isSafeUrl(actionHref) && (
        <a
          href={sanitizeUrl(actionHref)}
          target={actionHref.startsWith('http') ? '_blank' : undefined}
          rel={actionHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="mt-2 min-h-[44px] sm:min-h-0 -my-2 sm:my-0 inline-flex items-center text-sm font-medium text-indigo hover:underline underline-offset-4"
        >
          {actionLabel}
        </a>
      )}
    </div>
  )
}
