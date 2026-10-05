'use client'

import { Skeleton } from '@/app/components/ui/Skeleton'

/** Whole-app placeholder shown for a moment when the first-run experience
 * starts, before the real shell assembles itself piece by piece. */
export function AppBootSkeleton() {
  return (
    <div className="flex min-h-screen bg-[var(--surface-canvas)]" aria-busy="true" aria-label="Loading UpKeep">
      {/* Sidebar */}
      <aside className="flex h-screen w-[280px] shrink-0 flex-col gap-3 border-r border-[var(--border-default)] bg-[var(--surface-sidebar)] px-[var(--space-md)] py-4">
        <div className="flex h-7 items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-7 w-7" rounded="full" />
        </div>
        <Skeleton className="mt-2 h-11 w-full" rounded="lg" />
        {[5, 7, 5].map((rows, section) => (
          <div key={section} className="mt-3 flex flex-col gap-2.5">
            <Skeleton className="h-3 w-20" />
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" rounded="sm" />
                <Skeleton className={`h-3.5 ${['w-28', 'w-40', 'w-24', 'w-32', 'w-20'][i % 5]}`} />
              </div>
            ))}
          </div>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-[60px] items-center gap-3 border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-[var(--space-md)]">
          <Skeleton className="h-6 w-6" rounded="md" />
          <Skeleton className="h-5 w-24" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-[180px]" rounded="full" />
        </div>

        {/* Welcome + checklist */}
        <div className="flex flex-1 gap-[var(--space-lg)] bg-[var(--surface-primary)] p-[var(--space-lg)] pl-[var(--space-3xl)]">
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Skeleton className="h-8 w-[240px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <Skeleton className="h-[110px] w-full" rounded="lg" />
          </div>
          <div className="flex w-[300px] shrink-0 flex-col gap-[var(--space-md)] rounded-[var(--radius-3xl)] bg-[var(--surface-primary)] p-[var(--space-lg)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full" rounded="lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
