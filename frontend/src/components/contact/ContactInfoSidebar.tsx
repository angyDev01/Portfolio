import type { ReactElement } from 'react'
import Icon from '../Icon'

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
  copied: boolean
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
  copied,
  onCopyEmail,
}: ContactInfoSidebarProps): ReactElement {
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
              onClick={onCopyEmail}
              className={`btn-tactile py-1 inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                copied
                  ? 'text-indigo'
                  : 'text-muted hover:text-ink underline underline-offset-4'
              }`}
            >
              <Icon name={copied ? 'check' : 'copy'} className="size-3.5" />
              <span>{copied ? 'Adresse copiée' : 'Copier l’adresse'}</span>
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
                className="py-1 text-indigo hover:underline underline-offset-4"
              >
                WhatsApp
              </a>
              <a
                href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                className="py-1 text-muted hover:text-ink hover:underline underline-offset-4"
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
          <dd className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-muted hover:text-indigo transition-colors"
            >
              GitHub
            </a>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-muted hover:text-indigo transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-muted hover:text-indigo transition-colors"
            >
              X
            </a>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-muted hover:text-indigo transition-colors"
            >
              Facebook
            </a>
          </dd>
        </div>
      </dl>
    </aside>
  )
}
