'use client'

import { Check, ChevronDown, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { AppLogo } from './NovaPrimitives'
import { UPKEEP_ROLES, type SuggestedPerson, type UpkeepRole } from '@/app/lib/onboarding/nova-onboarding-data'

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

/** People Nova found in the connected apps, each with a suggested UpKeep
 * role. Adding happens in place (the Team row on the right fills in) and
 * stops at the plan's seat limit — past it, the way forward is an upgrade. */
export function TeamSuggestionsCard({ people, added, adding, roles, seatLimit, seatsUsed, onRoleChange, onAdd, onAddAll, onUpgrade }: {
  people: SuggestedPerson[]
  added: string[]
  adding: string[]
  roles: Record<string, UpkeepRole>
  seatLimit: number
  seatsUsed: number
  onRoleChange: (id: string, role: UpkeepRole) => void
  onAdd: (p: SuggestedPerson) => void
  onAddAll: () => void
  onUpgrade: () => void
}) {
  const remaining = people.filter(p => !added.includes(p.id) && !adding.includes(p.id))
  const seatsLeft = Math.max(0, seatLimit - seatsUsed - adding.length)
  const addable = Math.min(remaining.length, seatsLeft)
  const full = seatsLeft === 0

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-3 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Suggested team members</span>
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">Maintenance people at Moline and East Moline · roles suggested from their titles</span>
        </div>
        {addable > 0 && (
          <Button variant="primary" size="md" onClick={onAddAll}>
            <UserPlus size={14} /> Add {addable === remaining.length ? `all ${addable}` : addable}
          </Button>
        )}
      </div>

      {/* Seats on the plan */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-[length:var(--font-size-sm)]">
          <span className="text-[var(--color-neutral-11)]">Seats on your trial</span>
          <span className="font-semibold tabular-nums text-[var(--color-neutral-12)]">{Math.min(seatsUsed + adding.length, seatLimit)} of {seatLimit}</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-[var(--color-neutral-3)]">
          <span
            className={`block h-full rounded-full transition-[width] duration-[var(--duration-slow)] ${full ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-accent-9)]'}`}
            style={{ width: `${Math.min(100, ((seatsUsed + adding.length) / seatLimit) * 100)}%` }}
          />
        </span>
      </div>

      <ul className="flex max-h-[420px] flex-col divide-y divide-[var(--border-subtle)] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        {people.map((p, i) => {
          const isAdded = added.includes(p.id)
          const isAdding = adding.includes(p.id)
          const role = roles[p.id] ?? p.suggestedRole
          return (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 nova-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-2)] text-[length:var(--font-size-xs)] font-semibold text-[var(--color-accent-11)]">
                {initials(p.name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5 text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)]">
                  {p.name} <AppLogo app={p.app} />
                </span>
                <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{p.role} · {p.plant}</span>
              </span>

              {/* UpKeep role — editable until they're added */}
              <label className="relative shrink-0">
                <span className="sr-only">Role for {p.name}</span>
                <select
                  value={role}
                  disabled={isAdded || isAdding}
                  onChange={e => onRoleChange(p.id, e.target.value as UpkeepRole)}
                  className="h-7 appearance-none rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] pl-2 pr-6 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none disabled:border-transparent disabled:bg-transparent disabled:text-[var(--color-neutral-9)] cursor-pointer disabled:cursor-default"
                >
                  {UPKEEP_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {!isAdded && !isAdding && <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-8)]" />}
              </label>

              <span className="flex w-[76px] shrink-0 justify-end">
                {isAdded ? (
                  <span className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-success)]">
                    <Check size={14} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} /> Added
                  </span>
                ) : isAdding ? (
                  <Loader2 size={14} className="animate-spin text-[var(--color-accent-9)]" />
                ) : full ? (
                  <Button variant="tertiary" size="sm" onClick={onUpgrade}>Upgrade</Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => onAdd(p)}>Add</Button>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {full && remaining.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--color-warning-light)] px-3 py-2.5 nova-enter">
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">
            Your trial includes {seatLimit} seats. Upgrade to add the other {remaining.length}.
          </span>
          <Button variant="primary" size="sm" onClick={onUpgrade}>Upgrade</Button>
        </div>
      )}
    </div>
  )
}
