import type { ReactElement } from 'react'
import { portfolioData } from '../data/portfolioData'
import Icon from '../components/Icon'

export default function SkillsPage(): ReactElement {
  const { skills } = portfolioData

  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-custom">
        {/* Header de la page */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">
            {skills.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 mb-4">
            {skills.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {skills.description}
          </p>
        </div>

        {/* Vue modulaire détaillant chaque pilier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {skills.categories.map((cat) => (
            <div key={cat.id} className="glass-card p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icon name={cat.icon} className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-zinc-100 text-lg">{cat.title}</h2>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {cat.skills.length} expertises clés
                    </span>
                  </div>
                </div>

                <ul className="space-y-4">
                  {cat.skills.map((skill) => (
                    <li key={skill.name} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span className="font-semibold text-zinc-200 text-sm font-mono">
                          {skill.name}
                        </span>
                      </div>
                      {skill.description && (
                        <p className="text-xs text-zinc-400 pl-3.5 leading-relaxed">
                          {skill.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Standards Web & Clean Code</span>
                <span className="text-indigo-400">100% Modulaire</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

