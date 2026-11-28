import { describe, it, expect, afterEach, vi } from 'vitest'
import { copyTextToClipboard } from './clipboard'

describe('copyTextToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retourne false pour une chaîne vide', async () => {
    expect(await copyTextToClipboard('')).toBe(false)
  })

  it('utilise navigator.clipboard.writeText quand disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const ok = await copyTextToClipboard('angynewdev@gmail.com')
    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith('angynewdev@gmail.com')
  })

  it('bascule sur execCommand et restaure le focus si navigator.clipboard échoue', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const restoreFocus = vi.fn()
    const previousEl = { isConnected: true, focus: restoreFocus }
    const fakeTextarea = {
      value: '',
      tabIndex: 0,
      style: {} as Record<string, string>,
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
    }

    vi.stubGlobal('document', {
      activeElement: previousEl,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => fakeTextarea),
      execCommand: vi.fn(() => true),
    })

    const ok = await copyTextToClipboard('angynewdev@gmail.com')
    expect(ok).toBe(true)
    expect(fakeTextarea.value).toBe('angynewdev@gmail.com')
    expect(restoreFocus).toHaveBeenCalledTimes(1)
  })
})

