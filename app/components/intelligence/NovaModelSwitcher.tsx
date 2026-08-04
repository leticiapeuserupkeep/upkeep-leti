'use client'

import { useState } from 'react'
import { ChevronDown, Sparkles, Star } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/DropdownMenu'

export type NovaModelId = 'standard' | 'max'

const MODEL_OPTIONS: {
  id: NovaModelId
  menuLabel: string
  triggerShort: string
}[] = [
  { id: 'standard', menuLabel: 'Standard Nova', triggerShort: 'Standard' },
  { id: 'max', menuLabel: 'Nova Max', triggerShort: 'Max' },
]

export function NovaModelSwitcher() {
  const [model, setModel] = useState<NovaModelId>('max')

  const selected = MODEL_OPTIONS.find((o) => o.id === model)!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            model === 'max'
              ? 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-full)] border border-white/25 bg-[var(--color-accent-12)] px-2.5 py-1.5 text-[length:var(--font-size-sm)] font-medium text-white shadow-sm outline-none transition-colors hover:bg-[var(--color-accent-11)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-7)] focus-visible:ring-offset-2'
              : 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--color-neutral-3)] px-2.5 py-1.5 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] shadow-sm outline-none transition-colors hover:bg-[var(--color-neutral-4)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-9)] focus-visible:ring-offset-2'
          }
          aria-label="Nova model"
        >
          {model === 'max' ? (
            <Sparkles size={16} className="shrink-0 text-white" strokeWidth={2} aria-hidden />
          ) : (
            <Star size={16} className="shrink-0 text-[var(--color-neutral-10)]" strokeWidth={2} aria-hidden />
          )}
          <span>{selected.triggerShort}</span>
          <ChevronDown
            size={14}
            className={model === 'max' ? 'shrink-0 text-white/90' : 'shrink-0 text-[var(--color-neutral-9)]'}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={6}
        minWidth="216px"
        className="p-2 shadow-[var(--shadow-md)]"
      >
        {MODEL_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            textValue={opt.menuLabel}
            className={`gap-2 rounded-[var(--radius-md)] px-2 !py-[var(--space-2xs)] text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] cursor-pointer data-[highlighted]:bg-[var(--color-neutral-3)] ${model === opt.id ? 'bg-[var(--color-neutral-3)]' : ''}`}
            onSelect={() => setModel(opt.id)}
          >
            {opt.id === 'standard' ? (
              <Star size={18} className="shrink-0 text-[var(--color-neutral-10)]" strokeWidth={2} aria-hidden />
            ) : (
              <Sparkles size={18} className="shrink-0 text-[var(--color-neutral-10)]" strokeWidth={2.25} aria-hidden />
            )}
            {opt.menuLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
