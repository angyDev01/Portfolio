import { useEffect, useState, type ReactElement } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbSkill, SkillCategoryType } from '../types/database'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import { SkillCategorySkeleton } from '../components/Skeletons'

const CATEGORY_META: Record<SkillCategoryType, { title: string; icon: 'frontend' | 'backend' | 'tools' | 'database' }> = {
  frontend: { title: 'Frontend Moderne', icon: 'frontend' },
  backend: { title: 'Backend & APIs', icon: 'backend' },
  database: { title: 'Bases de données & Supabase', icon: 'database' },
  tools: { title: 'Outils & Pratiques', icon: 'tools' },
}

export default function SkillsPage(): ReactElement {
  const [skills, setSkills] = useState<DbSkill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    portfolioService.getSkills().then((data) => {
      if (mounted) {
        setSkills(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const categories: SkillCategoryType[] = ['frontend', 'backend', 'database', 'tools']

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header de la page */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
            Stack Technique
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            Compétences & Écosystème
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Une architecture technique moderne structurée autour de standards de qualité éprouvés du frontend au backend.
          </p>
        </div>

        {/* Vue modulaire détaillant chaque pilier */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkillCategorySkeleton />
            <SkillCategorySkeleton />
            <SkillCategorySkeleton />
            <SkillCategorySkeleton />
          </div>
        ) : skills.length === 0 ? (
          <EmptyState
            title="Aucune compétence pour le moment"
            description="La table 'skills' sur Supabase est prête. Vos compétences ajoutées s'afficheront ici automatiquement."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((catKey) => {
              const catSkills = skills.filter((s) => s.category === catKey)
              const meta = CATEGORY_META[catKey]

              return (
                <div key={catKey} className="glass-card p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Icon name={meta.icon} className="size-5" />
                      </span>
                      <div>
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">{meta.title}</h2>
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          {catSkills.length} compétence{catSkills.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {catSkills.length === 0 ? (
                        <li className="text-xs font-mono text-zinc-400 italic">Aucune entrée</li>
                      ) : (
                        catSkills.map((skill) => (
                          <li key={skill.id} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm font-mono">
                                {skill.name}
                              </span>
                            </div>
                            {skill.description && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-3.5 leading-relaxed">
                                {skill.description}
                              </p>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    <span>Synchronisé Supabase</span>
                    <span className="text-indigo-600 dark:text-indigo-400">Temps réel</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
