import { useEffect, useRef, createElement, type ReactElement, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'video[controls]',
  'audio[controls]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

function isElementVisible(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
    return false
  }
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false
  }
  return el.getClientRects().length > 0
}

/**
 * Retourne les éléments focusables visibles à l'intérieur d'un conteneur.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  return candidates.filter((el) => !el.hasAttribute('data-focus-guard') && isElementVisible(el))
}

export interface UseFocusTrapOptions {
  initialFocusRef?: RefObject<HTMLElement | null>
  restoreFocusRef?: RefObject<HTMLElement | null>
  lockScroll?: boolean
}

export interface UseFocusTrapResult {
  focusFirst: () => void
  focusLast: () => void
}

/**
 * Gère le cycle de focus d'une boîte de dialogue (focus initial, fermeture sur Escape,
 * verrouillage optionnel du scroll et restauration du focus à la fermeture).
 * Utiliser avec <FocusGuard /> en début et fin de modale pour ne pas interférer avec
 * la navigation interne des Shadow DOM (ex: contrôles de <video controls>).
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
  options: UseFocusTrapOptions = {}
): UseFocusTrapResult {
  const { initialFocusRef, restoreFocusRef, lockScroll = true } = options
  const onCloseRef = useRef(onClose)
  const restoreRefObj = useRef(restoreFocusRef)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    restoreRefObj.current = restoreFocusRef
  }, [restoreFocusRef])

  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow

    if (lockScroll) {
      document.body.style.overflow = 'hidden'
    }

    const rafId = window.requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container
      target.focus({ preventScroll: true })
    })

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', handleKeyDown)
      if (lockScroll) {
        document.body.style.overflow = prevOverflow
      }
      const restoreTarget = restoreRefObj.current?.current ?? previouslyFocused
      if (restoreTarget && restoreTarget.isConnected && typeof restoreTarget.focus === 'function') {
        restoreTarget.focus({ preventScroll: true })
      }
    }
  }, [isOpen, containerRef, initialFocusRef, lockScroll])

  const focusFirst = (): void => {
    const container = containerRef.current
    if (!container) return
    const items = getFocusableElements(container)
    const target = items[0] ?? container
    target.focus({ preventScroll: true })
  }

  const focusLast = (): void => {
    const container = containerRef.current
    if (!container) return
    const items = getFocusableElements(container)
    const target = items[items.length - 1] ?? container
    target.focus({ preventScroll: true })
  }

  return { focusFirst, focusLast }
}

/**
 * Sentinelle de focus placée avant/après les éléments interactifs d'une modale.
 */
export function FocusGuard({ onFocus }: { onFocus: () => void }): ReactElement {
  return createElement('span', {
    tabIndex: 0,
    'aria-hidden': 'true',
    'data-focus-guard': 'true',
    className: 'sr-only',
    onFocus,
  })
}

