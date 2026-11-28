import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/usePortfolioData'

export default function HomeContactBanner(): ReactElement {
  const { profile } = useProfile()

  const status = profile
    ? profile.availability_status || (profile.is_available ? 'available' : 'employed')
    : 'available'

  const statusCopy =
    status === 'unavailable'
      ? 'Actuellement mobilisé sur mes engagements en cours, mais toujours ouvert aux échanges techniques et prises de contact. Réponse sous 24h.'
      : status === 'employed'
        ? 'Actuellement en poste, mais ouvert aux échanges techniques, collaborations ponctuelles ou opportunités futures. Réponse sous 24h.'
        : 'Disponible pour une mission full-stack, un poste ou un échange technique. Réponse sous 24h.'

  return (
    <section
      id="contact-invitation"
      aria-labelledby="contact-banner-title"
      className="bg-indigo text-indigo-fg py-12 md:py-24 transition-colors"
    >
      <div className="container-custom flex flex-col md:flex-row md:items-end justify-between gap-7 md:gap-8">
        <div className="max-w-[52ch]">
          <h2
            id="contact-banner-title"
            className="text-[30px] sm:text-[43px] font-bold leading-[1.08] tracking-[-0.03em] text-indigo-fg mb-3 sm:mb-4"
          >
            Un projet en tête ? Parlons-en.
          </h2>
          <p className="text-sm sm:text-base text-indigo-fg/80 leading-relaxed">
            {statusCopy}
          </p>
        </div>

        <Link
          to="/contact"
          className="btn-tactile w-full sm:w-auto min-h-[48px] md:self-auto shrink-0 inline-flex items-center justify-center px-6 py-3.5 rounded-md bg-mango hover:brightness-95 text-mango-fg text-sm font-semibold transition-all"
        >
          Écrire un message
        </Link>
      </div>
    </section>
  )
}
