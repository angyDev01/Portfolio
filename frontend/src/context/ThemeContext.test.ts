import { describe, it, expect } from 'vitest'
import { resolveInitialTheme } from './ThemeContext'

describe('resolveInitialTheme', () => {
  it('respecte la préférence stockée lorsqu’elle est valide', () => {
    expect(resolveInitialTheme('light', true)).toBe('light')
    expect(resolveInitialTheme('dark', false)).toBe('dark')
  })

  it('suit la préférence système quand aucun choix manuel n’est enregistré', () => {
    expect(resolveInitialTheme(null, false)).toBe('light')
    expect(resolveInitialTheme(null, true)).toBe('dark')
    expect(resolveInitialTheme('invalid', false)).toBe('light')
    expect(resolveInitialTheme('invalid', true)).toBe('dark')
  })
})

