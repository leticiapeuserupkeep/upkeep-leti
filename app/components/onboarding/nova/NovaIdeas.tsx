'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, FileChartColumn, LayoutDashboard, ClipboardCheck, type LucideIcon } from 'lucide-react'
import type { NovaIdea } from '@/app/lib/onboarding/nova-onboarding-data'

const ICONS: Record<NovaIdea['icon'], LucideIcon> = {
  report: FileChartColumn,
  app: LayoutDashboard,
  pm: ClipboardCheck,
}

/** How long each idea stays before the next slides in. */
const ROTATE_MS = 6000

/** One card in the carousel. */
export interface IdeaCard {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

/** "Jump straight into your maintenance": Nova's welcome ideas. */
export function NovaIdeas({ ideas, onPick }: { ideas: NovaIdea[]; onPick: (idea: NovaIdea) => void }) {
  return (
    <IdeaCarousel
      heading="Jump straight into your maintenance"
      className="mx-auto max-w-[840px]"
      cards={ideas.map(i => ({ id: i.id, title: i.title, description: i.description, icon: ICONS[i.icon] }))}
      onPick={card => { const idea = ideas.find(i => i.id === card.id); if (idea) onPick(idea) }}
    />
  )
}

/** One idea at a time, rotating on its own (paused while hovered or
 * focused), with slider bars to jump between them. Shared by the Welcome
 * page and the modules' empty states. */
export function IdeaCarousel({ heading, cards, onPick, busyId, className = '' }: {
  heading: string
  cards: IdeaCard[]
  onPick: (card: IdeaCard) => void
  /** A card Nova is creating right now — shows "Creating…". */
  busyId?: string | null
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [paused, setPaused] = useState(false)
  // The card on its way out — it slides off while the new one slides in.
  const [leaving, setLeaving] = useState<{ card: IdeaCard; direction: 'next' | 'prev' } | null>(null)

  // Cards can drop out (e.g. once created) — stay in range.
  const current = Math.min(index, Math.max(0, cards.length - 1))
  const goTo = (next: number) => {
    if (next === current) return
    const dir = next > current || (current === cards.length - 1 && next === 0) ? 'next' : 'prev'
    setLeaving({ card: cards[current], direction: dir })
    setDirection(dir)
    setIndex(next)
  }

  const card = cards[current]
  if (!card) return null

  return (
    <section
      className={`flex w-full flex-col gap-3 nova-enter ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <h2 className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">{heading}</h2>

      {/* Clips the slide, with room around it so the card's shadow isn't cut. */}
      <div className="relative -m-10 overflow-hidden p-10">
        {/* Keyed so each card plays its slide-in, from the side it came from;
            the previous one slides out the other way on top of it. */}
        <IdeaRow key={card.id} card={card} busy={busyId === card.id} onPick={onPick} className={direction === 'next' ? 'nova-idea-in-next' : 'nova-idea-in-prev'} />
        {leaving && (
          <IdeaRow
            key={`out-${leaving.card.id}`}
            card={leaving.card}
            onPick={onPick}
            className={`pointer-events-none absolute inset-10 ${leaving.direction === 'next' ? 'nova-idea-out-next' : 'nova-idea-out-prev'}`}
            onAnimationEnd={() => setLeaving(null)}
            aria-hidden
          />
        )}
      </div>

      {/* Slider bars: the current one fills up until the next card, click any to jump. */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label={heading}>
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={c.title}
              onClick={() => goTo(i)}
              className={`relative h-1.5 overflow-hidden rounded-full bg-[var(--color-accent-3)] transition-[width,background-color] duration-300 ease-out hover:bg-[var(--color-accent-4)] cursor-pointer ${i === current ? 'w-6' : 'w-1.5'}`}
            >
              {i === current && (
                <span
                  key={current}
                  className="nova-idea-progress absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent-9)]"
                  style={{ animationDuration: `${ROTATE_MS}ms`, animationPlayState: paused || busyId ? 'paused' : 'running' }}
                  // The bar is the timer: when it's full, the next card comes in.
                  onAnimationEnd={() => goTo((current + 1) % cards.length)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function IdeaRow({ card, busy = false, onPick, className, onAnimationEnd, 'aria-hidden': ariaHidden }: {
  card: IdeaCard
  busy?: boolean
  onPick: (card: IdeaCard) => void
  className: string
  onAnimationEnd?: () => void
  'aria-hidden'?: boolean
}) {
  return (
    // The whole card is the button: icon tile, the idea, and the arrow as a
    // visual cue. Hover outlines it in the lightest blue.
    <button
      type="button"
      onClick={() => onPick(card)}
      disabled={busy}
      tabIndex={ariaHidden ? -1 : undefined}
      aria-label={ariaHidden ? undefined : `${card.title}: ${card.description}`}
      className={`group flex w-full items-center gap-4 rounded-[20px] border border-transparent bg-[var(--surface-primary)] p-4 text-left shadow-[-10px_10px_30px_rgba(31,45,92,0.06)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-2)] cursor-pointer disabled:cursor-default ${className}`}
      onAnimationEnd={onAnimationEnd}
      aria-hidden={ariaHidden}
    >
      <IdeaIcon icon={card.icon} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{card.title}</span>
        <span className="truncate text-[length:var(--font-size-base)] leading-5 text-[var(--color-neutral-9)]">{busy ? 'Creating…' : card.description}</span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[100px] bg-[var(--color-accent-9)] text-white transition-colors duration-[var(--duration-fast)] group-hover:bg-[var(--color-accent-10)]">
        {busy
          ? <Loader2 size={16} className="animate-spin" />
          : <ArrowRight size={16} className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />}
      </span>
    </button>
  )
}

/** Light blue tile with a thin blue line icon, plus Nova's AI badge inside
 * its corner so it reads as "Nova does this". */
function IdeaIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="relative flex shrink-0" aria-hidden>
      <span className="flex items-center justify-center rounded-[16px] bg-[var(--color-accent-1)] p-7 text-[var(--color-accent-9)]">
        <Icon size={40} strokeWidth={1.25} />
      </span>
      {/* AI badge — navy disc with Nova's sparkle, from the Figma spec. */}
      <span className="absolute bottom-1 right-1 flex items-center justify-center rounded-full bg-[#1F2D5C] p-2 shadow-[0_4px_14px_rgba(0,0,0,0.15)]">
        <svg width="9" height="9" viewBox="26.75 22.75 18.5 18.5" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M45.25 32C38.8264 32 36 34.8264 36 41.25C36 34.8264 33.1736 32 26.75 32C33.1736 32 36 29.1736 36 22.75C36 29.1736 38.8264 32 45.25 32Z" fill="white" />
        </svg>
      </span>
    </span>
  )
}
