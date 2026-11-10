/** UpKeep plans, as on the public pricing page. Each plan includes the one
 * before it ("Essential +", "Premium +"…). */

export type PlanId = 'essential' | 'premium' | 'professional' | 'enterprise'

export interface Plan {
  id: PlanId
  name: string
  description: string
  /** Total per month, billed monthly. */
  monthly: number
  /** "Essential +" — what the plan builds on. */
  includesPrevious?: string
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'Small teams or single-site operations getting off spreadsheets or paper for the first time.',
    monthly: 312,
    features: ['Unlimited work orders', 'Unlimited locations', 'Nova AI'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Growing maintenance teams ready to move from reactive to preventive maintenance.',
    monthly: 715,
    includesPrevious: 'Essential',
    features: ['UpKeep Studio', 'PM scheduling', 'Custom checklists', 'Parts & inventory management with costing', 'Time & labor tracking', '30-day analytics history'],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Departments managing multiple asset types, needing field mobility and deeper analytics.',
    monthly: 1170,
    includesPrevious: 'Premium',
    features: ['Mobile offline mode', 'External request portal', 'Full analytics history', 'Asset lifecycle tracking', 'Signature capture for compliance'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Multi-site organizations needing automation, integrations, and governance controls.',
    monthly: 1885,
    includesPrevious: 'Professional',
    features: ['Multi-site module support', 'Workflow automation', 'Reliability & downtime tracking', 'PO management', 'API & custom integrations', 'SSO & custom roles', 'Custom dashboards'],
  },
]

/** Annual billing: 20% off, shown as the yearly total. */
export const ANNUAL_DISCOUNT = 0.2

export function planPrice(plan: Plan, billing: 'monthly' | 'annual'): number {
  return billing === 'monthly' ? plan.monthly : Math.round(plan.monthly * 12 * (1 - ANNUAL_DISCOUNT))
}

export function planById(id: PlanId): Plan {
  return PLANS.find(p => p.id === id)!
}

export function planRank(id: PlanId): number {
  return PLANS.findIndex(p => p.id === id)
}

/** Paid features that are open during the trial, and the plan that keeps them. */
export type ProFeature = 'pm' | 'checklists' | 'analytics' | 'parts' | 'requests' | 'fleet' | 'purchaseOrders' | 'workflows'

export const FEATURE_PLAN: Record<ProFeature, PlanId> = {
  pm: 'premium',
  checklists: 'premium',
  analytics: 'premium',
  parts: 'premium',
  requests: 'professional',
  fleet: 'professional',
  purchaseOrders: 'enterprise',
  workflows: 'enterprise',
}

/** How each feature's usage reads in the plans modal ("4 PM schedules"). */
export const FEATURE_UNITS: Record<ProFeature, [singular: string, plural: string]> = {
  pm: ['PM schedule', 'PM schedules'],
  checklists: ['checklist', 'checklists'],
  analytics: ['analytics dashboard', 'analytics dashboards'],
  parts: ['part', 'parts'],
  requests: ['request', 'requests'],
  fleet: ['vehicle', 'vehicles'],
  purchaseOrders: ['purchase order', 'purchase orders'],
  workflows: ['workflow', 'workflows'],
}

export function formatUsage(feature: ProFeature, count: number): string {
  const [one, many] = FEATURE_UNITS[feature]
  return `${count} ${count === 1 ? one : many}`
}
