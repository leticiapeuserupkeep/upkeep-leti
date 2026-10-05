'use client'

import { useState, type ReactNode } from 'react'
import { AlertTriangle, CalendarClock, Box, AppWindow, MessageCircle, FileText, Mail, Check, Flag, Sparkles, Eye, CheckCircle2, ShieldCheck, Download, ExternalLink, Copy, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/app/components/ui/Button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/components/ui/DropdownMenu'
import { AppLogo } from './NovaPrimitives'
import { ProgressRing } from '@/app/components/ui/ProgressRing'
import { PM_PLAN, type Evidence, type PlantHealth } from '@/app/lib/onboarding/nova-onboarding-data'

function CardShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex w-full max-w-[680px] flex-col gap-[var(--space-md)] rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-xs)] nova-enter ${className}`}>
      {children}
    </div>
  )
}

export function EvidenceList({ items }: { items: Evidence[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((e, i) => (
        <li
          key={e.text}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] px-3 py-2 nova-enter"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="text-[length:var(--font-size-base)] text-[var(--color-neutral-11)]">{e.text}</span>
          {/* Only facts read from a connected app get a mark — just its logo. */}
          {e.app && <AppLogo app={e.app} />}
        </li>
      ))}
    </ul>
  )
}

/* ── What to do with the report ── */

export type ReportDestination = 'gdoc' | 'email' | 'pdf'

const ICON_BTN = 'flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-neutral-8)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] cursor-pointer data-[state=open]:bg-[var(--color-neutral-3)]'

/** Quiet actions under a Nova message — keeping the report is optional, so
 * it lives here instead of interrupting the conversation. */
export function ReportActions({ copyText, onAction }: {
  copyText: string
  onAction: (d: ReportDestination) => void
}) {
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)

  function copy() {
    navigator.clipboard?.writeText(copyText).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-0.5 nova-enter">
      <button type="button" aria-label={copied ? 'Copied' : 'Copy report'} title={copied ? 'Copied' : 'Copy'} onClick={copy} className={ICON_BTN}>
        {copied ? <Check size={15} className="text-[var(--color-success)]" /> : <Copy size={15} />}
      </button>
      <button type="button" aria-label="Good report" aria-pressed={vote === 'up'} onClick={() => setVote(v => (v === 'up' ? null : 'up'))} className={`${ICON_BTN} ${vote === 'up' ? 'text-[var(--color-accent-9)]' : ''}`}>
        <ThumbsUp size={15} />
      </button>
      <button type="button" aria-label="Bad report" aria-pressed={vote === 'down'} onClick={() => setVote(v => (v === 'down' ? null : 'down'))} className={`${ICON_BTN} ${vote === 'down' ? 'text-[var(--color-accent-9)]' : ''}`}>
        <ThumbsDown size={15} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More report actions" className={ICON_BTN}>
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent minWidth="200px">
          <DropdownMenuItem onSelect={() => onAction('pdf')}><Download size={14} /> Download as PDF</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction('gdoc')}>
            <Image src="/images/integrations/google-docs.svg" alt="" width={10} height={14} /> Create a Google Doc
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction('email')}><Mail size={14} /> Send by email</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Link to the doc Nova just created. */
export function DocLinkCard({ title, url }: { title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.preventDefault()}
      className="flex w-full max-w-[420px] items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2.5 shadow-[var(--shadow-xs)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] nova-enter"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-1)]">
        <Image src="/images/integrations/google-docs.svg" alt="" width={14} height={19} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{title}</span>
        <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-accent-10)]">{url.replace('https://', '')}</span>
      </span>
      <ExternalLink size={14} className="shrink-0 text-[var(--color-neutral-8)]" />
    </a>
  )
}

/* ── Plant health dashboard ── */

const HEALTH_GROUPS = [
  { key: 'urgent', label: 'Needs urgent maintenance', icon: AlertTriangle, tone: 'text-[var(--color-error)] bg-[var(--color-error-light)]' },
  { key: 'watch', label: 'Keep an eye on', icon: Eye, tone: 'text-[var(--color-warning)] bg-[var(--color-warning-light)]' },
  { key: 'good', label: 'Doing well', icon: CheckCircle2, tone: 'text-[var(--color-success)] bg-[var(--color-success-light)]' },
] as const

/** The report once Nova can see real signals: a score and what needs
 * attention now vs. later vs. not at all — every line tagged with its app. */
export function PlantHealthCard({ health, validatedWith, onViewReport, onEmail, emailed }: {
  health: PlantHealth
  validatedWith: string[]
  onViewReport: () => void
  onEmail: () => void
  emailed: boolean
}) {
  return (
    <CardShell>
      <div className="flex items-center gap-4">
        <ProgressRing value={health.score} size={56} strokeWidth={5} fillColor={health.score < 60 ? 'var(--color-warning)' : 'var(--color-accent-9)'} label={`Plant health ${health.score}`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Plant health</span>
          <span className="inline-flex items-center gap-1 text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
            <Check size={12} className="text-[var(--color-success)]" /> Validated with {validatedWith.join(' + ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HEALTH_GROUPS.map(({ key, label, icon: Icon, tone }, i) => {
          const items = health[key]
          return (
            <div key={key} className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] p-3 nova-enter" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="flex items-center gap-1.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${tone}`}><Icon size={12} /></span>
                <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">{label}</span>
              </span>
              {items.length === 0 ? (
                <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">Nothing here</span>
              ) : items.map(item => (
                <div key={item.name + item.detail} className="flex flex-col gap-0.5 rounded-[var(--radius-md)] bg-[var(--surface-primary)] px-2.5 py-2">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-12)]">{item.name}</span>
                    {item.app && <AppLogo app={item.app} />}
                  </span>
                  <span className="text-[length:var(--font-size-xs)] leading-4 text-[var(--color-neutral-9)]">{item.detail}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="md" onClick={onViewReport}><FileText size={14} /> View full report</Button>
        <Button variant="secondary" size="md" onClick={onEmail} disabled={emailed}>
          {emailed ? <><Check size={14} /> Sent to your inbox</> : <><Mail size={14} /> Email me the report</>}
        </Button>
      </div>
    </CardShell>
  )
}

