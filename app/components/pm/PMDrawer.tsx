'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import {
  X, Pencil, Maximize2, MoreHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Plus, Image as ImageIcon, FileText, ListChecks, CalendarClock, Flag,
} from 'lucide-react'
import { Avatar } from '@/app/components/ui'
import { Button } from '@/app/components/ui/Button'
import { Chip } from '@/app/components/ui/Chip'

// ── Types shared with the list page (minimal) ────────────────────────────────

interface TechAvatar { initials: string; bg: string }

interface AssignmentRow {
  id: string; asset: string; assetType: string; location: string
  meter?: string; technicians: TechAvatar[]; extraTechs?: number
  woCount?: number; lastWO?: string; nextWO?: string; startDate?: string; endDate?: string
}

interface PMSchedule {
  id: string; calendarTrigger: string; meterTrigger?: string; assignments: AssignmentRow[]
}

interface PMItem {
  id: string; title: string; description?: string
  category: string; priority: string; status: string
  checklists?: string[]; schedules: PMSchedule[]
}

interface PMDrawerProps {
  pm: PMItem | null
  onClose: () => void
  onEdit: (pm: PMItem) => void
  /** Section to land on when the drawer opens. Defaults to Details. */
  initialTab?: DrawerTab
}

type DrawerTab = 'Details' | 'Tasks' | 'Schedules' | 'Work Orders'

/** Tabs scroll the single page to their section rather than swapping content. */
const TABS: { key: DrawerTab; section: string }[] = [
  { key: 'Details', section: 'pm-details' },
  { key: 'Tasks', section: 'pm-tasks' },
  { key: 'Schedules', section: 'pm-schedules' },
  { key: 'Work Orders', section: 'pm-work-orders' },
]

const PRIORITY_COLOR: Record<string, string> = {
  High: 'text-[var(--color-error)]',
  Medium: 'text-[var(--color-warning)]',
  Low: 'text-[var(--color-success)]',
  None: 'text-[var(--color-neutral-6)]',
}

function AvatarRow({ techs, extra = 0 }: { techs: TechAvatar[]; extra?: number }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {techs.slice(0, 3).map((t, i) => (
        <Avatar key={i} name={t.initials.split('').join(' ')} size="xs" className="ring-2 ring-[var(--surface-primary)]" />
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-neutral-4)] text-[var(--color-neutral-8)] text-[9px] font-bold ring-2 ring-[var(--surface-primary)] shrink-0">
          +{extra}
        </span>
      )}
    </div>
  )
}

/** Icon-only header control. */
function HeaderButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}

/**
 * Collapsible section with a heading row. `action` sits to the left of the
 * collapse chevron so the chevron stays the rightmost affordance throughout.
 */
