import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage(): ReactElement {
  return (
    <section
      aria-labelledby="not-found-title"
      className="pt-24 pb-16 md:pt-36 md:pb-28 transition-colors"
    >
      <div className="container-custom max-w-[60ch]">
        <p className="font-mono text-xs font-medium text-indigo mb-3">
          Erreur 404
        </p>
        <h1
          id="not-found-title"
          style={{ fontVariationSettings: "'opsz' 72" }}
          className="text-[38px] sm:text-[57px] font-bold leading-[1.04] tracking-[-0.03em] text-ink mb-4"
        >
          Page introuvable.
        </h1>
        <p className="text-base sm:text-lg text-muted leading-[1.6] mb-8">
          L&apos;adresse demandée n&apos;existe pas ou a été déplacée. Vous pouvez revenir à l&apos;accueil ou consulter mes réalisations.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <Link
            to="/"
            className="btn-tactile w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            to="/projets"
            className="min-h-[44px] inline-flex items-center justify-center sm:justify-start text-sm font-medium text-ink hover:text-indigo underline underline-offset-4 decoration-line hover:decoration-indigo transition-colors"
          >
            Voir les projets
          </Link>
        </div>
      </div>
    </section>
  )
}

