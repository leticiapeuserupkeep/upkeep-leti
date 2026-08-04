'use client'

import { useMemo } from 'react'

/** Figma Frame 26085851–53 — token usage strip next to composer actions */
const SIZE = 18
const STROKE = 2
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

type UsageTier = 'safe' | 'warning' | 'critical'

const TIER_RING: Record<
  UsageTier,
  { track: string; arc: string }
> = {
  safe: { track: '#E8EAEF', arc: '#1F2D5C' },
  warning: { track: '#E1E9FF', arc: '#AB6400' },
  critical: { track: '#FECDD3', arc: '#E5484D' },
}

function tierFromPercent(pct: number): UsageTier {
  if (pct >= 85) return 'critical'
  if (pct >= 50) return 'warning'
  return 'safe'
}

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, n))
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1000 && n % 1000 === 0) return `${n / 1000}k`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}

export interface NovaTokenMeterProps {
  /** Tokens consumed this turn / session (placeholder until wired to API). */
  used: number
  /** Context window or plan limit. */
  max: number
  /** Optional concise label; default shows `used / max` tokens. */
  label?: string
}

export function NovaTokenMeter({ used, max, label }: NovaTokenMeterProps) {
  const pct = useMemo(() => clampPct(max > 0 ? (used / max) * 100 : 0), [used, max])
  const tier = tierFromPercent(pct)
  const ring = TIER_RING[tier]
  const dashOffset = C * (1 - pct / 100)
  const text =
    label ??
    `${formatTokenCount(used)} / ${formatTokenCount(max)} tokens`

  return (
    <div
      className="flex h-[18px] w-[145px] shrink-0 items-center gap-1"
      role="status"
      aria-label={`Token usage ${Math.round(pct)} percent. ${text}`}
    >
      <div className="relative h-[18px] w-[18px] shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={ring.track}
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={ring.arc}
            strokeWidth={STROKE}
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
      </div>
      <p className="min-w-0 flex-1 truncate text-[12px] font-medium leading-4 text-[#60646C]">
        {text}
      </p>
    </div>
  )
}
