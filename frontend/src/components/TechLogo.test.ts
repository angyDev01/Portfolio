import { describe, it, expect } from 'vitest'
import { getTechDetails } from './TechLogo'

describe('getTechDetails', () => {
  it('résout les noms exacts et les variantes formatées', () => {
    expect(getTechDetails('React').label).toBe('React')
    expect(getTechDetails('Node.js').label).toBe('Node.js')
    expect(getTechDetails('Tailwind CSS').label).toBe('Tailwind CSS')
    expect(getTechDetails('PostgreSQL').color).toBe('#4169E1')
    expect(getTechDetails('TS').label).toBe('TypeScript')
  })

  it('retourne un fallback cohérent pour une technologie inconnue ou vide', () => {
    const unknown = getTechDetails('CustomFrameworkX')
    expect(unknown.label).toBe('CustomFrameworkX')
    expect(unknown.color).toBe('#6366F1')

    const empty = getTechDetails('')
    expect(empty.label).toBe('')
  })
})
