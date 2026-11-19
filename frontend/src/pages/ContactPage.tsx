import { useEffect, useState, type ReactElement } from 'react'
import { DEFAULT_PROFILE_CONTACT } from '../config/defaults'
import { useProfile } from '../hooks/usePortfolioData'
import Icon from '../components/Icon'
import ContactInfoSidebar from '../components/contact/ContactInfoSidebar'
import DirectMessageForm from '../components/contact/DirectMessageForm'
import EmailClientForm from '../components/contact/EmailClientForm'

type ContactChannel = 'direct' | 'email'

export default function ContactPage(): ReactElement {
  const { profile } = useProfile()
  const [activeChannel, setActiveChannel] = useState<ContactChannel>('direct')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const recipientEmail = profile?.email || DEFAULT_PROFILE_CONTACT.email
  const primaryPhone = profile?.phone || DEFAULT_PROFILE_CONTACT.phone
  const secondaryPhone = profile?.phone_secondary || DEFAULT_PROFILE_CONTACT.phoneSecondary
  const whatsappUrl = profile?.whatsapp_url || DEFAULT_PROFILE_CONTACT.whatsappUrl
  const location = profile?.location || DEFAULT_PROFILE_CONTACT.location
  const github = profile?.github_url || DEFAULT_PROFILE_CONTACT.githubUrl
  const linkedin = profile?.linkedin_url || DEFAULT_PROFILE_CONTACT.linkedinUrl
  const twitter = profile?.twitter_url || DEFAULT_PROFILE_CONTACT.twitterUrl
  const facebook = profile?.facebook_url || DEFAULT_PROFILE_CONTACT.facebookUrl

  const handleCopyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(recipientEmail)
      setCopied(true)
    } catch {
      /* ignore clipboard refusal */
    }
  }

  return (
    <div className="pt-24 pb-16 md:pt-36 md:pb-28 transition-colors">
      <div className="container-custom">
        <header className="max-w-[60ch] mb-8 md:mb-12">
          <h1
            style={{ fontVariationSettings: "'opsz' 72" }}
            className="text-[38px] sm:text-[57px] font-bold leading-[1.04] tracking-[-0.03em] text-ink mb-3.5 sm:mb-4"
          >
            Contact
          </h1>
          <p className="text-base sm:text-lg text-muted leading-[1.6]">
            Un projet précis, une opportunité de collaboration ou une question technique ? Écrivez-moi, je réponds sous 24h.
          </p>
        </header>

        {/* Raccourcis rapides sur mobile au-dessus du formulaire */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-8">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-surface border border-line text-ink text-xs font-medium"
          >
            <Icon name="messageSquare" className="size-3.5 text-indigo" />
            <span>WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="btn-tactile min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-surface border border-line text-ink text-xs font-medium cursor-pointer"
          >
            <Icon name={copied ? 'check' : 'copy'} className="size-3.5 text-indigo" />
            <span>{copied ? 'Email copié' : 'Copier l’email'}</span>
          </button>
        </div>

        <div className="section-rail items-start">
          <ContactInfoSidebar
            recipientEmail={recipientEmail}
            primaryPhone={primaryPhone}
            secondaryPhone={secondaryPhone}
            whatsappUrl={whatsappUrl}
            location={location}
            github={github}
            linkedin={linkedin}
            twitter={twitter}
            facebook={facebook}
            copied={copied}
            onCopyEmail={handleCopyEmail}
          />

          <div className="order-1 lg:order-2 max-w-2xl w-full">
            <div
              role="tablist"
              aria-label="Canal de contact"
              className="flex items-center gap-8 border-b border-line mb-6 sm:mb-8"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeChannel === 'direct'}
                onClick={() => setActiveChannel('direct')}
                className={`relative min-h-[44px] pb-3.5 pt-2 text-sm font-medium transition-colors cursor-pointer ${activeChannel === 'direct'
                    ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-indigo'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                Message direct
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeChannel === 'email'}
                onClick={() => setActiveChannel('email')}
                className={`relative min-h-[44px] pb-3.5 pt-2 text-sm font-medium transition-colors cursor-pointer ${activeChannel === 'email'
                    ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-indigo'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                Client email
              </button>
            </div>

            {activeChannel === 'direct' ? (
              <DirectMessageForm acceptDirectMessages={profile?.accept_direct_messages !== false} />
            ) : (
              <EmailClientForm recipientEmail={recipientEmail} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
