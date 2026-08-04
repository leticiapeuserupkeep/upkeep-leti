'use client'

import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Clock } from 'lucide-react'

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const PERIODS = ['AM', 'PM']

function parseTime(value: string): { hour: string; minute: string; period: string } {
  if (!value) return { hour: '12', minute: '00', period: 'AM' }
  const [h, m] = value.split(':')
  const hNum = parseInt(h, 10)
  const period = hNum >= 12 ? 'PM' : 'AM'
  const hour12 = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum
  return { hour: String(hour12).padStart(2, '0'), minute: m?.slice(0, 2) ?? '00', period }
}

function toTime24(hour: string, minute: string, period: string): string {
  let h = parseInt(hour, 10)
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

function formatDisplay(value: string): string {
  if (!value) return ''
  const { hour, minute, period } = parseTime(value)
  return `${hour}:${minute} ${period}`
}

function ScrollColumn({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
  const listRef = useRef<HTMLDivElement>(null)
  const ITEM_H = 32

  useEffect(() => {
    const idx = items.indexOf(selected)
    if (idx >= 0 && listRef.current) {
      listRef.current.scrollTop = idx * ITEM_H
    }
  }, [selected, items])

  return (
    <div
      ref={listRef}
      className="flex flex-col overflow-y-auto h-[192px] scroll-smooth"
      style={{ scrollbarWidth: 'none' }}
    >
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <div className="flex flex-col py-2">
        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`h-8 w-12 flex items-center justify-center text-[14px] font-medium transition-colors cursor-pointer shrink-0 mx-1 ${
              item === selected
                ? 'bg-[var(--color-accent-1)] text-[var(--color-accent-9)] rounded-[4px]'
                : 'text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] rounded-[4px]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

interface TimePickerProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const { hour, minute, period } = parseTime(value)

  function setHour(h: string) { onChange(toTime24(h, minute, period)) }
  function setMinute(m: string) { onChange(toTime24(hour, m, period)) }
  function setPeriod(p: string) { onChange(toTime24(hour, minute, p)) }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`h-8 flex items-center gap-2 px-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] data-[state=open]:border-[var(--color-accent-7)] transition-colors cursor-pointer outline-none ${className}`}
        >
          <Clock size={13} className="text-[var(--color-neutral-7)] shrink-0" />
          <span className={value ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-7)]'}>
            {value ? formatDisplay(value) : 'Set time'}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className="z-[var(--z-dropdown)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="flex divide-x divide-[var(--border-subtle)]">
            <ScrollColumn items={HOURS} selected={hour} onSelect={setHour} />
            <ScrollColumn items={MINUTES} selected={minute} onSelect={setMinute} />
            <ScrollColumn items={PERIODS} selected={period} onSelect={setPeriod} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
