'use client'

import { useSyncExternalStore } from 'react'
import { FEATURE_PLAN, planRank, type PlanId, type ProFeature } from '@/app/lib/billing/plans'

/** What the account has made with paid features during the trial — drives the
 * recommended plan and what a smaller plan would lose. In-memory, like the
 * setup store; seeded with a typical first week so the prototype tells a story. */
export type TrialUsage = Record<ProFeature, number>

const SEED: TrialUsage = {
  pm: 4,
  checklists: 2,
  analytics: 1,
  parts: 0,
  requests: 3,
  fleet: 0,
  purchaseOrders: 0,
  workflows: 0,
}

let state: TrialUsage = { ...SEED }
const listeners = new Set<() => void>()

export const trialUsageStore = {
  get: () => state,
  /** Record something made with a paid feature. */
  add(feature: ProFeature, by = 1) {
    state = { ...state, [feature]: state[feature] + by }
    listeners.forEach(l => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}

export function useTrialUsage(): TrialUsage {
  return useSyncExternalStore(trialUsageStore.subscribe, trialUsageStore.get, () => SEED)
}

/** The smallest plan that keeps everything the team used. */
export function recommendedPlan(usage: TrialUsage): PlanId {
  let best: PlanId = 'essential'
  for (const [feature, count] of Object.entries(usage) as [ProFeature, number][]) {
    if (count > 0 && planRank(FEATURE_PLAN[feature]) > planRank(best)) best = FEATURE_PLAN[feature]
  }
  return best
}

/** What the team made that a given plan doesn't include. */
export function lostOnPlan(plan: PlanId, usage: TrialUsage): { feature: ProFeature; count: number }[] {
  return (Object.entries(usage) as [ProFeature, number][])
    .filter(([feature, count]) => count > 0 && planRank(FEATURE_PLAN[feature]) > planRank(plan))
    .map(([feature, count]) => ({ feature, count }))
}

/** Opens the plans modal from anywhere (trial badge, Billing, plan tags). */
export const OPEN_PLANS_EVENT = 'upkeep:open-plans'
export function openPlans() {
  window.dispatchEvent(new CustomEvent(OPEN_PLANS_EVENT))
}
