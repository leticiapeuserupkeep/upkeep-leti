'use client'

import { useState } from 'react'
import { DiscoveryLoading } from '@/app/components/onboarding/nova/discovery/DiscoveryLoading'
import { DiscoveryResults } from '@/app/components/onboarding/nova/discovery/DiscoveryResults'
import { discoveryScenario, simulateDiscovery, type ConfirmedDiscovery } from '@/app/lib/onboarding/discovery'

type Phase = 'loading' | 'results'

/** Onboarding V2's first screen, over everything (no sidebar or header yet):
 * Nova researches the company, then shows what it found to confirm.
 * `onFinish` gets what was confirmed, or null when the user skipped. */
export function NovaDiscovery({ onFinish }: { onFinish: (confirmed: ConfirmedDiscovery | null) => void }) {
  // `?scenario=partial|none|slow` tries the edge cases.
  const [run] = useState(() => simulateDiscovery(discoveryScenario(typeof window === 'undefined' ? '' : window.location.search)))
  const [phase, setPhase] = useState<Phase>('loading')
  // Each screen eases out before the next comes in.
  const [leaving, setLeaving] = useState<'loading' | 'overlay' | null>(null)

  const toResults = () => {
    setLeaving('loading')
    window.setTimeout(() => { setPhase('results'); setLeaving(null) }, 320)
  }
  const finish = (confirmed: ConfirmedDiscovery | null) => {
    setLeaving('overlay')
    window.setTimeout(() => onFinish(confirmed), 480)
  }

  return (
    <div
      className={`fixed inset-0 isolate z-[var(--z-modal)] overflow-y-auto bg-[#050b24] ${leaving === 'overlay' ? 'nova-overlay-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Setting up your workspace"
    >
      {/* Dark wave backdrop, drifting slowly behind everything. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="nova-discovery-backdrop" />
      </div>
      {/* While Nova researches: the way out, at the bottom of the screen. */}
      {phase === 'loading' && (
        <button
          type="button"
          onClick={() => finish(null)}
          className={`absolute bottom-[60px] left-1/2 -translate-x-1/2 text-[length:var(--font-size-sm)] font-medium text-white/50 underline underline-offset-2 transition-[color,opacity] duration-300 hover:text-white cursor-pointer ${leaving === 'loading' ? 'opacity-0' : ''}`}
        >
          Skip and set up myself
        </button>
      )}
      <div className="flex min-h-full items-center justify-center px-4 py-12">
        {phase === 'loading' ? (
          <DiscoveryLoading stepMs={run.stepMs} onDone={toResults} leaving={leaving === 'loading'} />
        ) : (
          <DiscoveryResults result={run.result} onConfirm={finish} onSkip={() => finish(null)} />
        )}
      </div>
    </div>
  )
}
