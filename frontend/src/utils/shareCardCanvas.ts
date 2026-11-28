import {
  PWA_ICON_PATH,
  resolveShareImage,
  stripUrlHash,
  type ShareItem,
} from './shareUtils'
import { isSafeUrl } from './urlSecurity'

export type ShareCardFormat = 'status' | 'card'
export type ShareCardTheme = 'dark' | 'light'

interface CardPalette {
  paper: string
  surface: string
  ink: string
  muted: string
  line: string
  indigo: string
  indigoFg: string
  mango: string
  mangoFg: string
}

const PALETTES: Record<ShareCardTheme, CardPalette> = {
  dark: {
    paper: '#0E1615',
    surface: '#16201F',
    ink: '#E3E9E6',
    muted: '#93A39F',
    line: '#24302E',
    indigo: '#8F9BFF',
    indigoFg: '#0E1615',
    mango: '#F2C445',
    mangoFg: '#16211F',
  },
  light: {
    paper: '#F4F6F3',
    surface: '#FFFFFF',
    ink: '#16211F',
    muted: '#5B6B67',
    line: '#D9E0DC',
    indigo: '#2E3A9A',
    indigoFg: '#FFFFFF',
    mango: '#E9B323',
    mangoFg: '#16211F',
  },
}

const FONT_STACK = "'Bricolage Grotesque', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

function withCorsParam(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has('cors')) {
      parsed.searchParams.set('cors', '1')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous'
    }
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = withCorsParam(src)
  })
}

async function loadImageWithFallback(
  primaryUrl: string,
  fallbackUrl: string = PWA_ICON_PATH
): Promise<{ img: HTMLImageElement | null; isFallback: boolean }> {
  const cleanPrimary = stripUrlHash(primaryUrl)
  if (cleanPrimary && isSafeUrl(cleanPrimary)) {
    const loaded = await loadImageElement(cleanPrimary)
    if (loaded) {
      return { img: loaded, isFallback: cleanPrimary === fallbackUrl }
    }
  }
  const fallbackImg = await loadImageElement(fallbackUrl)
  return { img: fallbackImg, isFallback: true }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight)
  const drawW = img.naturalWidth * ratio
  const drawH = img.naturalHeight * ratio
  const offsetX = x + (w - drawW) / 2
  const offsetY = y + (h - drawH) / 2
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const drawW = img.naturalWidth * ratio
  const drawH = img.naturalHeight * ratio
  const offsetX = x + (w - drawW) / 2
  const offsetY = y + (h - drawH) / 2
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
}

function drawCircularImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  borderColor?: string,
  borderWidth = 4
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  drawImageCover(ctx, img, cx - radius, cy - radius, radius * 2, radius * 2)
  ctx.restore()

  if (borderColor && borderWidth > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.lineWidth = borderWidth
    ctx.strokeStyle = borderColor
    ctx.stroke()
    ctx.restore()
  }
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const words = clean.split(' ')
  const lines: string[] = []
  let current = ''

  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? ''
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      if (current) {
        lines.push(current)
        current = word
      } else {
        let sliced = word
        while (sliced.length > 1 && ctx.measureText(`${sliced}…`).width > maxWidth) {
          sliced = sliced.slice(0, -1)
        }
        lines.push(`${sliced}…`)
        current = ''
      }
      if (lines.length === maxLines) {
        const last = lines[maxLines - 1] ?? ''
        let trimmed = last.replace(/…$/, '')
        while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
          trimmed = trimmed.slice(0, -1)
        }
        lines[maxLines - 1] = `${trimmed}…`
        return lines
      }
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  } else if (current && lines.length === maxLines) {
    const last = lines[maxLines - 1] ?? ''
    let trimmed = last.replace(/…$/, '')
    while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1)
    }
    lines[maxLines - 1] = `${trimmed}…`
  }

  return lines
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  bg: string,
  fg: string,
  fontSize: number
): number {
  ctx.save()
  ctx.font = `600 ${fontSize}px ${FONT_STACK}`
  const padX = Math.round(fontSize * 0.85)
  const height = Math.round(fontSize * 1.95)
  const textWidth = ctx.measureText(label).width
  const width = textWidth + padX * 2

  drawRoundedRect(ctx, x, y, width, height, 10)
  ctx.fillStyle = bg
  ctx.fill()

  ctx.fillStyle = fg
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + padX, y + height / 2 + 1)
  ctx.restore()
  return width
}

