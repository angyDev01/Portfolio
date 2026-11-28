import { lazy, Suspense, useState, type MouseEvent, type ReactElement } from 'react'
import Icon from './Icon'
import { useAdminSession } from '../hooks/useAdminSession'
import type { ShareItem } from '../utils/shareUtils'

const ShareModal = lazy(() => import('./ShareModal'))

interface ShareButtonProps {
  item: ShareItem
  label?: string
  compact?: boolean
  adminOnly?: boolean
  className?: string
  onOpenChange?: (open: boolean) => void
}

export default function ShareButton({
  item,
  label = 'Partager',
  compact = false,
  adminOnly = true,
  className = '',
  onOpenChange,
}: ShareButtonProps): ReactElement | null {
  const { isAdmin } = useAdminSession()
  const [open, setOpen] = useState(false)

  if (adminOnly && !isAdmin) {
    return null
  }

  const setModalOpen = (next: boolean): void => {
    setOpen(next)
    onOpenChange?.(next)
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    setModalOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Partager ${item.title} sur WhatsApp`}
        className={
          className ||
          `btn-tactile inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 -my-2 sm:my-0 px-1.5 sm:px-0 sm:py-1.5 text-muted hover:text-indigo transition-colors cursor-pointer ${compact ? 'text-xs' : 'text-sm'
          } font-medium`
        }
      >
        <Icon name="share" className={compact ? 'size-3.5' : 'size-4'} />
        <span>{label}</span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <ShareModal
            item={item}
            isOpen={open}
            onClose={() => setModalOpen(false)}
          />
        </Suspense>
      )}
    </>
  )
}

