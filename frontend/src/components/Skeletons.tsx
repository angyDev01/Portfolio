import type { ReactElement } from 'react'

export function ProjectCardSkeleton(): ReactElement {
  return (
    <div className="glass-card p-5 sm:p-6 flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="h-5 bg-zinc-800 rounded-md w-2/3" />
          <div className="size-6 bg-zinc-800/80 rounded" />
        </div>
        <div className="h-3 bg-zinc-800/60 rounded w-1/3 mb-4" />
        <div className="space-y-2 mb-6">
          <div className="h-3 bg-zinc-800/40 rounded w-full" />
          <div className="h-3 bg-zinc-800/40 rounded w-5/6" />
        </div>
      </div>
      <div className="pt-3 border-t border-zinc-800/60 flex gap-2">
        <div className="h-5 bg-zinc-800/60 rounded w-16" />
        <div className="h-5 bg-zinc-800/60 rounded w-20" />
        <div className="h-5 bg-zinc-800/60 rounded w-14" />
      </div>
    </div>
  )
}

export function SkillCategorySkeleton(): ReactElement {
  return (
    <div className="glass-card p-6 sm:p-7 flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
          <div className="size-10 bg-zinc-800 rounded-lg shrink-0" />
          <div className="space-y-1.5 w-full">
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
            <div className="h-2.5 bg-zinc-800/60 rounded w-1/3" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 bg-zinc-800/80 rounded w-3/4" />
              <div className="h-2.5 bg-zinc-800/40 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-zinc-800/80 flex justify-between">
        <div className="h-2.5 bg-zinc-800/40 rounded w-24" />
        <div className="h-2.5 bg-zinc-800/40 rounded w-20" />
      </div>
    </div>
  )
}

