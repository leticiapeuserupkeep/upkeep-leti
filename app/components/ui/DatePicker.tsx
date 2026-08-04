'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa']

function parseDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplay(value: string): string {
  const d = parseDate(value)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

interface DatePickerProps {
  value: string
  onChange: (v: string) => void
  label: string
  className?: string
}

export function DatePicker({ value, onChange, label, className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const selected = parseDate(value)
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  function select(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    onChange(toValue(d))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`group/datefield flex items-center gap-1 px-1.5 py-1 rounded-[var(--radius-md)] cursor-pointer hover:bg-[var(--color-neutral-3)] transition-all duration-200 ease-in-out ${className}`}
        >
          <span className="text-[11px] text-[#8B8D98] group-hover/datefield:text-[#60646C] transition-colors duration-200 select-none">{label}:</span>
          <span className="text-[12px] text-[#60646C] min-w-[68px] text-left">
            {value ? formatDisplay(value) : <span className="text-[#8B8D98]">—</span>}
          </span>
          <Calendar size={11} className="text-[#8B8D98] opacity-0 group-hover/datefield:opacity-100 transition-opacity duration-200 shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-[var(--z-dropdown)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none p-3 w-[240px]"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer text-[var(--color-neutral-8)]">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-semibold text-[var(--color-neutral-12)]">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer text-[var(--color-neutral-8)]">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-[var(--color-neutral-7)] py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const isSelected = selected?.getFullYear() === viewYear && selected?.getMonth() === viewMonth && selected?.getDate() === day
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(day)}
                  className={`h-8 w-full flex items-center justify-center text-[14px] font-medium transition-colors cursor-pointer rounded-[8px] ${
                    isSelected
                      ? 'bg-[var(--color-accent-9)] text-white'
                      : isToday
                        ? 'bg-[var(--color-accent-1)] text-[var(--color-accent-9)]'
                        : 'text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)]'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Clear */}
          {value && (
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="w-full text-center text-[12px] text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer py-0.5"
              >
                Clear
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
