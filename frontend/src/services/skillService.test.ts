import { describe, it, expect } from 'vitest'
import { normalizeSkillCategory, formatSkillError } from './skillService'

describe('skillService helpers', () => {
  it('normalise les catégories connues de façon insensible à la casse et aux espaces', () => {
    expect(normalizeSkillCategory('  Frontend ')).toBe('frontend')
    expect(normalizeSkillCategory('BACKEND')).toBe('backend')
    expect(normalizeSkillCategory('Database')).toBe('database')
    expect(normalizeSkillCategory('DevOps')).toBe('devops')
  })

  it('retombe sur "frontend" par défaut si vide et sur "other" si catégorie inconnue', () => {
    expect(normalizeSkillCategory('')).toBe('frontend')
    expect(normalizeSkillCategory(undefined)).toBe('frontend')
    expect(normalizeSkillCategory('quantum-ai')).toBe('other')
  })

  it('traduit les erreurs de contrainte SQL en message utilisateur compréhensible', () => {
    const friendly = formatSkillError(
      'new row for relation "skills" violates check constraint "skills_category_check"'
    )
    expect(friendly).toContain('Catégorie non reconnue')
    expect(formatSkillError('Network error')).toBe('Network error')
  })
})
