import type { ReactElement } from 'react'
import { portfolioData } from '../data/portfolioData'

const { profile, ui } = portfolioData

export default function About(): ReactElement {
  return (
    <section id="about" aria-labelledby="about-title" className="py-20 border-t border-zinc-900">
      <div className="container-custom">
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-2">{ui.about.eyebrow}</p>
          <h2 id="about-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-3">
            {ui.about.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 glass-card p-6 sm:p-8 space-y-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            {profile.fullBio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <aside aria-labelledby="about-summary-title" className="glass-card p-6 flex flex-col gap-4">
            <h3 id="about-summary-title" className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
              {ui.about.summaryTitle}
            </h3>
            <dl className="space-y-3 text-xs font-mono">
              {ui.about.summary.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-1.5 border-b border-zinc-800">
                  <dt className="text-zinc-400">{row.label}</dt>
                  <dd className={`text-right ${row.highlight ? 'text-emerald-400' : 'text-zinc-200'}`}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  )
}
