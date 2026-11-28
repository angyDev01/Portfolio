import { describe, it, expect } from 'vitest'
import {
  getBannerPosition,
  stripBannerPosition,
  withBannerPosition,
} from './bannerPosition'

describe('bannerPosition', () => {
  it('extrait le cadrage depuis le fragment URL et retombe sur center par défaut', () => {
    expect(getBannerPosition(null)).toBe('center')
    expect(getBannerPosition(undefined)).toBe('center')
    expect(getBannerPosition('')).toBe('center')
    expect(getBannerPosition('https://cdn.example.com/banner.webp')).toBe('center')
    expect(getBannerPosition('https://cdn.example.com/banner.webp#pos=top')).toBe('top')
    expect(getBannerPosition('https://cdn.example.com/banner.webp#pos=center')).toBe('center')
    expect(getBannerPosition('https://cdn.example.com/banner.webp#pos=bottom')).toBe('bottom')
    expect(getBannerPosition('https://cdn.example.com/banner.webp?t=123#pos=top')).toBe('top')
    expect(getBannerPosition('https://cdn.example.com/banner.webp#pos=left')).toBe('center')
  })

  it('supprime le fragment de cadrage tout en préservant les query params', () => {
    expect(stripBannerPosition(null)).toBe('')
    expect(stripBannerPosition('https://cdn.example.com/banner.webp?t=123#pos=bottom')).toBe(
      'https://cdn.example.com/banner.webp?t=123'
    )
    expect(stripBannerPosition('  https://cdn.example.com/banner.webp#pos=top  ')).toBe(
      'https://cdn.example.com/banner.webp'
    )
  })

  it('met à jour ou nettoie le fragment de cadrage selon la position choisie', () => {
    expect(withBannerPosition('', 'top')).toBe('')
    expect(withBannerPosition('https://cdn.example.com/banner.webp?t=123', 'top')).toBe(
      'https://cdn.example.com/banner.webp?t=123#pos=top'
    )
    expect(withBannerPosition('https://cdn.example.com/banner.webp?t=123#pos=top', 'bottom')).toBe(
      'https://cdn.example.com/banner.webp?t=123#pos=bottom'
    )
    expect(withBannerPosition('https://cdn.example.com/banner.webp?t=123#pos=bottom', 'center')).toBe(
      'https://cdn.example.com/banner.webp?t=123'
    )
  })
})
