'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, X, AlertTriangle } from 'lucide-react'
import { Modal, ModalBody } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { PLANS, planById, planPrice, planRank, formatUsage, FEATURE_PLAN, type PlanId } from '@/app/lib/billing/plans'
import { useTrialUsage, recommendedPlan, lostOnPlan } from '@/app/lib/billing/trial-usage'

type Billing = 'annual' | 'monthly'

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** The pricing page as a modal, opened from Billing / Upgrade. It recommends
 * the smallest plan that keeps what the team made during the trial, and warns
 * before a smaller plan drops some of it. */
export function PlansModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const usage = useTrialUsage()
  const recommended = recommendedPlan(usage)
  const [billing, setBilling] = useState<Billing>('monthly')
  // A smaller plan the user picked — waits on the "you'll lose…" confirmation.
  const [pending, setPending] = useState<PlanId | null>(null)
  const [chosen, setChosen] = useState<PlanId | null>(null)

  const used = (Object.entries(usage) as [keyof typeof usage, number][]).filter(([, n]) => n > 0)
  const pendingLosses = pending ? lostOnPlan(pending, usage) : []

  function pick(id: PlanId) {
    if (lostOnPlan(id, usage).length > 0) setPending(id)
    else confirm(id)
  }
  function confirm(id: PlanId) {
    setPending(null)
    setChosen(id)
  }
  function close(next: boolean) {
    onOpenChange(next)
    if (!next) window.setTimeout(() => { setPending(null); setChosen(null) }, 300)
  }

  return (
    <Modal open={open} onOpenChange={close} maxWidth="1200px" srTitle="Choose a plan">
      <Dialog.Close asChild>
        <button aria-label="Close" className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-neutral-8)] transition-colors hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] cursor-pointer">
          <X size={16} />
        </button>
      </Dialog.Close>
      <ModalBody className="relative bg-[var(--color-neutral-2)] px-[var(--space-2xl)] py-[var(--space-2xl)]">
        {chosen ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center nova-enter">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white"><Check size={22} /></span>
            <h2 className="text-[24px] font-bold text-[var(--color-neutral-12)]">You’re on {planById(chosen).name}</h2>
            <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-10)]">
              {money(planPrice(planById(chosen), billing))} total, billed {billing === 'monthly' ? 'monthly' : 'annually'}. Everything your team set up stays where it is.
            </p>
            <Button variant="primary" size="md" className="mt-2" onClick={() => close(false)}>Back to UpKeep</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-[30px] font-bold leading-tight tracking-[-0.01em] text-[var(--color-neutral-12)]">Choose the plan that is right for your team</h2>
              <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-10)]">
                To see a full list of features on our pricing page, <a href="https://www.onupkeep.com/pricing" target="_blank" rel="noreferrer" className="font-medium text-[var(--color-accent-9)] underline">click here.</a>
              </p>
            </div>

            {/* Annual / Monthly */}
            <div className="flex rounded-[var(--radius-xl)] bg-[var(--color-neutral-4)] p-1" role="radiogroup" aria-label="Billing period">
              {(['annual', 'monthly'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={billing === b}
                  onClick={() => setBilling(b)}
                  className={`h-9 w-[180px] rounded-[var(--radius-lg)] text-[length:var(--font-size-base)] font-medium capitalize transition-colors cursor-pointer ${
                    billing === b ? 'bg-[var(--surface-primary)] text-[var(--color-neutral-12)] shadow-[var(--shadow-sm)]' : 'text-[var(--color-neutral-11)] hover:text-[var(--color-neutral-12)]'
                  }`}
                >
                  {b}{b === 'annual' && <span className="ml-1.5 text-[length:var(--font-size-sm)] text-[var(--color-success)]">Save 20%</span>}
                </button>
              ))}
            </div>

            <div className="grid w-full grid-cols-1 gap-4 pb-[72px] pt-2 md:grid-cols-2 xl:grid-cols-4">
              {PLANS.map(plan => {
                const isRec = plan.id === recommended
                const losses = lostOnPlan(plan.id, usage)
                return (
                  <div
                    key={plan.id}
                    // The whole card picks the plan; the Upgrade button is the visual cue.
                    role="button"
                    tabIndex={0}
                    aria-label={`Choose ${plan.name}`}
                    onClick={() => pick(plan.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(plan.id) } }}
                    // Hover previews choosing it: blue border, blue CTA, a slight lift,
                    // and what it would drop slides in.
                    className={`group/plan relative flex cursor-pointer flex-col rounded-[var(--radius-xl)] outline-none focus-visible:border-[var(--color-accent-9)] border bg-[var(--surface-primary)] p-4 border-[var(--border-default)] transition-[scale,translate,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:z-10 hover:-translate-y-2 hover:scale-[1.05] hover:border-[var(--color-accent-9)] hover:shadow-[0_24px_48px_-12px_rgba(31,45,92,0.25)] ${
                      isRec ? 'hover:bg-[var(--color-accent-1)]' : ''
                    }`}
                  >
                    {isRec && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[var(--radius-sm)] bg-[var(--color-accent-9)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                        Recommended
                      </span>
                    )}
                    <h3 className="text-[20px] font-bold text-[var(--color-neutral-12)]">{plan.name}</h3>
                    <p className="mt-2 min-h-[60px] text-[length:var(--font-size-base)] leading-5 text-[var(--color-neutral-10)]">{plan.description}</p>
                    <div className="mt-4 flex items-end gap-1.5 border-b border-[var(--border-subtle)] pb-4">
                      <span className="text-[28px] font-bold leading-none text-[var(--color-neutral-12)]">{money(planPrice(plan, billing))}</span>
                      <span className="text-[10px] leading-3 text-[var(--color-neutral-10)]">total, billed {billing === 'monthly' ? 'monthly' : 'annually'}</span>
                    </div>
                    {plan.includesPrevious && <p className="mt-4 text-[length:var(--font-size-base)] text-[var(--color-neutral-12)]">{plan.includesPrevious} +</p>}
                    <ul className="mt-3 flex flex-1 flex-col gap-3">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-3 text-[length:var(--font-size-base)] leading-5 text-[var(--color-neutral-11)]">
                          <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-neutral-10)]" /> {f}
                        </li>
                      ))}
                    </ul>
                    {/* What the plan keeps or drops floats just under the card on hover,
                        so the card's height never changes. */}
                    {(isRec ? used.length > 0 : losses.length > 0) && (
                      <p
                        className={`pointer-events-none absolute inset-x-0 top-full mt-3 translate-y-[-6px] rounded-[8px] p-4 text-[length:var(--font-size-sm)] leading-4 text-[var(--color-neutral-11)] opacity-0 shadow-[var(--shadow-md)] transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/plan:translate-y-0 group-hover/plan:opacity-100 ${
                          isRec ? 'bg-[var(--color-accent-1)]' : 'bg-[var(--color-warning-light)]'
                        }`}
                      >
                        {isRec
                          ? <>You’ll keep all your trial work, including {joinList(used.map(([f, n]) => formatUsage(f, n)), true)}.</>
                          : <>You’ll lose: {joinList(losses.map(l => formatUsage(l.feature, l.count)), true)}.</>}
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      size="lg"
                      className="mt-4 w-full !duration-300 group-hover/plan:border-[var(--color-accent-9)] group-hover/plan:bg-[var(--color-accent-9)] group-hover/plan:text-white"
                      tabIndex={-1}
                      onClick={e => { e.stopPropagation(); pick(plan.id) }}
                    >
                      Upgrade
                    </Button>
                  </div>
                )
              })}
            </div>

            <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
              Our pricing is based on the number of Admin, Technician and Limited Technician users.{' '}
              <a href="https://help.onupkeep.com" target="_blank" rel="noreferrer" className="text-[var(--color-accent-9)] underline">Learn more about the type of user roles.</a>
            </p>
          </div>
        )}

        {/* Picking a smaller plan than what the trial used: say exactly what goes. */}
        {pending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 p-6 nova-enter" onClick={() => setPending(null)}>
            <div role="alertdialog" aria-label={`Switch to ${planById(pending).name}?`} onClick={e => e.stopPropagation()} className="flex w-full max-w-[440px] flex-col gap-4 rounded-[var(--radius-2xl)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-xl)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)]"><AlertTriangle size={18} /></span>
              <div className="flex flex-col gap-1">
                <h3 className="text-[length:var(--font-size-lg)] font-semibold text-[var(--color-neutral-12)]">Switch to {planById(pending).name}?</h3>
                <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-10)]">Your team made these during the trial. {planById(pending).name} doesn’t include them, so they’ll be lost:</p>
              </div>
              <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                {pendingLosses.map(l => (
                  <li key={l.feature} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[length:var(--font-size-base)]">
                    <span className="font-medium text-[var(--color-neutral-12)]">{formatUsage(l.feature, l.count)} will be lost</span>
                    <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">Needs {planById(FEATURE_PLAN[l.feature]).name}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="md" onClick={() => confirm(pending)}>Choose {planById(pending).name} anyway</Button>
                <Button variant="primary" size="md" onClick={() => confirm(planRank(recommended) > planRank(pending) ? recommended : pending)}>
                  Keep everything with {planById(recommended).name}
                </Button>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}

/** "a, b and c" — or "a, b, and c" with the serial comma. */
function joinList(items: string[], serialComma = false): string {
  if (items.length <= 1) return items.join('')
  const comma = serialComma && items.length > 2 ? ',' : ''
  return `${items.slice(0, -1).join(', ')}${comma} and ${items[items.length - 1]}`
}
