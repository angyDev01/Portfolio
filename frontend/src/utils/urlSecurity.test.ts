import { describe, it, expect } from 'vitest'
import {
  sanitizeUrl,
  isSafeUrl,
  sanitizePlainText,
  sanitizeUserText,
  containsLink,
  hasUnallowedLink,
} from './urlSecurity'

describe('urlSecurity', () => {
  it('autorise uniquement les schémas et chemins sûrs', () => {
    expect(isSafeUrl('https://angydev.me/projets')).toBe(true)
    expect(isSafeUrl('/contact')).toBe(true)
    expect(isSafeUrl('#about')).toBe(true)
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeUrl('//evil.example')).toBe(false)
    expect(sanitizeUrl('javascript:alert(1)', '/')).toBe('/')
  })

  it('assainit le texte brut et le texte utilisateur multiligne', () => {
    expect(sanitizePlainText('<b>Salut</b>\u0000!')).toBe('Salut!')
    expect(sanitizeUserText('Bonjour\u0007   à  tous\n\n\n\nSuper', { multiline: true })).toBe(
      'Bonjour à tous\n\nSuper'
    )
    expect(containsLink('Voir https://example.com')).toBe(true)
    expect(hasUnallowedLink('Texte sans lien')).toBe(false)
  })
})

