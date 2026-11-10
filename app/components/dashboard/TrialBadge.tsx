'use client'

import { CalendarDays, ChevronRight } from 'lucide-react'

/** Trial countdown. On hover an "Upgrade" button slides in where the chevron
 * was, so the way to keep going is right there. */
export function TrialBadge({ daysLeft, onUpgrade }: { daysLeft: number; onUpgrade?: () => void }) {
  return (
    <button
      type="button"
      onClick={onUpgrade}
      aria-label={`Trial ends in ${daysLeft} days — upgrade`}
      className="group inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-error-light)] pl-3 pr-1 text-[length:var(--font-size-base)] text-[var(--color-neutral-11)] transition-colors duration-300 hover:bg-[var(--color-accent-1)] cursor-pointer"
    >
      <CalendarDays size={16} className="text-[var(--color-neutral-9)]" />
      Trial ends in <span className="-ml-1 font-semibold text-[var(--color-error)]">{daysLeft} days</span>
      {/* Chevron and Upgrade swap smoothly: each collapses/expands its own width. */}
      <span className="grid grid-cols-[1fr] opacity-100 transition-[grid-template-columns,opacity] duration-300 ease-out group-hover:grid-cols-[0fr] group-hover:opacity-0">
        <span className="min-w-0 overflow-hidden"><ChevronRight size={14} className="mr-1 text-[var(--color-neutral-8)]" /></span>
      </span>
      <span className="-ml-2 grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity,margin] duration-300 ease-out group-hover:ml-0 group-hover:grid-cols-[1fr] group-hover:opacity-100">
        <span className="min-w-0 overflow-hidden">
          <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full bg-[var(--color-accent-9)] px-3 text-[length:var(--font-size-sm)] font-medium text-white">
            Upgrade
          </span>
        </span>
      </span>
    </button>
  )
}
