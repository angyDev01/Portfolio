import { useEffect, useState, type ReactElement } from 'react'
import Icon from './Icon'

export default function BackToTop(): ReactElement | null {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = (): void => {
      setIsVisible(window.scrollY > 350)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      className="btn-tactile fixed right-5 sm:right-6 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex size-11 items-center justify-center rounded-md bg-surface border border-line text-muted hover:text-indigo hover:border-indigo transition-colors cursor-pointer"
    >
      <Icon name="arrowUp" className="size-4" />
    </button>
  )
}
