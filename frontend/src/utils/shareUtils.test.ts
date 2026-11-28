import { describe, it, expect, afterEach } from 'vitest'
import {
  DEFAULT_PUBLIC_ORIGIN,
  PWA_ICON_PATH,
  resolveShareImage,
  buildShareUrl,
  buildWhatsAppText,
  buildWhatsAppChatUrl,
  buildShareFilename,
  stripUrlHash,
  type ShareItem,
} from './shareUtils'

describe('shareUtils', () => {
  const originalWindow = globalThis.window

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: Window }).window
    } else {
      ;(globalThis as { window?: Window }).window = originalWindow
    }
  })

  it('sélectionne la photo liée à chaque élément ou retombe sur l’icône PWA', () => {
    const projectWithCover: ShareItem = {
      kind: 'project',
      slug: 'omnipulse',
      title: 'OmniPulse',
      imageUrl: 'https://cdn.example.com/project.png#pos=top',
    }
    expect(resolveShareImage(projectWithCover, 'https://cdn.example.com/avatar.png')).toEqual({
      url: 'https://cdn.example.com/project.png',
      isFallbackIcon: false,
    })

    const projectWithoutCover: ShareItem = {
      kind: 'project',
      slug: 'api-core',
      title: 'API Core',
      imageUrl: null,
    }
    expect(resolveShareImage(projectWithoutCover, 'https://cdn.example.com/avatar.png')).toEqual({
      url: PWA_ICON_PATH,
      isFallbackIcon: true,
    })

    const announcementWithoutCover: ShareItem = {
      kind: 'announcement',
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Nouvelle annonce',
    }
    expect(
      resolveShareImage(announcementWithoutCover, 'https://cdn.example.com/avatar.png')
    ).toEqual({
      url: PWA_ICON_PATH,
      isFallbackIcon: true,
    })

    const announcementUnsafeUrl: ShareItem = {
      kind: 'announcement',
      id: '11111111-1111-1111-1111-111111111111',
      title: 'XSS test',
      imageUrl: 'javascript:alert(1)',
    }
    expect(resolveShareImage(announcementUnsafeUrl)).toEqual({
      url: PWA_ICON_PATH,
      isFallbackIcon: true,
    })

    const profileWithAvatar: ShareItem = {
      kind: 'profile',
      title: 'Yao Jean Angoa',
      avatarUrl: 'https://cdn.example.com/avatar.webp',
      bannerUrl: 'https://cdn.example.com/banner.webp#pos=bottom',
    }
    expect(resolveShareImage(profileWithAvatar)).toEqual({
      url: 'https://cdn.example.com/avatar.webp',
      isFallbackIcon: false,
    })

    const profileBannerOnly: ShareItem = {
      kind: 'profile',
      title: 'Yao Jean Angoa',
      bannerUrl: 'https://cdn.example.com/banner.webp#pos=top',
    }
    expect(resolveShareImage(profileBannerOnly)).toEqual({
      url: 'https://cdn.example.com/banner.webp',
      isFallbackIcon: false,
    })

    const pollWithProfileAvatar: ShareItem = {
      kind: 'poll',
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Quel framework ?',
    }
    expect(
      resolveShareImage(pollWithProfileAvatar, 'https://cdn.example.com/avatar.webp')
    ).toEqual({
      url: 'https://cdn.example.com/avatar.webp',
      isFallbackIcon: false,
    })
    expect(resolveShareImage(pollWithProfileAvatar, null)).toEqual({
      url: PWA_ICON_PATH,
      isFallbackIcon: true,
    })
  })

  it('construit les URLs publiques même depuis localhost et formate le message WhatsApp', () => {
    expect(stripUrlHash('https://example.com/a.jpg?t=1#pos=top')).toBe(
      'https://example.com/a.jpg?t=1'
    )

    ;(globalThis as unknown as { window?: { location: { hostname: string; origin: string } } }).window = {
      location: { hostname: '127.0.0.1', origin: 'http://127.0.0.1:5173' },
    }
    expect(buildShareUrl({ kind: 'project', slug: 'mon-projet', title: 'Mon Projet' })).toBe(
      `${DEFAULT_PUBLIC_ORIGIN}/s/projet/mon-projet`
    )
    ;(globalThis as unknown as { window?: { location: { hostname: string; origin: string } } }).window = {
      location: { hostname: 'preview.portfolio-vs28.vercel.app', origin: 'https://preview.portfolio-vs28.vercel.app' },
    }
    expect(buildShareUrl({ kind: 'profile', title: 'Profil' })).toBe(
      'https://preview.portfolio-vs28.vercel.app/s/profil'
    )

    expect(
      buildShareUrl({ kind: 'project', slug: 'mon-projet', title: 'Mon Projet' }, 'https://portfolio-vs28.vercel.app/')
    ).toBe('https://portfolio-vs28.vercel.app/s/projet/mon-projet')

    expect(
      buildShareUrl(
        { kind: 'announcement', id: 'abc-123', title: 'Annonce' },
        'https://portfolio-vs28.vercel.app'
      )
    ).toBe('https://portfolio-vs28.vercel.app/s/actualite/abc-123')

    expect(
      buildShareUrl({ kind: 'poll', id: 'poll-1', title: 'Sondage' }, 'https://portfolio-vs28.vercel.app')
    ).toBe('https://portfolio-vs28.vercel.app/s/sondage/poll-1')

    expect(buildShareUrl({ kind: 'profile', title: 'Profil' }, 'https://portfolio-vs28.vercel.app')).toBe(
      'https://portfolio-vs28.vercel.app/s/profil'
    )

    const text = buildWhatsAppText(
      {
        kind: 'project',
        title: 'OmniPulse',
        badge: 'À la une',
        secondaryBadge: 'En cours',
        description: 'Une description concise du projet.',
      },
      'https://portfolio-vs28.vercel.app/s/projet/omnipulse'
    )
    expect(text).toContain('*OmniPulse* (À la une · En cours)')
    expect(text.endsWith('https://portfolio-vs28.vercel.app/s/projet/omnipulse')).toBe(true)

    expect(buildWhatsAppChatUrl('Salut test')).toBe(
      'https://api.whatsapp.com/send?text=Salut%20test'
    )

    expect(
      buildShareFilename({ kind: 'project', slug: 'Réseau Éclair', title: 'Réseau Éclair' }, 'status')
    ).toBe('reseau-eclair-whatsapp-statut.png')
    expect(
      buildShareFilename({ kind: 'profile', title: 'Yao Jean Angoa' }, 'card')
    ).toBe('yao-jean-angoa-carte.png')
  })
})
