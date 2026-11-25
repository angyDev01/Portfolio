import { useEffect, useRef, type ReactElement } from 'react'
import { useLocation } from 'react-router-dom'

interface ScrollProgressBarProps {
  hidden?: boolean
}

export default function ScrollProgressBar({
  hidden = false,
}: ScrollProgressBarProps): ReactElement | null {
  const barRef = useRef<HTMLDivElement | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (hidden) return
    let rafId = 0

    const update = (): void => {
      rafId = 0
      const el = barRef.current
      if (!el) return
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const ratio = scrollable > 8 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      el.style.transform = `scaleX(${ratio})`
      el.style.opacity = ratio > 0 ? '1' : '0'
    }

    const schedule = (): void => {
      if (!rafId) rafId = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })

    const observer = new ResizeObserver(schedule)
    observer.observe(document.documentElement)

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [pathname, hidden])

  if (hidden) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] overflow-hidden"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-indigo will-change-transform opacity-0"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
