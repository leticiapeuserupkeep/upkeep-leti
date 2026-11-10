import type { SourceId } from './nova-onboarding-data'

/** Everything Nova has learned so far that can change what it recommends. */
export interface RecommendationSignals {
  companyConfirmed: boolean
  industry: string
  employees: string
  /** Nova has shown the company report. */
  findingShown: boolean
  connected: SourceId[]
  assets: number
  installed: string[]
  /** Offers declined in the conversation — they stay available here. */
  declined: string[]
}

export type RecommendationIcon = 'learn' | 'safety' | 'edge' | 'import' | 'pm' | 'vendor' | 'handover'

export interface Recommendation {
  id: string
  name: string
  kind: 'product' | 'app'
  /** Studio apps install free; UpKeep products need a plan upgrade. */
  action: 'install' | 'upgrade'
  icon: RecommendationIcon
  /** Why Nova thinks this fits — always tied to something it actually knows. */
  reason: string
  /** Paywall copy for upgrade products. */
  pitch?: { title: string; description: string; benefits: string[] }
  score: number
}

type Rule = (s: RecommendationSignals) => Recommendation | null

/** UpKeep Safety, offered in the conversation after the plant report. */
export const SAFETY_OFFER: Recommendation = {
  id: 'safety', name: 'UpKeep Safety', kind: 'product', action: 'upgrade', icon: 'safety',
  reason: 'Safety inspections keep coming up in your maintenance issues.',
  pitch: {
    title: 'Keep safety connected to maintenance',
    description: 'UpKeep Safety lets your team run inspections, report hazards and follow up on issues before they turn into bigger problems.',
    benefits: ['Run safety inspections', 'Report hazards from any phone', 'Track follow-ups next to the work orders they lead to'],
  },
  score: 70,
}

/** More seats than the trial includes — offered when the team fills up. */
export const SEATS_OFFER: Recommendation = {
  id: 'seats', name: 'More seats', kind: 'product', action: 'upgrade', icon: 'learn',
  reason: 'Bring your whole maintenance team into UpKeep.',
  pitch: {
    title: 'Bring your whole team in',
    description: 'Your trial includes 10 seats. Upgrade to add everyone who keeps Moline and East Moline running.',
    benefits: ['Unlimited technicians and requesters', 'Roles and permissions per plant', 'Invite contractors with limited access'],
  },
  score: 0,
}

const RULES: Rule[] = [
  // Offered in the chat first; only shows here once the user says "not now".
  () => ({ ...SAFETY_OFFER, score: 100 }),

  s => s.companyConfirmed ? {
    id: 'learn', name: 'UpKeep Learn', kind: 'product', action: 'upgrade', icon: 'learn',
    reason: s.connected.includes('drive')
      ? 'Turn your PM procedures in Drive into training for technicians.'
      : 'Onboard the 375 technicians being rehired in the Quad Cities.',
    pitch: {
      title: 'Turn know-how into training',
      description: 'UpKeep Learn turns your SOPs and procedures into short courses technicians can take on the floor.',
      benefits: ['Courses generated from your existing documents', 'Track who is certified on which equipment', 'Assign training straight from a work order'],
    },
    score: s.connected.includes('drive') ? 88 : 80,
  } : null,

  s => s.findingShown ? {
    id: 'sap-importer', name: 'SAP PM Importer', kind: 'app', action: 'install', icon: 'import',
    reason: 'Deere most likely runs SAP PM today — bring assets and PMs over.',
    score: 90,
  } : null,

  s => s.findingShown ? {
    id: 'edge', name: 'UpKeep Edge', kind: 'product', action: 'upgrade', icon: 'edge',
    reason: 'Connect the sensors and PLCs already on your lines to UpKeep.',
    pitch: {
      title: 'Catch failures before they stop a line',
      description: 'UpKeep Edge connects your sensors and PLCs to assets and opens a work order the moment readings drift.',
      benefits: ['Live readings from existing PLCs and sensors', 'Automatic work orders on threshold breaches', 'Runtime-based PMs for robots and CNCs'],
    },
    score: 75,
  } : null,

  s => s.assets > 0 ? {
    id: 'pm-planner', name: 'PM Planner', kind: 'app', action: 'install', icon: 'pm',
    reason: `Plan preventive work across your ${s.assets} new assets on one calendar.`,
    score: 85,
  } : null,

  s => s.connected.includes('gmail') ? {
    id: 'vendor-scorecard', name: 'Vendor Scorecard', kind: 'app', action: 'install', icon: 'vendor',
    reason: 'Emergency vendor calls came up 5 times in Gmail — track response times.',
    score: 65,
  } : null,

  s => s.connected.includes('slack') || s.connected.includes('teams') ? {
    id: 'shift-handover', name: 'Shift Handover', kind: 'app', action: 'install', icon: 'handover',
    reason: 'Most robot faults are raised on 2nd shift — hand issues over cleanly.',
    score: 60,
  } : null,
]

/** Nova offers each of these in the chat first; the right panel only keeps
 * the ones the user turned down, so they're one click away later. Reasons
 * are recomputed from the signals, so they stay current. */
export function recommend(signals: RecommendationSignals, limit = 3): Recommendation[] {
  return RULES
    .map(rule => rule(signals))
    .filter((r): r is Recommendation => r !== null && signals.declined.includes(r.id) && !signals.installed.includes(r.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** A recommendation by id, as Nova would pitch it in the chat right now. */
export function offerFor(id: string, signals: RecommendationSignals): Recommendation | null {
  for (const rule of RULES) {
    const r = rule(signals)
    if (r?.id === id) return r
  }
  return null
}
