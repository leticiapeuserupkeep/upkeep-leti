'use client'

import { useState, forwardRef } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

const CARD = 'flex w-full max-w-[560px] flex-col gap-4 rounded-[var(--radius-2xl)] border bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter'

/** Safety, the one other UpKeep product Nova suggests — from what it found. */
export function ProductFamilyCard({ answered, onAddSafety, onSkip }: {
  answered: boolean
  onAddSafety: () => void
  onSkip: () => void
}) {
  return (
    <div className="flex w-full max-w-[560px] items-center gap-4 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-md)] shadow-[var(--shadow-xs)] nova-enter">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">Safety</span>
          <span className="inline-flex h-5 items-center rounded-full bg-[var(--color-accent-2)] px-2 text-[length:var(--font-size-xs)] font-semibold text-[var(--color-accent-11)]">Recommended</span>
        </div>
        <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">Inspections, safety issues &amp; follow-ups</span>
      </div>
      {!answered && (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="md" onClick={onSkip}>Not now</Button>
          <Button variant="primary" size="md" onClick={onAddSafety}>Add</Button>
        </div>
      )}
    </div>
  )
}

export interface SetupStep {
  label: string
  done: boolean
  /** e.g. "15 locations" — shown while reviewing. */
  detail?: string
  href?: string
}

function SetupChecklist({ steps, review = false }: { steps: SetupStep[]; review?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2.5 nova-enter" style={{ animationDelay: `${i * 90}ms` }}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.done ? 'bg-[var(--color-success)] text-white' : 'border border-dashed border-[var(--color-neutral-6)]'}`}>
            {step.done && <Check size={12} strokeWidth={3} />}
          </span>
          <span className={`flex-1 text-[length:var(--font-size-base)] ${step.done ? 'text-[var(--color-neutral-12)]' : 'text-[var(--color-neutral-8)]'}`}>{step.label}</span>
          {review && step.detail && <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{step.detail}</span>}
          {review && step.href && (
            <Link href={step.href} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] hover:text-[var(--color-accent-10)]">View</Link>
          )}
        </li>
      ))}
    </ul>
  )
}

/** How much of the setup is done — green once it's all there. */
function CompleteBar({ percent }: { percent: number }) {
  const complete = percent >= 100
  const color = complete ? 'var(--color-success)' : 'var(--color-accent-9)'
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[length:var(--font-size-xs)] font-semibold uppercase tracking-[0.06em]" style={{ color }}>
        {complete ? '100% setup complete' : `${percent}% set up`}
      </span>
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-neutral-3)]">
        <span className="block h-full origin-left rounded-full" style={{ width: `${percent}%`, background: color, animation: 'nova-bar-grow 1s cubic-bezier(0.22, 1, 0.36, 1) both' }} />
      </span>
    </div>
  )
}

/** End of the onboarding, inside the conversation. "Setup complete" in the
 * nav brings the user back here; "Review setup" lists everything configured. */
export const SetupCompleteCard = forwardRef<HTMLDivElement, {
  steps: SetupStep[]
  /** The fuller list shown while reviewing. */
  reviewSteps: SetupStep[]
  onGo: () => void
  /** Share of the setup steps done, 0–100. */
  percent?: number
}>(function SetupCompleteCard({ steps, reviewSteps, onGo, percent = 100 }, ref) {
  const [review, setReview] = useState(false)
  return (
    <div ref={ref} className={`${CARD} border-[var(--border-default)] scroll-mt-4`}>
      <CompleteBar percent={percent} />
      {review ? <SetupChecklist key="review" steps={reviewSteps} review /> : <SetupChecklist key="done" steps={steps} />}
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="md" onClick={() => setReview(r => !r)}>{review ? 'Done reviewing' : 'Review setup'}</Button>
        <Button variant="primary" size="md" onClick={onGo}>Go to UpKeep</Button>
      </div>
    </div>
  )
})
