'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, Factory, MapPin, Box, Sparkles, type LucideIcon } from 'lucide-react'
import { DISCOVERY_STEPS, DISCOVERY_STEP_MS } from '@/app/lib/onboarding/discovery'

/** One icon per step, in the same order as DISCOVERY_STEPS. */
const STEP_ICONS: LucideIcon[] = [Building2, Factory, MapPin, Box, Sparkles]

/** How long the outgoing icon and message take to leave. */
const LEAVE_MS = 1000

/** Keeps the previous value around for a moment, so it can ease out while
 * the new one comes in. */
function usePrevious<T>(value: T): T | null {
  const [current, setCurrent] = useState(value)
  const [previous, setPrevious] = useState<T | null>(null)
  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }
  useEffect(() => {
    if (previous === null) return
    const id = window.setTimeout(() => setPrevious(null), LEAVE_MS)
    return () => window.clearTimeout(id)
  }, [previous])
  return previous
}

/** The step's icon, no background, floating gently. On the next step the
 * old icon's lines travel off while the new one draws in on top. */
function StepIcon({ step }: { step: number }) {
  const previous = usePrevious(step)
  const Icon = STEP_ICONS[step % STEP_ICONS.length]
  const Previous = previous === null ? null : STEP_ICONS[previous % STEP_ICONS.length]
  const icon = 'absolute inset-0 text-white'
  return (
    <div className="nova-icon-float relative h-[60px] w-[60px]" aria-hidden>
      {Previous && <Previous key={`out-${previous}`} size={60} strokeWidth={0.8} className={`nova-icon-undraw ${icon}`} />}
      <Icon key={step} size={60} strokeWidth={0.8} className={`nova-icon-draw ${icon}`} />
    </div>
  )
}

/** The step's message, crossfading softly into the next. */
function StepMessage({ text }: { text: string }) {
  const previous = usePrevious(text)
  const line = 'absolute inset-x-0 top-0 whitespace-nowrap text-center text-[length:var(--font-size-md)] font-medium text-white'
  return (
    <p className="relative h-6 w-[320px]">
      {previous !== null && <span key={`out-${previous}`} className={`nova-soft-out ${line}`} aria-hidden>{previous}</span>}
      <span key={text} className={`nova-soft-in ${line}`}>{text}</span>
    </p>
  )
}

/** How far a step gets on time alone; the rest fills when its operation
 * actually returns, so the bar never claims a step done early. */
const ON_TIME_SHARE = 0.92

/** Full-screen "Nova is researching" sequence: one step at a time — its
 * message and its icon — over a single calm bar from 0 to 100%. Progress
 * follows each step's operation (simulated by `stepMs`); `onDone` fires once
 * all return. */
export function DiscoveryLoading({ stepMs, onDone, leaving = false }: {
  /** How long each step's operation takes. */
  stepMs: number[]
  onDone: () => void
  leaving?: boolean
}) {
  const [step, setStep] = useState(0)
  const [slow, setSlow] = useState(false)
  const [percent, setPercent] = useState(0)
  const done = useRef(onDone)
  useEffect(() => { done.current = onDone })

  useEffect(() => {
    const start = performance.now()
    const ends = stepMs.reduce<number[]>((acc, ms) => [...acc, (acc.at(-1) ?? 0) + ms], [])
    let shown = 0
    let frame = 0
    let finished = false
    const tick = (now: number) => {
      const t = now - start
      const current = ends.findIndex(end => t < end)
      const index = current === -1 ? stepMs.length : current
      // Returned steps count in full; the running one moves with time, then
      // creeps if it runs long.
      let target = index
      if (index < stepMs.length) {
        const inStep = t - (ends[index - 1] ?? 0)
        target += inStep <= DISCOVERY_STEP_MS
          ? ON_TIME_SHARE * (inStep / DISCOVERY_STEP_MS)
          : ON_TIME_SHARE + (1 - ON_TIME_SHARE) * 0.85 * (1 - Math.exp(-(inStep - DISCOVERY_STEP_MS) / 4000))
        setSlow(inStep > DISCOVERY_STEP_MS + 1000)
        setStep(index)
      }
      // Eased toward the target, so a step returning never jumps the bar.
      shown += (target - shown) * 0.06
      setPercent(Math.min(100, (shown / stepMs.length) * 100))
      if (index === stepMs.length && shown > stepMs.length - 0.005) {
        setPercent(100)
        if (!finished) {
          finished = true
          window.setTimeout(() => done.current(), 600)
        }
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [stepMs])

  const message = slow ? 'This is taking a little longer than usual…' : DISCOVERY_STEPS[step].message

  return (
    <div className={`flex flex-col items-center ${leaving ? 'nova-discovery-out' : 'nova-section-in'}`} role="status" aria-live="polite">
      <div className="flex h-[120px] items-center justify-center">
        <StepIcon step={step} />
      </div>
      <div className="mt-4">
        <StepMessage text={message} />
      </div>
      <span
        className="mt-4 block h-1 w-[220px] overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label="Preparing your workspace"
      >
        <span className="block h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
      </span>
    </div>
  )
}
