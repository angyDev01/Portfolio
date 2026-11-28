import { describe, expect, it } from 'vitest'
import { formatCommentDate, getAuthorInitials, getAvatarToneIndex } from './commentDisplay'

describe('commentDisplay', () => {
  describe('getAuthorInitials', () => {
    it('extrait une ou deux initiales en majuscules', () => {
      expect(getAuthorInitials('Alice')).toBe('A')
      expect(getAuthorInitials('Jean Dupont')).toBe('JD')
      expect(getAuthorInitials('  marie   claire   konan  ')).toBe('MK')
      expect(getAuthorInitials('Élodie Martin')).toBe('ÉM')
    })

    it('retourne "?" lorsque le nom est vide ou absent', () => {
      expect(getAuthorInitials('')).toBe('?')
      expect(getAuthorInitials('   ')).toBe('?')
      expect(getAuthorInitials(null)).toBe('?')
      expect(getAuthorInitials(undefined)).toBe('?')
    })
  })

  describe('getAvatarToneIndex', () => {
    it('reste déterministe et dans les bornes de la palette', () => {
      const idx1 = getAvatarToneIndex('Jean Dupont', 5)
      const idx2 = getAvatarToneIndex('  jean dupont ', 5)
      expect(idx1).toBe(idx2)
      expect(idx1).toBeGreaterThanOrEqual(0)
      expect(idx1).toBeLessThan(5)
    })

    it('gère les entrées vides ou palettes nulles', () => {
      expect(getAvatarToneIndex('', 5)).toBe(0)
      expect(getAvatarToneIndex('Alice', 0)).toBe(0)
      expect(getAvatarToneIndex('Alice', -2)).toBe(0)
    })
  })

  describe('formatCommentDate', () => {
    const now = Date.UTC(2026, 10, 28, 12, 0, 0)

    it('retourne une chaîne vide pour une date absente ou invalide', () => {
      expect(formatCommentDate(null, now)).toBe('')
      expect(formatCommentDate(undefined, now)).toBe('')
      expect(formatCommentDate('not-a-date', now)).toBe('')
    })

    it('formate les durées récentes en temps relatif', () => {
      expect(formatCommentDate(new Date(now - 20_000).toISOString(), now)).toBe('À l’instant')
      expect(formatCommentDate(new Date(now - 5 * 60_000).toISOString(), now)).toBe('Il y a 5 min')
      expect(formatCommentDate(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe('Il y a 3 h')
      expect(formatCommentDate(new Date(now - 4 * 86_400_000).toISOString(), now)).toBe('Il y a 4 j')
    })

    it('formate les dates plus anciennes avec Intl fr-FR', () => {
      const olderSameYear = new Date(Date.UTC(2026, 9, 10, 9, 30, 0)).toISOString()
      const formatted = formatCommentDate(olderSameYear, now)
      expect(formatted).toContain('10')
      expect(formatted.length).toBeGreaterThan(5)

      const previousYear = new Date(Date.UTC(2025, 4, 2, 14, 15, 0)).toISOString()
      expect(formatCommentDate(previousYear, now)).toContain('2025')
    })
  })
})
