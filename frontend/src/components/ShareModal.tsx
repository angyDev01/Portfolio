import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useProfile } from '../hooks/usePortfolioData'
import { useFocusTrap, FocusGuard } from '../hooks/useFocusTrap'
import { copyTextToClipboard } from '../utils/clipboard'
import {
  buildShareFilename,
  buildShareUrl,
  buildWhatsAppChatUrl,
  buildWhatsAppText,
  resolveShareImage,
  truncateShareExcerpt,
  type ShareItem,
} from '../utils/shareUtils'
import type { ShareCardFormat, ShareCardTheme } from '../utils/shareCardCanvas'

interface ShareModalProps {
  item: ShareItem | null
  isOpen: boolean
  onClose: () => void
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ShareModal({
  item,
  isOpen,
  onClose,
}: ShareModalProps): ReactElement | null {
  const { profile } = useProfile()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  const [copiedMode, setCopiedMode] = useState<'link' | 'text' | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [sharingOther, setSharingOther] = useState(false)

  // Optionnel : export PNG uniquement à la demande
  const [exportOpen, setExportOpen] = useState(false)
  const [format, setFormat] = useState<ShareCardFormat>('status')
  const [cardTheme, setCardTheme] = useState<ShareCardTheme>('dark')
  const [pngBlob, setPngBlob] = useState<Blob | null>(null)
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string | null>(null)
  const [generatingPng, setGeneratingPng] = useState(false)

  const { focusFirst, focusLast } = useFocusTrap(dialogRef, isOpen && Boolean(item), onClose, {
    initialFocusRef: closeBtnRef,
  })

  const shareUrl = useMemo(() => (item ? buildShareUrl(item) : ''), [item])
  const waText = useMemo(
    () => (item && shareUrl ? buildWhatsAppText(item, shareUrl) : ''),
    [item, shareUrl]
  )
  const waChatHref = useMemo(() => (waText ? buildWhatsAppChatUrl(waText) : '#'), [waText])

  const resolvedVisual = useMemo(
    () =>
      item
        ? resolveShareImage(item, profile?.avatar_url, profile?.banner_url)
        : { url: '/pwa-512x512.png', isFallbackIcon: true },
    [item, profile?.avatar_url, profile?.banner_url]
  )

  const [visualFailed, setVisualFailed] = useState(false)
  useEffect(() => {
    setVisualFailed(false)
  }, [resolvedVisual.url, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setFeedback(null)
      setCopiedMode(null)
      setExportOpen(false)
      setPngBlob(null)
      setPngPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !exportOpen || !item || !shareUrl) return

    let cancelled = false
    setGeneratingPng(true)

    import('../utils/shareCardCanvas')
      .then(({ generateShareCardBlob }) =>
        generateShareCardBlob({
          item,
          format,
          theme: cardTheme,
          shareUrl,
          profileAvatar: profile?.avatar_url,
          profileBanner: profile?.banner_url,
          authorName: profile?.name,
        })
      )
      .then((nextBlob) => {
        if (cancelled) return
        const nextUrl = URL.createObjectURL(nextBlob)
        setPngBlob(nextBlob)
        setPngPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return nextUrl
        })
      })
      .catch(() => {
        if (!cancelled) {
          setPngBlob(null)
          setPngPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
          setFeedback('Export image indisponible sur ce navigateur.')
        }
      })
      .finally(() => {
        if (!cancelled) setGeneratingPng(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    isOpen,
    exportOpen,
    item,
    format,
    cardTheme,
    shareUrl,
    profile?.avatar_url,
    profile?.banner_url,
    profile?.name,
  ])

  useEffect(() => {
    return () => {
      if (pngPreviewUrl) URL.revokeObjectURL(pngPreviewUrl)
    }
  }, [pngPreviewUrl])

  useEffect(() => {
    if (!copiedMode) return
    const timer = window.setTimeout(() => setCopiedMode(null), 2200)
    return () => window.clearTimeout(timer)
  }, [copiedMode])

  if (!isOpen || !item) return null

  const supportsWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const displayDomain = shareUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'portfolio-vs28.vercel.app'
  const previewExcerpt = truncateShareExcerpt(item.description || item.subtitle, 140)
  const effectiveImageUrl = visualFailed ? '/pwa-512x512.png' : resolvedVisual.url
  const showAsAvatar =
    !visualFailed &&
    !resolvedVisual.isFallbackIcon &&
    (item.kind === 'profile' || item.kind === 'poll')
  const showAsFallbackIcon = visualFailed || resolvedVisual.isFallbackIcon

  const handleCopyLink = async (): Promise<void> => {
    const ok = await copyTextToClipboard(shareUrl)
    if (ok) {
      setCopiedMode('link')
      setFeedback('Lien copié — collez-le dans votre Statut ou discussion WhatsApp.')
    }
  }

  const handleCopyMessage = async (): Promise<void> => {
    const ok = await copyTextToClipboard(waText)
    if (ok) {
      setCopiedMode('text')
      setFeedback('Message complet copié avec le lien.')
    }
  }

  const handleShareViaOtherApp = async (): Promise<void> => {
    if (!supportsWebShare) return
    setSharingOther(true)
    try {
      await navigator.share({
        title: item.title,
        text: waText,
        url: shareUrl,
      })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      await handleCopyLink()
    } finally {
      setSharingOther(false)
    }
  }

  const handleDownloadPng = (): void => {
    if (!pngBlob) return
    const filename = buildShareFilename(item, format)
    triggerBlobDownload(pngBlob, filename)
    setFeedback('Image PNG enregistrée sur votre appareil.')
  }

  const handleSharePngFile = async (): Promise<void> => {
    if (!pngBlob) return
    const filename = buildShareFilename(item, format)
    const file = new File([pngBlob], filename, { type: 'image/png' })
    const nav = typeof navigator !== 'undefined' ? navigator : undefined
    if (typeof nav?.share === 'function' && typeof nav?.canShare === 'function' && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: item.title, text: waText })
        return
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    triggerBlobDownload(pngBlob, filename)
    setFeedback('Image PNG téléchargée.')
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md modal-backdrop-animate"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-surface border-t sm:border border-line rounded-t-2xl sm:rounded-xl max-h-[92dvh] sm:max-h-[90vh] w-full sm:max-w-[540px] flex flex-col overflow-hidden text-muted shadow-2xl sheet-dialog-animate focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <FocusGuard onFocus={focusLast} />

        {/* Poignée mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* En-tête collant */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 border-b border-line shrink-0 bg-surface">
          <div className="min-w-0">
            <h2 id="share-modal-title" className="text-base sm:text-lg font-semibold text-ink truncate">
              Partager sur WhatsApp
            </h2>
            <p className="text-xs text-muted truncate">{item.title}</p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="btn-tactile shrink-0 size-11 sm:size-9 rounded-md border border-line bg-paper text-muted hover:text-ink hover:border-ink/30 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre de partage"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto px-5 sm:px-6 pt-4 pb-safe space-y-4">
          {/* Aperçu instantané de la carte Open Graph WhatsApp (zéro téléchargement) */}
          <div className="rounded-xl border border-line bg-paper overflow-hidden">
            {showAsFallbackIcon ? (
              <div className="h-36 sm:h-40 w-full bg-surface border-b border-line flex items-center justify-center p-4">
                <img
                  src="/pwa-512x512.png"
                  alt={item.title}
                  className="size-24 rounded-2xl object-cover shadow-xs"
                />
              </div>
            ) : showAsAvatar ? (
              <div className="h-36 sm:h-40 w-full bg-surface border-b border-line flex items-center justify-center p-4">
                <img
                  src={effectiveImageUrl}
                  alt={item.title}
                  onError={() => setVisualFailed(true)}
                  className="size-28 rounded-full object-cover border-2 border-line shadow-xs"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-surface border-b border-line overflow-hidden">
                <img
                  src={effectiveImageUrl}
                  alt={item.title}
                  onError={() => setVisualFailed(true)}
                  className="w-full h-full object-contain object-center block"
                />
              </div>
            )}

            <div className="p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
                <span className="text-indigo uppercase tracking-wider">{displayDomain}</span>
                {item.badge && <span className="text-muted">{item.badge}</span>}
              </div>
              <p className="text-sm sm:text-base font-semibold text-ink leading-snug line-clamp-2">
                {item.title}
              </p>
              {previewExcerpt && previewExcerpt !== item.title && (
                <p className="text-xs text-muted leading-relaxed line-clamp-2">{previewExcerpt}</p>
              )}
              <p className="text-[11px] font-mono text-muted/80 truncate pt-1">{shareUrl}</p>
            </div>
          </div>

          {/* Action principale directe (zéro téléchargement) */}
          <div className="space-y-2">
            <a
              href={waChatHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-semibold transition-colors"
            >
              <Icon name="messageSquare" className="size-4" />
              <span>Partager sur WhatsApp (Statut / Discussion)</span>
            </a>

            <p className="text-[11px] text-muted leading-relaxed text-center px-1">
              Dans WhatsApp, sélectionnez <strong className="text-ink">« Mon statut »</strong> ou une discussion : la carte avec l&apos;image s&apos;affiche automatiquement, sans téléchargement.
            </p>
          </div>

          {/* Raccourcis directs sans téléchargement */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="btn-tactile min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-line bg-paper hover:border-ink/30 text-ink text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Icon name={copiedMode === 'link' ? 'check' : 'copy'} className="size-4 text-indigo" />
              <span>{copiedMode === 'link' ? 'Lien copié !' : 'Copier le lien'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyMessage()}
              className="btn-tactile min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-line bg-paper hover:border-ink/30 text-ink text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Icon name={copiedMode === 'text' ? 'check' : 'copy'} className="size-4 text-indigo" />
              <span>{copiedMode === 'text' ? 'Message copié !' : 'Copier le message'}</span>
            </button>
          </div>

          {supportsWebShare && (
            <button
              type="button"
              disabled={sharingOther}
              onClick={() => void handleShareViaOtherApp()}
              className="btn-tactile w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-line bg-paper hover:border-indigo/50 hover:text-indigo text-ink text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
            >
              <Icon name="share" className="size-4" />
              <span>{sharingOther ? 'Ouverture…' : 'Partager via une autre app'}</span>
            </button>
          )}

          {feedback && (
            <p role="status" className="text-xs text-indigo text-center">
              {feedback}
            </p>
          )}

          {/* Optionnel replié : exporter une carte image PNG */}
          <details
            open={exportOpen}
            onToggle={(e) => setExportOpen((e.currentTarget as HTMLDetailsElement).open)}
            className="rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-xs"
          >
            <summary className="cursor-pointer select-none font-medium text-muted hover:text-ink transition-colors py-1">
              Optionnel : exporter une carte image PNG
            </summary>

            {exportOpen && (
              <div className="pt-3 space-y-3 border-t border-line mt-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    role="group"
                    aria-label="Format de la carte PNG"
                    className="inline-flex rounded-md border border-line bg-surface p-0.5 gap-0.5"
                  >
                    <button
                      type="button"
                      aria-pressed={format === 'status'}
                      onClick={() => setFormat('status')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${format === 'status' ? 'bg-indigo text-indigo-fg' : 'text-muted hover:text-ink'
                        }`}
                    >
                      Statut 9:16
                    </button>
                    <button
                      type="button"
                      aria-pressed={format === 'card'}
                      onClick={() => setFormat('card')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${format === 'card' ? 'bg-indigo text-indigo-fg' : 'text-muted hover:text-ink'
                        }`}
                    >
                      Discussion 16:9
                    </button>
                  </div>

                  <div
                    role="group"
                    aria-label="Thème de la carte PNG"
                    className="inline-flex rounded-md border border-line bg-surface p-0.5 gap-0.5"
                  >
                    <button
                      type="button"
                      aria-pressed={cardTheme === 'dark'}
                      onClick={() => setCardTheme('dark')}
                      className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${cardTheme === 'dark' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                        }`}
                    >
                      Sombre
                    </button>
                    <button
                      type="button"
                      aria-pressed={cardTheme === 'light'}
                      onClick={() => setCardTheme('light')}
                      className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${cardTheme === 'light' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                        }`}
                    >
                      Clair
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-surface p-2 flex items-center justify-center min-h-[140px]">
                  {generatingPng && !pngPreviewUrl ? (
                    <span className="text-muted">Génération de la carte PNG…</span>
                  ) : pngPreviewUrl ? (
                    <img
                      src={pngPreviewUrl}
                      alt={`Carte PNG pour ${item.title}`}
                      className="max-h-52 w-auto max-w-full rounded object-contain block"
                    />
                  ) : (
                    <span className="text-muted">Impossible de générer l&apos;image PNG.</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!pngBlob || generatingPng}
                    onClick={handleDownloadPng}
                    className="btn-tactile flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surface hover:border-ink/30 text-ink font-medium cursor-pointer disabled:opacity-50"
                  >
                    <Icon name="download" className="size-3.5" />
                    <span>Télécharger PNG</span>
                  </button>

                  {supportsWebShare && (
                    <button
                      type="button"
                      disabled={!pngBlob || generatingPng}
                      onClick={() => void handleSharePngFile()}
                      className="btn-tactile flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-mango text-mango-fg font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Icon name="share" className="size-3.5" />
                      <span>Envoyer l&apos;image</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </details>
        </div>

        <FocusGuard onFocus={focusFirst} />
      </div>
    </div>,
    document.body
  )
}
