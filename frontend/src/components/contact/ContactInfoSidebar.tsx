import type { ReactElement } from 'react'
import Icon from '../Icon'

export type CopyEmailState = 'idle' | 'copied' | 'error'

interface ContactInfoSidebarProps {
  recipientEmail: string
  primaryPhone: string
  secondaryPhone: string
  whatsappUrl: string
  location: string
  github: string
  linkedin: string
  twitter: string
  facebook: string
  copyState: CopyEmailState
  onCopyEmail: () => void
}

export default function ContactInfoSidebar({
  recipientEmail,
  primaryPhone,
  secondaryPhone,
  whatsappUrl,
  location,
  github,
  linkedin,
  twitter,
  facebook,
  copyState,
  onCopyEmail,
}: ContactInfoSidebarProps): ReactElement {
  const copyLabel =
    copyState === 'copied'
      ? 'Adresse copiée'
      : copyState === 'error'
        ? 'Copie impossible'
        : 'Copier l’adresse'

  const touchLinkClass =
    'inline-flex items-center min-h-[44px] sm:min-h-0 -my-2.5 sm:my-0 sm:py-1'
  const socialLinkClass =
    'inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-1.5 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-1 text-muted hover:text-indigo transition-colors'

  return (
    <aside className="rail-title order-2 lg:order-1 space-y-6">
      <dl className="divide-y divide-line border-t border-b border-line text-sm">
        <div className="py-4 space-y-2">
          <dt className="text-xs font-medium text-muted">Email</dt>
          <dd className="flex flex-col items-start gap-2">
            <span className="font-medium text-ink select-all break-all">
              {recipientEmail}
            </span>
            <button
              type="button"
              data-copy-email="sidebar"
              onClick={onCopyEmail}
              className={`btn-tactile ${touchLinkClass} gap-1.5 text-xs font-medium cursor-pointer transition-colors ${copyState === 'copied'
                ? 'text-indigo'
                : copyState === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted hover:text-ink underline underline-offset-4'
                }`}
            >
              <Icon
                name={copyState === 'copied' ? 'check' : copyState === 'error' ? 'alert' : 'copy'}
                className="size-3.5"
              />
              <span>{copyLabel}</span>
            </button>
          </dd>
        </div>

        <div className="py-4 space-y-2">
          <dt className="text-xs font-medium text-muted">Téléphone & WhatsApp</dt>
          <dd className="space-y-1">
            <p className="font-medium text-ink">{primaryPhone}</p>
            <p className="text-xs text-muted">Secondaire : {secondaryPhone}</p>
            <div className="flex items-center gap-4 pt-1 text-xs font-medium">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${touchLinkClass} text-indigo hover:underline underline-offset-4`}
              >
                WhatsApp
              </a>
              <a
                href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                className={`${touchLinkClass} text-muted hover:text-ink hover:underline underline-offset-4`}
              >
                Appeler
              </a>
            </div>
          </dd>
        </div>

        <div className="py-4 space-y-1">
          <dt className="text-xs font-medium text-muted">Localisation</dt>
          <dd className="font-medium text-ink">{location}</dd>
        </div>

        <div className="py-4 space-y-2">
          <dt className="text-xs font-medium text-muted">Réseaux</dt>
          <dd className="flex flex-wrap gap-x-2 sm:gap-x-4 gap-y-1 -ml-1.5 -my-2 sm:ml-0 sm:my-0 text-xs font-medium">
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
            >
              GitHub
            </a>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
            >
              LinkedIn
            </a>
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
            >
              X
            </a>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
            >
              Facebook
            </a>
          </dd>
        </div>
      </dl>
    </aside>
  )
}
