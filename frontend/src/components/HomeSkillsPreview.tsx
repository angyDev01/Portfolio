import type { ReactElement } from 'react'
import type { SkillCategoryType } from '../types/database'
import { ALL_SKILL_CATEGORIES } from '../config/defaults'
import { useSkills } from '../hooks/usePortfolioData'
import { portfolioService } from '../services/portfolioService'
import SectionHeader from './SectionHeader'
import EmptyState from './EmptyState'
import TechCard from './TechCard'

const CATEGORY_LABELS: Record<SkillCategoryType, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Données',
  tools: 'Outils',
  devops: 'DevOps',
  mobile: 'Mobile',
  other: 'Autres',
}

export default function HomeSkillsPreview(): ReactElement {
  const { skills, loading } = useSkills()

  const groupedCategories = ALL_SKILL_CATEGORIES.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat],
    items: skills.filter((s) => s.category?.toLowerCase() === cat),
  })).filter((group) => group.items.length > 0)

  return (
    <section
      id="stack-preview"
      aria-labelledby="skills-preview-title"
      className="py-12 md:py-24 border-b border-line transition-colors"
    >
      <div className="container-custom">
        <div className="section-rail">
          <SectionHeader
            id="skills-preview-title"
            title="Compétences"
            context="Langages, frameworks et bases de données pratiqués au quotidien."
            link={{
              to: '/competences',
              label: `Explorer toute la stack${skills.length > 0 ? ` (${skills.length})` : ''}`,
              onMouseEnter: () => portfolioService.prefetch('skills'),
            }}
          />

          <div className="min-w-0">
            {loading ? (
              <div className="divide-y divide-line border-t border-b border-line animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-3 h-4 bg-line/60 rounded w-20" />
                    <div className="sm:col-span-9 flex flex-wrap gap-2">
                      <div className="h-8 bg-line/50 rounded-md w-24" />
                      <div className="h-8 bg-line/50 rounded-md w-28" />
                      <div className="h-8 bg-line/50 rounded-md w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedCategories.length === 0 ? (
              <EmptyState
                headingLevel="h3"
                title="Aucune compétence renseignée"
                description="Les technologies et compétences seront affichées ici prochainement."
              />
            ) : (
              <div className="divide-y divide-line border-t border-b border-line">
                {groupedCategories.map((group) => (
                  <div
                    key={group.key}
                    className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start"
                  >
                    <h3 className="sm:col-span-3 text-sm font-medium text-muted pt-1.5">
                      {group.label}
                    </h3>
                    <div className="sm:col-span-9 flex flex-wrap gap-2">
                      {group.items.map((skill) => (
                        <TechCard key={skill.id} skill={skill} variant="chip" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
