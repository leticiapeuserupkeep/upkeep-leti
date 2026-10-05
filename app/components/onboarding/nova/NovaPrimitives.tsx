'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Building2, Database, Plug, Sparkles, ChevronRight, Check } from 'lucide-react'
import { SOURCE_LABEL, sourceName, CONNECTABLE_SOURCES, type InsightSource, type SourceId } from '@/app/lib/onboarding/nova-onboarding-data'

/** Characters revealed per tick — fast enough not to feel slow, slow enough
 * to read as Nova "writing" rather than text popping in. */
const CHARS_PER_TICK = 1
export const TYPE_TICK_MS = 24

export function typingDuration(text: string) {
  return Math.ceil(text.length / CHARS_PER_TICK) * TYPE_TICK_MS
}

/** Nova's text, revealed progressively. */
export function NovaText({ text, variant = 'body', emphasis, className: extra = '' }: {
  text: string
  variant?: 'body' | 'heading'
  /** A word to render bold once it has been typed out, e.g. "Nova". */
  emphasis?: string
  className?: string
}) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    setShown(0)
    const id = window.setInterval(() => {
      setShown(n => {
        if (n >= text.length) {
          window.clearInterval(id)
          return n
        }
        return n + CHARS_PER_TICK
      })
    }, TYPE_TICK_MS)
    return () => window.clearInterval(id)
  }, [text])

  const className = variant === 'heading'
    ? 'text-[length:var(--font-size-base)] font-semibold leading-[22px] text-[var(--color-neutral-12)]'
    : 'text-[length:var(--font-size-base)] leading-[22px] text-[var(--color-neutral-11)]'

  const visible = text.slice(0, shown)
  const parts = emphasis ? visible.split(emphasis) : [visible]

  return (
    <p className={`${className} ${extra}`}>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <strong className="font-semibold text-[var(--color-neutral-12)]">{emphasis}</strong>}
          {part}
        </span>
      ))}
      {shown < text.length && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[var(--color-accent-9)] animate-[blink_0.9s_steps(1)_infinite]" />}
    </p>
  )
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="self-end max-w-[80%] rounded-[var(--radius-2xl)] rounded-br-[var(--radius-sm)] bg-[var(--color-accent-2)] px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--font-size-base)] text-[var(--color-neutral-12)] nova-enter">
      {children}
    </div>
  )
}

/* ── Intro: type → hold → erase → type the next line ── */

const INTRO_TYPE_MS = 70
const INTRO_HOLD_MS = 500
const INTRO_LINE_MS = 32

/** Total time the intro takes, so the script can wait for it. */
export function introDuration(first: string, second: string) {
  return first.length * INTRO_TYPE_MS + INTRO_HOLD_MS + second.length * INTRO_LINE_MS
}

/** Nova introduces itself, then types what it's about to do on the line
 * below. `emphasis` is bolded once typed. */
export function NovaIntroTyper({ first, second, emphasis }: { first: string; second: string; emphasis?: string }) {
  const [firstText, setFirstText] = useState('')
  const [secondText, setSecondText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => { if (!cancelled) fn() }, ms))

    let t = 0
    for (let i = 1; i <= first.length; i++) { t += INTRO_TYPE_MS; at(t, () => setFirstText(first.slice(0, i))) }
    t += INTRO_HOLD_MS
    for (let i = 1; i <= second.length; i++) { t += INTRO_LINE_MS; at(t, () => setSecondText(second.slice(0, i))) }
    at(t + 50, () => setDone(true))

    return () => { cancelled = true; timers.forEach(window.clearTimeout) }
  }, [first, second])

  const cursor = <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[var(--color-accent-9)] animate-[blink_0.9s_steps(1)_infinite]" />
  const parts = emphasis ? firstText.split(emphasis) : [firstText]

  return (
    <div className="flex flex-col items-center gap-0.5 text-[length:var(--font-size-md)] leading-6 text-[var(--color-neutral-11)]">
      <p className="min-h-6">
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 && <strong className="font-semibold text-[var(--color-neutral-12)]">{emphasis}</strong>}
            {part}
          </span>
        ))}
        {secondText.length === 0 && !done && cursor}
      </p>
      <p className="min-h-6">
        {secondText}
        {secondText.length > 0 && !done && cursor}
      </p>
    </div>
  )
}

/** Breathing dot shown while Nova is working. */
export function NovaPulseDot() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      <span className="nova-dot" />
    </span>
  )
}

/** "Nova is working" — breathing dot plus a shimmering line that swaps as
 * Nova moves on to the next thing, so the wait reads as progress. */
export function NovaThinking({ labels, stepMs = 1100 }: { labels: string[]; stepMs?: number }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (labels.length <= 1) return
    const id = window.setInterval(() => setIndex(i => Math.min(i + 1, labels.length - 1)), stepMs)
    return () => window.clearInterval(id)
  }, [labels, stepMs])

  return (
    <div className="flex items-center gap-2.5 nova-enter" aria-live="polite">
      <NovaPulseDot />
      <span key={index} className="nova-shimmer nova-label-in text-[length:var(--font-size-sm)] font-medium">
        {labels[index]}
      </span>
    </div>
  )
}

/** What's left of a "thinking" once Nova replies: a quiet, expandable
 * "Thought for Ns" line, so the user can see what Nova did before answering. */
export function NovaThought({ labels, seconds }: { labels: string[]; seconds: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-1.5 nova-label-in">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="group inline-flex w-fit items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-8)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-neutral-11)] cursor-pointer"
      >
        Thought for {seconds}s
        <ChevronRight size={14} className={`transition-transform duration-[var(--duration-normal)] ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <ul className="ml-[3px] flex flex-col gap-1 border-l border-[var(--border-default)] pl-3 nova-label-in">
          {labels.map(label => (
            <li key={label} className="flex items-center gap-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">
              <Check size={12} className="shrink-0 text-[var(--color-neutral-7)]" />
              {label.replace(/…$/, '')}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const SOURCE_ICON: Record<InsightSource, typeof Building2> = {
  company: Building2,
  workspace: Database,
  connected: Plug,
  nova: Sparkles,
}

const SOURCE_TONE: Record<InsightSource, string> = {
  company: 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-10)]',
  workspace: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  connected: 'bg-[var(--color-accent-2)] text-[var(--color-accent-11)]',
  nova: 'bg-[var(--color-purple-light)] text-[var(--color-purple)]',
}

/** Tags every fact with where it came from — the trust backbone of the flow. */
export function SourceBadge({ source, app }: { source: InsightSource; app?: SourceId }) {
  const Icon = SOURCE_ICON[source]
  const logo = app ? CONNECTABLE_SOURCES.find(s => s.id === app)?.logo : undefined
  return (
    <span className={`inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[length:var(--font-size-xs)] font-medium ${SOURCE_TONE[source]}`}>
      {logo ? <Image src={logo} alt="" width={11} height={11} /> : <Icon size={11} />}
      {app ? sourceName(app) : SOURCE_LABEL[source]}
    </span>
  )
}

/** A connected app's logo on its own, for marking where a fact came from
 * without the weight of a full badge. */
export function AppLogo({ app }: { app: SourceId }) {
  const source = CONNECTABLE_SOURCES.find(s => s.id === app)
  if (!source) return null
  return <Image src={source.logo} alt={`From ${source.name}`} title={`From ${source.name}`} width={14} height={14} className="shrink-0" />
}
