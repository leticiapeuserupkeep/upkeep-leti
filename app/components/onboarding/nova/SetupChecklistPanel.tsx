'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Building2, MapPin, Box, Users, FileText, Check, Plus, ChevronDown, ArrowRight, Loader2, Pencil, type LucideIcon } from 'lucide-react'
import type { SetupCounts } from '@/app/lib/onboarding/setup-store'
import { Button } from '@/app/components/ui/Button'
import { TextInput } from '@/app/components/ui/TextInput'
import { SearchableSelect } from '@/app/components/ui/SearchableSelect'

type Key = keyof SetupCounts

/** Each step and what it's for, so a new user knows why it matters. */
const ITEMS: { key: Key; label: string; description: string; icon: LucideIcon }[] = [
  { key: 'locations', label: 'Locations', description: 'Add where your team works to organize maintenance by location.', icon: MapPin },
  { key: 'assets', label: 'Assets', description: 'Add your equipment to start tracking and maintaining it.', icon: Box },
  { key: 'team', label: 'Team', description: 'People who do and request the work', icon: Users },
  { key: 'workOrders', label: 'Work Orders', description: 'Add your first job to start managing maintenance.', icon: FileText },
]

/** The setup guide: one row per step, each clearly done or not, with the
 * next one highlighted. Counts update as Nova adds things, and filled steps
 * open to show what was added. */
export function SetupChecklistPanel({ title = 'Set up your account', subtitle = 'Complete these steps here, or answer Nova’s questions as you go.', className, headerAction, accountDone, accountRows, accountLoading = false, accountDetails, roleOptions, industryOptions, onSaveAccount, gmailConnected, onConnectGmail, counts, items, pending = [], onAdd, onView, children }: {
  title?: string
  subtitle?: string
  /** Replaces the default container styles. */
  className?: string
  /** A button beside the title, e.g. to bring Nova back. */
  headerAction?: ReactNode
  /** Checks off once the user confirms what Nova found about the company. */
  accountDone: boolean
  /** What's known so far — role, industry, company — added as the user answers. */
  accountRows: { label: string; value: string }[]
  /** The user has started answering but the account isn't confirmed yet. */
  accountLoading?: boolean
  /** Pre-fills the account form. */
  accountDetails: AccountDetails
  roleOptions: string[]
  industryOptions: string[]
  onSaveAccount: (details: AccountDetails) => void
  gmailConnected: boolean
  onConnectGmail: () => void
  counts: SetupCounts
  /** Names of what's been added, per step. */
  items: Record<Key, string[]>
  /** Steps Nova is adding to right now. */
  pending?: Key[]
  onAdd: (key: Key) => void
  onView: (key: Key) => void
  /** Extra content under the checklist, e.g. Nova's recommendations. */
  children?: ReactNode
}) {
  // Accordion: at most one step open; nothing opens on its own.
  const [openStep, setOpenStep] = useState<string | null>(null)

  // Account just confirmed: hand focus to Locations, the next step.
  const panelRef = useRef<HTMLElement>(null)
  const wasAccountDone = useRef(accountDone)
  useEffect(() => {
    const justDone = accountDone && !wasAccountDone.current
    wasAccountDone.current = accountDone
    if (!justDone) return
    const id = window.setTimeout(() => {
      const next = panelRef.current?.querySelector<HTMLElement>('[data-step="locations"]')
      if (!next) return
      next.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      next.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    }, 400)
    return () => window.clearTimeout(id)
  }, [accountDone])

  const done = (accountDone ? 1 : 0) + ITEMS.filter(i => counts[i.key] > 0).length
  const total = ITEMS.length + 1
  // No step is singled out as "next" — the user may be answering Nova in the
  // chat or working here, so each step just shows done or not.
  const next: string | undefined = undefined

  return (
    <aside ref={panelRef} className={className ?? 'flex w-[300px] shrink-0 flex-col gap-[var(--space-md)] overflow-y-auto rounded-[var(--radius-3xl)] bg-[var(--surface-primary)] p-[var(--space-lg)]'}>
      <div className="flex flex-col gap-0.5 px-1" data-stagger style={{ '--base': '450ms', '--i': 0 } as React.CSSProperties}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">{title}</span>
            {subtitle && <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{subtitle}</span>}
          </div>
          {headerAction}
        </div>
        {/* Setup progress — fills smoothly as each step lands. */}
        <div className="mt-2 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-3)]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Setup progress">
            <span
              className="block h-full rounded-full bg-[var(--color-accent-9)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </span>
          <span className="text-[length:var(--font-size-xs)] font-medium tabular-nums text-[var(--color-neutral-9)]">{done}/{total}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4" data-stagger style={{ '--base': '450ms', '--i': 1 } as React.CSSProperties}>
        <AccountStep
          expanded={openStep === 'account'}
          onExpand={() => setOpenStep('account')}
          done={accountDone}
          active={next === 'account'}
          loading={accountLoading}
          rows={accountRows}
          details={accountDetails}
          roleOptions={roleOptions}
          industryOptions={industryOptions}
          onSave={onSaveAccount}
        />
        {ITEMS.map((item, i) => (
          <ListStep
            key={item.key}
            step={item.key}
            open={openStep === item.key}
            // One step open at a time: opening this folds the previous one.
            onToggle={() => setOpenStep(o => (o === item.key ? null : item.key))}
            label={item.label}
            description={item.description}
            icon={item.icon}
            active={next === item.key}
            last={i === ITEMS.length - 1}
            value={counts[item.key]}
            added={items[item.key]}
            loading={pending.includes(item.key)}
            // The team comes from Gmail — connect it first, from this step.
            connectGmail={item.key === 'team' && !gmailConnected ? onConnectGmail : undefined}
            onAdd={() => onAdd(item.key)}
            onView={() => onView(item.key)}
          />
        ))}
      </div>

      {children}
    </aside>
  )
}

