'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { NovaPulseDot } from './NovaPrimitives'

export const ANALYSIS_STEP_MS = 1300

/** Nova working through the analysis, research-assistant style: a header
 * with a running timer, and a timeline that grows one step at a time. */
export function AnalysisSequence({ steps }: { steps: string[] }) {
  const [current, setCurrent] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const done = current >= steps.length

  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => setCurrent(c => c + 1), ANALYSIS_STEP_MS)
    return () => window.clearTimeout(id)
  }, [current, done])

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [done])

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-3 nova-enter">
      {done ? (
        // Finished: collapses to the same quiet line as a "Thought for Ns".
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          className="inline-flex w-fit items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-8)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-neutral-11)] cursor-pointer nova-label-in"
        >
          Analyzed {steps.length} steps for {seconds}s
          <ChevronRight size={14} className={`transition-transform duration-[var(--duration-normal)] ${expanded ? 'rotate-90' : ''}`} />
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          <NovaPulseDot />
          <span className="nova-shimmer text-[length:var(--font-size-sm)] font-medium">Analyzing your operation</span>
          <span className="text-[length:var(--font-size-sm)] tabular-nums text-[var(--color-neutral-8)]">{seconds}s</span>
        </div>
      )}

      {(!done || expanded) && <ol className="ml-[9px] flex flex-col border-l border-[var(--border-default)] pl-[var(--space-md)]">
        {steps.slice(0, current + 1).map((step, i) => {
          const stepDone = i < current
          return (
            <li key={step} className="relative py-1.5 nova-label-in">
              <span className="absolute -left-[calc(var(--space-md)+4px)] top-1/2 flex h-[7px] w-[7px] -translate-y-1/2 items-center justify-center">
                {!stepDone && (
                  <span className="absolute inset-0 rounded-full bg-[var(--color-accent-9)]" style={{ animation: 'nova-ping 1.2s var(--ease-default) infinite' }} />
                )}
                <span className={`relative h-[7px] w-[7px] rounded-full transition-colors duration-[var(--duration-slow)] ${stepDone ? 'bg-[var(--color-neutral-6)]' : 'bg-[var(--color-accent-9)]'}`} />
              </span>
              <span className={`text-[length:var(--font-size-sm)] transition-colors duration-[var(--duration-slow)] ${stepDone ? 'text-[var(--color-neutral-8)]' : 'nova-shimmer font-medium'}`}>
                {step}
              </span>
            </li>
          )
        })}
      </ol>}
    </div>
  )
}
