import { describe, it, expect, afterEach, vi } from 'vitest'
import { getFocusableElements } from './useFocusTrap'

describe('getFocusableElements', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('filtre les sentinelles data-focus-guard et les éléments masqués', () => {
    const visibleBtn = {
      hasAttribute: (attr: string) => attr === 'disabled' ? false : false,
      getAttribute: () => null,
      getClientRects: () => [{ width: 44, height: 44 }],
    }
    const guardSpan = {
      hasAttribute: (attr: string) => attr === 'data-focus-guard',
      getAttribute: () => 'true',
      getClientRects: () => [{ width: 1, height: 1 }],
    }
    const hiddenBtn = {
      hasAttribute: () => false,
      getAttribute: () => null,
      getClientRects: () => [],
    }

    vi.stubGlobal('window', {
      getComputedStyle: () => ({ display: 'inline-flex', visibility: 'visible' }),
    })

    const container = {
      querySelectorAll: () => [guardSpan, visibleBtn, hiddenBtn],
    } as unknown as HTMLElement

    const result = getFocusableElements(container)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(visibleBtn)
  })
})

