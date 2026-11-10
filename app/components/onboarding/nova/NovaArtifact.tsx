'use client'

import type { ReactNode } from 'react'
import { FileText, Share, X } from 'lucide-react'
import { IconButton } from '@/app/components/ui/IconButton'

/** A document Nova made, as a compact card in the chat. Opens it beside the
 * conversation; when it's already open the same button hides it. */
export function NovaArtifactCard({ title, subtitle, open, onToggle }: {
  title: string
  subtitle: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`flex w-full max-w-[520px] items-center gap-3 rounded-[var(--radius-xl)] border p-2 pr-3 transition-colors duration-[var(--duration-fast)] nova-enter ${
        open ? 'border-[var(--color-neutral-6)] bg-[var(--color-neutral-2)]' : 'border-[var(--border-default)] bg-[var(--surface-primary)]'
      }`}
    >
      <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
        <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-accent-4)] bg-[var(--color-accent-1)] text-[var(--color-accent-9)]">
          <FileText size={16} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)]">{title}</span>
          <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{subtitle}</span>
        </span>
      </button>
      <IconButton label="Share" variant="secondary" size="md"><Share size={14} /></IconButton>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 items-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-2)] cursor-pointer"
      >
        {open ? 'Hide' : 'Open'}
      </button>
    </div>
  )
}

/** The opened document, in a closable pane to the right of the chat. */
export function NovaArtifactPanel({ title, onClose, actions, fill = false, className = '', children }: {
  title: string
  onClose: () => void
  className?: string
  /** Take all the space it's given instead of a side column's width. */
  fill?: boolean
  /** Extra controls in the header, before close. */
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <aside
      aria-label={title}
      className={`flex min-h-0 ${fill ? 'w-full' : 'w-[min(680px,50%)]'} shrink-0 flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-sm)] nova-panel-in ${className}`}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] pl-[var(--space-lg)] pr-[var(--space-sm)]">
        <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{title}</span>
        {actions}
        <IconButton label="Close" variant="ghost" size="md" className="text-[var(--color-neutral-9)] hover:text-[var(--color-neutral-12)] hover:bg-[var(--color-neutral-3)]" onClick={onClose}><X size={16} /></IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-[var(--space-lg)]">{children}</div>
    </aside>
  )
}
