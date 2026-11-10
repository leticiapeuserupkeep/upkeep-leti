'use client'

const orbSizeClass = {
  /** Inline with a line of text, e.g. a "thinking" indicator. */
  xs: 'h-5 w-5',
  sm: 'h-8 w-8',
  lg: 'h-12 w-12',
  /** 10px larger than `lg` (staging empty states). */
  xl: 'h-[58px] w-[58px]',
} as const

export type SuperNovaStagingOrbSize = keyof typeof orbSizeClass

/**
 * SuperNova-style orb: rotating accent conic field + inner radial core.
 * Uses `var(--color-accent-*)`, `var(--shadow-brand-glow)`, and `.supernova-staging-orb__inner` (globals.css).
 */
export function SuperNovaStagingOrb({
  size = 'sm',
  className = '',
}: {
  size?: SuperNovaStagingOrbSize
  className?: string
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-accent-7)]/25 shadow-[var(--shadow-brand-glow)] ${orbSizeClass[size]} ${className}`}
      aria-hidden
    >
      <span className="absolute left-1/2 top-1/2 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2">
        <span
          className="block h-full w-full animate-[sn-staging-orb-spin_4.5s_linear_infinite]"
          style={{
            background: `conic-gradient(
            from 200deg,
            var(--color-accent-3) 0%,
            var(--color-accent-7) 22%,
            var(--color-accent-4) 44%,
            var(--color-accent-11) 68%,
            var(--color-accent-5) 88%,
            var(--color-accent-3) 100%
          )`,
          }}
        />
      </span>
      <span className="supernova-staging-orb__inner absolute inset-[2px] rounded-full animate-[sn-staging-orb-pulse_3.2s_ease-in-out_infinite]" />
    </span>
  )
}
