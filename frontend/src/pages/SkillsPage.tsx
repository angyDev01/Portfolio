import type { ReactElement } from 'react'
import {
  ALL_SKILL_CATEGORIES,
  PRIMARY_SKILL_CATEGORIES,
  SKILL_CATEGORY_META,
} from '../config/defaults'
import { useSkills } from '../hooks/usePortfolioData'
import EmptyState from '../components/EmptyState'
import TechCard from '../components/TechCard'
import { SkillCategorySkeleton } from '../components/Skeletons'

export default function SkillsPage(): ReactElement {
  const { skills, loading } = useSkills()

  const displayCategories = ALL_SKILL_CATEGORIES.filter(
    (cat) =>
      PRIMARY_SKILL_CATEGORIES.includes(cat) ||
      skills.some((s) => s.category?.toLowerCase() === cat)
  )

  return (
    <div className="pt-24 pb-16 md:pt-36 md:pb-28">
      <div className="container-custom">
        <header className="max-w-[60ch] mb-10 md:mb-14">
          <h1
            style={{ fontVariationSettings: "'opsz' 72" }}
            className="text-[38px] sm:text-[57px] font-bold leading-[1.04] tracking-[-0.03em] text-ink mb-3.5 sm:mb-4"
          >
            Compétences
          </h1>
          <p className="text-base sm:text-lg text-muted leading-[1.6]">
            Les langages, frameworks et outils utilisés au quotidien pour concevoir des applications fiables et faciles à faire évoluer.
          </p>
        </header>

        {loading ? (
          <div>
            <SkillCategorySkeleton />
            <SkillCategorySkeleton />
            <SkillCategorySkeleton />
          </div>
        ) : skills.length === 0 ? (
          <EmptyState
            title="Technologies en cours d'actualisation"
            description="Les compétences et outils de cette section sont en cours de mise à jour."
          />
        ) : (
          <div className="divide-y divide-line border-t border-b border-line">
            {displayCategories.map((catKey) => {
              const catSkills = skills.filter((s) => s.category?.toLowerCase() === catKey)
              const meta = SKILL_CATEGORY_META[catKey]

              return (
                <section
                  key={catKey}
                  aria-labelledby={`skills-cat-${catKey}`}
                  className="py-8 md:py-12 section-rail"
                >
                  <div className="rail-title flex flex-col gap-1.5">
                    <h2
                      id={`skills-cat-${catKey}`}
                      className="text-2xl font-semibold tracking-[-0.02em] text-ink"
                    >
                      {meta.title}
                    </h2>
                    <p className="text-sm text-muted">{meta.subtitle}</p>
                    <span className="text-xs text-muted mt-1">
                      {catSkills.length} technologie{catSkills.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="min-w-0">
                    {catSkills.length === 0 ? (
                      <p className="text-sm text-muted py-4">Aucune entrée pour le moment.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                        {catSkills.map((skill) => (
                          <TechCard key={skill.id} skill={skill} variant="detail" showDescription />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