function formatDisplayUrl(shareUrl: string): string {
  return shareUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

export interface GenerateShareCardOptions {
  item: ShareItem
  format: ShareCardFormat
  theme: ShareCardTheme
  shareUrl: string
  profileAvatar?: string | null
  profileBanner?: string | null
  authorName?: string
}

export async function generateShareCardBlob(options: GenerateShareCardOptions): Promise<Blob> {
  const { item, format, theme, shareUrl, profileAvatar, profileBanner, authorName } = options
  const palette = PALETTES[theme]
  const width = format === 'status' ? 1080 : 1200
  const height = format === 'status' ? 1920 : 630

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined)
  }

  const resolvedMain = resolveShareImage(item, profileAvatar, profileBanner)
  const footerAvatarTarget = stripUrlHash(item.avatarUrl || profileAvatar) || PWA_ICON_PATH
  const bannerTarget = item.kind === 'profile' ? stripUrlHash(item.bannerUrl || profileBanner) : ''

  const [mainResult, footerAvatarResult, bannerResult] = await Promise.all([
    loadImageWithFallback(resolvedMain.url, PWA_ICON_PATH),
    loadImageWithFallback(footerAvatarTarget, PWA_ICON_PATH),
    bannerTarget ? loadImageElement(bannerTarget) : Promise.resolve(null),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Contexte Canvas 2D indisponible.')
  }

  // Fond principal + liseré supérieur indigo/mango
  ctx.fillStyle = palette.paper
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = palette.indigo
  ctx.fillRect(0, 0, Math.round(width * 0.72), 10)
  ctx.fillStyle = palette.mango
  ctx.fillRect(Math.round(width * 0.72), 0, width - Math.round(width * 0.72), 10)

  const displayAuthor = authorName || item.authorName || 'Yao Jean Angoa'
  const displayUrl = formatDisplayUrl(shareUrl)

  if (format === 'status') {
    await renderStatusCard({
      ctx,
      width,
      height,
      palette,
      item,
      mainResult,
      footerAvatarResult,
      bannerImg: bannerResult,
      displayAuthor,
      displayUrl,
    })
  } else {
    await renderHorizontalCard({
      ctx,
      width,
      height,
      palette,
      item,
      mainResult,
      footerAvatarResult,
      displayAuthor,
      displayUrl,
    })
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Impossible de générer l’image de partage.'))
        }
      },
      'image/png',
      0.96
    )
  })
}

