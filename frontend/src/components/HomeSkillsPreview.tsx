import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { portfolioData } from '../data/portfolioData'
import Icon from './Icon'

export default function HomeSkillsPreview(): ReactElement {
  const { featuredTechs } = portfolioData

  return (
    <section id="stack-preview" aria-labelledby="skills-preview-title" className="py-20 border-t border-zinc-900 bg-zinc-950/40">
      <div className="container-custom">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            Technologies Maîtrisées
          </p>
          <h2 id="skills-preview-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-3">
            Le Coeur de ma Stack
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Les outils et technologies prioritaires au centre de mes projets web quotidiens.
          </p>
        </div>

        {/* Grille des 6 technologies principales sous forme de badges élégants */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-10">
          {featuredTechs.map((tech) => (
            <div
              key={tech.name}
              className="glass-card p-4 flex flex-col items-center text-center group hover:border-indigo-400/50 hover:bg-zinc-900/90 transition-all"
            >
              <div className="size-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-sm mb-3 group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all">
                {tech.name.slice(0, 2)}
              </div>
              <span className="font-semibold text-zinc-100 text-sm tracking-tight mb-1">
                {tech.name}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 leading-tight">
                {tech.role}
              </span>
            </div>
          ))}
        </div>

        {/* CTA vers /competences */}
        <div className="text-center">
          <Link
            to="/competences"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Voir toutes mes compétences</span>
            <Icon name="arrowRight" className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