/** Done: a filled blue check. Next up: an arrow to start it. Otherwise an empty circle. */
function StepStatus({ done, active, onGo, label }: { done: boolean; active: boolean; onGo?: () => void; label: string }) {
  if (done) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white" style={{ animation: 'checkPop 0.45s var(--ease-default)' }} aria-label="Done">
        <Check size={13} strokeWidth={3} />
      </span>
    )
  }
  if (active && onGo) {
    return (
      <button type="button" onClick={onGo} aria-label={label} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white transition-colors hover:bg-[var(--color-accent-10)] cursor-pointer">
        <ArrowRight size={14} />
      </button>
    )
  }
  // Steps with their own Add / Connect button don't need an empty circle too.
  if (onGo) return null
  return <span className="h-6 w-6 shrink-0 rounded-full border-[1.5px] border-[var(--color-neutral-6)]" aria-label="Not done yet" />
}

/** Each step is its own card. */
function StepRow({ step, working = false, children }: { step?: string; active?: boolean; last?: boolean; working?: boolean; children: ReactNode }) {
  return (
    // No border at rest; blue while something inside has focus (e.g. filling in
    // Account) or while Nova is working on the step. Transparent rather than
    // none so nothing shifts.
    <div data-step={step} className={`flex flex-col overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--surface-primary)] transition-colors duration-300 focus-within:border-[var(--color-accent-9)] ${working ? 'border-[var(--color-accent-9)]' : 'border-transparent'}`}>
      {children}
    </div>
  )
}

function StepHeading({ icon: Icon, label, detail }: { icon: LucideIcon; label: string; detail?: ReactNode; done?: boolean }) {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] text-[var(--color-accent-9)]">
        <Icon size={17} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{label}</span>
        {detail && <span className="text-[length:var(--font-size-base)] leading-5 text-[var(--color-neutral-9)]">{detail}</span>}
      </span>
    </>
  )
}

/** Company and role — filled in row by row as the user answers Nova, with a
 * loader while it's in progress; editable once confirmed. */
export interface AccountDetails {
  role: string
  industry: string
  companyName: string
  companySize: string
}

/** A form field with its label on the left. */
function FieldRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <label htmlFor={htmlFor} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">{label}</label>
      {children}
    </div>
  )
}

