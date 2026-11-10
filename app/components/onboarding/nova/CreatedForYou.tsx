'use client'

import Image from 'next/image'
import { ExternalLink, CalendarClock, FileText, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/Skeleton'
import type { CreatedItem } from '@/app/lib/onboarding/setup-store'

/** Everything Nova has made for the user so far — a skeleton row while it's
 * being made, then the item lands with the same entrance as the rest. */
export function CreatedForYou({ items, creating, onOpenReport }: {
  items: CreatedItem[]
  creating: boolean
  /** Reports open beside the chat. */
  onOpenReport?: (id: string) => void
}) {
  if (items.length === 0 && !creating) return null

  return (
    <section className="flex flex-col gap-[var(--space-sm)] nova-enter">
      <span className="px-1 pt-[var(--space-xs)] text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">What we created for you</span>

      {items.map(item => {
        const isDoc = item.kind === 'google-doc'
        const isReport = item.kind === 'report'
        const Icon = item.kind === 'pm' ? CalendarClock : isReport ? BarChart3 : FileText
        const body = (
          <>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] text-[var(--color-accent-9)]">
              {isDoc ? <Image src="/images/integrations/google-docs.svg" alt="" width={12} height={16} /> : <Icon size={14} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{item.title}</span>
              <span className="truncate text-[length:var(--font-size-xs)] text-[var(--color-neutral-8)]">
                {isDoc ? 'Google Doc' : isReport ? `UpKeep report${item.detail ? ` · ${item.detail}` : ''}` : item.kind === 'pm' ? `Preventive maintenance · ${item.detail ?? ''}` : `Work order · ${item.detail ?? ''}`}
              </span>
            </span>
            {isDoc && <ExternalLink size={14} className="shrink-0 text-[var(--color-neutral-8)]" />}
          </>
        )
        const cls = 'flex shrink-0 items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] py-2.5 pl-3 pr-2 transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-neutral-6)] nova-row-pop'
        if (isReport) {
          return (
            <button key={item.id} type="button" onClick={() => onOpenReport?.(item.id)} className={`${cls} text-left cursor-pointer`}>{body}</button>
          )
        }
        return isDoc ? (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={e => e.preventDefault()} className={cls}>{body}</a>
        ) : (
          <div key={item.id} className={cls}>{body}</div>
        )
      })}

      {creating && (
        <div className="flex shrink-0 items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] py-2.5 pl-3 pr-2">
          <Skeleton className="h-7 w-7" rounded="lg" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      )}
    </section>
  )
}
