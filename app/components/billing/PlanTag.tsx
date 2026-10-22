'use client'

import { Sparkles } from 'lucide-react'
import { Tooltip, TooltipProvider } from '@/app/components/ui/Tooltip'
import { planById, type PlanId } from '@/app/lib/billing/plans'
import { openPlans } from '@/app/lib/billing/trial-usage'

/** Next to a paid section's title while it's used in the trial: which plan
 * keeps it. Opens the plans modal. */
export function PlanTag({ plan }: { plan: PlanId }) {
  const name = planById(plan).name
  return (
    <TooltipProvider>
    <Tooltip content={`Free during your trial — keep it with ${name}`} side="bottom" sideOffset={6}>
      <button
        type="button"
        onClick={openPlans}
        className="ml-2 inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[var(--color-purple-light)] px-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-purple)] transition-opacity hover:opacity-80 cursor-pointer"
      >
        <Sparkles size={12} /> {name} plan
      </button>
    </Tooltip>
    </TooltipProvider>
  )
}
