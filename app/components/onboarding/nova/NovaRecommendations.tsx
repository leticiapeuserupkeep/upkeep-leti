'use client'

import { useEffect, useRef, useState } from 'react'
import { GraduationCap, ShieldCheck, Radio, Download, CalendarClock, Star, ArrowRightLeft, Loader2, type LucideIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Skeleton } from '@/app/components/ui/Skeleton'
import type { Recommendation, RecommendationIcon } from '@/app/lib/onboarding/upkeep-recommendations'

const ICONS: Record<RecommendationIcon, LucideIcon> = {
  learn: GraduationCap,
  safety: ShieldCheck,
  edge: Radio,
  import: Download,
  pm: CalendarClock,
  vendor: Star,
  handover: ArrowRightLeft,
}

/** How long the section loads the first time it appears. */
export const RECOMMENDATIONS_SKELETON_MS = 1500
const EXIT_MS = 450

/** Recommendations that follow what Nova learns — the list is recomputed
 * from signals, so a card can appear, reorder, or be replaced at any time. */
export function NovaRecommendations({ items, onInstall, onUpgrade }: {
  items: Recommendation[]
  onInstall: (r: Recommendation) => void
  onUpgrade: (r: Recommendation) => void
}) {
  const [installing, setInstalling] = useState<string | null>(null)
  // First appearance loads with a skeleton; after that, changes animate
  // card by card — leaving ones fade out before the list reflows.
  const [phase, setPhase] = useState<'hidden' | 'loading' | 'ready'>('hidden')
  const [shown, setShown] = useState<Recommendation[]>([])
  const [leaving, setLeaving] = useState<string[]>([])
  const shownRef = useRef(shown)
  shownRef.current = shown

  const itemsRef = useRef(items)
  itemsRef.current = items

  // Skeleton timer lives in its own effect so later item changes can't reset it.
  useEffect(() => {
    if (phase !== 'loading') return
    const id = window.setTimeout(() => { setShown(itemsRef.current); setPhase('ready') }, RECOMMENDATIONS_SKELETON_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  useEffect(() => {
    if (phase === 'hidden') {
      if (items.length > 0) setPhase('loading')
      return
    }
    if (phase !== 'ready') return
    const removed = shownRef.current.filter(r => !items.some(i => i.id === r.id)).map(r => r.id)
    if (removed.length === 0) {
      setShown(items)
      return
    }
    setLeaving(removed)
    const id = window.setTimeout(() => { setLeaving([]); setShown(items) }, EXIT_MS)
    return () => window.clearTimeout(id)
  }, [items, phase])

  if (phase === 'hidden' || (phase === 'ready' && shown.length === 0)) return null

  function install(r: Recommendation) {
    setInstalling(r.id)
    window.setTimeout(() => {
      setInstalling(null)
      onInstall(r)
    }, 1200)
  }

  return (
    <section className="flex flex-col gap-[var(--space-sm)] nova-enter">
      <span className="px-1 pt-[var(--space-xs)] text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">We think you&rsquo;ll need</span>

      {phase === 'loading' && [0, 1].map(i => (
        <div key={i} className="flex shrink-0 items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] py-2.5 pl-3 pr-2">
          <Skeleton className="h-7 w-7" rounded="lg" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      ))}

      {shown.map(r => {
        const Icon = ICONS[r.icon]
        const isInstalling = installing === r.id
        return (
          // Keyed by id so a newly surfaced recommendation animates in. The
          // reason stays available on hover instead of crowding the card.
          <div key={r.id} title={r.reason} className={`flex shrink-0 items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] py-2.5 pl-3 pr-2 ${leaving.includes(r.id) ? 'nova-label-out' : 'nova-label-in'}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${
              r.kind === 'product' ? 'bg-[var(--color-purple-light)] text-[var(--color-purple)]' : 'bg-[var(--color-accent-2)] text-[var(--color-accent-9)]'
            }`}>
              <Icon size={14} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{r.name}</span>
            <Button
              variant="tertiary"
              size="sm"
              className="shrink-0"
              disabled={isInstalling}
              onClick={() => (r.action === 'install' ? install(r) : onUpgrade(r))}
            >
              {isInstalling ? <><Loader2 size={12} className="animate-spin" /> Installing</> : r.action === 'install' ? 'Install' : 'Upgrade'}
            </Button>
          </div>
        )
      })}
    </section>
  )
}
