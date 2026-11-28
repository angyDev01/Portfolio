import type { ReactElement } from 'react'

export function ProjectCardSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="aspect-video w-full rounded-lg bg-line/60" />
      <div className="space-y-2.5">
        <div className="h-5 bg-line/70 rounded w-2/3" />
        <div className="h-3.5 bg-line/50 rounded w-full" />
        <div className="h-3.5 bg-line/50 rounded w-4/5" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-6 bg-line/50 rounded w-16" />
        <div className="h-6 bg-line/50 rounded w-20" />
      </div>
    </div>
  )
}

export function ProjectFeatureSkeleton(): ReactElement {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 aspect-video rounded-lg bg-line/60" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-7 bg-line/70 rounded w-3/4" />
          <div className="h-4 bg-line/50 rounded w-full" />
          <div className="h-4 bg-line/50 rounded w-5/6" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-line/50 rounded w-16" />
            <div className="h-6 bg-line/50 rounded w-16" />
          </div>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="pt-6 border-t border-line flex items-center justify-between gap-4">
          <div className="h-5 bg-line/60 rounded w-1/3" />
          <div className="h-4 bg-line/40 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

export function SkillCategorySkeleton(): ReactElement {
  return (
    <div className="py-8 border-t border-line section-rail animate-pulse">
      <div className="space-y-2">
        <div className="h-6 bg-line/70 rounded w-36" />
        <div className="h-3.5 bg-line/50 rounded w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-line/40 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