/* ── Contextual product offer ── */

export function ProductOfferCard({ name, pitch, answered, onUpgrade, onDecline, actionLabel = 'Upgrade', icon: Icon = ShieldCheck }: {
  name: string
  pitch: string
  answered: boolean
  onUpgrade: () => void
  onDecline: () => void
  /** "Upgrade" for paid products, "Install" for free apps. */
  actionLabel?: string
  icon?: typeof ShieldCheck
}) {
  return (
    <CardShell className="border-[var(--color-accent-4)] bg-[var(--color-accent-1)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-purple-light)] text-[var(--color-purple)]">
          <Icon size={18} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">{name}</span>
          <span className="text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">{pitch}</span>
        </div>
      </div>
      {!answered && (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={onUpgrade}>{actionLabel}</Button>
          <Button variant="secondary" size="md" onClick={onDecline}>Not now</Button>
        </div>
      )}
    </CardShell>
  )
}

/* ── Focus + actions ── */

export type FocusAction = 'pm' | 'assets' | 'app' | 'ask'

const ACTIONS: { id: FocusAction; label: string; icon: typeof Box }[] = [
  { id: 'pm', label: 'Create a preventive maintenance plan', icon: CalendarClock },
  { id: 'assets', label: 'Identify critical assets', icon: Box },
  { id: 'app', label: 'Create a monthly monitoring app', icon: AppWindow },
  { id: 'ask', label: 'Ask Nova about this', icon: MessageCircle },
]

