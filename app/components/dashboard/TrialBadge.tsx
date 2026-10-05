'use client'

import { CalendarDays, ChevronRight } from 'lucide-react'

export function TrialBadge({ daysLeft }: { daysLeft: number }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-error-light)] pl-3 pr-2 text-[length:var(--font-size-base)] text-[var(--color-neutral-11)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-error-border)] cursor-pointer"
    >
      <CalendarDays size={16} className="text-[var(--color-neutral-9)]" />
      Trial ends in <span className="-ml-1 font-semibold text-[var(--color-error)]">{daysLeft} days</span>
      <ChevronRight size={14} className="text-[var(--color-neutral-8)]" />
    </button>
  )
}
