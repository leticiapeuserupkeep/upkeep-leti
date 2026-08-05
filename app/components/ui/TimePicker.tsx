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

function parseInputTime(raw: string): string | null {
  const s = raw.trim().toUpperCase()
  const full = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (full) {
    const h = parseInt(full[1], 10)
    const m = parseInt(full[2], 10)
    const per = full[3]
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59)
      return toTime24(String(h).padStart(2, '0'), String(m).padStart(2, '0'), per)
  }
  const noAmPm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (noAmPm) {
    const h = parseInt(noAmPm[1], 10)
    const m = parseInt(noAmPm[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return null
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
      className="flex flex-col overflow-y-auto h-[192px]"
      style={{ scrollbarWidth: 'none' }}
      onWheel={e => {
        e.stopPropagation()
        if (listRef.current) listRef.current.scrollTop += e.deltaY
      }}
    >
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
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { hour, minute, period } = parseTime(value)

  useEffect(() => {
    setInputVal(value ? formatDisplay(value) : '')
  }, [value, open])

  function setHour(h: string) { onChange(toTime24(h, minute, period)) }
  function setMinute(m: string) { onChange(toTime24(hour, m, period)) }
  function setPeriod(p: string) { onChange(toTime24(hour, minute, p)) }

  function handleInputChange(raw: string) {
    setInputVal(raw)
    const parsed = parseInputTime(raw)
    if (parsed) onChange(parsed)
  }

  function handleInputBlur() {
    blurTimerRef.current = setTimeout(() => {
      const parsed = parseInputTime(inputVal)
      if (parsed) {
        onChange(parsed)
      } else {
        setInputVal(value ? formatDisplay(value) : '')
      }
    }, 150)
  }

  function handleInputFocus() {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen(true)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className={`h-8 min-w-[100px] flex items-center gap-1 px-2 rounded-[var(--radius-md)] border data-[state=open]:border-[var(--color-accent-7)] border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] transition-colors cursor-text ${className}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setOpen(true) }}
            placeholder="hh:mm AM"
            className="flex-1 min-w-0 bg-transparent outline-none text-[13px] cursor-text text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-6)]"
          />
          <Clock size={13} className="text-[var(--color-neutral-7)] shrink-0 pointer-events-none" />
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className="z-[var(--z-dropdown)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden"
          onOpenAutoFocus={e => e.preventDefault()}
          onInteractOutside={() => setOpen(false)}
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
