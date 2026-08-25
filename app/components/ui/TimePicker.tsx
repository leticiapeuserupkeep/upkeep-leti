'use client'

import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Clock } from 'lucide-react'


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

  // HH:MM AM/PM  or  H:MM AM/PM
  const full = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (full) {
    const h = parseInt(full[1], 10)
    const m = parseInt(full[2], 10)
    const per = full[3]
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59)
      return toTime24(String(h).padStart(2, '0'), String(m).padStart(2, '0'), per)
  }

  // HH:MM (24h or 12h without period)
  const noAmPm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (noAmPm) {
    const h = parseInt(noAmPm[1], 10)
    const m = parseInt(noAmPm[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // Bare digits + AM/PM: 917AM, 1230PM
  const digitsAmPm = s.match(/^(\d{3,4})(AM|PM)$/)
  if (digitsAmPm) {
    const d = digitsAmPm[1], per = digitsAmPm[2]
    const h = parseInt(d.length === 3 ? d[0] : d.slice(0, 2), 10)
    const m = parseInt(d.length === 3 ? d.slice(1) : d.slice(2), 10)
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59)
      return toTime24(String(h).padStart(2, '0'), String(m).padStart(2, '0'), per)
  }

  // Bare digits: 930 → 09:30, 1430 → 14:30
  const digits = s.replace(/\D/g, '')
  if (digits.length === 3) {
    const h = parseInt(digits[0], 10)
    const m = parseInt(digits.slice(1), 10)
    if (h <= 9 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  if (digits.length === 4) {
    const h = parseInt(digits.slice(0, 2), 10)
    const m = parseInt(digits.slice(2), 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return null
}

/* One list of times rather than three columns to reconcile: every half hour of
   the day, scrolled to whatever is currently set. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h24 = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h24).padStart(2, '0')}:${m}`
})

function TimeList({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  const listRef = useRef<HTMLDivElement>(null)
  const ITEM_H = 32

  useEffect(() => {
    const idx = TIME_OPTIONS.indexOf(selected)
    if (idx >= 0 && listRef.current) {
      /* Keep the selected time a couple of rows down so its neighbours show. */
      listRef.current.scrollTop = Math.max(0, (idx - 2) * ITEM_H)
    }
  }, [selected])

  return (
    <div
      ref={listRef}
      className="flex flex-col overflow-y-auto max-h-[240px] w-[130px] py-1"
      onWheel={e => {
        e.stopPropagation()
        if (listRef.current) listRef.current.scrollTop += e.deltaY
      }}
    >
      {TIME_OPTIONS.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className={`h-8 shrink-0 flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer ${
            t === selected
              ? 'bg-[var(--color-accent-9)] text-white'
              : 'text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)]'
          }`}
        >
          {formatDisplay(t)}
        </button>
      ))}
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

  /* The list moves in half hours; anything in between highlights the slot it
     falls in rather than nothing at all. */
  const selectedSlot = value ? `${value.slice(0, 2)}:${parseInt(value.slice(3, 5), 10) < 30 ? '00' : '30'}` : ''

  function handleInputChange(raw: string) {
    // Allow digits, colon, space, and AM/PM letters; uppercase letters as typed
    const sanitized = raw.toUpperCase().replace(/[^0-9: AMP]/g, '')

    if (/[AMP]/.test(sanitized)) {
      // User is typing AM/PM — pass through, let parseInputTime handle it
      setInputVal(sanitized)
      const parsed = parseInputTime(sanitized)
      if (parsed) onChange(parsed)
      return
    }

    // Pure digit input — auto-insert colon after 2nd digit
    const digits = sanitized.replace(/\D/g, '').slice(0, 4)
    let display = digits
    if (digits.length >= 3) display = digits.slice(0, 2) + ':' + digits.slice(2)
    setInputVal(display)
    const parsed = parseInputTime(display)
    if (parsed) onChange(parsed)
  }

  function commitInput() {
    const parsed = parseInputTime(inputVal)
    if (parsed) {
      onChange(parsed)
      setInputVal(formatDisplay(parsed))
    } else {
      setInputVal(value ? formatDisplay(value) : '')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      commitInput()
      setOpen(false)
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setOpen(false)
      setInputVal(value ? formatDisplay(value) : '')
    }
  }

  function handleInputBlur() {
    blurTimerRef.current = setTimeout(() => {
      commitInput()
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
          className={`h-8 w-[130px] flex items-center gap-1 px-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] data-[state=open]:border-[var(--color-accent-7)] data-[state=open]:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors cursor-text ${className}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
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
          <TimeList
            selected={selectedSlot}
            onSelect={t => { onChange(t); setOpen(false) }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