async function renderStatusCard(params: {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  palette: CardPalette
  item: ShareItem
  mainResult: { img: HTMLImageElement | null; isFallback: boolean }
  footerAvatarResult: { img: HTMLImageElement | null; isFallback: boolean }
  bannerImg: HTMLImageElement | null
  displayAuthor: string
  displayUrl: string
}): Promise<void> {
  const { ctx, width, height, palette, item, mainResult, footerAvatarResult, bannerImg, displayAuthor, displayUrl } =
    params
  const padX = 76
  const contentW = width - padX * 2

  // Barre supérieure : marque "Angy." + badges
  let cursorY = 86
  ctx.font = `700 44px ${FONT_STACK}`
  ctx.textBaseline = 'top'
  ctx.fillStyle = palette.ink
  ctx.fillText('Angy', padX, cursorY)
  const brandW = ctx.measureText('Angy').width
  ctx.fillStyle = palette.indigo
  ctx.fillText('.', padX + brandW, cursorY)

  // Badges alignés à droite
  const badges: Array<{ label: string; bg: string; fg: string }> = []
  if (item.badge) {
    badges.push({ label: item.badge, bg: palette.indigo, fg: palette.indigoFg })
  }
  if (item.secondaryBadge) {
    badges.push({ label: item.secondaryBadge, bg: palette.mango, fg: palette.mangoFg })
  }

  if (badges.length > 0) {
    ctx.font = `600 24px ${FONT_STACK}`
    const badgeWidths = badges.map((b) => ctx.measureText(b.label).width + Math.round(24 * 0.85) * 2)
    const gap = 14
    const totalW = badgeWidths.reduce((acc, w) => acc + w, 0) + gap * (badges.length - 1)
    let bx = width - padX - totalW
    badges.forEach((b) => {
      const drawnW = drawBadge(ctx, b.label, bx, cursorY + 2, b.bg, b.fg, 24)
      bx += drawnW + gap
    })
  }

  cursorY = 190

  // Zone visuelle principale (couverture 16:9 pour projet/actualité, profil/sondage centré)
  const showcaseH = item.kind === 'project' || item.kind === 'announcement' ? 522 : 420

  ctx.save()
  drawRoundedRect(ctx, padX, cursorY, contentW, showcaseH, 28)
  ctx.fillStyle = palette.surface
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = palette.line
  ctx.stroke()
  ctx.clip()

  if (item.kind === 'profile') {
    if (bannerImg) {
      drawImageCover(ctx, bannerImg, padX, cursorY, contentW, Math.round(showcaseH * 0.56))
    } else {
      ctx.fillStyle = palette.indigo
      ctx.globalAlpha = 0.14
      ctx.fillRect(padX, cursorY, contentW, Math.round(showcaseH * 0.56))
      ctx.globalAlpha = 1
    }
    ctx.restore()

    if (mainResult.img) {
      const avatarR = 112
      const cx = padX + contentW / 2
      const cy = cursorY + Math.round(showcaseH * 0.58)
      drawCircularImage(ctx, mainResult.img, cx, cy, avatarR, palette.paper, 10)
    }
  } else if (item.kind === 'poll') {
    ctx.restore()
    if (mainResult.img) {
      drawCircularImage(ctx, mainResult.img, padX + 112, cursorY + 110, 56, palette.line, 3)
    }
    ctx.font = `600 28px ${FONT_STACK}`
    ctx.fillStyle = palette.indigo
    ctx.textBaseline = 'middle'
    ctx.fillText('Sondage communautaire', padX + 196, cursorY + 96)
    ctx.font = `500 24px ${FONT_STACK}`
    ctx.fillStyle = palette.muted
    ctx.fillText('Votez directement sur le portfolio', padX + 196, cursorY + 136)

    const options = (item.metaItems || []).slice(0, 3)
    options.forEach((opt, idx) => {
      const oy = cursorY + 206 + idx * 62
      drawRoundedRect(ctx, padX + 42, oy, contentW - 84, 48, 12)
      ctx.fillStyle = palette.paper
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = palette.line
      ctx.stroke()

      ctx.font = `500 24px ${FONT_STACK}`
      ctx.fillStyle = palette.ink
      ctx.textBaseline = 'middle'
      const labelLine = wrapTextLines(ctx, `○  ${opt}`, contentW - 140, 1)[0] || opt
      ctx.fillText(labelLine, padX + 64, oy + 24)
    })
  } else {
    if (mainResult.img) {
      if (mainResult.isFallback) {
        const iconSize = 236
        drawRoundedRect(
          ctx,
          padX + (contentW - iconSize) / 2,
          cursorY + (showcaseH - iconSize) / 2,
          iconSize,
          iconSize,
          44
        )
        ctx.save()
        ctx.clip()
        drawImageCover(
          ctx,
          mainResult.img,
          padX + (contentW - iconSize) / 2,
          cursorY + (showcaseH - iconSize) / 2,
          iconSize,
          iconSize
        )
        ctx.restore()
      } else {
        drawImageContain(ctx, mainResult.img, padX + 16, cursorY + 16, contentW - 32, showcaseH - 32)
      }
    }
    ctx.restore()
  }

  cursorY += showcaseH + 64

  // Titre
  ctx.font = `700 62px ${FONT_STACK}`
  ctx.fillStyle = palette.ink
  ctx.textBaseline = 'top'
  const titleLines = wrapTextLines(ctx, item.title, contentW, 3)
  titleLines.forEach((line) => {
    ctx.fillText(line, padX, cursorY)
    cursorY += 74
  })

  // Sous-titre
  if (item.subtitle && item.subtitle.trim() !== item.title.trim()) {
    cursorY += 12
    ctx.font = `500 32px ${FONT_STACK}`
    ctx.fillStyle = palette.indigo
    const subLines = wrapTextLines(ctx, item.subtitle, contentW, 2)
    subLines.forEach((line) => {
      ctx.fillText(line, padX, cursorY)
      cursorY += 44
    })
  }

  // Résumé / description
  const bodySource = item.description || ''
  if (bodySource && bodySource.trim() !== (item.subtitle || '').trim()) {
    cursorY += 22
    ctx.font = `400 30px ${FONT_STACK}`
    ctx.fillStyle = palette.muted
    const descLines = wrapTextLines(ctx, bodySource, contentW, 5)
    descLines.forEach((line) => {
      ctx.fillText(line, padX, cursorY)
      cursorY += 44
    })
  }

  // Pastilles de technologies (projets / profil)
  if (item.kind !== 'poll' && item.metaItems && item.metaItems.length > 0 && cursorY < height - 340) {
    cursorY += 32
    let chipX = padX
    const chipFont = 24
    ctx.font = `500 ${chipFont}px ${FONT_STACK}`
    for (const tech of item.metaItems.slice(0, 4)) {
      const chipW = ctx.measureText(tech).width + 38
      if (chipX + chipW > width - padX) break
      drawRoundedRect(ctx, chipX, cursorY, chipW, 50, 12)
      ctx.fillStyle = palette.surface
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = palette.line
      ctx.stroke()

      ctx.fillStyle = palette.ink
      ctx.textBaseline = 'middle'
      ctx.fillText(tech, chipX + 19, cursorY + 26)
      chipX += chipW + 14
    }
  }

  // Pied de carte avec avatar + nom + lien court
  const footerY = height - 210
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(padX, footerY)
  ctx.lineTo(width - padX, footerY)
  ctx.stroke()

  if (footerAvatarResult.img) {
    drawCircularImage(ctx, footerAvatarResult.img, padX + 42, footerY + 84, 42, palette.line, 2)
  }

  ctx.textBaseline = 'top'
  ctx.font = `600 30px ${FONT_STACK}`
  ctx.fillStyle = palette.ink
  ctx.fillText(displayAuthor, padX + 106, footerY + 52)

  ctx.font = `500 24px ${FONT_STACK}`
  ctx.fillStyle = palette.indigo
  const truncatedUrl = wrapTextLines(ctx, displayUrl, contentW - 120, 1)[0] || displayUrl
  ctx.fillText(truncatedUrl, padX + 106, footerY + 94)
}

