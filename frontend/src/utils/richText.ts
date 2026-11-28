import { isSafeUrl, sanitizeUrl } from './urlSecurity'

export type TextSegment =
  | { type: 'text'; text: string }
  | {
      type: 'link'
      label: string
      href: string
      isInternal: boolean
      isExternalHttp: boolean
    }

export type InsertMarkdownLinkResult =
  | { ok: true; nextValue: string; nextCursor: number }
  | { ok: false; error: string }

const LINK_TOKEN_RE =
  /\[([^\]]+)\]\(((?:\([^)\s]*\)|[^)\s])+)\)|((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi

const TRAILING_PUNCTUATION = new Set(['.', ',', ';', ':', '!', '?', "'", '"', '»', '”', '’'])

function countChar(text: string, target: string): number {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    if (text.charAt(i) === target) count++
  }
  return count
}

function splitTrailingPunctuation(rawUrl: string): { url: string; trailing: string } {
  let url = rawUrl
  let trailing = ''

  while (url.length > 0) {
    const last = url.charAt(url.length - 1)

    if (TRAILING_PUNCTUATION.has(last)) {
      trailing = last + trailing
      url = url.slice(0, -1)
      continue
    }

    if (last === ')' && countChar(url, ')') > countChar(url, '(')) {
      trailing = last + trailing
      url = url.slice(0, -1)
      continue
    }

    if (last === ']' && countChar(url, ']') > countChar(url, '[')) {
      trailing = last + trailing
      url = url.slice(0, -1)
      continue
    }

    break
  }

  return { url, trailing }
}

const DEFAULT_PORTFOLIO_ORIGIN = 'https://portfolio-vs28.vercel.app'

function extractOrigin(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!/^https?:\/\//i.test(trimmed)) return null
  try {
    return new URL(trimmed).origin.toLowerCase()
  } catch {
    return null
  }
}

function getKnownPortfolioOrigins(currentOrigin?: string): Set<string> {
  const origins = new Set<string>([DEFAULT_PORTFOLIO_ORIGIN.toLowerCase()])

  const envSiteUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL
      : undefined
  const envOrigin = extractOrigin(envSiteUrl)
  if (envOrigin) origins.add(envOrigin)

  const runtimeOrigin = extractOrigin(
    currentOrigin || (typeof window !== 'undefined' ? window.location?.origin : undefined)
  )
  if (runtimeOrigin) origins.add(runtimeOrigin)

  return origins
}

/**
 * Si une URL désigne une route interne du portfolio (chemin relatif `/...`
 * ou URL complète vers le domaine du portfolio), retourne le chemin relatif sûr
 * pour une navigation React Router sans quitter l'application.
 */
export function resolveInternalPortfolioPath(
  href?: string | null,
  currentOrigin?: string
): string | null {
  if (!href || typeof href !== 'string') return null
  const trimmed = href.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    const knownOrigins = getKnownPortfolioOrigins(currentOrigin)
    if (!knownOrigins.has(parsed.origin.toLowerCase())) {
      return null
    }
    const safePathname = (parsed.pathname || '/').replace(/^\/+/, '/')
    return `${safePathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

/**
 * Normalise une URL (ajout de https:// devant www.) et vérifie qu'elle utilise
 * un schéma autorisé ou une route interne sûre.
 */
export function normalizeRichLinkUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  if (/^www\./i.test(trimmed) && !/^www\.[^\s./]+\.[^\s/]+/i.test(trimmed)) {
    return null
  }

  const candidate = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed
  if (!isSafeUrl(candidate)) return null

  const sanitized = sanitizeUrl(candidate, '')
  return sanitized || null
}

function buildLinkSegment(label: string, href: string): TextSegment {
  const internalPath = resolveInternalPortfolioPath(href)
  if (internalPath) {
    return {
      type: 'link',
      label,
      href: internalPath,
      isInternal: true,
      isExternalHttp: false,
    }
  }

  return {
    type: 'link',
    label,
    href,
    isInternal: false,
    isExternalHttp: /^https?:\/\//i.test(href),
  }
}

/**
 * Découpe un texte en segments texte/lien sécurisés (liens nommés [Libellé](url)
 * et URLs brutes auto-détectées). Tout schéma non autorisé reste du texte brut.
 */
export function parseRichText(input?: string | null): TextSegment[] {
  if (!input || typeof input !== 'string') return []

  const segments: TextSegment[] = []
  const pushText = (text: string): void => {
    if (!text) return
    const prev = segments[segments.length - 1]
    if (prev && prev.type === 'text') {
      prev.text += text
    } else {
      segments.push({ type: 'text', text })
    }
  }

  LINK_TOKEN_RE.lastIndex = 0
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = LINK_TOKEN_RE.exec(input)) !== null) {
    const fullMatch = match[0]
    const matchIndex = match.index

    if (matchIndex > cursor) {
      pushText(input.slice(cursor, matchIndex))
    }

    const mdLabel = match[1]
    const mdTarget = match[2]
    const rawAutoUrl = match[3]

    if (mdLabel !== undefined && mdTarget !== undefined) {
      const normalized = normalizeRichLinkUrl(mdTarget)
      if (normalized && mdLabel.trim()) {
        segments.push(buildLinkSegment(mdLabel.trim(), normalized))
      } else {
        pushText(fullMatch)
      }
    } else if (rawAutoUrl !== undefined) {
      const prevChar = matchIndex > 0 ? input.charAt(matchIndex - 1) : ''
      if (prevChar && /[\p{L}\p{N}]/u.test(prevChar)) {
        pushText(fullMatch)
      } else {
        const { url, trailing } = splitTrailingPunctuation(rawAutoUrl)
        const normalized = normalizeRichLinkUrl(url)
        if (normalized) {
          segments.push(buildLinkSegment(url, normalized))
          if (trailing) pushText(trailing)
        } else {
          pushText(fullMatch)
        }
      }
    } else {
      pushText(fullMatch)
    }

    cursor = matchIndex + fullMatch.length
  }

  if (cursor < input.length) {
    pushText(input.slice(cursor))
  }

  return segments
}

/**
 * Remplace les liens nommés [Libellé](url) par leur libellé lisible pour les
 * aperçus compacts, cartes cliquables, partages WhatsApp et métadonnées OG.
 */
export function stripRichLinks(input?: string | null): string {
  if (!input || typeof input !== 'string') return ''
  return parseRichText(input)
    .map((segment) => (segment.type === 'link' ? segment.label : segment.text))
    .join('')
}

/**
 * Insère un lien formaté [Libellé](url) (ou l'URL directe si le libellé est vide)
 * à l'emplacement de la sélection courante dans un champ texte.
 */
export function insertMarkdownLink(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  label: string,
  rawUrl: string
): InsertMarkdownLinkResult {
  const href = normalizeRichLinkUrl(rawUrl)
  if (!href) {
    return {
      ok: false,
      error: 'URL invalide (utilisez https://, www., mailto:, tel: ou /page).',
    }
  }

  const safeStart = Math.max(0, Math.min(selectionStart, value.length))
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, value.length))
  const cleanLabel = label.trim().split('[').join('').split(']').join('')
  const insertion = cleanLabel ? `[${cleanLabel}](${href})` : href

  const nextValue = value.slice(0, safeStart) + insertion + value.slice(safeEnd)
  return {
    ok: true,
    nextValue,
    nextCursor: safeStart + insertion.length,
  }
}
