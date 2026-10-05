'use client'

import { AlertTriangle, Repeat, Flag, CalendarClock, FileText, Check, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { DonutChart } from '@/app/components/ui/DonutChart'
import { AppLogo } from './NovaPrimitives'
import { MAINTENANCE_OVERVIEW, type MaintenancePlanItem, type SourceId } from '@/app/lib/onboarding/nova-onboarding-data'

const TONE = {
  error: { chip: 'bg-[var(--color-error-light)] text-[var(--color-error)]', icon: AlertTriangle, rail: 'bg-[var(--color-error)]' },
  warning: { chip: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]', icon: Repeat, rail: 'bg-[var(--color-warning)]' },
  accent: { chip: 'bg-[var(--color-accent-2)] text-[var(--color-accent-11)]', icon: Flag, rail: 'bg-[var(--color-accent-9)]' },
}

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[length:var(--font-size-sm)] font-semibold uppercase tracking-[0.04em] text-[var(--color-neutral-8)]">{children}</h4>
)

/** The wow moment: what Nova found in the connected tools, with the three
 * things to look at first up top and the supporting numbers underneath. */
/** `bare` drops the card chrome and title, for the report panel. */
export function MaintenanceOverviewCard({ sources, bare = false }: { sources: SourceId[]; bare?: boolean }) {
  const o = MAINTENANCE_OVERVIEW
  const total = o.byStatus.reduce((n, s) => n + s.value, 0)
  const maxLocation = Math.max(...o.byLocation.map(l => l.value))
  const maxAsset = Math.max(...o.byAsset.map(l => l.value))

  return (
    <div className={bare ? 'flex w-full flex-col gap-5' : 'flex w-full max-w-[720px] flex-col gap-5 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter'}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          {!bare && <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">This week&rsquo;s maintenance overview</span>}
          <span className="flex items-center gap-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
            From {sources.map(s => <AppLogo key={s} app={s} />)}
          </span>
        </div>
      </div>

      {/* Top 3 — the most prominent part */}
      <section className="flex flex-col gap-2.5">
        <Heading>Top 3 to check first</Heading>
        <ol className="flex flex-col gap-2">
          {o.top.map((f, i) => {
            const tone = TONE[f.tone]
            const Icon = tone.icon
            return (
              <li
                key={f.title}
                className="relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] py-3 pl-4 pr-3 nova-enter"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${tone.rail}`} aria-hidden />
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-neutral-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{f.title}</span>
                  <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">{f.where}</span>
                  <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{f.detail}</span>
                </span>
                <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[length:var(--font-size-xs)] font-semibold ${tone.chip}`}>
                  <Icon size={12} /> {f.tag}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        {o.metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col gap-1 rounded-[var(--radius-lg)] px-3 py-2.5 nova-enter ${m.highlight ? 'bg-[var(--color-error-light)]' : 'bg-[var(--color-neutral-2)]'}`}
            style={{ animationDelay: `${300 + i * 80}ms` }}
          >
            <span className={`text-[length:var(--font-size-xl)] font-semibold leading-7 tabular-nums ${m.highlight ? 'text-[var(--color-error)]' : 'text-[var(--color-neutral-12)]'}`}>{m.value}</span>
            <span className="text-[length:var(--font-size-sm)] leading-4 text-[var(--color-neutral-10)]">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Charts — in the narrower report panel, the trend gets its own row. */}
      <div className={bare ? 'grid grid-cols-2 gap-x-4 gap-y-6 [&>*:last-child]:col-span-2' : 'grid grid-cols-3 gap-4'}>
        <section className="flex flex-col gap-2.5 nova-enter" style={{ animationDelay: '500ms' }}>
          <Heading>Open vs resolved</Heading>
          <div className="flex items-center gap-3">
            <DonutChart segments={o.byStatus} size={84} strokeWidth={12} centerValue={String(total)} centerLabel="issues" />
            <ul className="flex flex-col gap-1">
              {o.byStatus.map(s => (
                <li key={s.label} className="flex items-center gap-1.5 text-[length:var(--font-size-xs)] text-[var(--color-neutral-10)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label} · {s.value}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col gap-2.5 nova-enter" style={{ animationDelay: '580ms' }}>
          <Heading>By location</Heading>
          <Bars items={o.byLocation} max={maxLocation} />
        </section>

        <section className="flex flex-col gap-2.5 nova-enter" style={{ animationDelay: '660ms' }}>
          <Heading>By asset type</Heading>
          <Bars items={o.byAsset} max={maxAsset} />
        </section>
      </div>
    </div>
  )
}

function Bars({ items, max }: { items: { label: string; value: number }[]; max: number }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map(l => (
        <li key={l.label} className="flex items-center gap-2">
          <span className="w-[96px] shrink-0 truncate text-[length:var(--font-size-xs)] text-[var(--color-neutral-10)]">{l.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-3)]">
            <span className="block h-full origin-left rounded-full bg-[var(--color-accent-9)]" style={{ width: `${(l.value / max) * 100}%`, animation: 'nova-bar-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both' }} />
          </span>
          <span className="w-4 text-right text-[length:var(--font-size-xs)] font-semibold tabular-nums text-[var(--color-neutral-12)]">{l.value}</span>
        </li>
      ))}
    </ul>
  )
}

/** The plan built from the findings — recommendations until approved. */
export function MaintenancePlanCard({ items, added, adding, skipped, onAdd, onAddAll, onSkip }: {
  items: MaintenancePlanItem[]
  added: string[]
  adding: string[]
  skipped: boolean
  onAdd: (item: MaintenancePlanItem) => void
  onAddAll: () => void
  onSkip: () => void
}) {
  const allQueued = items.every(i => added.includes(i.id) || adding.includes(i.id))
  return (
    <div className="flex w-full max-w-[720px] flex-col gap-3 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter">
      <Heading>Action plan</Heading>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const done = added.includes(item.id)
          const busy = adding.includes(item.id)
          const Icon = item.kind === 'pm' ? CalendarClock : FileText
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] px-3 py-2.5 nova-enter" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] text-[var(--color-accent-9)]"><Icon size={16} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[length:var(--font-size-xs)] font-medium uppercase tracking-[0.04em] text-[var(--color-neutral-8)]">
                  {item.kind === 'pm' ? 'Preventive maintenance' : 'Work order'}
                </span>
                <span className="text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)]">{item.title}</span>
                <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{[item.detail, item.meta].filter(Boolean).join(' · ')}</span>
              </span>
              {done ? (
                <span className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-success)]">
                  <Check size={14} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} /> Created
                </span>
              ) : busy ? (
                <span className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)]">
                  <Loader2 size={14} className="animate-spin" /> Creating…
                </span>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => onAdd(item)}>{item.kind === 'pm' ? 'Create PM' : 'Create Work Order'}</Button>
              )}
            </div>
          )
        })}
      </div>
      {!allQueued && (
        <div className="flex items-center justify-end gap-2">
          {!skipped && <Button variant="secondary" size="md" onClick={onSkip}>Skip for now</Button>}
          <Button variant="primary" size="md" onClick={onAddAll}>Add all</Button>
        </div>
      )}
    </div>
  )
}
