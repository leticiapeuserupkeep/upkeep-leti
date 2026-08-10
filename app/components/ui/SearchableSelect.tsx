'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, Search, Check, X } from 'lucide-react'
import { Avatar } from '@/app/components/ui/Avatar'

/* ── Single-select ── */

interface SearchableSelectProps {
  label?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  className?: string
  showAvatar?: boolean
}

export function SearchableSelect({
  label, required, value, onChange, options, placeholder = '', className = '', showAvatar = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
    else setQuery('')
  }, [open])

  return (
    <div className={`flex flex-col gap-[var(--space-xs)] ${className}`}>
      {label && (
        <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
          {label}{required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="w-full h-10 flex items-center gap-2 pl-3 pr-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] data-[state=open]:border-[var(--color-accent-7)] data-[state=open]:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors cursor-pointer outline-none"
          >
            {showAvatar && value && <Avatar name={value} size="xs" className="shrink-0" />}
            <span className={`flex-1 text-left text-[13px] truncate ${value ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-7)]'}`}>
              {value || placeholder}
            </span>
            {value && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); onChange('') }}
                className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full hover:bg-[var(--color-neutral-4)] text-[var(--color-neutral-7)] transition-colors cursor-pointer"
              >
                <X size={11} />
              </span>
            )}
            <ChevronDown size={14} className="shrink-0 text-[var(--color-neutral-7)]" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={4}
            align="start"
            className="z-[var(--z-dropdown)] w-[var(--radix-popover-trigger-width)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none dropdown-animate overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
              <Search size={13} className="shrink-0 text-[var(--color-neutral-7)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-[13px] text-[var(--color-neutral-11)] bg-transparent outline-none placeholder:text-[var(--color-neutral-7)]"
              />
            </div>
            <div className="py-1 max-h-[200px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-[13px] text-[var(--color-neutral-7)]">No results</p>
              ) : filtered.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => { onChange(o); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-[var(--space-xs)] text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${value === o ? 'text-[var(--color-accent-9)] font-medium bg-[var(--color-accent-1)]' : 'text-[var(--color-neutral-11)]'}`}
                >
                  {showAvatar && <Avatar name={o} size="xs" className="shrink-0" />}
                  <span className="flex-1 truncate">{o}</span>
                  {value === o && <Check size={13} className="shrink-0" />}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

/* ── Multi-select ── */

interface SearchableMultiSelectProps {
  label?: string
  required?: boolean
  values: string[]
  onChange: (values: string[]) => void
  options: string[]
  placeholder?: string
  className?: string
  showAvatar?: boolean
}

export function SearchableMultiSelect({
  label, required, values, onChange, options, placeholder = '', className = '', showAvatar = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(values.length)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
    else setQuery('')
  }, [open])

  const compute = useCallback(() => {
    const trigger = triggerRef.current
    const measure = measureRef.current
    if (!trigger || !measure || values.length === 0) { setVisibleCount(0); return }

    const CHEVRON_W = 26
    const GAP = 4
    const PL = 12
    const OVERFLOW_W = 36
    const available = trigger.offsetWidth - PL - CHEVRON_W

    const chipEls = Array.from(measure.children) as HTMLElement[]
    let used = 0
    let count = 0
    for (let i = 0; i < values.length; i++) {
      const chipW = chipEls[i]?.offsetWidth ?? 60
      const remaining = values.length - i - 1
      const needed = (i > 0 ? GAP : 0) + chipW + (remaining > 0 ? GAP + OVERFLOW_W : 0)
      if (used + needed <= available) {
        used += (i > 0 ? GAP : 0) + chipW
        count++
      } else break
    }
    setVisibleCount(Math.max(1, count))
  }, [values])

  useEffect(() => {
    compute()
    const ro = new ResizeObserver(compute)
    if (triggerRef.current) ro.observe(triggerRef.current)
    return () => ro.disconnect()
  }, [compute])

  function toggle(o: string) {
    onChange(values.includes(o) ? values.filter(v => v !== o) : [...values, o])
  }

  const hidden = values.length - visibleCount
  const visibleValues = values.slice(0, visibleCount)

  return (
    <div className={`flex flex-col gap-[var(--space-xs)] ${className}`}>
      {label && (
        <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
          {label}{required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      {/* Hidden measurement row */}
      <div ref={measureRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', display: 'flex', gap: '4px' }} aria-hidden="true">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[12px] font-medium whitespace-nowrap">
            {v}<X size={11} />
          </span>
        ))}
      </div>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="w-full h-10 flex items-center gap-1 pl-3 pr-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] data-[state=open]:border-[var(--color-accent-7)] data-[state=open]:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors cursor-pointer outline-none text-left overflow-hidden"
          >
            {values.length === 0 ? (
              <span className="flex-1 text-[13px] text-[var(--color-neutral-7)]">{placeholder}</span>
            ) : (
              <>
                {visibleValues.map(v => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[12px] font-medium shrink-0"
                    onClick={e => { e.stopPropagation(); toggle(v) }}
                  >
                    {v}
                    <X size={11} className="cursor-pointer" />
                  </span>
                ))}
                {hidden > 0 && (
                  <span className="inline-flex items-center h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)] text-[12px] font-medium shrink-0">
                    +{hidden}
                  </span>
                )}
              </>
            )}
            <ChevronDown size={14} className="shrink-0 text-[var(--color-neutral-7)] ml-auto" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={4}
            align="start"
            className="z-[var(--z-dropdown)] w-[var(--radix-popover-trigger-width)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none dropdown-animate overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
              <Search size={13} className="shrink-0 text-[var(--color-neutral-7)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-[13px] text-[var(--color-neutral-11)] bg-transparent outline-none placeholder:text-[var(--color-neutral-7)]"
              />
            </div>
            <div className="py-1 max-h-[200px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-[13px] text-[var(--color-neutral-7)]">No results</p>
              ) : filtered.map(o => {
                const selected = values.includes(o)
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggle(o)}
                    className={`w-full flex items-center gap-2.5 px-3 py-[var(--space-xs)] text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${selected ? 'bg-[var(--color-accent-1)]' : ''} text-[var(--color-neutral-11)]`}
                  >
                    <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-[3px] border transition-colors ${selected ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--border-default)] bg-[var(--surface-primary)]'}`}>
                      {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </span>
                    {showAvatar && <Avatar name={o} size="xs" className="shrink-0" />}
                    <span className="flex-1 truncate">{o}</span>
                  </button>
                )
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
