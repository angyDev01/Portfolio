import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { useAnnouncements, usePolls } from '../../hooks/usePortfolioData'
import SectionHeader from '../SectionHeader'
import AnnouncementCard from './AnnouncementCard'
import PollCard from './PollCard'
import Icon from '../Icon'

export default function HomeCommunityPreview(): ReactElement | null {
  const { announcements, loading: loadingAnn } = useAnnouncements()
  const { polls, loading: loadingPolls } = usePolls()

  if (!loadingAnn && !loadingPolls && announcements.length === 0 && polls.length === 0) {
    return null
  }

  const leadAnnouncement = announcements[0]
  const activePoll = polls.find((p) => p.is_active) || polls[0]

  return (
    <section
      id="actualites"
      aria-labelledby="home-community-title"
      className="py-12 md:py-24 border-b border-line transition-colors"
    >
      <div className="container-custom">
        <div className="section-rail">
          <SectionHeader
            id="home-community-title"
            title="En cours & sondages"
            context="Chantiers du moment, événements à venir et avis de la communauté."
            link={{
              to: '/actualites',
              label: 'Tout voir & participer',
            }}
          />

          <div className="min-w-0 space-y-8">
            {loadingAnn || loadingPolls ? (
              <div className="h-44 rounded-xl border border-line bg-surface animate-pulse" />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {leadAnnouncement && <AnnouncementCard announcement={leadAnnouncement} />}
                {activePoll && <PollCard poll={activePoll} />}
              </div>
            )}

            {/* Bouton CTA d'accès direct aux actualités */}
            <div className="pt-2">
              <Link
                to="/actualites"
                className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-line text-ink text-sm font-medium transition-all shadow-xs cursor-pointer"
              >
                <span>Accéder à toutes les actualités</span>
                <Icon name="arrowRight" className="size-4 text-indigo" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
