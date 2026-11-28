import { useState, type ReactElement } from 'react'
import type { DbProject } from '../types/database'
import { useProjects } from '../hooks/usePortfolioData'
import { portfolioService } from '../services/portfolioService'
import SectionHeader from './SectionHeader'
import ProjectCard from './ProjectCard'
import ProjectDetailModal from './ProjectDetailModal'
import EmptyState from './EmptyState'
import { ProjectFeatureSkeleton } from './Skeletons'

export default function HomeProjectsMarquee(): ReactElement {
  const { projects, loading } = useProjects()
  const [selectedProject, setSelectedProject] = useState<DbProject | null>(null)

  const featured = projects.filter((p) => p.is_featured).slice(0, 4)
  const displayItems = featured.length > 0 ? featured : projects.slice(0, 4)
  const [leadProject, ...otherProjects] = displayItems

  return (
    <section
      id="projets-phares"
      aria-labelledby="marquee-projects-title"
      className="py-12 md:py-24 border-b border-line transition-colors"
    >
      <div className="container-custom">
        <div className="section-rail">
          <SectionHeader
            id="marquee-projects-title"
            title="Projets choisis"
            context={
              projects.length > 0
                ? `${projects.length} réalisation${projects.length > 1 ? 's' : ''} au total, du schéma de données jusqu'à l'interface.`
                : "Applications conçues du schéma de données jusqu'à l'interface."
            }
            link={{
              to: '/projets',
              label: `Voir tous les projets${projects.length > 0 ? ` (${projects.length})` : ''}`,
              onMouseEnter: () => portfolioService.prefetch('projects'),
            }}
          />

          <div className="min-w-0">
            {loading ? (
              <ProjectFeatureSkeleton />
            ) : !leadProject ? (
              <EmptyState
                headingLevel="h3"
                title="Aucun projet publié pour le moment"
                description="Les réalisations apparaîtront ici dès leur mise en ligne."
              />
            ) : (
              <div>
                <ProjectCard
                  project={leadProject}
                  variant="feature"
                  onClick={(p) => setSelectedProject(p)}
                />

                {otherProjects.length > 0 && (
                  <div className="border-b border-line">
                    {otherProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        variant="row"
                        onClick={(p) => setSelectedProject(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ProjectDetailModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    </section>
  )
}
