import { useState, type ReactElement } from 'react'
import type { DbSkill } from '../types/database'
import TechLogo, { getTechDetails } from './TechLogo'

interface TechCardProps {
  skill: DbSkill
  compact?: boolean
  showDescription?: boolean
}

export default function TechCard({
  skill,
  compact = false,
  showDescription = false,
}: TechCardProps): ReactElement {
  const [hovered, setHovered] = useState(false)
  const tech = getTechDetails(skill.name)

  const cardStyle: React.CSSProperties = {
    borderColor: hovered ? `${tech.color}66` : undefined,
    boxShadow: hovered
      ? `0 14px 28px -6px ${tech.color}25, 0 0 16px -2px ${tech.color}20`
      : undefined,
  }

  if (compact) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={cardStyle}
        className="relative p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center text-center transition-all duration-300 group hover:-translate-y-1 overflow-hidden shadow-xs"
      >
        {/* Lueur subtile en arrière-plan au survol */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(circle at 50% 30%, ${tech.color}18, transparent 75%)` }}
          aria-hidden="true"
        />

        {/* Conteneur sombre zinc du logo officiel */}
        <div
          className="relative size-12 rounded-xl bg-zinc-100 dark:bg-zinc-950/90 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300"
          style={{
            borderColor: hovered ? `${tech.color}40` : undefined,
          }}
        >
          <TechLogo name={skill.name} size={28} className="transition-transform duration-300" />
        </div>

        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight mb-1 truncate max-w-full group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
          {skill.name}
        </span>
        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 leading-tight capitalize">
          {skill.category}
        </span>
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardStyle}
      className="relative p-3.5 sm:p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-300 group hover:-translate-y-0.5 overflow-hidden shadow-xs"
    >
      {/* Lueur subtile en arrière-plan */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 10% 50%, ${tech.color}15, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3">
        {/* Conteneur sombre zinc du logo officiel */}
        <div
          className="size-11 sm:size-12 rounded-xl bg-zinc-100 dark:bg-zinc-950/90 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300"
          style={{
            borderColor: hovered ? `${tech.color}40` : undefined,
          }}
        >
          <TechLogo name={skill.name} size={24} className="transition-transform duration-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm font-mono tracking-tight truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
              {skill.name}
            </h3>
            {skill.is_featured && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Core
              </span>
            )}
          </div>
          {showDescription && skill.description ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {skill.description}
            </p>
          ) : (
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 capitalize">
              {skill.category}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

