import type { ReactElement } from 'react'
import { DEFAULT_PROFILE_CONTACT } from '../config/defaults'
import { useProfile, useSkills } from '../hooks/usePortfolioData'
import SectionHeader from './SectionHeader'
import AboutVideoPlayer from './AboutVideoPlayer'
import RichText from './RichText'

export default function About(): ReactElement {
  const { profile } = useProfile()
  const { skills } = useSkills()

  const fullBio =
    profile?.full_bio && Array.isArray(profile.full_bio) && profile.full_bio.length > 0
      ? profile.full_bio
      : [
        "Mon histoire avec le code a commencé par une curiosité insatiable : comprendre ce qui se cache sous le capot des applications que nous utilisons tous les jours. Au fil des projets, cette curiosité s'est transformée en une véritable passion pour l'ingénierie web, avec une exigence constante d'apprendre et de construire en autonomie.",
        "Au quotidien, j'aime relier la rigueur d'un backend robuste (Node.js, bases relationnelles PostgreSQL, architectures sécurisées) à la finesse d'un frontend fluide et intuitif (React, TypeScript, Tailwind). Pour moi, un produit réussi ne doit pas seulement être performant : il doit être lisible pour l'équipe qui le maintient et agréable pour les personnes qui l'utilisent.",
        "Basé à Abidjan et ouvert aux collaborations en télétravail à l'international, je privilégie la simplicité, la transparence et une communication limpide. Je suis toujours motivé par de nouveaux défis où rigueur technique et créativité se rencontrent.",
      ]

  const statusText =
    profile?.availability_status === 'employed'
      ? 'En poste'
      : profile?.availability_status === 'unavailable'
        ? 'Non disponible'
        : 'Disponible'

  const topSkills = [...skills]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .map((s) => s.name)
    .slice(0, 4)
  const stackSummary = topSkills.length > 0 ? topSkills.join(', ') : 'React, TS, Node, Postgres'
  const locationSummary = profile?.location || DEFAULT_PROFILE_CONTACT.locationShort
  const profileName = profile?.name || 'Yao Jean Angoa'

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="py-12 md:py-24 transition-colors"
    >
      <div className="container-custom">
        <div className="section-rail">
          <SectionHeader
            id="about-title"
            title="À propos"
            context="Parcours, façon de travailler et présentation vidéo."
          />

          <div className="min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Bio en colonne de lecture, sans carte */}
              <div className="lg:col-span-8 space-y-5 text-base sm:text-[18px] leading-[1.65] text-muted max-w-[65ch]">
                {fullBio.map((paragraph, index) => (
                  <p key={index} className={index === 0 ? 'text-ink' : undefined}>
                    <RichText text={paragraph} />
                  </p>
                ))}
              </div>

              {/* Liste de définitions sobre */}
              <aside aria-label="Repères clés" className="lg:col-span-4">
                <dl className="divide-y divide-line border-t border-b border-line text-sm">
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-muted">Rôle</dt>
                    <dd className="text-right font-medium text-ink">
                      {profile?.role || 'Full-Stack Web'}
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-muted">Stack</dt>
                    <dd className="text-right font-medium text-ink">
                      {stackSummary}
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-muted">Lieu</dt>
                    <dd className="text-right font-medium text-ink">
                      {locationSummary}
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-muted">Statut</dt>
                    <dd className="text-right font-medium text-ink">
                      {statusText}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>

            {/* Présentation Vidéo */}
            <AboutVideoPlayer
              posterUrl="/videos/poster.jpg"
              profileName={profileName}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
