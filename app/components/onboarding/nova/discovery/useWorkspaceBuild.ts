'use client'

import { useEffect, useRef, useState } from 'react'
import { setupStore, useSetupState, type SetupCounts, type SetupState } from '@/app/lib/onboarding/setup-store'
import type { ConfirmedDiscovery } from '@/app/lib/onboarding/discovery'

type Company = NonNullable<ConfirmedDiscovery['company']>

/** How long each checklist step takes to fill (prototype timing). */
const BUILD_MS = { start: 500, account: 800, locations: 1200, assets: 1800, team: 1200, gap: 250 }

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Onboarding V2: after the user confirms what Nova found, the setup
 * checklist fills itself in one step at a time — account, then each
 * location, asset and verified team member. Only confirmed data is saved;
 * a step with nothing confirmed stays pending. */
export function useWorkspaceBuild(confirmed: ConfirmedDiscovery | null, onAccount: (company: Company) => void) {
  // Account fill while it animates (0–1); undefined when not animating.
  const [accountProgress, setAccountProgress] = useState<number | undefined>()
  const [accountRows, setAccountRows] = useState<{ label: string; value: string }[]>([])
  const [building, setBuilding] = useState<keyof SetupCounts | undefined>()
  const [done, setDone] = useState(false)
  // Stopping keeps what's been added so far and skips the rest.
  const [stopped, setStopped] = useState(false)
  const account = useRef(onAccount)
  const accountSaved = useRef(false)
  // What the build left in the setup store, to put back if something wipes it.
  const result = useRef<Pick<SetupState, 'counts' | 'addedNames'> | null>(null)
  const remember = () => {
    const { counts, addedNames } = setupStore.get()
    result.current = { counts, addedNames }
  }
  useEffect(() => { account.current = onAccount })

  useEffect(() => {
    // Built once; a re-run (e.g. a hot reload) doesn't build it again.
    if (!confirmed || stopped || result.current) return
    let cancelled = false
    const speed = reducedMotion() ? 0.25 : 1
    const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms * speed))

    /** Adds the names one by one over `ms` — a count-up, not one row each
     * when there are many. */
    async function fill(key: 'locations' | 'assets' | 'team', names: string[], ms: number) {
      if (cancelled || names.length === 0) return
      setBuilding(key)
      const per = ms / names.length
      for (let i = 1; i <= names.length; i++) {
        await wait(per)
        if (cancelled) return
        setupStore.update(prev => ({
          counts: { ...prev.counts, [key]: i },
          ...(key === 'team' ? {} : { addedNames: { ...prev.addedNames, [key]: names.slice(0, i) } }),
        }))
      }
      await wait(BUILD_MS.gap)
      setBuilding(undefined)
    }

    ;(async () => {
      await wait(BUILD_MS.start)
      const company = confirmed.company
      if (company && !cancelled) {
        // Account 0 → 100%: its details appear as the ring fills.
        const rows = [
          { label: 'Company', value: company.name },
          { label: 'Industry', value: company.industry },
          { label: 'Company size', value: company.size },
        ]
        setAccountProgress(0)
        for (let i = 1; i <= rows.length; i++) {
          await wait(BUILD_MS.account / rows.length)
          if (cancelled) return
          setAccountRows(rows.slice(0, i))
          setAccountProgress(i / rows.length)
        }
        await wait(BUILD_MS.gap)
        if (cancelled) return
        account.current(company)
        accountSaved.current = true
        setAccountProgress(undefined)
        await wait(BUILD_MS.gap)
      }
      if (cancelled) return
      await fill('locations', confirmed.locations, BUILD_MS.locations)
      await fill('assets', confirmed.assets, BUILD_MS.assets)
      // Roles alone aren't people: the team waits for real invites.
      await fill('team', confirmed.members, BUILD_MS.team)
      if (cancelled) return
      remember()
      setDone(true)
    })()
    return () => { cancelled = true }
  }, [confirmed, stopped])

  // Nova's conversation starts the setup store over when it (re)mounts — e.g.
  // on a dev hot reload. Once built, the confirmed workspace comes back.
  const setup = useSetupState()
  useEffect(() => {
    const built = result.current
    if (!done || !built) return
    const wiped = (['locations', 'assets', 'team'] as const).every(k => setup.counts[k] === 0)
      && (['locations', 'assets', 'team'] as const).some(k => built.counts[k] > 0)
    if (wiped) {
      setupStore.update(prev => ({
        counts: { ...prev.counts, locations: built.counts.locations, assets: built.counts.assets, team: built.counts.team },
        addedNames: built.addedNames,
      }))
    }
    if (confirmed?.company && accountSaved.current && !setup.companyConfirmed) account.current(confirmed.company)
  }, [done, setup.counts, setup.companyConfirmed, confirmed])

  const stop = () => {
    // The company was confirmed, so it's saved even when stopped early.
    if (confirmed?.company && !accountSaved.current) {
      accountSaved.current = true
      account.current(confirmed.company)
    }
    remember()
    setStopped(true)
    setBuilding(undefined)
    setAccountProgress(undefined)
    setDone(true)
  }

  return { accountProgress, accountRows, building, done, stop }
}
