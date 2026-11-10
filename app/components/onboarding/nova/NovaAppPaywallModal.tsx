'use client'

import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Modal } from '@/app/components/ui/Modal'

export interface UpgradePitch {
  title: string
  description: string
  benefits: string[]
}

/** Default pitch: the Nova App that keeps the plant analysis running. */
const MONITOR_PITCH: UpgradePitch = {
  title: 'Keep this analysis running automatically',
  description: 'Nova Apps can monitor your connected sources and generate this operational report every month.',
  benefits: [
    'Re-runs this analysis every month on your connected sources',
    'Alerts your team the moment a new pattern appears',
    'Turns recurring issues into PMs before they become downtime',
  ],
}

/** Shown only after Nova has already delivered the value — so it reads as
 * "keep this running", not "this is locked". */
export function NovaAppPaywallModal({ open, onOpenChange, onUpgrade, pitch = MONITOR_PITCH }: {
  pitch?: UpgradePitch
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgrade: () => void
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="460px" srTitle={pitch.title}>
      <div className="flex flex-col gap-[var(--space-lg)] p-[var(--space-xl)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-accent-9)] to-[var(--color-purple)] text-white shadow-[var(--shadow-md)]" style={{ animation: 'ai-pulse 2.4s var(--ease-default) infinite' }}>
          <Sparkles size={22} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-[length:var(--font-size-xl)] font-semibold text-[var(--color-neutral-12)]">{pitch.title}</h2>
          <p className="text-[length:var(--font-size-md)] text-[var(--color-neutral-9)]">
            {pitch.description}
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {pitch.benefits.map(b => (
            <li key={b} className="flex items-start gap-2 text-[length:var(--font-size-base)] text-[var(--color-neutral-11)]">
              <Check size={16} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
              {b}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Button variant="primary" size="lg" onClick={onUpgrade}>Upgrade to unlock</Button>
          <Button variant="secondary" size="lg" onClick={() => onOpenChange(false)}>Maybe later</Button>
        </div>
      </div>
    </Modal>
  )
}
