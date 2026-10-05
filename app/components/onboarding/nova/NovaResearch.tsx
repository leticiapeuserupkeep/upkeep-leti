'use client'

import { useEffect, useState } from 'react'
import { Globe, Search, ExternalLink, ChevronRight } from 'lucide-react'
import type { ResearchStep } from '@/app/lib/onboarding/nova-onboarding-data'
import { NovaPulseDot } from './NovaPrimitives'

export const RESEARCH_STEP_MS = 1100

export function researchDuration(steps: ResearchStep[], stepMs = RESEARCH_STEP_MS) {
  return steps.length * stepMs + 700
}

/** What Nova is doing during a step, as one short status line. */
function status(step: ResearchStep) {
  return step.kind === 'search'
    ? `Searching the web for “${step.query}”…`
    : `Collecting data on ${step.url.replace(/^https?:\/\//, '').split('/')[0]}…`
}

function summary(steps: ResearchStep[]) {
  const pages = steps.filter(s => s.kind === 'page').length
  const searched = steps.some(s => s.kind === 'search')
  const parts = [pages > 0 && `Read ${pages} ${pages === 1 ? 'page' : 'pages'}`, searched && 'searched the web'].filter(Boolean)
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Nova's research, shown as it happens: each page read and search run
 * lands in a list, so the user can see exactly where the info came from. */
export function NovaResearch({ steps, stepMs = RESEARCH_STEP_MS, label }: {
  steps: ResearchStep[]
  stepMs?: number
  /** Fixed header instead of the "Read N pages…" summary. */
  label?: string
}) {
  const [shown, setShown] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const done = shown >= steps.length

  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => setShown(n => n + 1), shown === 0 ? 300 : stepMs)
    return () => window.clearTimeout(id)
  }, [shown, done, stepMs])

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [done])

  // While working: one line — dot, what Nova is doing right now, timer.
  if (!done) {
    const current = steps[Math.min(shown, steps.length - 1)]
    return (
      <div className="flex items-center gap-2.5 nova-enter" aria-live="polite">
        <NovaPulseDot />
        <span key={shown} className="nova-shimmer nova-label-in min-w-0 truncate text-[length:var(--font-size-sm)] font-medium">
          {shown === 0 && label ? `${label}…` : status(current)}
        </span>
        <span className="shrink-0 text-[length:var(--font-size-sm)] tabular-nums text-[var(--color-neutral-8)]">· {seconds}s</span>
      </div>
    )
  }

  // Done: a quiet summary; the chevron opens the whole process.
  return (
    <div className="flex w-full max-w-[680px] flex-col gap-3 nova-label-in">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        className="inline-flex w-fit items-center gap-1 text-[length:var(--font-size-sm)] font-normal text-[var(--color-neutral-8)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-neutral-10)] cursor-pointer"
      >
        {label ?? summary(steps)}
        <ChevronRight size={14} className={`transition-transform duration-[var(--duration-normal)] ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <ol className="flex flex-col nova-label-in">
          {steps.map((step, i) => {
            const last = i === steps.length - 1
            const Icon = step.kind === 'page' ? Globe : Search
            return (
              <li key={i} className="relative flex items-center gap-3 py-2">
                {!last && <span className="absolute left-[7.5px] top-[26px] h-[calc(100%-18px)] w-px bg-[var(--border-default)]" aria-hidden />}
                <Icon size={16} strokeWidth={1.75} className="shrink-0 text-[var(--color-neutral-8)]" />
                {step.kind === 'page' ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] text-[var(--color-neutral-11)]">{step.url}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">
                      {step.domain}
                      <ExternalLink size={13} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] text-[var(--color-neutral-11)]">{step.query}</span>
                    <span className="shrink-0 text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">{step.results} results</span>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
