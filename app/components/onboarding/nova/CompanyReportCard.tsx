'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, ChevronRight, Loader2, MapPin, Box } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { COMPANY_REPORT, STARTER_ASSETS, SUGGESTED_PEOPLE, type PlanItem } from '@/app/lib/onboarding/nova-onboarding-data'

const PLANTS_PREVIEW = 5

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <section className="flex flex-col gap-2.5 nova-enter" style={{ animationDelay: `${delay}ms` }}>
      <h4 className="text-[length:var(--font-size-sm)] font-semibold uppercase tracking-[0.04em] text-[var(--color-neutral-8)]">{title}</h4>
      {children}
    </section>
  )
}

function EstimateTag() {
  return (
    <span className="inline-flex h-4 items-center rounded-full bg-[var(--color-warning-light)] px-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--color-warning)]">
      Estimate
    </span>
  )
}

/** The digested version of Nova's public research: the numbers that shape
 * the setup, where the plants are, and what's an estimate. What to do about
 * it comes next, in its own message (ActionPlanCard). */
/** The setup report. `bare` drops the card chrome and title, for when it's
 * shown inside the report panel that already has them. */
export function CompanyReportCard({ bare = false }: { bare?: boolean }) {
  const [allPlants, setAllPlants] = useState(false)
  const r = COMPANY_REPORT
  const maxPlants = Math.max(...r.plantsByCountry.map(c => c.plants))
  const productionShare = Math.round((r.workforce.production / r.workforce.total) * 100)
  const usShare = Math.round((r.workforce.us / r.workforce.total) * 100)

  return (
    <div className={bare ? 'flex w-full flex-col gap-6' : 'flex w-full max-w-[720px] flex-col gap-6 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter'}>
      {!bare && <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Deere &amp; Company · Setup report</span>
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">From public sources · 10-K FY25, deere.com, press</span>
        </div>
      </div>}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        {r.kpis.map((kpi, i) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] px-3 py-2.5 nova-enter" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="whitespace-nowrap text-[length:var(--font-size-xl)] font-semibold leading-7 tabular-nums text-[var(--color-neutral-12)]">{kpi.value}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">
              {kpi.label}
              {kpi.estimate && <EstimateTag />}
            </span>
            <span className="text-[length:var(--font-size-xs)] leading-4 text-[var(--color-neutral-8)]">{kpi.hint}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Section title="Plants by country" delay={200}>
          <ul className="flex flex-col gap-1.5">
            {r.plantsByCountry.map(c => (
              <li key={c.country} className="flex items-center gap-2" title={c.note}>
                <span className="w-[92px] shrink-0 truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">{c.country}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-3)]">
                  <span
                    className="block h-full rounded-full bg-[var(--color-accent-9)] origin-left"
                    style={{ width: `${(c.plants / maxPlants) * 100}%`, animation: 'nova-bar-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both' }}
                  />
                </span>
                <span className="w-5 text-right text-[length:var(--font-size-sm)] font-semibold tabular-nums text-[var(--color-neutral-12)]">{c.plants}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Workforce" delay={280}>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Production', share: productionShare, value: '32.5k of 73.1k' },
              { label: 'In the US', share: usShare, value: '27k · 11.6k in production' },
              { label: 'UAW (US production & maint.)', share: 77, value: 'Contract to Nov 2027' },
            ].map(row => (
              <div key={row.label} className="flex flex-col gap-1">
                <span className="flex items-center justify-between text-[length:var(--font-size-sm)]">
                  <span className="text-[var(--color-neutral-11)]">{row.label}</span>
                  <span className="font-semibold tabular-nums text-[var(--color-neutral-12)]">{row.share}%</span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-[var(--color-neutral-3)]">
                  <span className="block h-full rounded-full bg-[var(--color-purple)] origin-left" style={{ width: `${row.share}%`, animation: 'nova-bar-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both' }} />
                </span>
                <span className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-8)]">{row.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* US plants */}
      <Section title={`US plants · ${r.usPlants.length}`} delay={360}>
        <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
          {(allPlants ? r.usPlants : r.usPlants.slice(0, PLANTS_PREVIEW)).map(p => (
            <li key={p.name} className="flex items-center gap-3 px-3 py-2">
              <MapPin size={14} className="shrink-0 text-[var(--color-neutral-8)]" />
              <span className="w-[210px] shrink-0 truncate text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">{p.name}</span>
              <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{p.makes}</span>
              {p.note && <span className="shrink-0 text-[length:var(--font-size-xs)] text-[var(--color-neutral-8)]">{p.note}</span>}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setAllPlants(v => !v)}
          className="inline-flex w-fit items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-10)] hover:text-[var(--color-accent-12)] cursor-pointer"
        >
          {allPlants ? 'Show less' : `Show all ${r.usPlants.length}`}
          <ChevronRight size={14} className={`transition-transform duration-[var(--duration-normal)] ${allPlants ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </Section>

      {/* Hierarchy */}
      <Section title="Suggested hierarchy" delay={440}>
        <div className="flex flex-wrap items-center gap-1">
          {r.hierarchy.map((level, i) => (
            <span key={level} className="flex items-center gap-1">
              <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">{level}</span>
              {i < r.hierarchy.length - 1 && <ChevronRight size={12} className="text-[var(--color-neutral-7)]" />}
            </span>
          ))}
        </div>
      </Section>

    </div>
  )
}

/** One selectable line inside an expanded plan row. */
function CheckRow({ checked, onToggle, disabled, error = false, children }: { checked: boolean; onToggle: () => void; disabled: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-3 px-3 py-2 ${error ? 'bg-[var(--color-error-light)] [&_*]:!text-[var(--color-error)]' : ''}`}>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">{children}</span>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:cursor-default disabled:opacity-60 ${
          checked ? 'border-[var(--color-accent-9)] bg-[var(--color-accent-9)] text-white' : error ? 'border-[var(--color-error)] bg-[var(--surface-primary)]' : 'border-[var(--color-neutral-7)] bg-[var(--surface-primary)]'
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </button>
    </li>
  )
  }

/** Nova's setup suggestions. Each row expands to show (and
 * trim) exactly what would be added; nothing is added until the user says so.
 * The conversation waits here until it's handled. */
export function ActionPlanCard({ plan, generated, generating, skipped, gmailConnected, seatLimit, onGenerate, onGenerateAll, onSkip, onConnectGmail, onUpgradeSeats }: {
  plan: PlanItem[]
  generated: PlanItem['id'][]
  generating: PlanItem['id'][]
  skipped: boolean
  gmailConnected: boolean
  /** Team seats the plan allows — people past it wait on an upgrade. */
  seatLimit: number
  onGenerate: (item: PlanItem, count: number) => void
  onGenerateAll: (counts: Record<PlanItem['id'], number>) => void
  onSkip: () => void
  onConnectGmail: () => void
  onUpgradeSeats: () => void
}) {
  const r = COMPANY_REPORT
  const gmailPeople = SUGGESTED_PEOPLE.filter(p => p.app === 'gmail')
  const [open, setOpen] = useState<PlanItem['id'] | null>(null)
  // A row is "reviewed" once it's been opened — then its action is a plain Add.
  const [reviewed, setReviewed] = useState<Set<PlanItem['id']>>(new Set())
  function openRow(id: PlanItem['id'] | null) {
    setOpen(id)
    if (id) setReviewed(prev => new Set(prev).add(id))
  }
  // Once Gmail is connected the people are listed — open them for review.
  const [teamShownFor, setTeamShownFor] = useState(gmailConnected)
  if (gmailConnected && !teamShownFor) {
    setTeamShownFor(true)
    openRow('team')
  }
  const [plants, setPlants] = useState(() => new Set(r.usPlants.map(p => p.name)))
  const [assets, setAssets] = useState(() => new Set(STARTER_ASSETS.map(a => a.name)))
  const [people, setPeople] = useState(() => new Set(gmailPeople.map(p => p.id)))

  const counts: Record<PlanItem['id'], number> = {
    locations: plants.size,
    assets: STARTER_ASSETS.filter(a => assets.has(a.name)).reduce((n, a) => n + a.count, 0),
    team: gmailConnected ? people.size : (plan.find(i => i.id === 'team')?.count ?? 0),
  }
  const labels: Record<PlanItem['id'], string> = {
    locations: `${counts.locations} locations`,
    assets: `${counts.assets} assets`,
    team: `${counts.team} team members${gmailConnected ? ' · from Gmail' : ''}`,
  }
  // Once the team is added, the people past the seat limit show as left out.
  const teamAdded = generated.includes('team')
  const overSeats = teamAdded
    ? new Set(gmailPeople.filter(p => people.has(p.id)).slice(seatLimit).map(p => p.id))
    : new Set<string>()
  if (teamAdded && gmailConnected) labels.team = `${Math.min(people.size, seatLimit)} team members · from Gmail`
  const allQueued = plan.every(i => generated.includes(i.id) || generating.includes(i.id))

  function toggle(set: Set<string>, value: string, update: (s: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    update(next)
  }

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-5 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter">
      <Section title="Action plan">
        <div className="flex flex-col gap-2">
          {plan.map(item => {
            const done = generated.includes(item.id)
            const busy = generating.includes(item.id)
            const locked = done || busy
            // Team has nothing to review until Gmail is connected — its action is connecting.
            const needsGmail = item.id === 'team' && !gmailConnected
            const isOpen = open === item.id && !needsGmail
            return (
              <div key={item.id} className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => !needsGmail && openRow(isOpen ? null : item.id)}
                    aria-expanded={needsGmail ? undefined : isOpen}
                    className={`flex min-w-0 flex-1 items-start gap-1.5 text-left ${needsGmail ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <ChevronRight size={14} className={`mt-[3px] shrink-0 text-[var(--color-neutral-8)] transition-transform duration-[var(--duration-normal)] ${isOpen ? 'rotate-90' : ''} ${needsGmail ? 'invisible' : ''}`} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)]">{labels[item.id]}</span>
                      <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{item.detail}</span>
                    </span>
                  </button>
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-success)]">
                      <Check size={14} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} /> Added
                    </span>
                  ) : busy ? (
                    <span className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)]">
                      <Loader2 size={14} className="animate-spin" /> Adding…
                    </span>
                  ) : needsGmail ? (
                    <Button variant="secondary" size="sm" onClick={onConnectGmail}>
                      <Image src="/images/integrations/gmail.svg" alt="" width={12} height={12} /> Connect Gmail
                    </Button>
                  ) : (
                    reviewed.has(item.id)
                      ? <Button variant="primary" size="sm" disabled={counts[item.id] === 0} onClick={() => onGenerate(item, counts[item.id])}>Add</Button>
                      : <Button variant="secondary" size="sm" onClick={() => openRow(item.id)}>Review &amp; add</Button>
                  )}
                </div>

                {isOpen && (
                  <div className="border-t border-[var(--border-subtle)] nova-label-in">
                    {item.id === 'locations' && (
                      <ul className="flex max-h-[240px] flex-col divide-y divide-[var(--border-subtle)] overflow-y-auto">
                        {r.usPlants.map(p => (
                          <CheckRow key={p.name} checked={plants.has(p.name)} disabled={locked} onToggle={() => toggle(plants, p.name, setPlants)}>
                            <MapPin size={13} className="shrink-0 text-[var(--color-neutral-8)]" />
                            <span className="truncate font-medium text-[var(--color-neutral-12)]">{p.name}</span>
                            <span className="truncate text-[var(--color-neutral-8)]">{p.makes}</span>
                          </CheckRow>
                        ))}
                      </ul>
                    )}

                    {item.id === 'assets' && (
                      <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
                        {STARTER_ASSETS.map(a => (
                          <CheckRow key={a.name} checked={assets.has(a.name)} disabled={locked} onToggle={() => toggle(assets, a.name, setAssets)}>
                            <Box size={13} className="shrink-0 text-[var(--color-neutral-8)]" />
                            <span className="truncate font-medium text-[var(--color-neutral-12)]">{a.name}</span>
                            <span className="text-[var(--color-neutral-8)]">{a.count}</span>
                          </CheckRow>
                        ))}
                      </ul>
                    )}

                    {item.id === 'team' && gmailConnected && overSeats.size > 0 && (
                      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
                        <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-10)]">Your trial includes up to {seatLimit} team members.</span>
                        <button
                          type="button"
                          onClick={onUpgradeSeats}
                          className="inline-flex h-6 shrink-0 items-center rounded-full bg-[var(--color-error-light)] px-2.5 text-[length:var(--font-size-xs)] font-semibold text-[var(--color-error)] transition-colors hover:brightness-95 cursor-pointer"
                        >
                          Upgrade to add {overSeats.size} more {overSeats.size === 1 ? 'seat' : 'seats'}
                        </button>
                      </div>
                    )}
                    {item.id === 'team' && gmailConnected && (
                      <ul className="flex max-h-[240px] flex-col divide-y divide-[var(--border-subtle)] overflow-y-auto">
                        {gmailPeople.map(p => (
                          <CheckRow key={p.id} checked={people.has(p.id) && !overSeats.has(p.id)} error={overSeats.has(p.id)} disabled={locked} onToggle={() => toggle(people, p.id, setPeople)}>
                            <span className="truncate font-medium text-[var(--color-neutral-12)]">{p.name}</span>
                            <span className="truncate text-[var(--color-neutral-8)]">{p.role} · {p.plant}</span>
                          </CheckRow>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {!allQueued && (
          <div className="flex items-center justify-end gap-2">
            {!skipped && <Button variant="secondary" size="md" onClick={onSkip}>Skip for now</Button>}
            <Button variant="primary" size="md" onClick={() => onGenerateAll(counts)}>Add all</Button>
          </div>
        )}
      </Section>
    </div>
  )
}
