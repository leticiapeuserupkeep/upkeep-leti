'use client'

import type { ReactNode } from 'react'

interface OnboardingSplitLayoutProps {
  children: ReactNode
  panel: ReactNode
}

/** Route-local layout: the real page on the left, Nova's guidance panel on
 * the right — never a parallel wizard replacing the real UI. */
export function OnboardingSplitLayout({ children, panel }: OnboardingSplitLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 w-full">
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      <div className="w-[400px] shrink-0 border-l border-[var(--border-default)] flex flex-col min-h-0 bg-[var(--surface-primary)]">
        {panel}
      </div>
    </div>
  )
}