function AccountStep({ expanded, onExpand, done, active, loading, rows, details, roleOptions, industryOptions, onSave }: {
  /** Whether this is the panel's one open step. */
  expanded: boolean
  onExpand: () => void
  done: boolean
  active: boolean
  loading: boolean
  rows: { label: string; value: string }[]
  /** What's known so far — pre-fills the form. */
  details: AccountDetails
  roleOptions: string[]
  industryOptions: string[]
  onSave: (details: AccountDetails) => void
}) {
  // Clicking the card opens the fields to fill in (or edit) by hand.
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(details)
  // Unsaved edits survive the card folding away when focus leaves it; only
  // an untouched draft picks up what Nova has learned since.
  const dirty = useRef(false)
  // Once confirmed the card folds to its header — the summary is a click away.
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [wasDone, setWasDone] = useState(done)
  if (done !== wasDone) {
    setWasDone(done)
    if (done) setSummaryOpen(false)
  }
  const open = () => { if (!dirty.current) setDraft(details); setEditing(true); onExpand() }
  // Another step opened: fold this one (unsaved edits are kept).
  if (!expanded && (editing || summaryOpen)) {
    setEditing(false)
    setSummaryOpen(false)
  }
  const close = (keep: boolean) => {
    if (!keep) { dirty.current = false; setDraft(details) }
    setEditing(false)
  }
  const set = (key: keyof AccountDetails) => (value: string) => { dirty.current = true; setDraft(d => ({ ...d, [key]: value })) }

  // Focus leaving the card folds it. A dropdown's list lives in a portal, so
  // focus there (or on its way back to the field) still counts as inside.
  const cardRef = useRef<HTMLDivElement>(null)
  const onBlur = () => {
    window.setTimeout(() => {
      const el = document.activeElement
      if (cardRef.current?.contains(el)) return
      if (el?.closest('[data-radix-popper-content-wrapper]') || document.querySelector('[data-radix-popper-content-wrapper]')) return
      close(true)
    }, 150)
  }

  return (
    <StepRow step="account" active={editing} working={loading && !done}>
      <div ref={cardRef} onBlur={onBlur} className="contents">
      <div className="flex items-center gap-3 px-[var(--space-md)] py-3">
        {/* Done: the header shows/hides the summary. Not yet: it opens the form. */}
        <button
          type="button"
          onClick={() => (editing ? close(true) : done ? (summaryOpen ? setSummaryOpen(false) : (setSummaryOpen(true), onExpand())) : open())}
          aria-expanded={editing || (done && summaryOpen)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
        >
          <StepHeading icon={Building2} label="Account" done={done} detail="Tell us about your company" />
        </button>
        {done && !editing && (
          <button type="button" onClick={open} className="inline-flex shrink-0 items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">
            <Pencil size={12} /> Edit
          </button>
        )}
        {loading && !done
          ? <Loader2 size={18} className="shrink-0 animate-spin text-[var(--color-accent-9)]" aria-label="In progress" />
          : <StepStatus done={done} active={active} label="Confirm your account" />}
      </div>

      {/* Form and summary fold open/closed smoothly instead of popping. */}
      <div inert={!editing} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${editing ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
        <form
          onSubmit={e => { e.preventDefault(); onSave(draft); dirty.current = false; setEditing(false) }}
          className="flex flex-col gap-3 border-t border-[var(--border-subtle)] px-[var(--space-md)] py-3"
        >
          <div className="flex flex-col gap-2.5">
            <FieldRow label="Company name" htmlFor="account-company-name">
              <TextInput id="account-company-name" value={draft.companyName} onChange={e => set('companyName')(e.target.value)} />
            </FieldRow>
            <FieldRow label="Company size" htmlFor="account-company-size">
              <TextInput id="account-company-size" value={draft.companySize} onChange={e => set('companySize')(e.target.value)} />
            </FieldRow>
            <FieldRow label="Your role" htmlFor="account-role">
              <SearchableSelect value={draft.role} onChange={set('role')} options={roleOptions} />
            </FieldRow>
            <FieldRow label="Industry" htmlFor="account-industry">
              <SearchableSelect value={draft.industry} onChange={set('industry')} options={industryOptions} />
            </FieldRow>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" disabled={!draft.role || !draft.industry || !draft.companyName.trim()}>Save</Button>
          </div>
        </form>
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${!editing && rows.length > 0 && (!done || summaryOpen) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
        <dl className="flex flex-col border-t border-[var(--border-subtle)] py-1">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 px-[var(--space-md)] py-1.5 nova-enter">
              <dt className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{row.label}</dt>
              <dd className="truncate text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">{row.value}</dd>
            </div>
          ))}
        </dl>
        </div>
      </div>
      </div>
    </StepRow>
  )
}