function Section({
  id, title, action, children, defaultOpen = true, className = '',
}: { id?: string; title: string; action?: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className={`px-5 py-5 border-b border-[var(--border-subtle)] last:border-0 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-[16px] font-semibold text-[var(--color-neutral-12)]">{title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={open}
            className="flex items-center justify-center w-6 h-6 rounded-[var(--radius-md)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"
          >
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>
      {open && children}
    </section>
  )
}

/** Label/value row inside the Details card, separated by a dashed rule. */
function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-dashed border-[var(--border-default)] last:border-0">
      <span className="w-[92px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)]">{label}</span>
      <div className="flex-1 min-w-0 text-[length:var(--control-font-size-base)] text-[var(--color-neutral-11)]">{children}</div>
    </div>
  )
}

/** Count pill used by the Images / Files / Work Orders headings. */
function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--color-neutral-3)] text-[12px] font-medium text-[var(--color-neutral-9)]">
      {children}
    </span>
  )
}

export function PMDrawer({ pm, onClose, onEdit, initialTab = 'Details' }: PMDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('Details')
  const [descExpanded, setDescExpanded] = useState(false)
  // Whether the description is actually long enough to be clamped — the toggle
  // is pointless when the whole thing already fits.
  const [descOverflows, setDescOverflows] = useState(false)
  const descRef = useRef<HTMLParagraphElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Suppresses the scroll spy while a tab-initiated smooth scroll is in flight,
  // so the active tab doesn't flicker through the sections it passes over.
  const scrollingTo = useRef<DrawerTab | null>(null)

  // Reset when the PM changes, landing on the requested section. The jump waits
  // a frame so the body has rendered and section offsets are real.
  useEffect(() => {
    setTab(initialTab)
    setDescExpanded(false)
    const frame = requestAnimationFrame(() => {
      const body = bodyRef.current
      if (!body) return
      const target = TABS.find(x => x.key === initialTab)
      const el = target && body.querySelector<HTMLElement>(`#${target.section}`)
      body.scrollTop = el ? el.offsetTop : 0
    })
    return () => cancelAnimationFrame(frame)
  }, [pm?.id, initialTab])

  useEffect(() => {
    const el = descRef.current
    if (!el) { setDescOverflows(false); return }
    // Only measurable while clamped; expanded, the text always fits its own box.
    const measure = () => { if (!descExpanded) setDescOverflows(el.scrollHeight > el.clientHeight + 1) }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pm?.id, pm?.description, descExpanded])

  const goToSection = useCallback((t: DrawerTab) => {
    setTab(t)
    const body = bodyRef.current
    const target = TABS.find(x => x.key === t)
    if (!body || !target) return
    const el = body.querySelector<HTMLElement>(`#${target.section}`)
    if (!el) return
    scrollingTo.current = t
    body.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
  }, [])

  // Scroll spy: the active tab follows whichever section header is at the top.
  useEffect(() => {
    const body = bodyRef.current
    if (!body || !pm) return
    const onScroll = () => {
      if (scrollingTo.current) {
        const target = TABS.find(x => x.key === scrollingTo.current)
        const el = target && body.querySelector<HTMLElement>(`#${target.section}`)
        // Settled close enough to the target — hand control back to the spy.
        if (el && Math.abs(body.scrollTop - el.offsetTop) < 4) scrollingTo.current = null
        return
      }
      let current: DrawerTab = TABS[0].key
      for (const t of TABS) {
        const el = body.querySelector<HTMLElement>(`#${t.section}`)
        if (el && el.offsetTop - body.scrollTop <= 8) current = t.key
      }
      setTab(prev => (prev === current ? prev : current))
    }
    body.addEventListener('scroll', onScroll, { passive: true })
    return () => body.removeEventListener('scroll', onScroll)
  }, [pm?.id])

  const isOpen = pm !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[780px] max-w-[94vw] z-50 flex flex-col bg-[var(--surface-primary)] border-l border-[var(--border-default)] shadow-[var(--shadow-xl)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {pm && (
          <>
            {/* Header */}
            <div className="flex flex-col px-5 pt-5 shrink-0 border-b border-[var(--border-default)]">
              <div className="flex items-start gap-3 mb-3">
                <h2 className="flex-1 text-[20px] font-semibold text-[var(--color-neutral-12)] leading-7 min-w-0 break-words">
                  {pm.title}
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <HeaderButton label="Edit" onClick={() => onEdit(pm)}><Pencil size={14} /></HeaderButton>
                  <HeaderButton label="Expand"><Maximize2 size={14} /></HeaderButton>
                  <HeaderButton label="More actions"><MoreHorizontal size={15} /></HeaderButton>
                  <HeaderButton label="Close" onClick={onClose}><X size={15} /></HeaderButton>
                </div>
              </div>

              {/* Description */}
              {pm.description && (
                <div className="mb-4">
                  <p ref={descRef} className={`text-[length:var(--control-font-size-base)] text-[var(--color-neutral-9)] leading-6 ${!descExpanded ? 'line-clamp-2' : ''}`}>
                    {pm.description}
                  </p>
                  {(descOverflows || descExpanded) && (
                    <button
                      onClick={() => setDescExpanded(p => !p)}
                      className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent-9)] hover:underline mt-1 cursor-pointer"
                    >
                      {descExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {descExpanded ? 'Show Less' : 'Show Full Description'}
                    </button>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1 -mx-1">
                {TABS.map(({ key }) => (
                  <button
                    key={key}
                    onClick={() => goToSection(key)}
                    className={`px-3 h-10 text-[length:var(--control-font-size-base)] font-medium border-b-2 transition-colors cursor-pointer ${
                      tab === key
                        ? 'border-[var(--color-accent-9)] text-[var(--color-accent-9)]'
                        : 'border-transparent text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)]'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Body — one continuous page; the tabs scroll to a section within it */}
            <div ref={bodyRef} className="relative flex-1 overflow-y-auto">
              <DetailsTab pm={pm} />
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ pm }: { pm: PMItem }) {
  const woCount = pm.schedules.reduce((n, s) => n + s.assignments.reduce((m, a) => m + (a.woCount ?? 0), 0), 0)

  return (
    <div className="flex flex-col">
      {/* Details card */}
      <Section id="pm-details" title="Details">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] px-4 py-1">
          <FieldRow label="Category">{pm.category}</FieldRow>
          <FieldRow label="Priority">
            <span className="inline-flex items-center gap-1.5">
              <Flag size={13} fill="currentColor" className={PRIORITY_COLOR[pm.priority] ?? 'text-[var(--color-neutral-6)]'} />
              {pm.priority}
            </span>
          </FieldRow>
          <FieldRow label="Duration">2 hrs 35 Mins</FieldRow>
          <FieldRow label="Created">Monday, Oct 19, 2025 5:00 PM</FieldRow>
          <FieldRow label="Updated">Monday, Oct 19, 2025 5:00 PM</FieldRow>
        </div>
      </Section>

      {/* Images */}
      <Section
        title="Images"
        action={
          <>
            <CountPill>0</CountPill>
            <div className="flex items-center gap-0.5">
              <button type="button" aria-label="Previous images" disabled className="flex items-center justify-center w-6 h-6 rounded-[var(--radius-md)] text-[var(--color-neutral-6)] disabled:cursor-not-allowed">
                <ChevronLeft size={15} />
              </button>
              <button type="button" aria-label="Next images" disabled className="flex items-center justify-center w-6 h-6 rounded-[var(--radius-md)] text-[var(--color-neutral-6)] disabled:cursor-not-allowed">
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        }
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Add image"
            className="flex items-center justify-center w-[72px] h-[72px] rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] border border-dashed border-[var(--color-accent-4)] text-[var(--color-accent-9)] hover:bg-[var(--color-accent-2)] transition-colors cursor-pointer shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
      </Section>

      {/* Files */}
      <Section
        title="Files"
        action={
          <>
            <CountPill>0</CountPill>
            <Button variant="secondary" size="sm"><Plus size={12} /> Add</Button>
          </>
        }
      >
        <div className="flex items-center gap-2 text-[13px] text-[var(--color-neutral-8)]">
          <FileText size={15} className="text-[var(--color-neutral-6)]" />
          No files added yet
        </div>
      </Section>

      {/* Tasks & Checklists */}
      <Section
        id="pm-tasks"
        title="Tasks & Checklists"
        action={<Button variant="secondary" size="sm"><Plus size={12} /> Add</Button>}
      >
        {pm.checklists && pm.checklists.length > 0 ? (
          <div className="flex flex-col gap-2">
            {pm.checklists.map((cl, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 h-10 rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                <ListChecks size={15} className="text-[var(--color-neutral-7)] shrink-0" />
                <span className="text-[length:var(--control-font-size-base)] text-[var(--color-neutral-11)] truncate">{cl}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-[var(--color-neutral-8)]">No checklists added</span>
        )}
      </Section>

      {/* Schedules */}
      <SchedulesSection pm={pm} />

      {/* Work Orders */}
      <Section id="pm-work-orders" title="Work Orders" action={<CountPill>{woCount}</CountPill>}>
        <WorkOrderList pm={pm} />
      </Section>

      {/* Lets the last section scroll up to the top of the viewport */}
      <div aria-hidden className="h-[60vh] shrink-0" />
    </div>
  )
}

// ── Schedules ────────────────────────────────────────────────────────────────

function SchedulesSection({ pm }: { pm: PMItem }) {
  const body = pm.schedules.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <CalendarClock size={26} className="text-[var(--color-neutral-5)]" />
      <p className="text-[13px] font-medium text-[var(--color-neutral-8)]">No schedules yet</p>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {pm.schedules.map(s => <ScheduleCard key={s.id} sched={s} />)}
    </div>
  )

  return (
    <Section
      id="pm-schedules"
      title="Schedules"
      action={<>
        <CountPill>{pm.schedules.length}</CountPill>
        <Button variant="secondary" size="sm"><Plus size={12} /> Add</Button>
      </>}
    >
      {body}
    </Section>
  )
}

function ScheduleCard({ sched }: { sched: PMSchedule }) {
  const [open, setOpen] = useState(true)
  const count = sched.assignments.length

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] overflow-hidden">
      {/* Trigger header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <span className="text-[length:var(--control-font-size-base)] font-semibold text-[var(--color-neutral-12)]">
            {sched.calendarTrigger}
          </span>
          {sched.meterTrigger && (
            <>
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-[var(--color-neutral-3)] text-[11px] font-medium text-[var(--color-neutral-9)]">or</span>
              <span className="text-[length:var(--control-font-size-base)] font-semibold text-[var(--color-neutral-12)]">
                {sched.meterTrigger}
              </span>
            </>
          )}
        </div>
        <Chip size="sm" variant="soft" className="!text-[12px]">
          {count === 0 ? 'No Assignments' : `${count} Assignment${count !== 1 ? 's' : ''}`}
        </Chip>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Collapse schedule' : 'Expand schedule'}
          aria-expanded={open}
          className="flex items-center justify-center w-6 h-6 shrink-0 rounded-[var(--radius-md)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer"
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {open && count > 0 && (
        <>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 h-9 bg-[var(--surface-secondary)] border-y border-[var(--border-subtle)]">
            <span className="flex-1 min-w-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)]">Assignments</span>
            <span className="w-[64px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)]">Techs</span>
            <span className="w-[80px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)]">Start / End</span>
            <span className="w-[88px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)]">Work Orders</span>
            <span className="w-[70px] shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)]">Next Due</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {sched.assignments.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{a.asset}</span>
                    <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-[var(--color-neutral-3)] text-[10px] font-medium text-[var(--color-neutral-9)]">{a.assetType}</span>
                  </div>
                  {a.location && <span className="text-[11px] text-[var(--color-neutral-8)] truncate">{a.location}</span>}
                  {/* A Meter row is the meter — its badge already says so. */}
                  {a.assetType !== 'Meter' && (
                    <span className="text-[11px] text-[var(--color-neutral-8)] truncate" title={a.meter || undefined}>
                      <span className="uppercase tracking-wide text-[10px]">Meter:</span> {a.meter || '—'}
                    </span>
                  )}
                </div>
                <div className="w-[64px] shrink-0">
                  {a.technicians.length > 0
                    ? <AvatarRow techs={a.technicians} extra={a.extraTechs} />
                    : <span className="text-[12px] text-[var(--color-neutral-7)]">—</span>}
                </div>
                <div className="w-[80px] shrink-0 flex flex-col gap-0.5">
                  {a.startDate && <span className="text-[11px] text-[var(--color-neutral-9)] leading-4">Start: {a.startDate}</span>}
                  {a.endDate && <span className="text-[11px] text-[var(--color-neutral-9)] leading-4">End: {a.endDate}</span>}
                  {!a.startDate && !a.endDate && <span className="text-[12px] text-[var(--color-neutral-7)]">—</span>}
                </div>
                <div className="w-[88px] shrink-0 flex flex-col gap-0.5">
                  {a.lastWO && <span className="text-[11px] text-[var(--color-neutral-9)] leading-4">Last: {a.lastWO}</span>}
                  {a.nextWO && <span className="text-[11px] text-[var(--color-neutral-9)] leading-4">Next: {a.nextWO}</span>}
                  {!a.lastWO && !a.nextWO && <span className="text-[11px] text-[var(--color-neutral-7)]">—</span>}
                </div>
                <div className="w-[70px] shrink-0">
                  {a.nextWO
                    ? <span className="text-[12px] font-semibold text-[var(--color-neutral-12)] leading-4">{a.nextWO}</span>
                    : <span className="text-[11px] text-[var(--color-neutral-7)]">—</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Work Orders ──────────────────────────────────────────────────────────────

function buildWorkOrders(pm: PMItem) {
  return pm.schedules.flatMap(s => s.assignments.flatMap(a =>
    Array.from({ length: Math.min(a.woCount ?? 0, 3) }, (_, i) => ({
      id: `WO-${pm.id}-${a.id}-${i}`,
      title: pm.title,
      asset: a.asset,
      status: i === 2 ? 'Completed' : 'Active',
      date: a.lastWO ?? '—',
    }))
  )).slice(0, 8)
}

function WorkOrderList({ pm }: { pm: PMItem }) {
  const wos = buildWorkOrders(pm)
  if (wos.length === 0) {
    return <span className="text-[13px] text-[var(--color-neutral-8)]">No work orders yet</span>
  }
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] divide-y divide-[var(--border-subtle)] overflow-hidden">
      {wos.map(wo => (
        <div key={wo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-secondary)] transition-colors">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{wo.title}</span>
            <span className="text-[11px] text-[var(--color-neutral-8)] truncate">{wo.asset}</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${wo.status === 'Active' ? 'bg-[#E6F9ED] text-[#1A7A3C]' : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)]'}`}>
            {wo.status}
          </span>
          <span className="text-[11px] text-[var(--color-neutral-8)] shrink-0">{wo.date}</span>
        </div>
      ))}
    </div>
  )
}
