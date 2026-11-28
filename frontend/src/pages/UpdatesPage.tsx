import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnnouncements, usePolls } from '../hooks/usePortfolioData'
import AnnouncementCard from '../components/community/AnnouncementCard'
import PollCard from '../components/community/PollCard'
import EmptyState from '../components/EmptyState'

type UpdatesTab = 'all' | 'project_wip' | 'event' | 'polls'

const TABS: Array<{ id: UpdatesTab; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'project_wip', label: 'Projets en cours' },
  { id: 'event', label: 'Événements' },
  { id: 'polls', label: 'Sondages' },
]

export default function UpdatesPage(): ReactElement {
  const { announcements, loading: loadingAnn } = useAnnouncements()
  const { polls, loading: loadingPolls } = usePolls()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<UpdatesTab>('all')
  const scrolledTargetRef = useRef<string | null>(null)

  const targetAnnonceId = searchParams.get('annonce')
  const targetPollId = searchParams.get('sondage')

  useEffect(() => {
    if (targetAnnonceId || targetPollId) {
      setActiveTab('all')
    }
  }, [targetAnnonceId, targetPollId])

  const filteredAnnouncements = useMemo(() => {
    if (activeTab === 'polls') return []
    if (activeTab === 'all') return announcements
    return announcements.filter((a) => a.kind === activeTab)
  }, [activeTab, announcements])

  const showPolls = activeTab === 'all' || activeTab === 'polls'
  const loading = loadingAnn || loadingPolls
  const hasPolls = polls.length > 0
  const hasAnnouncements = filteredAnnouncements.length > 0

  useEffect(() => {
    if (loading) return
    const key = targetAnnonceId
      ? `annonce-${targetAnnonceId}`
      : targetPollId
        ? `sondage-${targetPollId}`
        : null
    if (!key || scrolledTargetRef.current === key) return

    const timer = window.setTimeout(() => {
      const el = document.getElementById(key)
      if (el) {
        scrolledTargetRef.current = key
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 80)

    return () => window.clearTimeout(timer)
  }, [loading, targetAnnonceId, targetPollId, activeTab, announcements.length, polls.length])

  return (
    <div className="pt-24 pb-16 md:pt-36 md:pb-28">
      <div className="container-custom">
        <header className="max-w-[60ch] mb-10 md:mb-12">
          <h1
            style={{ fontVariationSettings: "'opsz' 72" }}
            className="text-[38px] sm:text-[57px] font-bold leading-[1.04] tracking-[-0.03em] text-ink mb-3.5 sm:mb-4"
          >
            Actualités & Sondages
          </h1>
          <p className="text-base sm:text-lg text-muted leading-[1.6]">
            Suivez les chantiers en préparation, les prochains événements et donnez votre avis en
            direct sur les choix techniques ou produit.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Filtrer les actualités et sondages"
          className="flex flex-nowrap overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 items-center gap-6 sm:gap-8 mb-10 md:mb-14 border-b border-line"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count =
              tab.id === 'all'
                ? announcements.length + polls.length
                : tab.id === 'polls'
                  ? polls.length
                  : announcements.filter((a) => a.kind === tab.id).length
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 inline-block text-center min-w-[44px] min-h-[44px] px-1 pb-3.5 pt-2 text-sm font-medium transition-colors cursor-pointer ${isActive
                    ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-indigo'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                <span>{tab.label}</span>
                <sup
                  className={`ml-1 text-[11px] font-normal ${isActive ? 'text-indigo' : 'text-muted'
                    }`}
                >
                  {count}
                </sup>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="space-y-6 max-w-3xl">
            <div className="h-52 rounded-xl border border-line bg-surface animate-pulse" />
            <div className="h-44 rounded-xl border border-line bg-surface animate-pulse" />
          </div>
        ) : !hasAnnouncements && (!showPolls || !hasPolls) ? (
          <EmptyState
            title="Aucune publication dans cette rubrique"
            description="De nouvelles annonces et de nouveaux sondages seront publiés très prochainement."
          />
        ) : activeTab === 'polls' ? (
          /* Onglet dédié aux sondages */
          <div className="max-w-3xl space-y-6">
            {hasPolls ? (
              polls.map((poll) => (
                <div
                  key={poll.id}
                  id={`sondage-${poll.id}`}
                  className={
                    targetPollId === poll.id ? 'rounded-xl ring-2 ring-indigo/50' : undefined
                  }
                >
                  <PollCard poll={poll} headingLevel="h2" />
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun sondage actif"
                description="Revenez bientôt pour donner votre avis sur les prochains projets."
              />
            )}
          </div>
        ) : activeTab === 'all' && hasPolls ? (
          /* Vue globale mixte : annonces à gauche, sondages à droite */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-7 xl:col-span-8 space-y-6 min-w-0">
              {hasAnnouncements ? (
                filteredAnnouncements.map((ann, index) => (
                  <div
                    key={ann.id}
                    id={`annonce-${ann.id}`}
                    className={
                      targetAnnonceId === ann.id ? 'rounded-xl ring-2 ring-indigo/50' : undefined
                    }
                  >
                    <AnnouncementCard
                      announcement={ann}
                      headingLevel="h2"
                      defaultExpanded={index === 0 || ann.id === targetAnnonceId}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucune annonce pour le moment"
                  description="Découvrez les sondages ci-contre en attendant les prochaines publications."
                />
              )}
            </div>

            <aside className="lg:col-span-5 xl:col-span-4 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
                Sondages en cours ({polls.length})
              </h2>
              <div className="space-y-5">
                {polls.map((poll) => (
                  <div
                    key={poll.id}
                    id={`sondage-${poll.id}`}
                    className={
                      targetPollId === poll.id ? 'rounded-xl ring-2 ring-indigo/50' : undefined
                    }
                  >
                    <PollCard poll={poll} headingLevel="h3" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          /* Vue filtrée par catégorie (projets ou événements) ou vue globale sans sondages */
          <div className="max-w-3xl space-y-6">
            {hasAnnouncements ? (
              filteredAnnouncements.map((ann, index) => (
                <div
                  key={ann.id}
                  id={`annonce-${ann.id}`}
                  className={
                    targetAnnonceId === ann.id ? 'rounded-xl ring-2 ring-indigo/50' : undefined
                  }
                >
                  <AnnouncementCard
                    announcement={ann}
                    headingLevel="h2"
                    defaultExpanded={index === 0 || ann.id === targetAnnonceId}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucune publication pour cette catégorie"
                description="Revenez bientôt pour découvrir les prochains chantiers et événements."
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