async function renderHorizontalCard(params: {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  palette: CardPalette
  item: ShareItem
  mainResult: { img: HTMLImageElement | null; isFallback: boolean }
  footerAvatarResult: { img: HTMLImageElement | null; isFallback: boolean }
  displayAuthor: string
  displayUrl: string
}): Promise<void> {
  const { ctx, width, height, palette, item, mainResult, footerAvatarResult, displayAuthor, displayUrl } =
    params
  const padX = 56
  const padY = 54

  const leftW = 550
  const rightX = padX + leftW + 44
  const rightW = width - rightX - padX

  // Colonne gauche : texte + pied de carte
  let cursorY = padY
  ctx.font = `700 28px ${FONT_STACK}`
  ctx.textBaseline = 'top'
  ctx.fillStyle = palette.ink
  ctx.fillText('Angy', padX, cursorY)
  const brandW = ctx.measureText('Angy').width
  ctx.fillStyle = palette.indigo
  ctx.fillText('.', padX + brandW, cursorY)

  let badgeX = padX + brandW + 28
  if (item.badge) {
    const bw = drawBadge(ctx, item.badge, badgeX, cursorY - 2, palette.indigo, palette.indigoFg, 18)
    badgeX += bw + 10
  }
  if (item.secondaryBadge) {
    drawBadge(ctx, item.secondaryBadge, badgeX, cursorY - 2, palette.mango, palette.mangoFg, 18)
  }

  cursorY += 70

  ctx.font = `700 42px ${FONT_STACK}`
  ctx.fillStyle = palette.ink
  ctx.textBaseline = 'top'
  const titleLines = wrapTextLines(ctx, item.title, leftW, 3)
  titleLines.forEach((line) => {
    ctx.fillText(line, padX, cursorY)
    cursorY += 50
  })

  if (item.subtitle && item.subtitle.trim() !== item.title.trim()) {
    cursorY += 8
    ctx.font = `500 22px ${FONT_STACK}`
    ctx.fillStyle = palette.indigo
    const subLines = wrapTextLines(ctx, item.subtitle, leftW, 2)
    subLines.forEach((line) => {
      ctx.fillText(line, padX, cursorY)
      cursorY += 30
    })
  }

  if (item.description && item.description.trim() !== (item.subtitle || '').trim()) {
    cursorY += 14
    ctx.font = `400 21px ${FONT_STACK}`
    ctx.fillStyle = palette.muted
    const descLines = wrapTextLines(ctx, item.description, leftW, 4)
    descLines.forEach((line) => {
      ctx.fillText(line, padX, cursorY)
      cursorY += 30
    })
  }

  // Pied gauche
  const footerY = height - 92
  if (footerAvatarResult.img) {
    drawCircularImage(ctx, footerAvatarResult.img, padX + 24, footerY + 24, 24, palette.line, 2)
  }
  ctx.font = `600 20px ${FONT_STACK}`
  ctx.fillStyle = palette.ink
  ctx.textBaseline = 'top'
  ctx.fillText(displayAuthor, padX + 62, footerY + 2)

  ctx.font = `500 17px ${FONT_STACK}`
  ctx.fillStyle = palette.indigo
  const shortUrl = wrapTextLines(ctx, displayUrl, leftW - 70, 1)[0] || displayUrl
  ctx.fillText(shortUrl, padX + 62, footerY + 28)

  // Colonne droite : visuel dédié
  const boxY = padY
  const boxH = height - padY * 2

  ctx.save()
  drawRoundedRect(ctx, rightX, boxY, rightW, boxH, 20)
  ctx.fillStyle = palette.surface
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = palette.line
  ctx.stroke()
  ctx.clip()

  if ((item.kind === 'profile' || item.kind === 'poll') && mainResult.img) {
    ctx.restore()
    const avatarR = mainResult.isFallback ? 95 : 120
    drawCircularImage(
      ctx,
      mainResult.img,
      rightX + rightW / 2,
      boxY + boxH / 2,
      avatarR,
      palette.line,
      4
    )
  } else if (mainResult.img) {
    if (mainResult.isFallback) {
      const iconSize = 180
      drawRoundedRect(
        ctx,
        rightX + (rightW - iconSize) / 2,
        boxY + (boxH - iconSize) / 2,
        iconSize,
        iconSize,
        32
      )
      ctx.save()
      ctx.clip()
      drawImageCover(
        ctx,
        mainResult.img,
        rightX + (rightW - iconSize) / 2,
        boxY + (boxH - iconSize) / 2,
        iconSize,
        iconSize
      )
      ctx.restore()
    } else {
      drawImageContain(ctx, mainResult.img, rightX + 14, boxY + 14, rightW - 28, boxH - 28)
    }
    ctx.restore()
  } else {
    ctx.restore()
  }
}

