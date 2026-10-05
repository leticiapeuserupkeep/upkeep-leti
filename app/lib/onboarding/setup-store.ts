'use client'

import { useSyncExternalStore } from 'react'

/** What the first user has set up so far. Read by the sidebar's "Setup your
 * account" button, the Welcome page checklist and Work Orders, so it lives
 * in one external store instead of per-component state: every consumer sees
 * the same value the moment any one of them changes it. */
export interface SetupCounts {
  locations: number
  assets: number
  team: number
  workOrders: number
}

export interface SetupState {
  userName: string
  companyConfirmed: boolean
  counts: SetupCounts
  /** The user chose to create their first work order — Work Orders shows its
   * Nova empty state instead of the regular list until one exists. */
  workOrderLanding: boolean
  /** Recommended apps installed / products upgraded to — dropped from the
   * recommendations so the next-best one takes their place. */
  installedApps: string[]
  /** Offers the user turned down in chat — kept in "We think you'll need". */
  declinedOffers: string[]
  /** Checklist rows Nova is filling right now — shown as loading. */
  pending: (keyof SetupCounts)[]
  /** Things Nova made for the user (docs, apps…) — "What we created for you". */
  created: CreatedItem[]
  /** Nova is creating something for that list right now. */
  creating: boolean
  /** Apps connected during onboarding — for the completed checklist. */
  connectedApps: string[]
  /** The onboarding reached its end. Setup stays reachable, marked complete. */
  setupComplete: boolean
}

export interface CreatedItem {
  id: string
  title: string
  kind: 'google-doc' | 'pm' | 'work-order' | 'report'
  /** Secondary line, e.g. "Monthly" or "High priority". */
  detail?: string
  url?: string
}

const STORAGE_KEY = 'upkeep-setup-progress'

function initialState(): SetupState {
  return {
    userName: 'Leti',
    companyConfirmed: false,
    counts: { locations: 0, assets: 0, team: 0, workOrders: 0 },
    workOrderLanding: false,
    installedApps: [],
    declinedOffers: [],
    pending: [],
    created: [],
    creating: false,
    connectedApps: [],
    setupComplete: false,
  }
}

let state: SetupState = initialState()
let hydrated = false
const listeners = new Set<() => void>()

// In memory only: a page reload starts setup over (handy for testing), while
// moving between sections keeps it. Clears what older builds persisted.
function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* storage unavailable */ }
}

function emit() {
  listeners.forEach(l => l())
}

function subscribe(listener: () => void) {
  hydrate()
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const serverSnapshot = initialState()

export const setupStore = {
  get: () => { hydrate(); return state },
  update(patch: Partial<SetupState> | ((prev: SetupState) => Partial<SetupState>)) {
    hydrate()
    const next = typeof patch === 'function' ? patch(state) : patch
    state = { ...state, ...next }
    emit()
  },
  setCount(key: keyof SetupCounts, value: number) {
    setupStore.update(prev => ({ counts: { ...prev.counts, [key]: value } }))
  },
  install(id: string) {
    setupStore.update(prev => (prev.installedApps.includes(id) ? {} : { installedApps: [...prev.installedApps, id] }))
  },
  setPending(key: keyof SetupCounts, on: boolean) {
    setupStore.update(prev => ({ pending: on ? [...prev.pending.filter(k => k !== key), key] : prev.pending.filter(k => k !== key) }))
  },
  addCreated(item: CreatedItem) {
    setupStore.update(prev => ({ creating: false, created: prev.created.some(c => c.id === item.id) ? prev.created : [...prev.created, item] }))
  },
  decline(id: string) {
    setupStore.update(prev => (prev.declinedOffers.includes(id) ? {} : { declinedOffers: [...prev.declinedOffers, id] }))
  },
  reset() {
    state = initialState()
    emit()
  },
}

export function useSetupState(): SetupState {
  return useSyncExternalStore(subscribe, setupStore.get, () => serverSnapshot)
}

/** Account counts once the company is confirmed; the rest once they have
 * at least one item. */
export function setupProgress(s: SetupState): number {
  if (s.setupComplete) return 100
  const done = (s.companyConfirmed ? 1 : 0) + (Object.values(s.counts) as number[]).filter(n => n > 0).length
  return Math.round((done / 5) * 100)
}