/** A step that collects things (locations, assets…). Empty, the arrow or Add
 * starts it; filled, it shows how many and opens to list them. When its count
 * goes up the row pops and a "+N" floats off it. */
function ListStep({ step, open, onToggle, label, description, icon, active, last, value, added, loading, connectGmail, onAdd, onView }: {
  step: string
  open: boolean
  onToggle: () => void
  label: string
  description: string
  icon: LucideIcon
  active: boolean
  last: boolean
  value: number
  added: string[]
  loading: boolean
  /** Set when the step needs Gmail before anything can be added. */
  connectGmail?: () => void
  onAdd: () => void
  onView: () => void
}) {
  const previous = useRef(value)
  const [gain, setGain] = useState(0)
  // Keeps the newest item in view while Nova adds them one by one.
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const diff = value - previous.current
    previous.current = value
    if (diff <= 0) return
    // Stays folded — the count tag says what landed; the user opens it.
    setGain(diff)
    const id = window.setTimeout(() => setGain(0), 1100)
    return () => window.clearTimeout(id)
  }, [value])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [added.length])

  const filled = value > 0
  const celebrating = gain > 0

  return (
    <StepRow step={step} last={last} working={loading}>
      <div className="flex items-center gap-3 px-[var(--space-md)] py-3">
        <StepHeading
          icon={icon}
          label={label}
          done={filled}
          detail={connectGmail && !filled ? 'Connect Gmail so Nova can find the people on your team' : description}
        />
        <span className="relative flex shrink-0 items-center gap-2">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-[var(--color-accent-9)]" />
          ) : filled ? (
            <>
            <span className="inline-flex h-6 items-center rounded-full bg-[var(--color-accent-1)] px-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)]">
              {value} added
            </span>
            <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${label.toLowerCase()}`} className="text-[var(--color-neutral-8)] cursor-pointer">
              <ChevronDown size={16} className={`transition-transform duration-[var(--duration-normal)] ${open ? 'rotate-180' : ''}`} />
            </button>
            </>
          ) : connectGmail ? (
            <button type="button" onClick={connectGmail} className="inline-flex h-6 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] transition-colors hover:bg-[var(--color-neutral-2)] cursor-pointer">
              <Image src="/images/integrations/gmail.svg" alt="" width={12} height={12} /> Connect Gmail
            </button>
          ) : !active ? (
            <button type="button" onClick={onAdd} className="inline-flex h-6 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] transition-colors hover:bg-[var(--color-neutral-2)] cursor-pointer">
              <Plus size={12} /> Add
            </button>
          ) : null}
          {celebrating && (
            <span className="pointer-events-none absolute -top-3 left-0" aria-hidden>
              <span className="block text-[length:var(--font-size-sm)] font-bold text-[var(--color-accent-9)]" style={{ animation: 'nova-float-up 1.1s var(--ease-default) forwards' }}>
                +{gain}
              </span>
            </span>
          )}
          {!loading && !(connectGmail && !filled) && <StepStatus done={filled} active={active} onGo={onAdd} label={`Add ${label.toLowerCase()}`} />}
        </span>
      </div>

      {filled && open && (
        <div className="flex flex-col border-t border-[var(--border-subtle)] nova-label-in">
          <ul ref={listRef} className="flex max-h-[204px] flex-col overflow-y-auto py-1">
            {added.map(name => (
              <li key={name} className="shrink-0 truncate px-[var(--space-md)] py-1.5 text-[length:var(--font-size-sm)] leading-5 text-[var(--color-neutral-11)] nova-enter">{name}</li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-[var(--space-md)] py-2">
            <button type="button" onClick={onView} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">
              View all
            </button>
            <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] transition-colors hover:text-[var(--color-neutral-12)] cursor-pointer">
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}
    </StepRow>
  )
}