export function FocusCard({ used, onAction }: { used: FocusAction[]; onAction: (a: FocusAction) => void }) {
  return (
    <CardShell>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-2)] text-[var(--color-accent-9)]">
          <Flag size={18} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Moline pilot</span>
          <span className="text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">Rehiring 375 people and moving lines to Mexico — a good moment to set standards. I can:</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ id, label, icon: Icon }, i) => {
          const done = used.includes(id) && id !== 'ask'
          return (
            <button
              key={id}
              type="button"
              onClick={() => onAction(id)}
              disabled={done}
              className="flex items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2.5 text-left text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-11)] transition-all duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] disabled:cursor-default disabled:opacity-60 disabled:hover:border-[var(--border-default)] disabled:hover:bg-[var(--surface-primary)] cursor-pointer nova-enter"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {done ? <Check size={16} className="shrink-0 text-[var(--color-success)]" /> : <Icon size={16} className="shrink-0 text-[var(--color-accent-9)]" />}
              {label}
            </button>
          )
        })}
      </div>
    </CardShell>
  )
}

/* ── Action results ── */

export function PmPlanCard({ onAdd }: { onAdd: () => void }) {
  const [added, setAdded] = useState(false)
  return (
    <CardShell>
      <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Pilot PM plan · draft</span>
      <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        {PM_PLAN.map((p, i) => (
          <li key={p.task} className="flex items-center justify-between gap-3 px-3 py-2.5 nova-enter" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="flex flex-col">
              <span className="text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)]">{p.task}</span>
              <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">{p.asset}</span>
            </div>
            <span className="rounded-full bg-[var(--color-neutral-3)] px-2 py-0.5 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-10)]">{p.frequency}</span>
          </li>
        ))}
      </ul>
      <Button variant={added ? 'secondary' : 'primary'} size="lg" className="self-start" disabled={added} onClick={() => { setAdded(true); onAdd() }}>
        {added ? <><Check size={16} /> Added to Preventive Maintenance</> : 'Add to Preventive Maintenance'}
      </Button>
    </CardShell>
  )
}

export function AssetsFoundCard({ assets, onAdd }: { assets: Evidence[]; onAdd: () => void }) {
  const [added, setAdded] = useState(false)
  return (
    <CardShell>
      <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">{assets.length} critical assets to start with</span>
      <EvidenceList items={assets} />
      <Button variant={added ? 'secondary' : 'primary'} size="lg" className="self-start" disabled={added} onClick={() => { setAdded(true); onAdd() }}>
        {added ? <><Check size={16} /> Added to Assets</> : `Add ${assets.length} assets to UpKeep`}
      </Button>
    </CardShell>
  )
}

export function AppOfferCard({ onCreate }: { onCreate: () => void }) {
  return (
    <CardShell className="border-[var(--color-accent-4)] bg-[var(--color-accent-1)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-9)] text-white">
          <Sparkles size={18} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Plant Reliability Monitor</span>
          <span className="text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">Nova App · runs monthly · alerts your team when a new pattern appears</span>
        </div>
      </div>
      <Button variant="primary" size="lg" className="self-start" onClick={onCreate}>
        Create App
      </Button>
    </CardShell>
  )
}

/* ── Next steps ── */

export interface NextStep {
  id: string
  label: string
  description: string
  done: boolean
  onClick: () => void
}

/** What's left to set up. `done` is derived live from the workspace, so
 * items tick off on their own as the user (or Nova) completes them. */
export function NextStepsCard({ steps }: { steps: NextStep[] }) {
  const doneCount = steps.filter(s => s.done).length
  return (
    <CardShell>
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Next steps</span>
        <span className="text-[length:var(--font-size-sm)] font-medium tabular-nums text-[var(--color-neutral-8)]">{doneCount} of {steps.length} done</span>
      </div>
      <ul className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={step.id} className="nova-enter" style={{ animationDelay: `${i * 90}ms` }}>
            <button
              type="button"
              onClick={step.onClick}
              disabled={step.done}
              className="flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] disabled:cursor-default disabled:hover:border-[var(--border-default)] disabled:hover:bg-[var(--surface-primary)] cursor-pointer"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-[var(--duration-slow)] ${
                step.done ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white' : 'border-[var(--color-neutral-6)]'
              }`}>
                {step.done && <Check size={12} strokeWidth={3} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`text-[length:var(--font-size-base)] font-medium ${step.done ? 'text-[var(--color-neutral-8)] line-through' : 'text-[var(--color-neutral-12)]'}`}>{step.label}</span>
                {!step.done && <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{step.description}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </CardShell>
  )
}
