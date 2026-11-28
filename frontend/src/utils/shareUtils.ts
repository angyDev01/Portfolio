import { isSafeUrl } from './urlSecurity'

export const PWA_ICON_PATH = '/pwa-512x512.png'

const configuredSiteUrl =
  typeof import.meta !== 'undefined'
    ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL?.trim()
    : undefined

export const DEFAULT_PUBLIC_ORIGIN =
  configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)
    ? configuredSiteUrl.replace(/\/+$/, '')
    : 'https://portfolio-vs28.vercel.app'

export type ShareItemKind = 'project' | 'announcement' | 'poll' | 'profile'

export interface ShareItem {
  kind: ShareItemKind
  id?: string
  slug?: string
  title: string
  subtitle?: string
  description?: string
  badge?: string
  secondaryBadge?: string
  imageUrl?: string | null
  bannerUrl?: string | null
  avatarUrl?: string | null
  authorName?: string
  metaItems?: string[]
}

export function stripUrlHash(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  return (url.split('#')[0] || '').trim()
}

function getSafeCleanImage(url?: string | null): string {
  const clean = stripUrlHash(url)
  if (!clean || !isSafeUrl(clean)) return ''
  return clean
}

function isLocalHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase()
  return clean === 'localhost' || clean === '127.0.0.1' || clean === '[::1]' || clean === '::1' || clean === '0.0.0.0'
}

/**
 * Sélectionne l'image liée à l'élément partagé selon son type,
 * avec repli sur l'icône PWA officielle si aucune photo n'est associée.
 */
export function resolveShareImage(
  item: ShareItem,
  profileAvatar?: string | null,
  profileBanner?: string | null
): { url: string; isFallbackIcon: boolean } {
  if (item.kind === 'project' || item.kind === 'announcement') {
    const cover = getSafeCleanImage(item.imageUrl)
    if (cover) return { url: cover, isFallbackIcon: false }
    return { url: PWA_ICON_PATH, isFallbackIcon: true }
  }

  if (item.kind === 'profile') {
    const avatar = getSafeCleanImage(item.avatarUrl || profileAvatar)
    if (avatar) return { url: avatar, isFallbackIcon: false }
    const banner = getSafeCleanImage(item.bannerUrl || profileBanner)
    if (banner) return { url: banner, isFallbackIcon: false }
    return { url: PWA_ICON_PATH, isFallbackIcon: true }
  }

  // Sondage : photo de l'élément ou photo de profil, sinon icône PWA
  const pollVisual = getSafeCleanImage(item.imageUrl || item.avatarUrl || profileAvatar)
  if (pollVisual) return { url: pollVisual, isFallbackIcon: false }
  return { url: PWA_ICON_PATH, isFallbackIcon: true }
}

export function buildShareUrl(item: ShareItem, origin?: string): string {
  let rawBase = origin?.trim()
  if (!rawBase) {
    if (typeof window !== 'undefined' && window.location?.origin && !isLocalHostname(window.location.hostname)) {
      rawBase = window.location.origin
    } else {
      rawBase = DEFAULT_PUBLIC_ORIGIN
    }
  }
  const base = rawBase.replace(/\/+$/, '')

  if (item.kind === 'project') {
    const ref = (item.slug || item.id || '').trim()
    return ref ? `${base}/s/projet/${encodeURIComponent(ref)}` : `${base}/projets`
  }

  if (item.kind === 'announcement') {
    const ref = (item.id || '').trim()
    return ref ? `${base}/s/actualite/${encodeURIComponent(ref)}` : `${base}/actualites`
  }

  if (item.kind === 'poll') {
    const ref = (item.id || '').trim()
    return ref ? `${base}/s/sondage/${encodeURIComponent(ref)}` : `${base}/actualites`
  }

  return `${base}/s/profil`
}

export function truncateShareExcerpt(text?: string, maxLen = 140): string {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen - 1).trimEnd()}…`
}

export function buildWhatsAppText(item: ShareItem, shareUrl: string): string {
  const headerBadge = [item.badge, item.secondaryBadge].filter(Boolean).join(' · ')
  const heading = headerBadge ? `*${item.title}* (${headerBadge})` : `*${item.title}*`
  const excerpt = truncateShareExcerpt(item.description || item.subtitle, 140)

  const lines: string[] = [heading]
  if (excerpt && excerpt !== item.title) lines.push(excerpt)
  lines.push(shareUrl)

  return lines.join('\n\n')
}

export function buildWhatsAppChatUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
}

export function buildShareFilename(item: ShareItem, format: 'status' | 'card'): string {
  const slugBase = (item.slug || item.title || item.kind)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  const suffix = format === 'status' ? 'whatsapp-statut' : 'carte'
  return `${slugBase || 'partage'}-${suffix}.png`
}
