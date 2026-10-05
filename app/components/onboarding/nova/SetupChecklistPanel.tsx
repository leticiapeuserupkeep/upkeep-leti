'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Building2, MapPin, Box, Users, FileText, Check, Plus, ArrowRight, Loader2, type LucideIcon } from 'lucide-react'
import type { SetupCounts } from '@/app/lib/onboarding/setup-store'

const ITEMS: { key: keyof SetupCounts; label: string; icon: LucideIcon }[] = [
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'assets', label: 'Assets', icon: Box },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'workOrders', label: 'Work Order', icon: FileText },
]

const ROW = 'flex shrink-0 items-center gap-3 h-[60px] w-full rounded-[var(--radius-xl)] border px-[var(--space-md)] text-left transition-colors duration-[var(--duration-fast)]'

/** Live view of what's set up. Counts update as Nova adds things, so the
 * conversation visibly fills the workspace in. */
export function SetupChecklistPanel({ accountDone, counts, pending = [], onOpen, children }: {
  /** Rows Nova is adding to right now. */
  pending?: (keyof SetupCounts)[]
  /** Checks off once the user confirms what Nova found about the company. */
  accountDone: boolean
  counts: SetupCounts
  onOpen: (key: keyof SetupCounts) => void
  /** Extra content under the checklist, e.g. Nova's recommendations. */
  children?: ReactNode
}) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-[var(--space-md)] overflow-y-auto rounded-[var(--radius-3xl)] bg-[var(--surface-primary)] p-[var(--space-lg)]">
      <AccountRow done={accountDone} />

      {ITEMS.map(({ key, label, icon: Icon }, i) => (
        <ChecklistRow key={key} order={i + 1} label={label} icon={Icon} value={counts[key]} loading={pending.includes(key)} onClick={() => onOpen(key)} />
      ))}

      {children}
    </aside>
  )
}

/** One checklist row. When its count goes up it celebrates — the row pops
 * and glows, the counter bumps and a "+N" floats off it — so what Nova just
 * added is impossible to miss. */
function ChecklistRow({ order, label, icon: Icon, value, loading, onClick }: {
  /** Position in the boot-time assembly (see [data-stagger]). */
  order: number
  label: string
  icon: LucideIcon
  value: number
  loading: boolean
  onClick: () => void
}) {
  const previous = useRef(value)
  const [gain, setGain] = useState(0)
  // Bumps on every increase so back-to-back additions each replay.
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    const diff = value - previous.current
    previous.current = value
    if (diff <= 0) return
    setGain(diff)
    setBurst(b => b + 1)
    const id = window.setTimeout(() => setGain(0), 1100)
    return () => window.clearTimeout(id)
  }, [value])

  const celebrating = gain > 0

  return (
    <button
      key={burst}
      type="button"
      data-stagger
      style={{ '--base': '450ms', '--i': order * 1.6 } as React.CSSProperties}
      onClick={onClick}
      aria-label={`${value > 0 ? 'View' : 'Add'} ${label.toLowerCase()}`}
      className={`${ROW} group relative cursor-pointer bg-[var(--surface-primary)] hover:border-[var(--color-neutral-6)] ${
        celebrating ? 'nova-row-pop border-[var(--color-accent-7)]' : loading ? 'border-[var(--color-accent-6)]' : 'border-[var(--border-default)]'
      }`}
    >
      <Icon size={18} className={`transition-colors duration-[var(--duration-slow)] ${celebrating ? 'text-[var(--color-accent-9)]' : 'text-[var(--color-neutral-8)]'}`} />
      <span className="flex-1 text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{label}</span>
      <span className="relative">
        {/* Count at rest; spinner while Nova adds; on hover, add one — or view them once there are some. */}
        {loading ? (
          <span className="flex h-6 min-w-[36px] items-center justify-center rounded-full bg-[var(--color-accent-2)] px-2 text-[var(--color-accent-9)] nova-label-in">
            <Loader2 size={13} className="animate-spin" />
          </span>
        ) : <>
        <span
          className={`flex h-6 min-w-[36px] items-center justify-center rounded-full px-2 text-[length:var(--font-size-sm)] font-semibold tabular-nums group-hover:hidden ${
            value > 0 ? 'bg-[var(--color-accent-2)] text-[var(--color-accent-11)]' : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]'
          } ${celebrating ? 'nova-count-bump' : ''}`}
        >
          {value}
        </span>
        <span className="hidden h-6 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] group-hover:inline-flex nova-label-in">
          {value > 0 ? <>View <ArrowRight size={12} /></> : <><Plus size={12} /> Add</>}
        </span>
        </>}
        {celebrating && (
          <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2" aria-hidden>
            <span
              className="block text-[length:var(--font-size-sm)] font-bold text-[var(--color-accent-9)]"
              style={{ animation: 'nova-float-up 1.1s var(--ease-default) forwards' }}
            >
              +{gain}
            </span>
          </span>
        )}
      </span>
    </button>
  )
}

/** Pending until the company is confirmed; then the check pops in and the
 * row settles into its quiet "done" look. */
function AccountRow({ done }: { done: boolean }) {
  return (
    <div
      key={String(done)}
      data-stagger
      style={{ '--base': '450ms', '--i': 0 } as React.CSSProperties}
      className={`${ROW} ${done
        ? 'nova-row-pop border-[var(--border-subtle)] text-[var(--color-neutral-7)]'
        : 'border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-12)]'}`}
    >
      <Building2 size={18} className={done ? '' : 'text-[var(--color-neutral-8)]'} />
      <span className={`flex-1 text-[length:var(--font-size-base)] ${done ? 'font-medium' : 'font-semibold'}`}>Account</span>
      {done ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-neutral-2)]" style={{ animation: 'checkPop 0.45s var(--ease-default)' }}>
          <Check size={12} />
        </span>
      ) : (
        <span className="h-6 w-6 rounded-full border border-dashed border-[var(--color-neutral-6)]" aria-label="Not confirmed yet" />
      )}
    </div>
  )
}
