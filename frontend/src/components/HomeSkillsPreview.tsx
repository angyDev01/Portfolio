import { useEffect, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { DbSkill } from '../types/database'
import EmptyState from './EmptyState'
import Icon from './Icon'
import TechCard from './TechCard'

export default function HomeSkillsPreview(): ReactElement {
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

  // 6 compétences mises en avant (is_featured ou premières)
  const featured = skills.filter((s) => s.is_featured).slice(0, 6)
  const displaySkills = featured.length > 0 ? featured : skills.slice(0, 6)

  return (
    <section id="stack-preview" aria-labelledby="skills-preview-title" className="py-20 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40">
      <div className="container-custom">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
            Technologies Maîtrisées
          </p>
          <h2 id="skills-preview-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
            Le Coeur de ma Stack
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Les outils et technologies prioritaires au centre de mes projets web quotidiens.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 glass-card animate-pulse" />
            ))}
          </div>
        ) : displaySkills.length === 0 ? (
          <div className="mb-10">
            <EmptyState
              title="Aucune compétence pour le moment"
              description="Les technologies et compétences seront chargées très prochainement."
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-10">
            {displaySkills.map((skill) => (
              <TechCard key={skill.id} skill={skill} compact />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/competences"
            onMouseEnter={() => portfolioService.prefetch('skills')}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            <span>Voir toutes mes compétences</span>
            <Icon name="arrowRight" className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
