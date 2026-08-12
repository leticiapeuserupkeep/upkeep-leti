'use client'

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import * as Popover from '@radix-ui/react-popover'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, FileText, Box,
  Plus, X, MapPin, Gauge, Clock, Users, Upload, Trash2, PanelLeft,
  Calendar, ArrowRight, ArrowDown, Sparkle, MoreHorizontal, Pencil, Activity, CalendarClock,
  User, UserX, RotateCcw, RefreshCw, Camera, Link2, Search, Ban, Flag, SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { IconButton } from '@/app/components/ui/IconButton'
import { TextInput, Textarea } from '@/app/components/ui/TextInput'
import { Switch } from '@/app/components/ui/Switch'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/components/ui/DropdownMenu'
import { Avatar } from '@/app/components/ui/Avatar'
import { Tooltip, TooltipProvider } from '@/app/components/ui/Tooltip'
import { Badge } from '@/app/components/ui/Badge'
import { FilterSelect } from '@/app/components/ui/FilterSelect'
import { SearchableSelect, SearchableMultiSelect } from '@/app/components/ui/SearchableSelect'
import { NumberInput } from '@/app/components/ui/NumberInput'
import { TimePicker } from '@/app/components/ui/TimePicker'
import { DatePicker } from '@/app/components/ui/DatePicker'
import { ASSET_NAMES, LOCATION_NAMES, METER_NAMES, PM_TEAMS, getAssetData, getLocationData, getMeterData } from '@/app/lib/pm-database'

/* ── Types ── */

interface AssignedAsset {
  id: string
  name: string
  location: string
  meter: string
  trigger: string
  triggerType?: 'meter' | 'calendar' | 'both'
  frequency: string
  primaryAssignee: string
  additionalAssignees?: string[]
  team: string
  timeRange: string
}

interface AssignAssetForm {
  asset: string[]
  location: string[]
  meter: string[]
  primaryAssignee: string
  additionalAssignee: string[]
  team: string
  trigger: string
  startDate: string
  endDate: string
}

interface CalendarTrigger {
  id: string
  scheduleType: string
  every: string
  period: string
  // week
  weekday: string
  // month
  monthMode: 'on-day' | 'on-the'
  monthDay: string
  monthOrdinal: string
  monthWeekday: string
  // year
  yearMode: 'on-day' | 'on-the'
  yearMonth: string
  yearDay: string
  yearOrdinal: string
  yearWeekday: string
  atTime: string
  // WO creation
  woCreationMode: 'relative' | 'on-the' | ''
  woRelativeN: string
  woRelativePeriod: string
  woOnThePeriod: string
  woAtTime: string
  woOnTheAtTime: string
  // Meter trigger
  meterCondition: string
  meterValue: string
  meterUnit: string
  meterDueN: string
  meterDuePeriod: string
}

/* ── Checklist types ── */

type TaskItemType = 'pass-fail' | 'text'

interface ChecklistTask {
  id: string
  title: string
  type: TaskItemType
  value: string
}

interface ChecklistGroup {
  id: string
  title: string
  tasks: ChecklistTask[]
  open: boolean
}

/* ── Mock options ── */

const CATEGORIES = ['Preventative', 'Electrical', 'Safety', 'Upgrade', 'Damage', 'Inspection']
const PRIORITIES = ['None', 'Low', 'Medium', 'High']
const PRIORITY_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'None',   label: 'None',   color: '#8B8D98' },
  { value: 'Low',    label: 'Low',    color: '#3E63DD' },
  { value: 'Medium', label: 'Medium', color: '#F76B15' },
  { value: 'High',   label: 'High',   color: '#CE2C31' },
]
const ASSETS = [...ASSET_NAMES].sort((a, b) => a.localeCompare(b))
const LOCATIONS = [...LOCATION_NAMES].sort((a, b) => a.localeCompare(b))
const METERS = [...METER_NAMES].sort((a, b) => a.localeCompare(b))
const TRIGGERS = ['Every Wednesday', 'Daily', 'Weekly', 'Monthly', 'On Meter Reading']
const ASSIGNEE_ROLES: Record<string, string> = {
  'Leticia Peuser': 'Technician',
  'John Smith': 'Technician',
  'Maria Garcia': 'Technician',
  'David Chen': 'Supervisor',
}
const ASSIGNEES = Object.keys(ASSIGNEE_ROLES).sort((a, b) => a.localeCompare(b))
const TEAM_COLORS: Record<string, string> = {
  Maintenance: '#3B82F6',
  Electrical: '#F59E0B',
  Safety: '#10B981',
  Operations: '#8B5CF6',
}
const TEAMS = ['Maintenance', 'Electrical', 'Safety', 'Operations'].map(name => ({
  value: name,
  label: name,
  icon: (
    <span style={{ background: TEAM_COLORS[name] }} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">
      {name[0]}
    </span>
  ),
}))

/* ── Date utilities ── */

function displayDate(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${m.padStart(2,'0')}/${d.padStart(2,'0')}/${y}`
}

function isoToMDY(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${m.padStart(2,'0')}/${d.padStart(2,'0')}/${y}`
}

function mdyToIso(mdy: string): string {
  const clean = mdy.replace(/[^\d/]/g, '')
  const parts = clean.split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  if (!m || !d || !y || y.length < 4) return ''
  const month = parseInt(m, 10)
  const day = parseInt(d, 10)
  const year = parseInt(y, 10)
  if (month < 1 || month > 12) return ''
  const maxDay = new Date(year, month, 0).getDate()
  if (day < 1 || day > maxDay) return ''
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function autoFormatMDY(prev: string, next: string): string {
  const prevDigits = prev.replace(/\D/g, '')
  const nextDigits = next.replace(/\D/g, '')
  if (nextDigits.length < prevDigits.length) {
    // Deleting: strip trailing slash so backspace feels natural
    return next.endsWith('/') ? next.slice(0, -1) : next
  }
  const digits = nextDigits.slice(0, 8)
  if (digits.length === 0) return ''

  // Month part (positions 0-1)
  let mm = digits.slice(0, Math.min(2, digits.length))
  if (mm.length === 2) {
    const m = parseInt(mm, 10)
    if (m < 1) mm = '01'
    else if (m > 12) mm = '12'
  }
  if (digits.length <= 2) return mm

  // Day part (positions 2-3)
  const month = parseInt(mm, 10) || 1
  let dd = digits.slice(2, Math.min(4, digits.length))
  if (dd.length === 2) {
    const yyyy = digits.length >= 8 ? parseInt(digits.slice(4, 8), 10) : new Date().getFullYear()
    const maxD = new Date(yyyy, month, 0).getDate()
    const d = parseInt(dd, 10)
    if (d < 1) dd = '01'
    else if (d > maxD) dd = String(maxD).padStart(2, '0')
  }
  if (digits.length <= 4) return `${mm}/${dd}`

  // Year part (positions 4-7)
  const yyyy = digits.slice(4, 8)
  return `${mm}/${dd}/${yyyy}`
}

function MiniCalendar({ iso, onSelect }: { iso: string; onSelect: (iso: string) => void }) {
  const today = new Date()
  const validIso = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  const initYear = validIso ? parseInt(iso.split('-')[0], 10) : today.getFullYear()
  const initMonth = validIso ? parseInt(iso.split('-')[1], 10) - 1 : today.getMonth()
  const [viewYear, setViewYear] = React.useState(initYear)
  const [viewMonth, setViewMonth] = React.useState(initMonth)
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const selParts = validIso ? iso.split('-') : []
  const selY = selParts[0] ? parseInt(selParts[0], 10) : -1
  const selM = selParts[1] ? parseInt(selParts[1], 10) - 1 : -1
  const selD = selParts[2] ? parseInt(selParts[2], 10) : -1
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate()
  return (
    <div className="p-3 w-[256px] select-none">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => { const d = new Date(viewYear, viewMonth - 1, 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }} className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--color-neutral-3)] cursor-pointer text-[var(--color-neutral-8)] transition-colors"><ChevronLeft size={14} /></button>
        <span className="text-[13px] font-semibold text-[var(--color-neutral-11)]">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={() => { const d = new Date(viewYear, viewMonth + 1, 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }} className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--color-neutral-3)] cursor-pointer text-[var(--color-neutral-8)] transition-colors"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <span key={d} className="text-[10px] font-medium text-[var(--color-neutral-7)] text-center py-0.5">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />
          const isSelected = day === selD && viewMonth === selM && viewYear === selY
          const isToday = day === todayD && viewMonth === todayM && viewYear === todayY
          return (
            <button key={i} type="button" onClick={() => { const m = String(viewMonth + 1).padStart(2,'0'); const d = String(day).padStart(2,'0'); onSelect(`${viewYear}-${m}-${d}`) }} className={`h-7 w-full flex items-center justify-center rounded-[var(--radius-sm)] text-[12px] cursor-pointer transition-colors ${isSelected ? 'bg-[var(--color-accent-9)] text-white font-semibold' : isToday ? 'border border-[var(--color-accent-7)] text-[var(--color-accent-11)] font-semibold hover:bg-[var(--color-accent-2)]' : 'text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)]'}`}>{day}</button>
          )
        })}
      </div>
    </div>
  )
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function DateInputMDY({ value, onChange, label, className, defaultToday, minIso }: { value: string; onChange: (iso: string) => void; label?: string; className?: string; defaultToday?: boolean; minIso?: string }) {
  const getInitial = (v: string) => {
    if (v) return isoToMDY(v)
    if (defaultToday) { const iso = todayIso(); return isoToMDY(iso) }
    return ''
  }
  const [raw, setRaw] = React.useState(() => getInitial(value))
  const [open, setOpen] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [error, setError] = React.useState('')
  React.useEffect(() => {
    if (value) { setRaw(isoToMDY(value)); setError('') }
    else if (defaultToday) { const iso = todayIso(); onChange(iso); setRaw(isoToMDY(iso)) }
    else setRaw('')
  }, [value])
  const commit = (text: string) => {
    if (!text.trim()) { onChange(''); setRaw(''); setError(''); return }
    const iso = mdyToIso(text)
    if (!iso) { setError('Invalid date'); return }
    if (minIso && iso < minIso) { setError('Must be after start date'); return }
    onChange(iso); setRaw(isoToMDY(iso)); setError('')
  }
  return (
    <div className={`flex flex-col gap-[var(--space-xs)] ${className ?? ''}`}>
      {label && <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">{label}</label>}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <div className={`flex items-center h-9 px-2.5 gap-2 rounded-[var(--radius-md)] border bg-[var(--surface-primary)] cursor-text transition-colors outline-none ${error ? 'border-[var(--color-error)] shadow-[0_0_1px_3px_rgba(206,44,49,0.12)]' : focused || open ? 'border-[var(--color-accent-7)] shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]' : 'border-[var(--border-default)]'}`}
            onClick={() => { setOpen(false) }}>
            <input
              type="text"
              placeholder="MM/DD/YYYY"
              value={raw}
              onClick={e => e.stopPropagation()}
              onChange={e => { const v = e.target.value; setError(''); setRaw(prev => autoFormatMDY(prev, v)) }}
              onFocus={() => setFocused(true)}
              onBlur={() => { setFocused(false); commit(raw) }}
              onKeyDown={e => { if (e.key === 'Enter') { commit(raw); setOpen(true) } }}
              className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-6)]"
            />
            {raw && !(defaultToday && raw === isoToMDY(todayIso())) && (
              <button type="button" onClick={e => { e.stopPropagation(); setError(''); if (defaultToday) { const iso = todayIso(); onChange(iso); setRaw(isoToMDY(iso)) } else { onChange(''); setRaw('') } }} className="shrink-0 text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"><X size={12} /></button>
            )}
            <button type="button" onClick={e => { e.stopPropagation(); setOpen(o => !o) }} className="shrink-0 text-[var(--color-neutral-6)] hover:text-[var(--color-neutral-9)] transition-colors cursor-pointer"><Calendar size={14} /></button>
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none" onOpenAutoFocus={e => e.preventDefault()}>
            <MiniCalendar iso={value} onSelect={iso => { if (minIso && iso < minIso) { setError('Must be after start date'); setOpen(false); return } onChange(iso); setRaw(isoToMDY(iso)); setError(''); setOpen(false) }} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-[11px] text-[var(--color-error)] mt-0.5">{error}</p>}
    </div>
  )
}

function validateDateRange(start: string, end: string): string {
  const checkYear = (d: string) => {
    if (!d) return true
    const y = parseInt(d.split('-')[0], 10)
    return y >= 1000 && y <= 9999
  }
  if (!checkYear(start) || !checkYear(end)) return 'Please enter a valid year (1000–9999)'
  if (start && end && end < start) return 'End date must be on or after start date'
  return ''
}

/* ── Select field component ── */

type SelectOption = string | { value: string; label: string; icon?: React.ReactNode }
function normalizeOption(o: SelectOption): { value: string; label: string; icon?: React.ReactNode } {
  return typeof o === 'string' ? { value: o, label: o } : o
}

function Select({
  label, required, value, onChange, options, placeholder = 'Select…', clearable = false,
}: {
  label?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  clearable?: boolean
}) {
  const normalized = options.map(normalizeOption)
  const selected = normalized.find(o => o.value === value)
  return (
    <div className="flex flex-col gap-[var(--space-xs)]">
      {label && (
        <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="w-full h-10 flex items-center gap-2 pl-3 pr-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] data-[state=open]:border-[var(--color-accent-7)] data-[state=open]:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors cursor-pointer outline-none">
            {selected?.icon && <span className="shrink-0 flex items-center">{selected.icon}</span>}
            <span className={`flex-1 text-left text-[13px] truncate ${value ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-7)]'}`}>
              {selected?.label ?? placeholder}
            </span>
            {clearable && value && (
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" minWidth="var(--radix-dropdown-menu-trigger-width)">
          {normalized.map(o => (
            <DropdownMenuItem
              key={o.value}
              onSelect={() => onChange(o.value)}
              className={value === o.value ? 'font-medium text-[var(--color-accent-9)] bg-[var(--color-accent-1)]' : ''}
            >
              {o.icon && <span className="mr-1.5 shrink-0 flex items-center">{o.icon}</span>}
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ChipMultiSelect({ label, values, options, onToggle }: {
  label?: string
  values: string[]
  options: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-[var(--space-xs)]">
      {label && <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">{label}</label>}
      <div className="min-h-[32px] flex flex-wrap gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] transition-colors">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[12px] font-medium">
            {v}
            <button type="button" onClick={() => onToggle(v)} className="text-[var(--color-accent-7)] hover:text-[var(--color-accent-9)] cursor-pointer leading-none">
              <X size={11} />
            </button>
          </span>
        ))}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="inline-flex items-center gap-1 h-6 px-1.5 text-[12px] text-[var(--color-neutral-7)] hover:text-[var(--color-neutral-11)] cursor-pointer rounded-[var(--radius-sm)] hover:bg-[var(--color-neutral-2)] transition-colors">
              <Plus size={11} />
              {values.length === 0 && <span>Select…</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" minWidth="200px">
            {options.map(o => (
              <DropdownMenuItem key={o} onSelect={() => onToggle(o)} className={values.includes(o) ? 'font-semibold text-[var(--color-accent-9)]' : ''}>
                {values.includes(o) && <span className="mr-2 text-[var(--color-accent-9)]">✓</span>}
                {o}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

const SCHEDULE_TYPES = ['Regular Interval', 'After Completion']
const PERIODS = ['Day', 'Week', 'Month', 'Year']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_ORDINALS = ['first', 'second', 'third', 'fourth', 'last']
const MONTH_WEEKDAYS = ['Day', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const FULL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1))

const EMPTY_TRIGGER: Omit<CalendarTrigger, 'id'> = {
  scheduleType: 'Regular Interval', every: '', period: '',
  weekday: '',
  monthMode: 'on-day', monthDay: '1', monthOrdinal: 'first', monthWeekday: 'Day',
  yearMode: 'on-day', yearMonth: 'January', yearDay: '1', yearOrdinal: 'first', yearWeekday: 'Day',
  atTime: '',
  woCreationMode: '', woRelativeN: '', woRelativePeriod: '',
  woOnThePeriod: '', woAtTime: '', woOnTheAtTime: '',
  meterCondition: '', meterValue: '', meterUnit: 'Units', meterDueN: '1', meterDuePeriod: 'Day',
}

const WEEKDAY_LETTERS = [
  { letter: 'M', value: 'Mon' },
  { letter: 'T', value: 'Tue' },
  { letter: 'W', value: 'Wed' },
  { letter: 'T', value: 'Thu' },
  { letter: 'F', value: 'Fri' },
  { letter: 'S', value: 'Sat' },
  { letter: 'S', value: 'Sun' },
]

type InlineOption = string | { value: string; label: string }

const InlineSelect = React.forwardRef<HTMLButtonElement, { value: string; onChange: (v: string) => void; options: InlineOption[]; placeholder?: string; className?: string; error?: boolean; onBlur?: () => void }>(function InlineSelect({ value, onChange, options, placeholder, className, error, onBlur }, ref) {
  const items = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  const displayLabel = value ? (items.find(i => i.value === value)?.label ?? value) : (placeholder ?? '')
  return (
    <DropdownMenu modal={false} onOpenChange={open => { if (!open) onBlur?.() }}>
      <DropdownMenuTrigger asChild>
        <button
          ref={ref}
          type="button"
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border bg-[var(--surface-primary)] text-[13px] font-medium hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer ${error ? 'border-[#CE2C31] shadow-[0_0_1px_3px_rgba(206,44,49,0.1)]' : 'border-[var(--border-default)] hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] data-[state=open]:border-[var(--color-accent-7)] data-[state=open]:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]'} ${value ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-7)]'} ${className ?? ''}`}
        >
          <span>{displayLabel}</span>
          <ChevronDown size={12} className="text-[var(--color-neutral-7)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" minWidth="140px" maxHeight={items.length > 8 ? '220px' : undefined}>
        {items.map(o => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => onChange(o.value)}
            className={value === o.value ? 'bg-[var(--color-accent-1)] text-[var(--color-accent-9)] font-medium' : ''}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

function CreateCalendarTriggerModal({
  open, onClose, onSubmit, initial, isEditing,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (t: CalendarTrigger) => void
  initial?: CalendarTrigger
  isEditing?: boolean
}) {
  const [form, setForm] = useState<Omit<CalendarTrigger, 'id'>>(initial ?? EMPTY_TRIGGER)
  const [hasChanges, setHasChanges] = useState(false)
  const [fieldsTouched, setFieldsTouched] = useState(false)
  const [woRelativeNTouched, setWoRelativeNTouched] = useState(false)
  const [woRelativePeriodTouched, setWoRelativePeriodTouched] = useState(false)
  const [woOnThePeriodTouched, setWoOnThePeriodTouched] = useState(false)
  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => {
    setFieldsTouched(true)
    setHasChanges(true)
    setForm(f => ({ ...f, [k]: v }))
  }

  const [showInactivePeriods, setShowInactivePeriods] = useState(false)
  const [showMeterTrigger, setShowMeterTrigger] = useState(!!(initial?.meterValue || initial?.meterCondition))
  const [showCalendarBased, setShowCalendarBased] = useState(!!(initial?.scheduleType && initial?.every && initial?.period))
  const [inactivePeriods, setInactivePeriods] = useState<Array<{ id: string; fromDate: string; fromTime: string; toDate: string; toTime: string }>>([])
  const [newPeriod, setNewPeriod] = useState({ fromDate: '', fromTime: '', toDate: '', toTime: '' })
  const lastAddedIdRef = useRef<string | null>(null)
  const inactiveInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const meterCardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const id = lastAddedIdRef.current
    if (!id) return
    const input = inactiveInputRefs.current.get(id)
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      input.focus()
      lastAddedIdRef.current = null
    }
  }, [inactivePeriods])
  const [meterCondition, setMeterCondition] = useState(initial?.meterCondition ?? '')
  const [meterValue, setMeterValue] = useState(initial?.meterValue ?? '')
  const [meterUnit, setMeterUnit] = useState(initial?.meterUnit ?? 'Units')
  const [everyTouched, setEveryTouched] = useState(false)
  const everyInputRef = useRef<HTMLInputElement>(null)
  const periodTriggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open && showCalendarBased) {
      setTimeout(() => everyInputRef.current?.focus(), 150)
    }
  }, [open, showCalendarBased])
  const [meterConditionTouched, setMeterConditionTouched] = useState(false)
  const [meterValueTouched, setMeterValueTouched] = useState(false)
  const meterValueInputRef = useRef<HTMLInputElement>(null)
  const [meterDueN, setMeterDueN] = useState(initial?.meterDueN ?? '')
  const [meterDuePeriod, setMeterDuePeriod] = useState(initial?.meterDuePeriod ?? '')
  const meterComplete = meterCondition !== '' && meterValue.trim() !== ''

  function handleSubmit() {
    onSubmit({ ...form, id: initial?.id ?? crypto.randomUUID(), meterCondition, meterValue, meterUnit, meterDueN, meterDuePeriod })
    setForm(EMPTY_TRIGGER)
    onClose()
  }

  function handleClose() {
    setForm(initial ?? EMPTY_TRIGGER)
    onClose()
  }

  const woPeriodOptions = ['Hour(s)', ...PERIODS.map(p => `${p}(s)`)]

  const timeInput = (value: string, onChange: (v: string) => void, className?: string) => (
    <TimePicker value={value} onChange={onChange} className={className ?? ''} />
  )

  return (
    <Modal open={open} onOpenChange={v => !v && handleClose()} maxWidth="720px">
      <ModalHeader title={isEditing ? 'Edit Schedule' : 'New Schedule'} />
      <ModalBody className="flex flex-col gap-3 p-6">

        {/* Calendar Based card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)]">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-neutral-2)] rounded-t-[var(--radius-xl)] hover:bg-[var(--color-neutral-3)] transition-colors">
            <button type="button" onClick={() => setShowCalendarBased(v => !v)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0">
                <Calendar size={15} className="text-[var(--color-neutral-9)]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium text-[var(--color-neutral-12)]">Calendar Based</span>
                {(() => {
                  const parts: string[] = []
                  if (form.scheduleType) {
                    parts.push(form.scheduleType === 'After Completion' ? 'After completion' : 'Fixed schedule')
                  }
                  if (form.every && form.period) {
                    parts.push(`Every ${form.every} ${form.period.toLowerCase()}(s)`)
                  }
                  if (form.woCreationMode === 'relative' && form.woRelativeN) {
                    parts.push(`Create WO ${form.woRelativeN} ${(form.woRelativePeriod || '').toLowerCase()} before`)
                  } else if (form.woCreationMode === 'on-the') {
                    parts.push(`Create WO ${form.woOnThePeriod} before`)
                  }
                  const touched = !!(form.every || form.period || form.woCreationMode)
                  const woMissing: string[] = form.woCreationMode === 'relative'
                    ? [!form.woRelativeN && 'number', !form.woRelativePeriod && 'period'].filter(Boolean) as string[]
                    : form.woCreationMode === 'on-the'
                    ? [!form.woOnThePeriod && 'day'].filter(Boolean) as string[]
                    : []
                  const mainMissing: string[] = [
                    ...(!form.every || !form.period ? ['maintenance frequency'] : []),
                    ...(form.period === 'Week' && !form.weekday ? ['day'] : []),
                  ]
                  const allMissing = [...mainMissing, ...woMissing]
                  if (touched && allMissing.length > 0 && !showCalendarBased) {
                    return <p className="text-[11px] font-[500] text-[var(--color-error-9,#CE2C31)] mt-0.5 leading-4">Missing: {allMissing.join(', ')}</p>
                  }
                  if (touched && parts.length > 0) {
                    return <p className="text-[11px] font-[500] text-[var(--color-neutral-9)] truncate mt-0.5 leading-4">{parts.join(' · ')}</p>
                  }
                  return <p className="text-[11px] font-[500] text-[var(--color-neutral-8)] mt-0.5 leading-4">Schedule work orders on set dates or after completion</p>
                })()}
              </div>
            </button>
            {(form.every || form.period || form.woCreationMode) ? (
              <button type="button"
                onClick={() => {
                  setForm(f => ({ ...f, scheduleType: 'Regular Interval', every: '', period: '', atTime: '', weekday: '', monthDay: '1', woCreationMode: '', woRelativeN: '', woRelativePeriod: '', woOnThePeriod: '', woAtTime: '', woOnTheAtTime: '' }))
                  setEveryTouched(false)
                  setShowCalendarBased(false)
                }}
                className="h-6 px-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[12px] font-medium text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer shrink-0">
                Reset
              </button>
            ) : null}
            {(form.every && form.period && form.woCreationMode) ? (
              <div onClick={() => setShowCalendarBased(v => !v)} className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0 cursor-pointer">
                {showCalendarBased ? <ChevronUp size={13} className="text-[var(--color-neutral-9)]" /> : <ChevronDown size={13} className="text-[var(--color-neutral-9)]" />}
              </div>
            ) : showCalendarBased ? (
              <div onClick={() => setShowCalendarBased(v => !v)} className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0 cursor-pointer">
                <ChevronUp size={13} className="text-[var(--color-neutral-9)]" />
              </div>
            ) : (
              <div onClick={() => setShowCalendarBased(v => !v)} className="w-8 h-8 rounded-[var(--radius-lg)] bg-[var(--color-accent-9)] flex items-center justify-center shrink-0 cursor-pointer">
                <Plus size={13} className="text-white" />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateRows: showCalendarBased ? '1fr' : '0fr', transition: 'grid-template-rows 220ms ease' }}>
            <div style={{ overflow: 'hidden' }}>
              <div className="p-4 flex flex-col gap-6">

                {/* Schedule type */}
                <div className="flex flex-col gap-3">
                  <p className="text-[14px] font-semibold text-[var(--color-neutral-12)]">Schedule Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'Regular Interval', label: 'Fixed schedule', desc: 'Repeat on set calendar dates.' },
                      { value: 'After Completion', label: 'After completion', desc: 'Repeat after the previous work order.' },
                    ].map(({ value, label, desc }) => {
                      const active = form.scheduleType === value
                      return (
                        <button key={value} type="button" onClick={() => set('scheduleType')(value)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-xl)] border text-left transition-colors cursor-pointer ${active ? 'border-[var(--color-accent-7)] bg-[var(--color-accent-1)]' : 'border-[var(--border-default)] hover:bg-[var(--color-neutral-2)]'}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[14px] font-semibold ${active ? 'text-[var(--color-accent-9)]' : 'text-[var(--color-neutral-12)]'}`}>{label}</p>
                            <p className="text-[12px] text-[var(--color-neutral-8)] mt-0.5 leading-4">{desc}</p>
                          </div>
                          {active && <ArrowDown size={16} className="shrink-0 text-[var(--color-accent-9)]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Animated reveal once a schedule type is selected */}
                <div className={`flex flex-col gap-6 overflow-visible transition-all duration-300 ease-in-out ${form.scheduleType ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}>

                <div className="h-px bg-[var(--border-subtle)]" />

                {/* Maintenance Due */}
                <div className="flex flex-col gap-4">
                  <p className="text-[14px] font-semibold text-[var(--color-neutral-12)]">Maintenance Due</p>
                  {form.scheduleType === 'After Completion' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">Every</span>
                      <NumberInput value={form.every} onChange={set('every')} min={1} className="w-[80px] shrink-0" onBlur={() => setFieldsTouched(true)} error={fieldsTouched && !form.every} />
                      <InlineSelect value={form.period} onChange={set('period')} options={PERIODS.map(p => ({ value: p, label: `${p}(s)` }))} className="flex-1 justify-between" onBlur={() => setFieldsTouched(true)} error={fieldsTouched && !form.period} />
                      <span className="text-[12px] text-[var(--color-neutral-10)]">After previous WO<br />is completed</span>
                      <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
                      {timeInput(form.atTime, set('atTime'), 'flex-1 min-w-0')}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">Every</span>
                        <NumberInput ref={everyInputRef} value={form.every} onChange={set('every')} min={1} className="w-[80px] shrink-0" onBlur={() => { setEveryTouched(true); if (form.every) setTimeout(() => periodTriggerRef.current?.click(), 50) }} error={everyTouched && !form.every} />
                        <InlineSelect ref={periodTriggerRef} value={form.period}
                          onChange={set('period')}
                          options={PERIODS.map(p => ({ value: p, label: `${p}(s)` }))}
                          placeholder="Period"
                          className="flex-1 justify-between"
                          error={fieldsTouched && !form.period} />
                        {form.period === 'Week' && (
                          <>
                            <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">On</span>
                            <InlineSelect value={form.weekday} onChange={set('weekday')}
                              options={WEEKDAY_LETTERS.map((wd, i) => ({ value: wd.value, label: FULL_WEEKDAYS[i] }))} placeholder="Day" className="justify-between" error={fieldsTouched && !form.weekday} />
                          </>
                        )}
                        {(form.period !== 'Month' && form.period !== 'Year') && (
                          <>
                            <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
                            {timeInput(form.atTime, set('atTime'), 'w-[130px] shrink-0')}
                          </>
                        )}
                      </div>
                      {form.period === 'Month' && (
                        <div className="flex items-center gap-2 pl-[134px] row-fade-in">
                          <InlineSelect
                            value={form.monthMode}
                            onChange={v => setForm(f => ({ ...f, monthMode: v as 'on-day' | 'on-the' }))}
                            options={[{ value: 'on-day', label: 'On day' }, { value: 'on-the', label: 'On the' }]}
                            className="min-w-[75px]"
                          />
                          {form.monthMode === 'on-day' ? (
                            <div key="on-day" className="row-fade-in inline-flex items-center gap-2">
                              <InlineSelect value={form.monthDay} onChange={set('monthDay')} options={MONTH_DAYS} />
                            </div>
                          ) : (
                            <div key="on-the" className="row-fade-in inline-flex items-center gap-2">
                              <InlineSelect value={form.monthOrdinal} onChange={set('monthOrdinal')} options={MONTH_ORDINALS} />
                              <InlineSelect
                                value={form.monthWeekday}
                                onChange={set('monthWeekday')}
                                options={MONTH_WEEKDAYS.map(w => ({
                                  value: w,
                                  label: w === 'Day' ? 'Day' : w === 'Sun' ? 'Sunday' : w === 'Mon' ? 'Monday' : w === 'Tue' ? 'Tuesday' : w === 'Wed' ? 'Wednesday' : w === 'Thu' ? 'Thursday' : w === 'Fri' ? 'Friday' : 'Saturday',
                                }))}
                              />
                            </div>
                          )}
                          <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
                          {timeInput(form.atTime, set('atTime'), 'w-[130px] shrink-0')}
                        </div>
                      )}
                      {form.period === 'Year' && (
                        <>
                          <div className="flex items-center gap-2 pl-[134px] row-fade-in">
                            <InlineSelect
                              value={form.yearMode}
                              onChange={v => setForm(f => ({ ...f, yearMode: v as 'on-day' | 'on-the' }))}
                              options={[{ value: 'on-day', label: 'On' }, { value: 'on-the', label: 'On the' }]}
                              className="min-w-[75px]"
                            />
                            {form.yearMode === 'on-day' ? (
                              <div key="on-day" className="row-fade-in inline-flex items-center gap-2">
                                <InlineSelect value={form.yearMonth} onChange={set('yearMonth')} options={MONTH_NAMES} />
                                <InlineSelect value={form.yearDay} onChange={set('yearDay')} options={MONTH_DAYS} />
                                <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
                                {timeInput(form.atTime, set('atTime'), 'w-[130px] shrink-0')}
                              </div>
                            ) : (
                              <div key="on-the" className="row-fade-in inline-flex items-center gap-2">
                                <InlineSelect value={form.yearOrdinal} onChange={set('yearOrdinal')} options={MONTH_ORDINALS} />
                                <InlineSelect
                                  value={form.yearWeekday}
                                  onChange={set('yearWeekday')}
                                  options={MONTH_WEEKDAYS.map(w => ({
                                    value: w,
                                    label: w === 'Day' ? 'Day' : w === 'Sun' ? 'Sunday' : w === 'Mon' ? 'Monday' : w === 'Tue' ? 'Tuesday' : w === 'Wed' ? 'Wednesday' : w === 'Thu' ? 'Thursday' : w === 'Fri' ? 'Friday' : 'Saturday',
                                  }))}
                                />
                                <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">of</span>
                                <InlineSelect value={form.yearMonth} onChange={set('yearMonth')} options={MONTH_NAMES} />
                              </div>
                            )}
                          </div>
                          {form.yearMode === 'on-the' && (
                            <div className="flex items-center gap-2 ml-[135px] row-fade-in">
                              <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
                              {timeInput(form.atTime, set('atTime'), 'w-[130px] shrink-0')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px bg-[var(--border-subtle)]" />

                {/* Create Work Order */}
                <div className="flex flex-col gap-3">
                  <p className="text-[14px] font-semibold text-[var(--color-neutral-12)]">Create Work Order</p>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { mode: 'relative' as const, label: 'Relative' },
                      { mode: 'on-the' as const, label: 'Weekday' },
                    ] as const).map(({ mode, label }) => {
                      const isSelected = form.woCreationMode === mode
                      return (
                        <div key={mode}
                          className={`flex flex-col rounded-lg border overflow-hidden transition-colors ${isSelected ? 'border-[var(--color-accent-7)] bg-[var(--color-accent-1)]' : 'border-[#F0F0F3] bg-[#FCFCFD]'}`}>
                          <button type="button" onClick={() => set('woCreationMode')(isSelected ? '' : mode)} className={`flex items-center gap-[10px] px-4 h-[52px] shrink-0 cursor-pointer w-full text-left ${isSelected ? 'bg-[var(--color-accent-2)]' : 'bg-[#F0F0F3]'}`}>
                            <span className={`flex-shrink-0 w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                              {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </span>
                            <span className="text-[14px] text-[var(--color-neutral-12)]">{label}</span>
                          </button>
                          <div className="p-4 flex-1" onClick={e => { e.stopPropagation(); if (!isSelected) set('woCreationMode')(mode) }}>
                            {mode === 'relative' ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <NumberInput value={form.woRelativeN} onChange={set('woRelativeN')} min={1} className="w-[80px] shrink-0" onBlur={() => setWoRelativeNTouched(true)} error={isSelected && woRelativeNTouched && !form.woRelativeN} />
                                  <InlineSelect value={form.woRelativePeriod} onChange={set('woRelativePeriod')} options={woPeriodOptions} placeholder="Period" className="flex-1 justify-between" onBlur={() => setWoRelativePeriodTouched(true)} error={isSelected && woRelativePeriodTouched && !form.woRelativePeriod} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] text-[var(--color-neutral-9)] shrink-0">Before the due date</span>
                                  <span className="text-[12px] font-medium text-[var(--color-neutral-9)] shrink-0">At</span>
                                  {timeInput(form.woAtTime, set('woAtTime'), 'flex-1 min-w-0')}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-medium text-[var(--color-neutral-9)] shrink-0">On</span>
                                  <InlineSelect value={form.woOnThePeriod} onChange={set('woOnThePeriod')} options={FULL_WEEKDAYS} placeholder="Day" className="flex-1 justify-between" onBlur={() => setWoOnThePeriodTouched(true)} error={isSelected && woOnThePeriodTouched && !form.woOnThePeriod} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] text-[var(--color-neutral-9)] shrink-0">Before the due date</span>
                                  <span className="text-[12px] font-medium text-[var(--color-neutral-9)] shrink-0">At</span>
                                  {timeInput(form.woOnTheAtTime, set('woOnTheAtTime'), 'flex-1 min-w-0')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Add Meter-Based Trigger */}
        <div className="flex flex-col gap-3">
          {(() => {
            const meterHasData = meterCondition !== '' || meterValue.trim() !== '' || meterDueN.trim() !== ''
            const meterPartial = meterHasData && !meterComplete
            const missingParts = [
              !meterCondition && 'condition',
              !meterValue.trim() && 'units',
            ].filter(Boolean) as string[]
            const filledSummary = [
              meterCondition,
              meterValue.trim() && `${meterValue}${meterUnit ? ' ' + meterUnit : ''}`,
              meterDueN.trim() && `due in ${meterDueN} ${meterDuePeriod.toLowerCase()}(s)`,
            ].filter(Boolean).join(' · ')
            const clearMeter = () => { setMeterCondition(''); setMeterValue(''); setMeterUnit('Units'); setMeterDueN(''); setMeterDuePeriod(''); setShowMeterTrigger(false) }
            return (
              <div ref={meterCardRef} className="rounded-[var(--radius-xl)] border border-[var(--border-default)] overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3 bg-[var(--color-neutral-2)]">
                  <button type="button" onClick={() => { setShowMeterTrigger(v => { if (!v) setTimeout(() => meterCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 240); return !v }) }}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0">
                      <Gauge size={15} className="text-[var(--color-neutral-9)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] font-medium text-[var(--color-neutral-12)]">Add Meter-Based Trigger</span>
                      {(meterComplete || meterPartial) ? (
                        <p className="text-[11px] mt-0.5 leading-4 truncate">
                          {filledSummary && <span className="font-medium text-[var(--color-neutral-9)]">{filledSummary}</span>}
                          {filledSummary && missingParts.length > 0 && <span className="text-[var(--color-neutral-6)]"> · </span>}
                          {missingParts.length > 0 && <span className="font-medium text-[#CE2C31]">Missing: {missingParts.join(', ')}</span>}
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-[var(--color-neutral-8)] mt-0.5 leading-4">Trigger work orders based on meter readings or usage</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {meterHasData && (
                      <button type="button" onClick={clearMeter}
                        className="h-6 px-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[12px] font-medium text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
                        Reset
                      </button>
                    )}
                    {meterHasData || showMeterTrigger ? (
                      <button type="button" onClick={() => { setShowMeterTrigger(v => { if (!v) setTimeout(() => meterCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 240); return !v }) }}
                        className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0 hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer">
                        {showMeterTrigger ? <ChevronUp size={13} className="text-[var(--color-neutral-9)]" /> : <ChevronDown size={13} className="text-[var(--color-neutral-9)]" />}
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setShowMeterTrigger(true); setTimeout(() => meterCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 240) }}
                        className="w-8 h-8 rounded-[var(--radius-lg)] bg-[var(--color-accent-9)] flex items-center justify-center shrink-0 hover:bg-[var(--color-accent-10)] transition-colors cursor-pointer">
                        <Plus size={13} className="text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateRows: showMeterTrigger ? '1fr' : '0fr', transition: 'grid-template-rows 220ms ease' }}>
                  <div style={{ overflow: 'hidden' }}>
                  <div className="p-4 flex gap-4">
                    <div className="flex flex-1 gap-4">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">When Meter</label>
                        <InlineSelect value={meterCondition}
                          onChange={v => { setMeterCondition(v); setMeterConditionTouched(true); setTimeout(() => meterValueInputRef.current?.focus(), 50) }}
                          options={['is above', 'is below', 'equals']} placeholder="Condition" className="w-full justify-between" onBlur={() => setMeterConditionTouched(true)} error={meterConditionTouched && !meterCondition} />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">Units</label>
                        <NumberInput ref={meterValueInputRef} value={meterValue} onChange={setMeterValue} min={0} placeholder="0" className="w-full" onBlur={() => setMeterValueTouched(true)} error={meterValueTouched && !meterValue.trim()} />
                      </div>
                    </div>
                    <div className={`flex flex-col gap-1.5 border-l border-[var(--border-default)] pl-4 min-w-[220px] transition-opacity ${meterCondition && meterValue.trim() ? '' : 'opacity-40 pointer-events-none'}`}>
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">Work Order Due Date</label>
                      <div className="flex items-center gap-2">
                        <NumberInput value={meterDueN} onChange={setMeterDueN} min={1} className="w-[80px] shrink-0" />
                        <InlineSelect value={meterDuePeriod} onChange={setMeterDuePeriod} options={['Day', 'Week', 'Month']} placeholder="Period" className="flex-1 justify-between" />
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Add Inactive Periods */}
          <div className={`rounded-[var(--radius-xl)] border border-[var(--border-default)] overflow-hidden transition-opacity ${(!form.scheduleType || !form.period) && !meterComplete ? 'opacity-40 pointer-events-none' : ''}`}>
            {(() => {
              const lastPeriod = inactivePeriods[inactivePeriods.length - 1]
              const lastPeriodComplete = !lastPeriod || (!!lastPeriod.fromDate && !!lastPeriod.toDate)
              const hasAnyPeriod = inactivePeriods.length > 0
              return (
                <div className="flex items-center gap-4 px-4 py-3 bg-[var(--color-neutral-2)]">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0">
                    <Ban size={15} className="text-[var(--color-neutral-9)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-[var(--color-neutral-12)]">Add Inactive Periods</span>
                    {(!form.scheduleType || !form.period) && !meterComplete && (
                      <p className="text-[11px] text-[var(--color-neutral-8)] mt-0.5 leading-4">Set inactive days after configuring at least one trigger</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasAnyPeriod && (
                      <button type="button"
                        disabled={!lastPeriodComplete}
                        onClick={() => {
                          const newId = crypto.randomUUID()
                          lastAddedIdRef.current = newId
                          setShowInactivePeriods(true)
                          setInactivePeriods(ps => [...ps, { id: newId, fromDate: '', fromTime: '', toDate: '', toTime: '' }])
                        }}
                        className="h-6 px-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[12px] font-medium text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none">
                        Add Period
                      </button>
                    )}
                    {hasAnyPeriod ? (
                      <button type="button"
                        onClick={() => setShowInactivePeriods(v => !v)}
                        className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0 hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer">
                        {showInactivePeriods ? <ChevronUp size={13} className="text-[var(--color-neutral-9)]" /> : <ChevronDown size={13} className="text-[var(--color-neutral-9)]" />}
                      </button>
                    ) : (
                      <button type="button"
                        onClick={() => {
                          const newId = crypto.randomUUID()
                          lastAddedIdRef.current = newId
                          setShowInactivePeriods(true)
                          setInactivePeriods(ps => [...ps, { id: newId, fromDate: '', fromTime: '', toDate: '', toTime: '' }])
                        }}
                        className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0 hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer">
                        <Plus size={14} className="text-[var(--color-neutral-11)]" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
            <div style={{ display: 'grid', gridTemplateRows: (showInactivePeriods && inactivePeriods.length > 0) ? '1fr' : '0fr', transition: 'grid-template-rows 220ms ease' }}>
              <div style={{ overflow: 'hidden' }}>
              <div className="flex flex-col gap-3 p-4">
                {inactivePeriods.map(p => (
                  <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">From</label>
                      <input type="date" value={p.fromDate}
                        ref={el => { if (el) inactiveInputRefs.current.set(p.id, el); else inactiveInputRefs.current.delete(p.id) }}
                        onChange={e => setInactivePeriods(ps => ps.map(x => x.id === p.id ? { ...x, fromDate: e.target.value } : x))}
                        className={`h-8 px-3 rounded-[var(--radius-md)] border bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors w-full ${!p.fromDate ? 'border-[#CE2C31] shadow-[0_0_1px_3px_rgba(206,44,49,0.1)]' : 'border-[var(--border-default)]'}`} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">To</label>
                      <input type="date" value={p.toDate}
                        onChange={e => setInactivePeriods(ps => ps.map(x => x.id === p.id ? { ...x, toDate: e.target.value } : x))}
                        className={`h-8 px-3 rounded-[var(--radius-md)] border bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors w-full ${!p.toDate ? 'border-[#CE2C31] shadow-[0_0_1px_3px_rgba(206,44,49,0.1)]' : 'border-[var(--border-default)]'}`} />
                    </div>
                    <button type="button"
                      onClick={() => { setInactivePeriods(ps => ps.filter(x => x.id !== p.id)); if (inactivePeriods.length === 1) setShowInactivePeriods(false) }}
                      className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-error-9,#e5352b)] hover:bg-[var(--color-neutral-3)] cursor-pointer shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>

      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2 px-6 py-4">
        <Button variant="secondary" size="md" onClick={handleClose}>Cancel</Button>
        {(() => {
          const calendarValid = !!(form.scheduleType && form.every && form.period && (form.period !== 'Week' || !!form.weekday) && (!form.woCreationMode || (form.woCreationMode === 'relative' && !!form.woRelativeN && !!form.woRelativePeriod) || (form.woCreationMode === 'on-the' && !!form.woOnThePeriod)))
          const calendarPartial = !!(form.every || form.period || form.woCreationMode) && !calendarValid
          const meterPartial = (meterCondition !== '' || meterValue.trim() !== '') && !meterComplete
          const hasValidTrigger = calendarValid || meterComplete
          return (
            <Button variant="primary" size="md" onClick={handleSubmit} disabled={!hasValidTrigger || meterPartial || calendarPartial || (isEditing && !hasChanges)}>
              {isEditing ? 'Save Changes' : 'Create Schedule'}
            </Button>
          )
        })()}
      </ModalFooter>
    </Modal>
  )
}

/* ── Trigger row ── */

function TriggerRow({ trigger, onRemove, onEdit, meterMissing }: { trigger: CalendarTrigger; onRemove: () => void; onEdit: () => void; meterMissing?: boolean }) {
  const onLabel = trigger.period === 'Week'
    ? `On ${trigger.weekday === 'Mon' ? 'Mondays' : trigger.weekday === 'Tue' ? 'Tuesdays' : trigger.weekday === 'Wed' ? 'Wednesdays' : trigger.weekday === 'Thu' ? 'Thursdays' : trigger.weekday === 'Fri' ? 'Fridays' : trigger.weekday === 'Sat' ? 'Saturdays' : 'Sundays'}`
    : trigger.period === 'Month' ? (trigger.monthMode === 'on-day' ? `On day ${trigger.monthDay}` : `On the ${trigger.monthOrdinal} ${trigger.monthWeekday}`)
    : trigger.period === 'Year' ? (trigger.yearMode === 'on-day' ? `On ${trigger.yearMonth} ${trigger.yearDay}` : `On the ${trigger.yearOrdinal} ${trigger.yearWeekday} of ${trigger.yearMonth}`)
    : ''
  const everyPart = `Every ${trigger.every} ${trigger.period === 'Day' ? (Number(trigger.every) === 1 ? 'day' : 'days') : trigger.period === 'Week' ? (Number(trigger.every) === 1 ? 'week' : 'weeks') : trigger.period === 'Year' ? (Number(trigger.every) === 1 ? 'year' : 'years') : (Number(trigger.every) === 1 ? 'month' : 'months')}`
  const timePart = trigger.atTime ? ` - At ${trigger.atTime}` : ''
  const calSummary = [everyPart, onLabel].filter(Boolean).join(', ') + timePart

  return (
    <div className="flex items-center gap-2 px-3 py-4 rounded-[12px] border border-[#F0F0F3] bg-[#FCFCFD]">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-[14px] font-medium text-[#1C2024]">{calSummary}</span>
        {trigger.meterValue && (
          <>
            <span className="inline-flex items-center justify-center px-2 h-5 rounded-full bg-[#F0F0F3] text-[12px] font-medium text-[#1C2024] shrink-0">or</span>
            <span className={`text-[14px] font-medium ${meterMissing ? 'text-[#CE2C31]' : 'text-[#1C2024]'}`}>When a reading is {trigger.meterCondition} {trigger.meterValue} {trigger.meterUnit}</span>
          </>
        )}
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-neutral-6)] hover:text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] rounded-[8px] transition-colors cursor-pointer shrink-0">
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" minWidth="160px">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil size={13} className="mr-2 text-[var(--color-neutral-8)]" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onRemove} className="text-[var(--color-error)] focus:text-[var(--color-error)]">
            <Trash2 size={13} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ── Image thumbnail ── */

function ImageThumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative w-[80px] h-[80px] rounded-[var(--radius-lg)] overflow-hidden group border border-[var(--border-subtle)]">
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X size={11} />
      </button>
    </div>
  )
}

/* ── Asset row ── */

/* ── Inline Assign Form ── */

function MultiAssetSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (asset: string) => {
    onChange(selected.includes(asset) ? selected.filter(a => a !== asset) : [...selected, asset])
  }

  return (
    <div ref={ref} className="flex flex-col gap-[var(--space-xs)]">
      <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
        Asset <span className="ml-0.5 text-[var(--color-error)]">*</span>
      </label>
      <div
        className="relative flex items-center min-h-10 px-3 pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] cursor-pointer transition-colors focus-within:border-[var(--color-accent-7)] focus-within:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]"
        onClick={() => setOpen(o => !o)}
      >
        {selected.length === 0 ? (
          <span className="text-[var(--color-neutral-7)]">Select…</span>
        ) : (
          <div className="flex flex-wrap gap-1 py-1.5">
            {selected.map(a => (
              <span
                key={a}
                className="inline-flex items-center gap-1 h-5 px-2 rounded-[var(--radius-md)] bg-[var(--color-accent-2)] border border-[var(--color-accent-4)] text-[var(--color-accent-9)] text-[11px] font-medium"
              >
                {a}
                <button
                  onClick={e => { e.stopPropagation(); toggle(a) }}
                  className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-[var(--color-accent-4)] transition-colors cursor-pointer"
                >
                  <X size={8} />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
      </div>
      {open && (
        <div className="mt-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-lg overflow-hidden z-50">
          {ASSETS.map(asset => (
            <label
              key={asset}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(asset)}
                onChange={() => toggle(asset)}
                className="w-4 h-4 rounded accent-[var(--color-accent-9)] cursor-pointer"
                onClick={e => e.stopPropagation()}
              />
              {asset}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function InlineAssignForm({ onSubmit, onCancel }: { onSubmit: (f: AssignAssetForm) => void; onCancel: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [form, setForm] = useState<AssignAssetForm>({ ...EMPTY_FORM })
  const set = (k: keyof AssignAssetForm) => (v: string) => {
    if (k === 'location') setForm(f => ({ ...f, location: v ? [v] : [] }))
    else if (k === 'additionalAssignee') setForm(f => ({ ...f, additionalAssignee: v ? [v] : [] }))
    else setForm(f => ({ ...f, [k]: v }))
  }

  const isSingle = selectedAssets.length === 1
  const isMulti = selectedAssets.length > 1

  useEffect(() => {
    if (isSingle) {
      const data = getAssetData(selectedAssets[0])
      if (data) setForm(f => ({ ...f, asset: [selectedAssets[0]], location: data.location ? [data.location] : [], meter: data.meter ? [data.meter] : [] }))
    } else {
      setForm(f => ({ ...f, asset: [], location: [], meter: [] }))
    }
  }, [selectedAssets, isSingle])

  const canSubmit = selectedAssets.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    if (selectedAssets.length === 1) {
      onSubmit({ ...form, asset: [selectedAssets[0]] })
    } else {
      selectedAssets.forEach(asset => {
        const data = getAssetData(asset)
        onSubmit({ ...form, asset: [asset], location: data?.location ? [data.location] : [], meter: data?.meter ? [data.meter] : [] })
      })
    }
  }

  return (
    <div className={`rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-5 flex flex-col gap-5 transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <p className="text-[11px] font-semibold tracking-widest text-[var(--color-neutral-8)] uppercase">New Asset</p>

      <MultiAssetSelect selected={selectedAssets} onChange={setSelectedAssets} />

      {isSingle && (
        <div className="grid grid-cols-2 gap-4">
          <Select label="Location" value={form.location[0] || ''} onChange={set('location')} options={LOCATIONS} />
          <Select label="Meter" value={form.meter[0] || ''} onChange={v => setForm(f => ({ ...f, meter: v ? [v] : [] }))} options={METERS} />
        </div>
      )}

      {isMulti && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-[var(--color-neutral-7)]">{selectedAssets.length} assets selected — location &amp; meter will be auto-filled from each asset's defaults</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedAssets.map(a => {
              const data = getAssetData(a)
              return (
                <div key={a} className="flex flex-col gap-0.5 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-default)]">
                  <span className="text-[12px] font-semibold text-[var(--color-neutral-12)]">{a}</span>
                  {data && (data.location || data.meter) && <span className="text-[11px] text-[var(--color-neutral-7)]">{[data.location, data.meter].filter(Boolean).join(' · ')}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <SearchableSelect label="Technician" value={form.primaryAssignee} onChange={set('primaryAssignee')} options={ASSIGNEES} showAvatar />
        <SearchableMultiSelect label="Additional Technicians" values={form.additionalAssignee} onChange={v => setForm(f => ({ ...f, additionalAssignee: v }))} options={ASSIGNEES} showAvatar />
        <Select label="Team" value={form.team} onChange={set('team')} options={TEAMS} clearable />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          {selectedAssets.length > 1 ? `Assign ${selectedAssets.length} Assets` : 'Assign Asset'}
        </Button>
      </div>
    </div>
  )
}

const AVATAR_COLORS = [
  { bg: '#7c3aed', text: '#fff' },
  { bg: '#2563eb', text: '#fff' },
  { bg: '#059669', text: '#fff' },
]

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function TriggerBadge({ icon, label, onEdit, onDelete }: {
  icon: React.ReactNode
  label: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative inline-flex items-center">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 h-5 px-2 rounded-[var(--radius-lg)] bg-[var(--color-neutral-3)] border border-[var(--color-neutral-5)] text-[var(--color-neutral-12)] text-[length:var(--font-size-sm)] font-medium hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer pr-5"
      >
        {icon}
        <span className="truncate max-w-[120px]">{label}</span>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--color-neutral-6)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-[var(--color-error)]"
        title="Remove trigger"
      >
        <X size={8} />
      </button>
    </div>
  )
}

function FieldDropdown({ icon, value, options, placeholder, label, hasError, isOpen, query, onOpen, onClose, onQueryChange, onSelect }: {
  icon: React.ReactNode
  value: string
  options: string[]
  placeholder: string
  label: string
  hasError?: boolean
  isOpen: boolean
  query: string
  onOpen: () => void
  onClose: () => void
  onQueryChange: (q: string) => void
  onSelect: (v: string) => void
}) {
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  return (
    <Popover.Root open={isOpen} onOpenChange={open => open ? onOpen() : onClose()}>
      <Popover.Trigger asChild>
        <button className="group/f flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] transition-all duration-200 cursor-pointer min-w-0">
          {icon}
          <span className={`text-[13px] truncate ${hasError ? 'text-[#CE2C31]' : value ? 'text-[#60646C]' : 'text-[#8B8D98]'}`}>
            {value || label}
          </span>
          <span className={`inline-flex items-center gap-0.5 h-5 px-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-9)] opacity-0 group-hover/f:opacity-100 transition-opacity duration-150 shrink-0`}>
            {value ? <Pencil size={9} /> : <Plus size={9} className={hasError ? 'text-[#CE2C31]' : ''} />}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom" align="start" sideOffset={4}
          className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] flex flex-col overflow-hidden"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
            <Search size={13} className="shrink-0 text-[var(--color-neutral-7)]" />
            <input
              autoFocus
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-[13px] text-[var(--color-neutral-11)] bg-transparent outline-none placeholder:text-[var(--color-neutral-7)]"
              onKeyDown={e => {
                if (e.key === 'Enter' && query) { onSelect(query) }
                if (e.key === 'Escape') onClose()
              }}
            />
            {value && (
              <button onClick={() => onSelect('')} className="text-[#8B8D98] hover:text-[#60646C] transition-colors cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex flex-col max-h-[160px] overflow-y-auto py-1">
            {filtered.length === 0 && query ? (
              <button
                onClick={() => onSelect(query)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors text-left"
              >
                <Plus size={12} className="shrink-0 text-[var(--color-neutral-7)]" />
                Add &ldquo;{query}&rdquo;
              </button>
            ) : filtered.map(opt => (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className={`flex items-center gap-2 px-3 py-2 text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${value === opt ? 'text-[var(--color-accent-9)] bg-[var(--color-accent-1)]' : 'text-[var(--color-neutral-11)]'}`}
              >
                <span className="w-3 h-3 flex items-center justify-center shrink-0">
                  {value === opt && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function AssignmentCard({ asset, onRemove, onSelectTrigger, onUpdate, onEdit, isSelected, onToggleSelect, meterError, defaultExpanded = true }: {
  asset: AssignedAsset
  onRemove: () => void
  onSelectTrigger: (type: 'meter' | 'calendar' | 'both') => void
  onUpdate: (patch: Partial<AssignedAsset>) => void
  onEdit: () => void
  isSelected: boolean
  onToggleSelect: () => void
  meterError?: boolean
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [openDropdown, setOpenDropdown] = useState<'name' | 'location' | 'meter' | null>(null)
  const [dropdownQuery, setDropdownQuery] = useState('')
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)
  const hasTrigger = !!asset.triggerType
  const assignees = [asset.primaryAssignee, ...(asset.additionalAssignees || [])].filter(n => n && n !== 'Unassigned')
  const visibleAvatars = assignees.slice(0, 3)
  const extraCount = assignees.length > 3 ? assignees.length - 3 : 0
  const [startDate, endDate] = (asset.timeRange || '').split('|').map(s => s.trim())
  const meterEmpty = !asset.meter

  // Determine primary type and title
  const primaryType = asset.name ? 'asset'
    : asset.location ? 'location'
    : asset.meter ? 'meter'
    : asset.primaryAssignee ? 'assignee'
    : 'team'
  const primaryTitle = asset.name || asset.location || asset.meter || asset.primaryAssignee || asset.team || 'Untitled'
  // Secondary label: first non-primary field available
  const secondaryLabel = primaryType === 'asset' ? (asset.location || asset.meter || null)
    : primaryType === 'location' ? (asset.meter || null)
    : primaryType === 'meter' ? (asset.location || null)
    : primaryType === 'assignee' ? (asset.team || null)
    : null

  return (
    <div className={`flex flex-col rounded-[var(--radius-xl)] border bg-[#FCFCFD] overflow-hidden transition-colors ${isSelected ? 'border-[var(--color-accent-7)] shadow-[0_0_0_3px_var(--color-accent-3)]' : meterError ? 'border-[#FFCDC2] shadow-[0_0_0_3px_#FFEAE6]' : 'border-[var(--color-neutral-5)]'}`}>

      {/* Header: checkbox · icon · name · secondary · kebab · chevron */}
      <div className="flex items-center gap-2 px-4 h-12">
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          onClick={onToggleSelect}
          className={`w-4 h-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[#E0E1E6] bg-white hover:border-[var(--color-neutral-7)]'}`}
        >
          {isSelected && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        {primaryType === 'assignee' && (
          <Avatar name={asset.primaryAssignee} size="xs" className="shrink-0" />
        )}

        <span className="text-[14px] font-semibold text-[#1C2024] truncate min-w-0 max-w-[45%]">
          {primaryTitle}
        </span>

        {primaryType !== 'assignee' && (
          <span className="inline-flex items-center h-5 px-1.5 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] text-[10px] font-semibold tracking-[0.06em] text-[var(--color-neutral-8)] shrink-0 select-none uppercase">
            {primaryType === 'location' ? 'Location' : primaryType === 'meter' ? 'Meter' : primaryType === 'team' ? 'Team' : 'Asset'}
          </span>
        )}
        <span className="flex-1" />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center text-[var(--color-neutral-9)] hover:text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] rounded-[8px] transition-colors cursor-pointer">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" minWidth="220px">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil size={13} className="mr-2 text-[var(--color-neutral-8)]" />
              Edit
            </DropdownMenuItem>
            {!hasTrigger ? (
              <DropdownMenuItem onSelect={() => onSelectTrigger('calendar')}>
                <Clock size={13} className="mr-2 text-[var(--color-neutral-8)]" />
                Assign particular trigger
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onUpdate({ triggerType: undefined, trigger: '' })}>
                <Clock size={13} className="mr-2 text-[var(--color-neutral-8)]" />
                Delete trigger
              </DropdownMenuItem>
            )}
            <div className="my-1 mx-2 h-px bg-[#E0E1E6]" />
            <DropdownMenuItem onSelect={onRemove} className="text-[#CE2C31] focus:text-[#CE2C31]">
              <Trash2 size={13} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setExpanded(e => !e)}
          className="w-8 h-8 flex items-center justify-center text-[var(--color-neutral-9)] hover:text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] rounded-[8px] transition-colors cursor-pointer"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </div>

      {/* Collapsible body — grid trick for smooth height animation */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
      <div className="overflow-hidden">
        <div className="flex flex-col border-t border-[#F0F0F3]">

          {/* Secondary fields row — excludes the primary type */}
          <div className="flex items-center gap-1 px-3" style={{ minHeight: '40px' }}>
            {primaryType !== 'asset' && (
              <div className="flex items-center gap-1.5 px-2 py-1 min-w-0">
                <Box size={13} className="text-[#8B8D98] shrink-0" />
                <span className={`text-[13px] truncate ${asset.name ? 'text-[#8B8D98]' : 'text-[#C1C2CB]'}`}>
                  {asset.name || 'No Asset'}
                </span>
              </div>
            )}
            {primaryType !== 'location' && (
              <div className="flex items-center gap-1.5 px-2 py-1 min-w-0">
                <MapPin size={16} className="text-[#8B8D98] shrink-0" />
                <span className={`text-[13px] truncate ${asset.location ? 'text-[#8B8D98]' : 'text-[#C1C2CB]'}`}>
                  {asset.location || 'No Location'}
                </span>
              </div>
            )}
            {primaryType !== 'meter' && (
              <FieldDropdown
                icon={<Gauge size={16} className={`shrink-0 ${meterError && meterEmpty ? 'text-[#CE2C31]' : 'text-[#8B8D98]'}`} />}
                value={asset.meter} options={METERS} placeholder="Search meters…" label="Add meter"
                hasError={meterError && meterEmpty}
                isOpen={openDropdown === 'meter'} query={dropdownQuery}
                onOpen={() => { setOpenDropdown('meter'); setDropdownQuery('') }}
                onClose={() => setOpenDropdown(null)}
                onQueryChange={setDropdownQuery}
                onSelect={v => { onUpdate({ meter: v }); setOpenDropdown(null) }}
              />
            )}
          </div>

          {/* Assignees · trigger · dates */}
          <div className="group/bottom-row flex items-center gap-4 border-t border-[#F0F0F3] px-4 py-2.5 min-w-0">
            {/* ASSIGNEES */}
            <div className="group/assignees flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#8B8D98] shrink-0">ASSIGNEES</span>
              <div className="flex items-center">
                {visibleAvatars.map((name, i) => (
                  <TooltipProvider key={name} delayDuration={300}>
                    <Tooltip content={name} side="top">
                      <div className="shrink-0 animate-avatar-in" style={{ marginLeft: i > 0 ? '-4px' : '0', zIndex: assignees.length - i }}>
                        <Avatar
                          name={name}
                          size="xs"
                          className="!w-6 !h-6 border-2 border-[var(--surface-primary)] cursor-default"
                        />
                      </div>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {extraCount > 0 && (
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button type="button" className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold bg-[var(--color-neutral-4)] text-[var(--color-neutral-9)] border-2 border-[var(--surface-primary)] shrink-0 cursor-pointer hover:bg-[var(--color-neutral-5)] transition-colors" style={{ marginLeft: '-4px' }}>
                        +{extraCount}
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        align="start"
                        sideOffset={4}
                        className="z-[var(--z-dropdown)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none py-1 min-w-[160px]"
                        onOpenAutoFocus={e => e.preventDefault()}
                      >
                        {assignees.slice(3).map(name => (
                          <div key={name} className="flex items-center gap-2 px-3 py-1.5">
                            <Avatar name={name} size="xs" className="shrink-0" />
                            <span className="text-[13px] text-[var(--color-neutral-11)] truncate">{name}</span>
                          </div>
                        ))}
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                )}
              </div>
              <Popover.Root open={assigneePopoverOpen} onOpenChange={open => { setAssigneePopoverOpen(open); if (!open) setAssigneeSearch('') }}>
                <Popover.Trigger asChild>
                  <Button variant="secondary" size="sm" className="opacity-0 group-hover/assignees:opacity-100 transition-opacity duration-150 !px-1.5 gap-1">
                    <Plus size={10} />
                  </Button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    align="start"
                    sideOffset={4}
                    className="z-[var(--z-dropdown)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none w-[200px]"
                    onOpenAutoFocus={e => e.preventDefault()}
                  >
                    {/* Search */}
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[var(--border-subtle)]">
                      <Search size={12} className="text-[var(--color-neutral-7)] shrink-0" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={assigneeSearch}
                        onChange={e => setAssigneeSearch(e.target.value)}
                        className="flex-1 text-[12px] bg-transparent outline-none text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)]"
                        autoFocus
                      />
                    </div>
                    {/* List: selected first, then unselected */}
                    <div className="py-1 max-h-[200px] overflow-y-auto">
                      {[
                        ...ASSIGNEES.filter(p => assignees.includes(p)),
                        ...ASSIGNEES.filter(p => !assignees.includes(p)),
                      ]
                        .filter(p => p.toLowerCase().includes(assigneeSearch.toLowerCase()))
                        .map(p => {
                          const isChecked = assignees.includes(p)
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  if (p === asset.primaryAssignee) {
                                    const next = asset.additionalAssignees?.[0] || ''
                                    const rest = asset.additionalAssignees?.slice(1) || []
                                    onUpdate({ primaryAssignee: next || 'Unassigned', additionalAssignees: rest })
                                  } else {
                                    onUpdate({ additionalAssignees: (asset.additionalAssignees || []).filter(n => n !== p) })
                                  }
                                } else {
                                  if (!asset.primaryAssignee || asset.primaryAssignee === 'Unassigned') {
                                    onUpdate({ primaryAssignee: p })
                                  } else {
                                    onUpdate({ additionalAssignees: [...(asset.additionalAssignees || []), p] })
                                  }
                                }
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-left cursor-pointer hover:bg-[var(--color-neutral-3)] transition-colors"
                            >
                              <Avatar name={p} size="xs" className="shrink-0" />
                              <span className="flex-1 text-[var(--color-neutral-11)] truncate">{p}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--border-default)] bg-transparent'}`}>
                                {isChecked && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                            </button>
                          )
                        })}
                      {ASSIGNEES.filter(p => p.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-[12px] text-[var(--color-neutral-7)]">No results</p>
                      )}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>

            {/* TEAM — hover-reveal popover */}
            <Popover.Root>
              <div className="group/team flex items-center gap-3 flex-1 min-w-0">
                <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#8B8D98] shrink-0">TEAM</span>
                {asset.team && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip content={asset.team} side="top">
                      <div className="shrink-0">
                        <Avatar name={asset.team} size="xs" className="!w-6 !h-6 cursor-default" />
                      </div>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Popover.Trigger asChild>
                  <Button variant="secondary" size="sm" className="opacity-0 group-hover/team:opacity-100 transition-opacity duration-150 !px-1.5 gap-1">
                    {asset.team ? <Pencil size={9} /> : <Plus size={10} />}
                  </Button>
                </Popover.Trigger>
              </div>
              <Popover.Portal>
                <Popover.Content
                  align="start"
                  sideOffset={4}
                  className="z-[var(--z-dropdown)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none py-1 min-w-[140px]"
                  onOpenAutoFocus={e => e.preventDefault()}
                >
                  {['', ...PM_TEAMS].map(t => (
                    <button
                      key={t || 'none'}
                      type="button"
                      onClick={() => onUpdate({ team: t })}
                      className={`w-full flex items-center px-3 py-1.5 text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${asset.team === t ? 'text-[var(--color-accent-9)] font-medium' : 'text-[var(--color-neutral-11)]'}`}
                    >
                      {t || 'No team'}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {hasTrigger && (
              <button
                onClick={() => onSelectTrigger(asset.triggerType!)}
                className="inline-flex items-center gap-1 h-5 px-2 rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] border border-[var(--color-accent-3)] text-[var(--color-accent-9)] text-[11px] font-medium hover:bg-[var(--color-accent-2)] transition-colors cursor-pointer truncate max-w-[160px]"
              >
                <Clock size={10} className="shrink-0" />
                <span className="truncate">{asset.trigger || 'Every Wednesday'}</span>
              </button>
            )}

            <div className="ml-auto flex items-center gap-1 text-[12px] shrink-0">
              {(['Start', 'End'] as const).map(label => {
                const val = label === 'Start' ? (startDate || '') : (endDate || '')
                const handleChange = label === 'Start'
                  ? (v: string) => onUpdate({ timeRange: `${v}|${endDate || ''}` })
                  : (v: string) => onUpdate({ timeRange: `${startDate || ''}|${v}` })
                return <DatePicker key={label} label={label} value={val} onChange={handleChange} className="w-[180px]" />
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ── Assign Asset Modal ── */

const EMPTY_FORM: AssignAssetForm = {
  asset: [], location: [], meter: [],
  primaryAssignee: '', additionalAssignee: [], team: '', trigger: '',
  startDate: '', endDate: '',
}

const APPLIES_TO_TYPES = ['Asset', 'Location', 'Meter'] as const
type AppliesToType = typeof APPLIES_TO_TYPES[number]

function ModalSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] mb-2">{children}</p>
  )
}

function AssignAssetModal({
  open, onClose, onSubmit, existingAssets = [], initialValues, previousAssignment, isMeterBased = false,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: AssignAssetForm) => void
  existingAssets?: Array<{ name: string; location?: string; meter?: string }>
  initialValues?: AssignAssetForm
  previousAssignment?: { primaryAssignee?: string; additionalAssignee?: string[]; team?: string; startDate?: string; endDate?: string }
  isMeterBased?: boolean

}) {
  const [form, setForm] = useState<AssignAssetForm>(EMPTY_FORM)
  const [appliesToType, setAppliesToType] = useState<AppliesToType>('Asset')
  const [meterTouched, setMeterTouched] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm(initialValues)
        setAppliesToType(initialValues.asset.length ? 'Asset' : initialValues.location.length ? 'Location' : initialValues.meter.length ? 'Meter' : 'Asset')
      } else {
        setForm(EMPTY_FORM)
        setAppliesToType('Asset')
      }
      setMeterTouched(false)
    }
  }, [open])
  const [valueOpen, setValueOpen] = useState(false)
  const [valueQuery, setValueQuery] = useState('')
  const valueInputRef = useRef<HTMLInputElement>(null)
  const appliesToTriggerRef = useRef<HTMLButtonElement>(null)
  const appliesToMeasureRef = useRef<HTMLDivElement>(null)
  const [appliesToVisibleCount, setAppliesToVisibleCount] = useState(99)
  const set = (k: keyof AssignAssetForm) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const [techAutoFilled, setTechAutoFilled] = useState(false)

  const usedAssets = existingAssets.map(a => a.name).filter(Boolean)
  const usedLocations = existingAssets.map(a => a.location).filter(Boolean)
  const usedMeters = existingAssets.map(a => a.meter).filter(Boolean)
  const usedList = appliesToType === 'Asset' ? usedAssets : appliesToType === 'Location' ? usedLocations : usedMeters
  const allAppliesToOptions = appliesToType === 'Asset' ? ASSETS : appliesToType === 'Location' ? LOCATIONS : METERS
  const appliesToOptions = allAppliesToOptions
  const appliesToSelected: string[] = appliesToType === 'Asset' ? form.asset
    : appliesToType === 'Location' ? form.location
    : form.meter
  const filteredAppliesToOptions = appliesToOptions.filter(o => {
    const q = valueQuery.toLowerCase()
    if (!q) return true
    if (o.toLowerCase().includes(q)) return true
    if (appliesToType === 'Asset') {
      const meta = getAssetData(o)
      if (meta?.location?.toLowerCase().includes(q)) return true
    }
    return false
  })

  function toggleAppliesToValue(v: string) {
    const update = (arr: string[]) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
    if (appliesToType === 'Asset') setForm(f => ({ ...f, asset: update(f.asset) }))
    else if (appliesToType === 'Location') setForm(f => ({ ...f, location: update(f.location) }))
    else setForm(f => ({ ...f, meter: update(f.meter) }))
  }

  function handleTypeChange(type: AppliesToType) {
    setAppliesToType(type)
    setValueQuery('')
    setForm(f => ({ ...f, asset: [], location: [], meter: [] }))
  }

  useEffect(() => {
    if (valueOpen) setTimeout(() => valueInputRef.current?.focus(), 0)
    else setValueQuery('')
  }, [valueOpen])

  useEffect(() => {
    if (appliesToSelected.length === 1) {
      const name = appliesToSelected[0]
      const data = appliesToType === 'Asset' ? getAssetData(name) : appliesToType === 'Location' ? getLocationData(name) : undefined
      const assignee = (data as { assignee?: string; assignees?: string[] } | undefined)?.assignee
        ?? (data as { assignees?: string[] } | undefined)?.assignees?.[0]
      const team = (data as { team?: string } | undefined)?.team
      if (assignee || team) {
        // Always update auto-filled fields when the single selection changes
        setForm(f => ({
          ...f,
          primaryAssignee: techAutoFilled || !f.primaryAssignee ? (assignee ?? '') : f.primaryAssignee,
          team: techAutoFilled || !f.team ? (team ?? '') : f.team,
        }))
        setTechAutoFilled(true)
      } else if (techAutoFilled) {
        // Item changed to one with no assignments — clear auto-filled fields
        setForm(f => ({ ...f, primaryAssignee: '', team: '' }))
        setTechAutoFilled(false)
      }
    } else if (techAutoFilled) {
      // Going to 0 or 2+ items — clear auto-filled values
      setForm(f => ({ ...f, primaryAssignee: '', team: '' }))
      setTechAutoFilled(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliesToSelected.join(','), appliesToType])

  useEffect(() => {
    const trigger = appliesToTriggerRef.current
    const measure = appliesToMeasureRef.current
    const compute = () => {
      if (!trigger || !measure || appliesToSelected.length === 0) { setAppliesToVisibleCount(99); return }
      const available = trigger.offsetWidth - 12 - 26
      const chipEls = Array.from(measure.children) as HTMLElement[]
      let used = 0; let count = 0
      for (let i = 0; i < appliesToSelected.length; i++) {
        const chipW = chipEls[i]?.offsetWidth ?? 60
        const remaining = appliesToSelected.length - i - 1
        const needed = (i > 0 ? 4 : 0) + chipW + (remaining > 0 ? 4 + 36 : 0)
        if (used + needed <= available) { used += (i > 0 ? 4 : 0) + chipW; count++ } else break
      }
      setAppliesToVisibleCount(Math.max(1, count))
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (trigger) ro.observe(trigger)
    return () => ro.disconnect()
  }, [appliesToSelected])

  const multiItemsWithTech = appliesToSelected.length > 1 && appliesToSelected.some(name => {
    const data = appliesToType === 'Asset' ? getAssetData(name) : appliesToType === 'Location' ? getLocationData(name) : undefined
    return !!(data as { assignee?: string; assignees?: string[]; team?: string } | undefined)?.team
      || !!(data as { assignee?: string } | undefined)?.assignee
      || !!((data as { assignees?: string[] } | undefined)?.assignees?.length)
  })

  const needsMeterInput = isMeterBased && appliesToType !== 'Meter'
    && appliesToSelected.length > 0
    && appliesToSelected.some(name => appliesToType === 'Asset' ? !getAssetData(name)?.meter : true)
  const canSubmit = !!(form.asset.length || form.location.length || form.meter.length || form.primaryAssignee || form.additionalAssignee.length || form.team)
    && !(needsMeterInput && !form.meter[0])
  const [dateError, setDateError] = useState('')

  function handleSubmit() {
    if (!canSubmit) return
    const err = validateDateRange(form.startDate, form.endDate)
    if (err) { setDateError(err); return }
    setDateError('')
    onSubmit(form)
    setForm(EMPTY_FORM)
    setAppliesToType('Asset')
  }

  function handleClose() {
    setDateError('')
    setForm(EMPTY_FORM)
    setAppliesToType('Asset')
    setTechAutoFilled(false)
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={v => !v && handleClose()} maxWidth="520px">
      <ModalHeader
        title="Add to Schedule"
        description="Choose where this schedule applies and optionally assign technicians or a team."
      />
      <ModalBody className="flex flex-col p-6">

        {/* APPLIES TO */}
        <div className="mb-6">
          <ModalSectionLabel>Applies To</ModalSectionLabel>
          <div className="flex items-stretch rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden">
            {/* Type selector */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-[130px] flex items-center gap-1.5 pl-3 pr-2 border-r border-[var(--border-default)] bg-[var(--color-neutral-2)] hover:bg-[var(--color-neutral-3)] text-[13px] font-medium text-[var(--color-neutral-11)] cursor-pointer outline-none transition-colors">
                  {appliesToType === 'Asset' && <Box size={18} className="shrink-0 text-[var(--color-neutral-8)]" />}
                  {appliesToType === 'Location' && <MapPin size={18} className="shrink-0 text-[var(--color-neutral-8)]" />}
                  {appliesToType === 'Meter' && <Gauge size={18} className="shrink-0 text-[var(--color-neutral-8)]" />}
                  <span className="flex-1 text-left truncate">{appliesToType}</span>
                  <ChevronDown size={14} className="shrink-0 text-[var(--color-neutral-7)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" minWidth="130px">
                {([
                  { type: 'Asset' as const, icon: Box },
                  { type: 'Location' as const, icon: MapPin },
                  { type: 'Meter' as const, icon: Gauge },
                ] as { type: AppliesToType; icon: React.ElementType }[]).map(({ type: t, icon: Icon }) => (
                  <DropdownMenuItem key={t} onSelect={() => handleTypeChange(t)} className={appliesToType === t ? 'font-medium text-[var(--color-accent-9)] bg-[var(--color-accent-1)]' : ''}>
                    <Icon size={18} className="shrink-0" />
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Value selector — searchable multiselect */}
            {/* Hidden measurement row */}
            <div ref={appliesToMeasureRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', display: 'flex', gap: '4px' }} aria-hidden="true">
              {appliesToSelected.map(v => (
                <span key={v} className="inline-flex items-center gap-1 h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[12px] font-medium whitespace-nowrap">
                  {v}<X size={11} />
                </span>
              ))}
            </div>
            <Popover.Root open={valueOpen} onOpenChange={setValueOpen}>
              <Popover.Trigger asChild>
                <button ref={appliesToTriggerRef} className="flex-1 h-10 flex items-center gap-1 pl-3 pr-2 bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] data-[state=open]:bg-[var(--color-neutral-2)] cursor-pointer outline-none transition-colors overflow-hidden">
                  {appliesToSelected.length === 0 ? (
                    <span className="flex-1 text-[13px] text-[var(--color-neutral-7)]" />
                  ) : (
                    <>
                      {appliesToSelected.slice(0, appliesToVisibleCount).map(v => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[12px] font-medium shrink-0"
                          onClick={e => { e.stopPropagation(); toggleAppliesToValue(v) }}
                        >
                          {v}<X size={11} className="cursor-pointer" />
                        </span>
                      ))}
                      {appliesToSelected.length - appliesToVisibleCount > 0 && (
                        <span className="inline-flex items-center h-6 px-2 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)] text-[12px] font-medium shrink-0">
                          +{appliesToSelected.length - appliesToVisibleCount}
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
                  className="z-[var(--z-dropdown)] w-[var(--radix-popover-trigger-width)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
                    <Search size={13} className="shrink-0 text-[var(--color-neutral-7)]" />
                    <input
                      ref={valueInputRef}
                      value={valueQuery}
                      onChange={e => setValueQuery(e.target.value)}
                      placeholder="Search…"
                      className="flex-1 text-[13px] text-[var(--color-neutral-11)] bg-transparent outline-none placeholder:text-[var(--color-neutral-7)]"
                    />
                  </div>
                  <div className="py-1 max-h-[220px] overflow-y-auto overscroll-contain" onWheelCapture={e => e.stopPropagation()}>
                    {filteredAppliesToOptions.length > 0 && (() => {
                      const allSelected = filteredAppliesToOptions.every(o => appliesToSelected.includes(o))
                      const someSelected = !allSelected && filteredAppliesToOptions.some(o => appliesToSelected.includes(o))
                      const selectedCount = filteredAppliesToOptions.filter(o => appliesToSelected.includes(o)).length
                      return (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-neutral-2)] border-b border-[var(--border-subtle)]">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)]">
                            TOTAL RESULTS: {filteredAppliesToOptions.length}{someSelected ? ` · ${selectedCount} selected` : allSelected ? ` · all selected` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (appliesToType === 'Asset') setForm(f => ({ ...f, asset: allSelected ? f.asset.filter(x => !filteredAppliesToOptions.includes(x)) : [...new Set([...f.asset, ...filteredAppliesToOptions])] }))
                              else if (appliesToType === 'Location') setForm(f => ({ ...f, location: allSelected ? f.location.filter(x => !filteredAppliesToOptions.includes(x)) : [...new Set([...f.location, ...filteredAppliesToOptions])] }))
                              else setForm(f => ({ ...f, meter: allSelected ? f.meter.filter(x => !filteredAppliesToOptions.includes(x)) : [...new Set([...f.meter, ...filteredAppliesToOptions])] }))
                            }}
                            className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent-9)] hover:opacity-80 cursor-pointer transition-opacity"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      )
                    })()}
                    {filteredAppliesToOptions.length === 0 ? (
                      <p className="px-3 py-2 text-[13px] text-[var(--color-neutral-7)]">No results</p>
                    ) : filteredAppliesToOptions.map(o => {
                      const checked = appliesToSelected.includes(o)
                      const alreadyUsed = usedList.includes(o)
                      const assetLocation = appliesToType === 'Asset' ? getAssetData(o)?.location : undefined
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => !alreadyUsed && toggleAppliesToValue(o)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2 text-[13px] text-left transition-colors ${alreadyUsed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--color-neutral-3)]'} ${checked ? 'text-[var(--color-neutral-12)] bg-[var(--color-accent-1)]' : 'text-[var(--color-neutral-11)]'}`}
                        >
                          <span className={`flex-shrink-0 w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center transition-colors ${alreadyUsed ? 'border-[var(--color-neutral-4)] bg-[var(--color-neutral-3)]' : checked ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                            {(checked && !alreadyUsed) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            {alreadyUsed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="var(--color-neutral-6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </span>
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className="truncate">{o}</span>
                            {assetLocation && <span className="text-[11px] text-[var(--color-neutral-7)] truncate">{assetLocation}</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        {/* "We'll use existing tech" hint — right after Applies To */}
        {multiItemsWithTech && (
          <p className="text-[12px] text-[var(--color-neutral-8)] mb-6 -mt-2 leading-5">
            We'll use the technicians and teams already assigned to these items. You can change them below.
          </p>
        )}

        {/* Meter field — only when meter-based trigger and selected items are missing a meter */}
        {needsMeterInput && (() => {
          return (
            <div className="mb-6">
              <ModalSectionLabel>Meter Reading <span className="text-[var(--color-error)]">*</span></ModalSectionLabel>
              <SearchableSelect
                value={form.meter[0] || ''}
                onChange={v => { setForm(f => ({ ...f, meter: v ? [v] : [] })); setMeterTouched(false) }}
                options={METERS}
                error={meterTouched && !form.meter[0]}
                onBlur={() => setMeterTouched(true)}
              />
            </div>
          )
        })()}

        <div className="h-px bg-[var(--border-subtle)] mb-6" />

        {/* PEOPLE */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)]">Assigned To</p>
          {(previousAssignment?.primaryAssignee || previousAssignment?.team) && (
            <button type="button"
              onClick={() => setForm(f => ({ ...f, primaryAssignee: previousAssignment.primaryAssignee!, additionalAssignee: previousAssignment.additionalAssignee ?? [], team: previousAssignment.team ?? '' }))}
              className="text-[11px] text-[var(--color-accent-9)] hover:underline cursor-pointer font-medium">
              Use Last Assigned To
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-[var(--space-xs)]">
            <div className="flex items-center justify-between">
              <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">Technician</label>
            </div>
            <SearchableSelect value={form.primaryAssignee} onChange={set('primaryAssignee')} options={ASSIGNEES} showAvatar />
          </div>
          <div className="flex gap-4">
            <div className={`flex-1 min-w-0 ${form.primaryAssignee ? '' : 'opacity-40 pointer-events-none'}`}>
              <SearchableMultiSelect label="Additional Technicians" values={form.additionalAssignee} onChange={v => setForm(f => ({ ...f, additionalAssignee: v }))} options={ASSIGNEES} showAvatar />
            </div>
            <div className="flex-1 min-w-0">
              <Select label="Team" value={form.team} onChange={set('team')} options={TEAMS} clearable placeholder="" />
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)] mb-6" />

        {/* DATES */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)]">Active Dates</p>
          {previousAssignment && (
            <button type="button"
              onClick={() => { setDateError(''); setForm(f => ({ ...f, startDate: previousAssignment.startDate ?? '', endDate: previousAssignment.endDate ?? '' })) }}
              className="text-[11px] text-[var(--color-accent-9)] hover:underline cursor-pointer font-medium">
              Use Last Active Dates
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DateInputMDY defaultToday label="Start" value={form.startDate} onChange={v => { setDateError(''); setForm(f => ({ ...f, startDate: v })) }} />
          <DateInputMDY label="End" value={form.endDate} minIso={form.startDate || undefined} onChange={v => { setDateError(''); setForm(f => ({ ...f, endDate: v })) }} />
        </div>
        {dateError && <p className="mt-2 text-[12px] text-[var(--color-error,#CE2C31)]">{dateError}</p>}

      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2 px-6 py-4">
        <Button variant="secondary" size="lg" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={!canSubmit}>Add</Button>
      </ModalFooter>
    </Modal>
  )
}

/* ── Nova AI Panel ── */

interface NovaMessage {
  id: string
  role: 'user' | 'nova'
  text: string
  fields?: { label: string; value: string }[]
}

interface NovaFill {
  title?: string
  description?: string
  category?: string
  priority?: string
}

function novaGenerate(prompt: string): { message: string; fields: { label: string; value: string }[]; fill: NovaFill } {
  const p = prompt.toLowerCase()
  const fill: NovaFill = {}

  // Title
  if (p.includes('hvac') || p.includes('air')) {
    fill.title = 'Monthly HVAC Filter Replacement'
    fill.description = 'Replace HVAC air filters monthly to maintain air quality and system efficiency. Inspect for signs of wear or clogging and document filter condition before and after replacement.'
    fill.category = 'Preventative'
    fill.priority = 'Medium'
  } else if (p.includes('pump')) {
    fill.title = 'Cooling Pump Pressure Check'
    fill.description = 'Inspect and test cooling pump pressure levels. Verify that pressure readings are within acceptable operating range and check for leaks or unusual vibrations.'
    fill.category = 'Preventative'
    fill.priority = 'High'
  } else if (p.includes('inspect') || p.includes('inspection')) {
    fill.title = prompt.replace(/create|a|an|pm|preventive|maintenance|for/gi, '').trim().replace(/^\w/, c => c.toUpperCase()) || 'Equipment Inspection'
    fill.description = 'Perform a thorough visual and functional inspection. Document findings, identify any potential issues, and flag items requiring immediate attention.'
    fill.category = 'Inspection'
    fill.priority = 'Medium'
  } else if (p.includes('electric') || p.includes('electrical')) {
    fill.title = 'Electrical Panel Inspection'
    fill.description = 'Inspect electrical panels, connections, and wiring for signs of wear, overheating, or damage. Test breakers and verify all safety labels are in place.'
    fill.category = 'Electrical'
    fill.priority = 'High'
  } else if (p.includes('safety') || p.includes('fire')) {
    fill.title = 'Safety Equipment Check'
    fill.description = 'Verify all safety equipment is present, accessible, and in working order. Check expiration dates, test functionality, and replace any expired or damaged items.'
    fill.category = 'Safety'
    fill.priority = 'High'
  } else {
    const cleaned = prompt.replace(/create|a|an|pm|for|maintenance|preventive/gi, '').trim()
    fill.title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'Scheduled Maintenance'
    fill.description = 'Perform scheduled maintenance tasks as required. Document all findings and actions taken during the maintenance session.'
    fill.category = 'Preventative'
    fill.priority = 'Medium'
  }

  // Override priority from keywords
  if (p.includes('urgent') || p.includes('critical') || p.includes('high')) fill.priority = 'High'
  if (p.includes('low') || p.includes('minor')) fill.priority = 'Low'

  const fields = [
    { label: 'Title', value: fill.title! },
    { label: 'Description', value: fill.description!.slice(0, 60) + '…' },
    { label: 'Category', value: fill.category! },
    { label: 'Priority', value: fill.priority! },
  ]

  return {
    message: `I've generated a PM based on your description. Here's what I filled in:`,
    fields,
    fill,
  }
}

/* ── Trigger Setup Modal ── */

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

function TriggerSetupModal({ type, onClose, onSave }: {
  type: 'meter' | 'calendar' | 'both'
  onClose: () => void
  onSave: (trigger: string) => void
}) {
  const [scheduleType, setScheduleType] = useState<'fixed' | 'after'>('fixed')
  const [interval, setInterval] = useState('1')
  const [period, setPeriod] = useState('Week')
  const [activeDay, setActiveDay] = useState('Monday')
  const [atTime, setAtTime] = useState('')
  const [createBefore, setCreateBefore] = useState<'advance' | 'day'>('day')
  const [advanceAmount, setAdvanceAmount] = useState('1')
  const [advancePeriod, setAdvancePeriod] = useState('Month')
  const [advanceTime, setAdvanceTime] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [dayTime, setDayTime] = useState('')
  const [meterThreshold, setMeterThreshold] = useState('')
  const [meterUnit, setMeterUnit] = useState('hours')

  const title = type === 'meter' ? 'Create Meter Trigger' : type === 'calendar' ? 'Create Calendar Trigger' : 'Create Meter & Calendar Trigger'


  return (
    <Modal open={true} onOpenChange={open => !open && onClose()} maxWidth="740px">
      <ModalHeader title={title} />
      <ModalBody className="flex flex-col gap-7 px-8 py-6">

          {/* Meter section */}
          {(type === 'meter' || type === 'both') && (
            <div className="flex flex-col gap-3">
              <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">When should the meter trigger fire?</p>
              <div className="flex items-center gap-3">
                <NumberInput
                  value={meterThreshold}
                  onChange={setMeterThreshold}
                  min={0}
                  placeholder="0"
                  className="w-24"
                />
                <select
                  value={meterUnit}
                  onChange={e => setMeterUnit(e.target.value)}
                  className="h-10 px-3 pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors appearance-none cursor-pointer"
                >
                  {['hours', 'miles', 'km', 'cycles', 'PSI'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Calendar section */}
          {(type === 'calendar' || type === 'both') && (<>
            <div className="flex flex-col gap-4">
              <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">How would you like to schedule this maintenance?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: 'fixed' as const,
                    icon: (
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.625 9.04167V5.54167C23.625 4.89733 23.1027 4.375 22.4583 4.375H5.54167C4.89733 4.375 4.375 4.89733 4.375 5.54167V9.04167M23.625 9.04167V22.4583C23.625 23.1027 23.1027 23.625 22.4583 23.625H5.54167C4.89733 23.625 4.375 23.1027 4.375 22.4583V9.04167M23.625 9.04167H4.375M9.33333 14V13.9883M14 14V13.9883M9.33333 18.6667V18.655M14 18.6667V18.655M18.6667 14V13.9883M9.625 14C9.625 14.1611 9.49442 14.2917 9.33333 14.2917C9.17225 14.2917 9.04167 14.1611 9.04167 14C9.04167 13.8389 9.17225 13.7083 9.33333 13.7083C9.49442 13.7083 9.625 13.8389 9.625 14ZM14.2917 14C14.2917 14.1611 14.1611 14.2917 14 14.2917C13.8389 14.2917 13.7083 14.1611 13.7083 14C13.7083 13.8389 13.8389 13.7083 14 13.7083C14.1611 13.7083 14.2917 13.8389 14.2917 14ZM9.625 18.6667C9.625 18.8277 9.49442 18.9583 9.33333 18.9583C9.17225 18.9583 9.04167 18.8277 9.04167 18.6667C9.04167 18.5056 9.17225 18.375 9.33333 18.375C9.49442 18.375 9.625 18.5056 9.625 18.6667ZM14.2917 18.6667C14.2917 18.8277 14.1611 18.9583 14 18.9583C13.8389 18.9583 13.7083 18.8277 13.7083 18.6667C13.7083 18.5056 13.8389 18.375 14 18.375C14.1611 18.375 14.2917 18.5056 14.2917 18.6667ZM18.9583 14C18.9583 14.1611 18.8277 14.2917 18.6667 14.2917C18.5056 14.2917 18.375 14.1611 18.375 14C18.375 13.8389 18.5056 13.7083 18.6667 13.7083C18.8277 13.7083 18.9583 13.8389 18.9583 14Z" stroke="currentColor" strokeWidth="0.884211" strokeLinecap="round"/>
                        <circle cx="8.90637" cy="19.0919" r="2.12121" fill="#006ADC"/>
                      </svg>
                    ),
                    title: 'Fixed schedule',
                    desc: 'Repeat on set calendar dates.',
                    example: 'Example: Monthly on the 26th',
                  },
                  {
                    key: 'after' as const,
                    icon: (
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.80013 11.0807L10.1126 11.9557L12.2962 9.04428M16.1093 10.5H19.0259M16.0417 17.5H18.9583M8.80013 18.082L10.1126 18.957L12.2962 16.0456M5.54167 23.625H22.4583C23.1027 23.625 23.625 23.1027 23.625 22.4583V5.54167C23.625 4.89733 23.1027 4.375 22.4583 4.375H5.54167C4.89733 4.375 4.375 4.89733 4.375 5.54167V22.4583C4.375 23.1027 4.89733 23.625 5.54167 23.625Z" stroke="currentColor" strokeWidth="0.884211" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16.0423 17.4993H18.959M8.80078 18.0813L10.1133 18.9564L12.2969 16.0449" stroke="#006ADC" strokeWidth="1.10526" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ),
                    title: 'After completion',
                    desc: 'Repeat after the previous work order is completed.',
                    example: 'Example: 30 days after completion',
                  },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setScheduleType(opt.key)}
                    className={`flex flex-col gap-3 p-5 rounded-[var(--radius-xl)] border-2 text-left transition-all cursor-pointer ${
                      scheduleType === opt.key
                        ? 'border-[var(--color-accent-7)] bg-[var(--color-accent-1)]'
                        : 'border-[var(--border-default)] hover:border-[var(--color-neutral-5)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scheduleType === opt.key ? 'bg-[var(--color-accent-2)] text-[var(--color-accent-9)]' : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)]'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`text-[14px] font-semibold ${scheduleType === opt.key ? 'text-[var(--color-accent-9)]' : 'text-[var(--color-neutral-12)]'}`}>{opt.title}</p>
                      <p className="text-[12px] text-[var(--color-neutral-8)] mt-1 leading-snug">{opt.desc}</p>
                      <p className="text-[12px] text-[var(--color-neutral-7)] mt-2 italic">{opt.example}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">When is the maintenance due?</p>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[var(--color-neutral-9)] shrink-0">Every</span>
                <input
                  type="number"
                  value={interval}
                  onChange={e => setInterval(e.target.value)}
                  className="w-14 h-9 px-2 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors shrink-0"
                />
                <div className="relative shrink-0">
                  <select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="h-9 pl-3 pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors appearance-none cursor-pointer"
                  >
                    {['Day', 'Week', 'Month', 'Year'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
                </div>
                {period === 'Week' && (
                  <>
                    <span className="text-[13px] text-[var(--color-neutral-9)] shrink-0 ml-3">On</span>
                    <div className="relative shrink-0">
                      <select
                        value={activeDay}
                        onChange={e => setActiveDay(e.target.value)}
                        className="h-8 pl-3 pr-7 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors appearance-none cursor-pointer"
                      >
                        {FULL_WEEKDAYS.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
                    </div>
                  </>
                )}
                <span className="text-[13px] text-[var(--color-neutral-9)] shrink-0 ml-3">At</span>
                <TimePicker value={atTime} onChange={setAtTime} className="shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">When should the work order be created?</p>
              <div className="flex flex-col gap-2">
                {/* Before the maintenance date */}
                <label
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border cursor-pointer transition-colors ${
                    createBefore === 'advance' ? 'border-[var(--color-accent-7)] bg-[var(--color-accent-1)]' : 'border-[var(--border-default)] hover:bg-[var(--color-neutral-2)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="create-before"
                    checked={createBefore === 'advance'}
                    onChange={() => setCreateBefore('advance')}
                    className="accent-[var(--color-accent-9)] cursor-pointer shrink-0"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <NumberInput
                      value={advanceAmount}
                      onChange={setAdvanceAmount}
                      min={1}
                      className="w-14"
                    />
                    <div className="relative">
                      <select
                        value={advancePeriod}
                        onChange={e => setAdvancePeriod(e.target.value)}
                        className="h-8 pl-3 pr-7 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors appearance-none cursor-pointer"
                      >
                        {['Day', 'Week', 'Month', 'Year'].map(p => <option key={p}>{p}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
                    </div>
                    <span className="text-[13px] text-[var(--color-neutral-9)]">before the maintenance date</span>
                    <span className="text-[13px] text-[var(--color-neutral-9)] ml-3">At</span>
                    <TimePicker value={advanceTime} onChange={setAdvanceTime} />
                  </div>
                </label>

                {/* On the day of maintenance */}
                <label
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border cursor-pointer transition-colors ${
                    createBefore === 'day' ? 'border-[var(--color-accent-7)] bg-[var(--color-accent-1)]' : 'border-[var(--border-default)] hover:bg-[var(--color-neutral-2)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="create-before"
                    checked={createBefore === 'day'}
                    onChange={() => setCreateBefore('day')}
                    className="accent-[var(--color-accent-9)] cursor-pointer shrink-0"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] text-[var(--color-neutral-9)]">On</span>
                    <div className="relative">
                      <select
                        value={dayOfWeek}
                        onChange={e => setDayOfWeek(e.target.value)}
                        className="h-8 pl-3 pr-7 min-w-[120px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors appearance-none cursor-pointer"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(p => <option key={p}>{p}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />

                    </div>
                    <span className="text-[13px] text-[var(--color-neutral-9)]">of the maintenance date</span>
                    <span className="text-[13px] text-[var(--color-neutral-9)] ml-3">At</span>
                    <TimePicker value={dayTime} onChange={setDayTime} />
                  </div>
                </label>
              </div>
            </div>

            <button className="text-[13px] font-medium text-[var(--color-accent-9)] hover:underline text-left w-fit cursor-pointer">
              + Add Inactive Periods
            </button>
          </>)}

      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2 px-8 py-4 border-t border-[var(--border-subtle)]">
        <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" onClick={() => {
          const label = type === 'meter' ? `Less than ${meterThreshold || '0'} ${meterUnit}` : `Every ${interval} ${period}`
          onSave(label)
        }}>
          Create Schedule
        </Button>
      </ModalFooter>
    </Modal>
  )
}

interface NovaPanelProps {
  open: boolean
  onClose: () => void
  setTitle: (v: string) => void
  setDescription: (v: string) => void
  setCategory: (v: string) => void
  setPriority: (v: string) => void
  setDetailsOpen: (v: boolean) => void
  setAssignModalOpen: (v: boolean) => void
  addAsset: (a: AssignedAsset) => void
  addTrigger: (t: PMTrigger) => void
}

function NovaPanel(props: NovaPanelProps) {
  const { open, onClose, setTitle, setDescription, setCategory, setPriority, setDetailsOpen, setAssignModalOpen, addAsset, addTrigger } = props
  const [messages, setMessages] = useState<NovaMessage[]>([
    { id: '0', role: 'nova', text: "Hi! Describe the PM you want to create and I'll build it for you — filling in every field." },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusText, setStatusText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, statusText])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350)
  }, [open])

  function pushMsg(role: 'user' | 'nova', text: string, fields?: NovaMessage['fields']) {
    setMessages(m => [...m, { id: crypto.randomUUID(), role, text, fields }])
  }

  function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

  async function typeText(setter: (v: string) => void, text: string, msPerChar = 28) {
    for (let i = 1; i <= text.length; i++) {
      if (cancelRef.current) return
      setter(text.slice(0, i))
      await sleep(msPerChar)
    }
  }

  async function runAnimation(prompt: string) {
    cancelRef.current = false
    setBusy(true)
    const { fill } = novaGenerate(prompt)

    // Step 1 — fill details
    setDetailsOpen(true)
    await sleep(400)
    setStatusText('Filling in the details…')
    pushMsg('nova', '✏️ Starting with the basic details — title, description, category and priority…')
    await sleep(600)

    await typeText(setTitle, fill.title ?? '')
    await sleep(200)
    await typeText(setDescription, fill.description ?? '', 10)
    await sleep(200)
    setCategory(fill.category ?? '')
    await sleep(300)
    setPriority(fill.priority ?? '')
    await sleep(500)

    // Step 2 — calendar trigger
    setStatusText('Creating a calendar-based trigger…')
    pushMsg('nova', '📅 Creating a recurring calendar trigger — every 3 months, work order 2 weeks before…')
    await sleep(800)
    const calTrigger: PMTrigger = {
      id: crypto.randomUUID(),
      expanded: true,
      assignments: [],
      calendarTrigger: {
        id: crypto.randomUUID(),
        scheduleType: 'Regular Interval',
        every: '3', period: 'Month',
        weekday: '', monthMode: 'on-day', monthDay: '1',
        monthOrdinal: 'first', monthWeekday: 'Day',
        yearMode: 'on-day', yearMonth: 'January', yearDay: '1', yearOrdinal: 'first', yearWeekday: 'Day',
        atTime: '08:00 AM',
        woCreationMode: 'relative', woRelativeN: '2', woRelativePeriod: 'Week',
        woOnThePeriod: '', woAtTime: '07:00 AM', woOnTheAtTime: '',
        meterCondition: '', meterValue: '', meterUnit: '',
        meterDueN: '', meterDuePeriod: '',
      },
    }
    addTrigger(calTrigger)
    await sleep(600)

    // Step 3 — add assets to calendar trigger
    setStatusText('Adding assets to the calendar trigger…')
    pushMsg('nova', '🏭 Adding some assets to that trigger so work orders know where to go…')
    await sleep(700)
    const asset1 = ASSETS[0]
    const asset2 = ASSETS[1] ?? ASSETS[0]
    const meta1 = getAssetData(asset1)
    const meta2 = getAssetData(asset2)
    addTrigger({ ...calTrigger, assignments: [
      { id: crypto.randomUUID(), name: asset1, type: 'Asset', subtext: meta1?.location ?? '', meter: meta1?.meter, assignees: [ASSIGNEES[0]], team: TEAMS[0].value, startDate: '', endDate: '' },
      { id: crypto.randomUUID(), name: asset2, type: 'Asset', subtext: meta2?.location ?? '', meter: meta2?.meter, assignees: [ASSIGNEES[1] ?? ASSIGNEES[0]], team: TEAMS[0].value, startDate: '', endDate: '' },
    ]})
    await sleep(500)

    // Step 4 — meter trigger
    setStatusText('Creating a meter-based trigger…')
    pushMsg('nova', '📊 Now adding a meter trigger — fires when a reading goes above 500 units…')
    await sleep(700)
    const meterTrigger: PMTrigger = {
      id: crypto.randomUUID(),
      expanded: false,
      assignments: [],
      calendarTrigger: {
        id: crypto.randomUUID(),
        scheduleType: 'Regular Interval',
        every: '', period: '', weekday: '',
        monthMode: 'on-day', monthDay: '1',
        monthOrdinal: 'first', monthWeekday: 'Day',
        yearMode: 'on-day', yearMonth: 'January', yearDay: '1', yearOrdinal: 'first', yearWeekday: 'Day',
        atTime: '',
        woCreationMode: '', woRelativeN: '', woRelativePeriod: '',
        woOnThePeriod: '', woAtTime: '', woOnTheAtTime: '',
        meterCondition: 'above', meterValue: '500', meterUnit: 'hours',
        meterDueN: '1', meterDuePeriod: 'Week',
      },
    }
    addTrigger(meterTrigger)
    await sleep(500)

    // Step 5 — add asset to meter trigger
    setStatusText('Assigning assets to the meter trigger…')
    pushMsg('nova', '🔧 Wiring up assets to the meter trigger too…')
    await sleep(600)
    const asset3 = ASSETS[2] ?? ASSETS[0]
    const meta3 = getAssetData(asset3)
    addTrigger({ ...meterTrigger, assignments: [
      { id: crypto.randomUUID(), name: asset3, type: 'Asset', subtext: meta3?.location ?? '', meter: meta3?.meter ?? METER_NAMES[0], assignees: [ASSIGNEES[2] ?? ASSIGNEES[0]], team: TEAMS[1]?.value ?? TEAMS[0].value, startDate: '', endDate: '' },
    ]})
    await sleep(600)

    setStatusText('')
    setBusy(false)
    pushMsg('nova', `✅ All done! I've set up **${fill.title}** with a calendar trigger (every 3 months) and a meter trigger (above 500 hours). Please check the PM info on the left — edit anything you'd like — and hit **Create PM** when you're happy.`, [
      { label: 'Title', value: fill.title ?? '' },
      { label: 'Category', value: fill.category ?? '' },
      { label: 'Priority', value: fill.priority ?? '' },
      { label: 'Triggers', value: '2 triggers created' },
      { label: 'Assets', value: '3 assets assigned' },
    ])
  }

  function handleSend() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    pushMsg('user', text)
    setBusy(true)
    setStatusText('Thinking…')

    setTimeout(() => {
      pushMsg('nova', "On it! I'll fill in each field for you now…")
      runAnimation(text)
    }, 1000)
  }

  const ThinkingDots = () => (
    <div className="flex items-center gap-1 px-3 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-8)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )

  return (
    <div className={`shrink-0 flex flex-col border-l border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden transition-[width] duration-300 ease-[var(--ease-default)]`} style={{ width: open ? '400px' : '0px' }}>
      <div className="w-[400px] h-full flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[var(--color-neutral-12)] leading-none">Nova</p>
            <p className="text-[11px] text-[var(--color-neutral-8)] mt-0.5">AI Assistant</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-7)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[92%] px-3 py-2.5 rounded-[var(--radius-xl)] text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--color-accent-9)] text-white rounded-tr-[4px]'
                  : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-12)] rounded-tl-[4px]'
              }`}>
                {msg.text}
              </div>
              {msg.fields && (
                <div className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden">
                  {msg.fields.map(f => (
                    <div key={f.label} className="flex items-start gap-2 px-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
                      <span className="text-[11px] font-semibold text-[var(--color-neutral-8)] uppercase tracking-widest w-20 shrink-0 pt-0.5">{f.label}</span>
                      <span className="text-[12px] text-[var(--color-neutral-11)]">{f.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Live status */}
          {busy && statusText && (
            <div className="flex items-start gap-2">
              <div className="bg-[var(--color-neutral-3)] rounded-[var(--radius-xl)] rounded-tl-[4px] text-[12px] text-[var(--color-neutral-9)] flex items-center gap-2">
                <ThinkingDots />
                <span className="pr-3">{statusText}</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[var(--border-subtle)] shrink-0">
          <div className="flex items-end gap-2 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2 focus-within:border-[var(--color-accent-7)] focus-within:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="e.g. Monthly HVAC filter check on Binding Machine…"
              rows={2}
              disabled={busy}
              data-composer-input
              className="flex-1 bg-transparent text-[13px] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)] outline-none resize-none leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || busy}
              className="w-7 h-7 rounded-full bg-[var(--color-accent-9)] flex items-center justify-center text-white hover:bg-[var(--color-accent-10)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            >
              <ArrowRight size={13} />
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-neutral-7)] mt-1.5 text-center">Nova fills each field in real-time. You can edit before saving.</p>
        </div>

      </div>
    </div>
  )
}

/* ── Main page ── */

/* ── PMTrigger types ── */

interface PMTrigger {
  id: string
  calendarTrigger: CalendarTrigger
  assignments: TriggerAssignment[]
  expanded: boolean
}

interface TriggerAssignment {
  id: string
  name: string
  type: 'Asset' | 'Location' | 'Meter' | 'Person'
  subtext: string
  meter?: string
  meterInherited?: boolean
  assignees: string[]
  team?: string
  teamInherited?: boolean
  startDate: string
  endDate: string
}

function formatScheduleText(t: CalendarTrigger): string {
  const parts: string[] = []
  if (t.every && t.period) parts.push(`Every ${t.every} ${t.period}${Number(t.every) > 1 ? 's' : ''}`)
  if (t.weekday) {
    const fullDay = FULL_WEEKDAYS[['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(t.weekday)]
    parts.push(`On ${fullDay ? fullDay + 's' : t.weekday + 's'}`)
  }
  if (t.atTime) parts.push(`At ${t.atTime}`)
  if (t.woCreationMode === 'relative' && t.woRelativeN && t.woRelativePeriod) {
    parts.push(`WO ${t.woRelativeN} ${t.woRelativePeriod.toLowerCase()} before`)
  } else if (t.woCreationMode === 'on-the' && t.woOnThePeriod) {
    parts.push(`WO on ${t.woOnThePeriod} before`)
  }
  return parts.join(' · ') || 'Scheduled trigger'
}
function formatMeterText(t: CalendarTrigger): string | undefined {
  if (!t.meterValue) return undefined
  return `When a reading is ${t.meterCondition} ${t.meterValue} ${t.meterUnit || 'units'}`
}

function MeterPopoverContent({ current, onSelect }: { current: string; onSelect: (m: string) => void }) {
  const [q, setQ] = React.useState('')
  const filtered = ['', ...METERS].filter(m => !q || (m || 'None').toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[var(--border-subtle)]">
        <Search size={12} className="text-[var(--color-neutral-7)] shrink-0" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search meters…" autoFocus className="flex-1 text-[12px] bg-transparent outline-none text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)]" />
      </div>
      <div className="py-1 max-h-[200px] overflow-y-auto">
        {filtered.map(m => (
          <Popover.Close key={m || 'none'} asChild>
            <button type="button" onClick={() => onSelect(m)} className={`w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${current === m ? 'text-[var(--color-accent-9)] font-medium' : 'text-[var(--color-neutral-11)]'}`}>
              {m || 'None'}
              {!m && <X size={12} className="text-[var(--color-neutral-7)] shrink-0" />}
            </button>
          </Popover.Close>
        ))}
        {filtered.length === 0 && <p className="px-3 py-2 text-[12px] text-[var(--color-neutral-7)]">No meters found</p>}
      </div>
    </>
  )
}


function BulkTechniciansContent({ selectedAssignments, onToggle }: {
  selectedAssignments: Array<{ assignees: string[] }>
  onToggle: (name: string) => void
}) {
  const [q, setQ] = React.useState('')
  const filtered = ASSIGNEES.filter(n => !q || n.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[var(--border-subtle)]">
        <Search size={12} className="text-[var(--color-neutral-7)] shrink-0" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." autoFocus className="flex-1 text-[12px] bg-transparent outline-none text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)]" />
      </div>
      <div className="py-1 max-h-[200px] overflow-y-auto">
        {filtered.map(name => {
          const allHave = selectedAssignments.length > 0 && selectedAssignments.every(a => a.assignees.includes(name))
          const someHave = !allHave && selectedAssignments.some(a => a.assignees.includes(name))
          return (
            <button key={name} type="button" onClick={() => onToggle(name)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-left cursor-pointer hover:bg-[var(--color-neutral-3)] transition-colors">
              <Avatar name={name} size="xs" className="shrink-0" />
              <span className="flex-1 text-[var(--color-neutral-11)] truncate">{name}</span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${allHave ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : someHave ? 'bg-[var(--color-accent-3)] border-[var(--color-accent-7)]' : 'border-[var(--border-default)]'}`}>
                {allHave && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {someHave && <div className="w-2 h-2 rounded-sm bg-[var(--color-accent-9)]" />}
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && <p className="px-3 py-2 text-[12px] text-[var(--color-neutral-7)]">No results</p>}
      </div>
    </>
  )
}

function FillMissingModal({
  open,
  onClose,
  type,
  assignments,
  onSave,
}: {
  open: boolean
  onClose: () => void
  type: 'meter' | 'tech'
  assignments: TriggerAssignment[]
  onSave: (updates: Array<{ id: string; meter?: string; assignees?: string[] }>) => void
}) {
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(assignments.map(a => [a.id, '']))
  )

  const allFilled = assignments.every(a => !!(values[a.id]))

  // ID of the first assignment that has a value filled
  const firstFilledId = assignments.find(a => values[a.id])?.id
  const firstFilledValue = firstFilledId ? values[firstFilledId] : ''

  function applyToAll() {
    if (!firstFilledValue) return
    setValues(Object.fromEntries(assignments.map(a => [a.id, firstFilledValue])))
  }

  function saveAll() {
    const updates = assignments
      .filter(a => values[a.id])
      .map(a => type === 'meter' ? { id: a.id, meter: values[a.id] } : { id: a.id, assignees: [values[a.id]] })
    if (updates.length) onSave(updates)
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={v => !v && onClose()} maxWidth="560px">
      <div className="p-6 flex flex-col">
        <h2 className="text-[16px] font-semibold text-[var(--color-neutral-12)] mb-4">
          Fill Missing {type === 'meter' ? 'Meters' : 'Technicians'}
        </h2>

        <div className="overflow-y-auto -mx-6 px-6" style={{ maxHeight: '380px' }}>
          {assignments.map((a, i) => {
            const isFirst = a.id === assignments[0].id
            const showApplyToAll = isFirst && assignments.length > 1 && !!values[a.id]
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 py-3 ${i < assignments.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}
              >
                <div className="flex items-center gap-1.5 shrink-0 w-[160px] min-w-0">
                  <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{a.name}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)] shrink-0">{a.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    value={values[a.id]}
                    onChange={v => setValues(s => ({ ...s, [a.id]: v }))}
                    options={type === 'meter' ? METERS : ASSIGNEES}
                    placeholder={type === 'meter' ? 'Select meter…' : 'Select technician…'}
                    showAvatar={type === 'tech'}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyToAll}
                  style={{
                    opacity: showApplyToAll ? 1 : 0,
                    transform: showApplyToAll ? 'translateX(0)' : 'translateX(6px)',
                    pointerEvents: showApplyToAll ? 'auto' : 'none',
                    transition: 'opacity 180ms ease, transform 180ms ease',
                    whiteSpace: 'nowrap',
                  }}
                  className="text-[12px] text-[var(--color-accent-9)] font-medium hover:underline shrink-0"
                >
                  Apply to all
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="md"
            onClick={saveAll}
            disabled={!allFilled}
          >
            Save All
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CreatePMPageContent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [duration, setDuration] = useState('')
  const [signature, setSignature] = useState(false)
  const [createWONow, setCreateWONow] = useState(false)
  const [checklists, setChecklists] = useState<ChecklistGroup[]>([])
  const [checklistsOpen, setChecklistsOpen] = useState(false)
  const [filesPartsOpen, setFilesPartsOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [triggers, setTriggers] = useState<PMTrigger[]>([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarModalKey, setCalendarModalKey] = useState(0)
  const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null)
  const [editingAssignmentId, setEditingAssignmentId] = useState<{ triggerId: string; assignmentId: string } | null>(null)
  const [showFillMissingModal, setShowFillMissingModal] = useState<{ triggerId: string; type: 'meter' | 'tech' } | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<{ triggerId: string; assignmentId: string; name: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  const [editingPmStatus, setEditingPmStatus] = useState<'Active' | 'Draft' | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [pendingNavHref, setPendingNavHref] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const dirtyTrackingRef = useRef(false)
  const draftIdRef = useRef(`pm-new-${Date.now()}`)
  const [assignmentSearch, setAssignmentSearch] = useState<Record<string, string>>({})
  const [assignmentFilters, setAssignmentFilters] = useState<Record<string, { technicians: string[]; meters: string[]; teams: string[] }>>({})
  const [assignmentSelected, setAssignmentSelected] = useState<Record<string, Set<string>>>({})
  const [assignmentSort, setAssignmentSort] = useState<Record<string, { col: string; dir: 'asc' | 'desc' }>>({})
  const [novaOpen, setNovaOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newTriggerIds, setNewTriggerIds] = useState<Set<string>>(new Set())
  const [focusedTriggerIds, setFocusedTriggerIds] = useState<Set<string>>(new Set())
  const [skeletonAssignmentIds, setSkeletonAssignmentIds] = useState<Set<string>>(new Set())
  const [newAssignmentIds, setNewAssignmentIds] = useState<Set<string>>(new Set())
  const [skeletonTriggerIds, setSkeletonTriggerIds] = useState<Set<string>>(new Set())
  const [titleError, setTitleError] = useState(false)
  const [showCreateErrors, setShowCreateErrors] = useState(false)
  const createBtnRef = useRef<HTMLDivElement>(null)
  const [createErrorPos, setCreateErrorPos] = useState<{ top: number; right: number } | null>(null)
  const titleContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams?.get('assign') === '1' && triggers.length > 0 && !showAssignModal) {
      setShowAssignModal(triggers[0].id)
    }
  }, [searchParams, triggers.length])

  useEffect(() => {
    const editId = searchParams?.get('edit')
    if (!editId) return
    try {
      const stored = localStorage.getItem('upkeep_editing_pm')
      if (!stored) return
      const pm = JSON.parse(stored) as {
        id: string; title?: string; category?: string; priority?: string; status?: string
        schedules?: Array<{ id: string; calendarTrigger: string; meterTrigger?: string; assignments: Array<{ id: string; asset: string; assetType: string; location: string; meter?: string; startDate?: string; endDate?: string; assignees?: string[]; assignee?: string; team?: string }> }>
      }
      if (pm.id !== editId) return
      draftIdRef.current = pm.id
      setEditingPmStatus((pm.status === 'Draft' ? 'Draft' : 'Active'))
      if (pm.title && pm.title.toLowerCase() !== 'untitled pm' && pm.title.toLowerCase() !== 'untitled') setTitle(pm.title)
      if (pm.category) setCategory(pm.category)
      if (pm.priority) setPriority(pm.priority)
      if (pm.schedules?.length) {
        const defaultCal = (): CalendarTrigger => ({
          id: crypto.randomUUID(),
          scheduleType: 'Regular Interval',
          every: '1', period: 'Month',
          weekday: '', monthMode: 'on-day' as const, monthDay: '1',
          monthOrdinal: 'first', monthWeekday: 'Day',
          yearMode: 'on-day' as const, yearMonth: 'January', yearDay: '1', yearOrdinal: 'first', yearWeekday: 'Day',
          atTime: '08:00 AM',
          woCreationMode: '' as const, woRelativeN: '', woRelativePeriod: '',
          woOnThePeriod: '', woAtTime: '', woOnTheAtTime: '',
          meterCondition: '', meterValue: '', meterUnit: '',
          meterDueN: '', meterDuePeriod: '',
        })
        setTriggers(pm.schedules.map(s => ({
          id: s.id,
          calendarTrigger: defaultCal(),
          assignments: s.assignments.map(a => ({
            id: a.id,
            name: a.asset,
            type: (a.assetType || 'Asset') as 'Asset' | 'Location' | 'Meter',
            subtext: a.location || '',
            meter: a.meter || '',
            assignees: a.assignees ?? (a.assignee ? [a.assignee] : []),
            team: a.team || '',
            startDate: a.startDate || '',
            endDate: a.endDate || '',
          })),
          expanded: true,
        })))
      }
    } catch {}
    // Enable dirty tracking after pre-fill settles (new PM enables immediately via separate effect)
    if (searchParams?.get('edit')) {
      setTimeout(() => { dirtyTrackingRef.current = true }, 50)
    }
  }, [searchParams])

  // For new PM: enable dirty tracking immediately on mount
  useEffect(() => {
    if (!searchParams?.get('edit')) {
      dirtyTrackingRef.current = true
    }
  }, [])

  // Mark dirty whenever tracked state changes (only after tracking is enabled)
  useEffect(() => {
    if (dirtyTrackingRef.current) setIsDirty(true)
  }, [title, category, priority, triggers.length])

  function persistPM(status: 'Active' | 'Draft') {
    const schedule = triggers[0]
      ? formatScheduleText(triggers[0].calendarTrigger) || `Meter trigger`
      : 'No schedule'
    const item = {
      id: draftIdRef.current,
      title: title,
      assets: triggers.flatMap(t => t.assignments.map(a => ({
        asset: a.name, location: a.subtext, assignees: a.assignees, team: a.team,
      }))),
      schedules: triggers.map(t => ({
        id: t.id,
        calendarTrigger: formatScheduleText(t.calendarTrigger) || (t.calendarTrigger.meterCondition ? `Meter reading` : ''),
        meterTrigger: t.calendarTrigger.meterCondition ? `${t.calendarTrigger.meterCondition} ${t.calendarTrigger.meterValue} ${t.calendarTrigger.meterUnit}`.trim() : undefined,
        assignments: t.assignments.map(a => ({
          id: a.id,
          asset: a.name,
          assetType: (a.type === 'Location' ? 'Location' : 'Asset') as 'Asset' | 'Location',
          location: a.subtext || '',
          meter: a.meter || undefined,
          startDate: a.startDate || undefined,
          endDate: a.endDate || undefined,
          assignees: a.assignees,
          team: a.team,
        })),
      })),
      schedule,
      status,
      priority: priority || 'None',
      woCount: 0,
    }
    try {
      const existing = JSON.parse(localStorage.getItem('upkeep_new_pms') ?? '[]')
      const updated = [item, ...existing.filter((x: { id: string }) => x.id !== item.id)]
      localStorage.setItem('upkeep_new_pms', JSON.stringify(updated))
      if (!isEditing) localStorage.setItem('upkeep_pm_skeleton_id', item.id)
    } catch {}
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const imageScrollRef = useRef<HTMLDivElement>(null)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach(f => {
      const url = URL.createObjectURL(f)
      setImages(imgs => [...imgs, url])
    })
    e.target.value = ''
  }

  function handleAssignToTrigger(triggerId: string, form: AssignAssetForm) {
    let items: TriggerAssignment[] = []
    if (form.asset.length > 0) {
      items = form.asset.map(a => {
        const db = getAssetData(a)
        return {
          id: crypto.randomUUID(),
          name: a,
          type: 'Asset' as const,
          subtext: form.location[0] || db?.location || '',
          meter: form.meter[0] || db?.meter || '',
          meterInherited: !form.meter[0] && !!db?.meter,
          assignees: [form.primaryAssignee, ...form.additionalAssignee].filter(Boolean),
          team: form.team || db?.team || '',
          teamInherited: !form.team && !!db?.team,
          startDate: form.startDate,
          endDate: form.endDate,
        }
      })
    } else if (form.location.length > 0) {
      items = form.location.map(l => {
        const db = getLocationData(l)
        return {
          id: crypto.randomUUID(),
          name: l,
          type: 'Location' as const,
          subtext: '',
          meter: form.meter[0] || '',
          assignees: [form.primaryAssignee, ...form.additionalAssignee].filter(Boolean),
          team: form.team || db?.team || '',
          startDate: form.startDate,
          endDate: form.endDate,
        }
      })
    } else if (form.meter.length > 0) {
      items = form.meter.map(m => {
        const db = getMeterData(m)
        return {
          id: crypto.randomUUID(),
          name: m,
          type: 'Meter' as const,
          subtext: db?.locationName || '',
          meter: m,
          assignees: [form.primaryAssignee, ...form.additionalAssignee].filter(Boolean),
          team: form.team || '',
          startDate: form.startDate,
          endDate: form.endDate,
        }
      })
    }
    if (items.length === 0) {
      const assignees = [form.primaryAssignee, ...form.additionalAssignee].filter(Boolean)
      const name = assignees[0] || form.team || ''
      if (name) {
        items = [{
          id: crypto.randomUUID(),
          name,
          type: 'Person' as const,
          subtext: '',
          meter: '',
          assignees,
          team: form.team || '',
          startDate: form.startDate,
          endDate: form.endDate,
        }]
      }
    }
    if (editingAssignmentId?.triggerId === triggerId && editingAssignmentId.assignmentId) {
      const editId = editingAssignmentId.assignmentId
      setTriggers(ts => ts.map(t => t.id === triggerId ? { ...t, assignments: t.assignments.map(a => a.id === editId ? (items[0] ? { ...items[0], id: editId } : a) : a) } : t))
      setEditingAssignmentId(null)
    } else {
      const currentTrigger = triggers.find(t => t.id === triggerId)
      const isFirst = (currentTrigger?.assignments.length ?? 0) === 0
      const wasCollapsed = !currentTrigger?.expanded
      setTriggers(ts => ts.map(t => t.id === triggerId ? { ...t, expanded: true, assignments: [...t.assignments, ...items] } : t))
      const newIds = items.map(i => i.id)
      const skeletonDuration = isFirst ? 500 : 0
      const expandDelay = wasCollapsed ? 350 : 0
      if (isFirst) setSkeletonAssignmentIds(s => new Set([...s, ...newIds]))
      setTimeout(() => {
        if (isFirst) setSkeletonAssignmentIds(s => { const next = new Set(s); newIds.forEach(id => next.delete(id)); return next })
        setNewAssignmentIds(s => new Set([...s, ...newIds]))
        newIds.forEach(id => {
          const el = document.getElementById(`assignment-row-${id}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      }, skeletonDuration + expandDelay)
      setTimeout(() => setNewAssignmentIds(s => { const next = new Set(s); newIds.forEach(id => next.delete(id)); return next }), skeletonDuration + expandDelay + 600)
    }
    setShowAssignModal(null)
    if (!title.trim()) {
      setTitleError(true)
    }
  }

  const hasUnassignedTriggers = triggers.length > 0 && triggers.some(t => t.assignments.length === 0)
  const hasMissingMeters = triggers.some(t => t.calendarTrigger.meterCondition && t.assignments.some(a => !a.meter))
  const hasMissingTechnicians = triggers.some(t => t.assignments.some(a => a.assignees.length === 0 && !a.team))
  const hasAnyError = triggers.length === 0 || hasUnassignedTriggers || hasMissingMeters || hasMissingTechnicians
  const isTitleValid = title.trim() !== '' && title.trim().toLowerCase() !== 'untitled pm' && title.trim().toLowerCase() !== 'untitled'
  const missingFields: string[] = [
    ...(!isTitleValid ? ['Title is required'] : []),
    ...(triggers.length === 0 ? ['At least one schedule is required'] : []),
    ...(hasUnassignedTriggers ? ['All schedules need at least one asset, location, or meter'] : []),
    ...(hasMissingTechnicians ? ['Some assignments are missing a technician or team'] : []),
    ...(hasMissingMeters ? ['Some assignments are missing a meter reading'] : []),
  ]
  const createDisabled = !isTitleValid || hasAnyError


  function handleCreatePM() {
    if (!isTitleValid || hasAnyError) return
    persistPM('Active')
    const scheduleCount = triggers.length
    const assignmentCount = triggers.reduce((n, t) => n + t.assignments.length, 0)
    try {
      localStorage.setItem('upkeep_pm_created_toast', JSON.stringify({ title: title || 'PM', scheduleCount, assignmentCount }))
    } catch {}
    router.push('/predictive-maintenance')
  }

  const isEditing = !!(searchParams?.get('edit'))

  function handleSaveDraft() {
    persistPM('Draft')
    router.push('/predictive-maintenance')
  }

  function handleSaveEdit() {
    persistPM(editingPmStatus === 'Draft' ? 'Draft' : 'Active')
    router.push('/predictive-maintenance')
  }

  function handleNavigateAway(href: string) {
    if (isDirty) {
      setPendingNavHref(href)
      setShowLeaveModal(true)
      return
    }
    router.push(href)
  }

  function handleLeaveModalSave() {
    if (isEditing) {
      persistPM(editingPmStatus === 'Draft' ? 'Draft' : 'Active')
    } else {
      persistPM('Draft')
      setHasSavedDraft(true)
    }
    setIsDirty(false)
    setShowLeaveModal(false)
    router.push(pendingNavHref)
  }

  function handleLeaveModalDiscard() {
    setShowLeaveModal(false)
    router.push(pendingNavHref)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
        <div className="w-16 h-16 rounded-full bg-[var(--color-success-subtle)] flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-success)]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-[var(--color-neutral-12)]">PM Created!</h2>
          <p className="text-[14px] text-[var(--color-neutral-9)] mt-1">
            <strong className="text-[var(--color-neutral-11)]">{title}</strong> has been added to Preventive Maintenance.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>Create Another</Button>
          <Link href="/predictive-maintenance">
            <Button variant="primary" size="sm">View Preventive Maintenance</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <style>{`
        @keyframes trigger-card-slide-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .trigger-card-new {
          animation: trigger-card-slide-in 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        @keyframes skeleton-shimmer-kf {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .skeleton-shimmer {
          animation: skeleton-shimmer-kf 1.4s ease-in-out infinite;
        }
        @keyframes assign-content-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .assign-content-fadein {
          animation: assign-content-in 500ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        @keyframes assign-cta-glow-kf {
          0%, 100% { box-shadow: 0 0 0 0px rgba(0, 106, 220, 0); }
          50% { box-shadow: 0 0 0 3px rgba(0, 106, 220, 0.35); }
        }
        .assign-cta-glow {
          animation: assign-cta-glow-kf 2s ease-in-out infinite;
        }
        @keyframes assignment-row-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .assignment-row-new {
          animation: assignment-row-in 350ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>
      {/* Header */}
      <div className="h-[60px] flex items-center gap-3 px-4 bg-[var(--surface-primary)] border-b border-[var(--border-subtle)] shrink-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
          className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] transition-colors text-[var(--color-neutral-8)] cursor-pointer shrink-0"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={20} />
        </button>
        <div className="w-px h-5 bg-[var(--border-subtle)] shrink-0" />
        <button
          type="button"
          onClick={() => handleNavigateAway('/predictive-maintenance')}
          className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] transition-colors text-[var(--color-neutral-8)] cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[15px] font-semibold text-[var(--color-neutral-12)] flex-1">
          {isEditing ? 'Edit Preventive Maintenance' : 'Create a New Preventive Maintenance'}
        </h1>
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[13px] text-[var(--color-neutral-9)]">Create First Work Order Now</span>
          <Switch checked={createWONow} onCheckedChange={setCreateWONow} size="md" aria-label="Create first Work Order Now" />
        </div>
        <div className="w-px h-5 bg-[var(--border-subtle)]" />
        <button
          type="button"
          onClick={() => handleNavigateAway('/predictive-maintenance')}
          className="text-[14px] font-medium text-[var(--color-neutral-9)] hover:text-[var(--color-neutral-12)] transition-colors cursor-pointer px-1"
        >
          Cancel
        </button>
        {/* Edit active PM: just "Save" as primary, no draft button */}
        {isEditing && editingPmStatus === 'Active' ? (
          <div className="relative group/create">
            <Button variant="primary" size="md" onClick={handleSaveEdit} disabled={createDisabled}>
              Save
            </Button>
          </div>
        ) : (
          <>
            {/* Draft save button: hidden when editing an active PM */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center justify-center h-8 px-3 rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] text-[14px] font-medium text-[var(--color-accent-11)] hover:bg-[var(--color-accent-2)] transition-colors cursor-pointer select-none"
            >
              Save Draft
            </button>
            <div ref={createBtnRef} className="relative">
              <Button variant="primary" size="md" onClick={handleCreatePM} disabled={createDisabled}>
                Create PM
              </Button>
              {createDisabled && (
                <div className="absolute inset-0 cursor-pointer" onClick={() => {
                  if (createBtnRef.current) {
                    const r = createBtnRef.current.getBoundingClientRect()
                    setCreateErrorPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
                  }
                  setShowCreateErrors(true)
                  setTimeout(() => setShowCreateErrors(false), 3000)
                }} />
              )}
            </div>
            {showCreateErrors && createErrorPos && missingFields.length > 0 && (
              <div style={{ position: 'fixed', top: createErrorPos.top, right: createErrorPos.right }} className="flex flex-col gap-1 bg-[var(--color-neutral-12)] text-white rounded-[var(--radius-lg)] px-3 py-2.5 shadow-lg pointer-events-none z-[9999] min-w-[220px]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-0.5">Required to create</span>
                {missingFields.map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-[12px]">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-error-8,#FF6369)] shrink-0" />
                    {f}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden bg-[var(--surface-primary)]">
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto w-full">

          {/* Page intro */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <p className="text-[13px] text-[var(--color-neutral-9)] max-w-[520px]">
              Automatically generate work orders based on a schedule or meter reading. Add the details, assign technicians, and help prevent equipment failures.
            </p>
            <button type="button" onClick={() => setNovaOpen(true)} className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-lg)] border border-[var(--color-accent-6)] bg-[var(--color-accent-1)] hover:bg-[var(--color-accent-2)] text-[13px] font-medium text-[var(--color-accent-11)] transition-colors cursor-pointer shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16.043 10.834C11.8309 11.1986 9.53257 13.4969 9.16797 17.709C8.78799 13.4314 6.50165 11.3107 2.29297 10.834C6.56817 10.3409 8.67487 8.23419 9.16797 3.95898C9.64468 8.16766 11.7654 10.454 16.043 10.834Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.4902 1.04968C16.4763 0.926913 16.3725 0.834111 16.2489 0.833985C16.1254 0.833858 16.0214 0.926449 16.0072 1.04919C15.9152 1.84733 15.6766 2.40856 15.2916 2.79354C14.9066 3.17851 14.3454 3.41714 13.5472 3.5092C13.4245 3.52335 13.3319 3.62734 13.332 3.7509C13.3322 3.87446 13.425 3.97826 13.5477 3.99216C14.3327 4.08107 14.9058 4.31961 15.3 4.70659C15.6926 5.09212 15.9362 5.65323 16.0066 6.44577C16.0177 6.57128 16.123 6.66746 16.249 6.66732C16.375 6.66718 16.48 6.57076 16.4908 6.44522C16.5583 5.66572 16.8017 5.09281 17.1963 4.69824C17.5909 4.30366 18.1638 4.06028 18.9433 3.9928C19.0688 3.98193 19.1652 3.87693 19.1654 3.75092C19.1655 3.62492 19.0693 3.5197 18.9438 3.50855C18.1513 3.43815 17.5902 3.19454 17.2046 2.80191C16.8177 2.4078 16.5791 1.83464 16.4902 1.04968Z" fill="currentColor"/></svg>
              Create with Nova
            </button>
          </div>

          {/* DETAILS */}
          <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 h-[57px] bg-[#F9F9FB] border-b border-[var(--border-subtle)]">
                  <FileText size={18} className="text-[var(--color-neutral-7)]" />
                  <span className="text-[16px] font-semibold text-[var(--color-neutral-12)]">Details</span>
                </div>
                {/* Card content */}
                <div className="px-4 py-3 flex flex-col gap-5">
                  {/* Two-column layout: Left (Title+Description) | Right (Category+Priority+Duration+Signature) */}
                  <div className="grid grid-cols-2 gap-5">
                    {/* Left column */}
                    <div className="flex flex-col gap-5">
                      <div ref={titleContainerRef}>
                        <TextInput
                          label="Title"
                          required
                          autoFocus
                          placeholder="e.g. Monthly HVAC filter replacement"
                          value={title}
                          error={titleError}
                          errorMessage={titleError ? 'Title is required' : undefined}
                          onChange={e => { setTitle((e.target as HTMLInputElement).value); if (titleError) setTitleError(false) }}
                        />
                      </div>
                      <Textarea
                        label="Description"
                        placeholder="Describe this maintenance task…"
                        value={description}
                        onChange={e => setDescription((e.target as HTMLTextAreaElement).value)}
                        className="h-[128px] resize-none"
                      />
                    </div>
                    {/* Right column */}
                    <div className="flex flex-col gap-5">
                      <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
                      <Select
                        label="Priority"
                        value={priority}
                        onChange={setPriority}
                        options={PRIORITY_OPTIONS.map(p => ({
                          value: p.value,
                          label: p.label,
                          icon: <Flag size={13} fill={p.color} stroke={p.color} />,
                        }))}
                      />
                      <TextInput
                        label="Duration (hs)"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={duration}
                        onChange={e => setDuration((e.target as HTMLInputElement).value)}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  {/* Signature Required — full-width row */}
                  <div
                    onClick={() => setSignature(v => !v)}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border cursor-pointer transition-colors border-[#E0E1E6] bg-[#F9F9FB] hover:bg-[var(--color-neutral-3)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--color-neutral-12)]">Signature Required</p>
                      <p className="text-[12px] text-[#60646C] mt-0.5 leading-4">Technicians must sign to complete this work order.</p>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <Switch checked={signature} onCheckedChange={setSignature} size="md" aria-label="Signature required" />
                    </div>
                  </div>
                </div>

                  {/* Images, Files & Parts */}
              <button
                onClick={() => setFilesPartsOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 h-[52px] border-y border-[#F0F0F3] bg-[#F9F9FB] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-[var(--color-neutral-7)]">
                  <path d="M9.1875 15.9375H4.3125C3.89829 15.9375 3.5625 15.6017 3.5625 15.1875V2.8125C3.5625 2.39829 3.89829 2.0625 4.3125 2.0625H13.6875C14.1017 2.0625 14.4375 2.39829 14.4375 2.8125V9.1875M13.6875 11.4375V13.6875M13.6875 13.6875V15.9375M13.6875 13.6875H11.4375M13.6875 13.6875H15.9375M6.5625 5.0625H11.4375M6.5625 8.0625H8.4375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="flex-1 text-left text-[14px] font-semibold text-[var(--color-neutral-12)]">Images, Files &amp; Parts</span>
                {filesPartsOpen ? <ChevronUp size={16} className="text-[var(--color-neutral-9)]" /> : <ChevronDown size={16} className="text-[var(--color-neutral-9)]" />}
              </button>
              {filesPartsOpen && (
                <div className="p-5 flex flex-col gap-5">
                  {/* Images */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[var(--color-neutral-11)]">Images</span>
                      <div className="flex items-center gap-1.5">
                        {images.length > 0 && (
                          <span className="text-[12px] text-[var(--color-neutral-8)]">{images.length} Images Added</span>
                        )}
                        <button onClick={() => imageScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
                          <ChevronLeft size={14} />
                        </button>
                        <button onClick={() => imageScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div ref={imageScrollRef} className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <button onClick={() => imageInputRef.current?.click()} className="shrink-0 w-[80px] h-[80px] rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-accent-4)] bg-[var(--color-accent-1)] flex items-center justify-center text-[var(--color-accent-7)] hover:border-[var(--color-accent-6)] transition-colors cursor-pointer">
                          <Plus size={20} />
                        </button>
                        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                        {images.map((src, i) => (
                          <ImageThumb key={i} src={src} onRemove={() => setImages(imgs => imgs.filter((_, j) => j !== i))} />
                        ))}
                      </div>
                      <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[var(--surface-primary)] to-transparent" />
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border-subtle)]" />

                  {/* Files */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[var(--color-neutral-11)]">Files</span>
                      <button className="text-[13px] text-[var(--color-accent-9)] font-medium hover:text-[var(--color-accent-11)] cursor-pointer">Add from Saved Files</button>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full h-[72px] rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border-default)] flex items-center justify-center gap-3 text-[var(--color-neutral-8)] hover:border-[var(--color-accent-7)] hover:text-[var(--color-accent-9)] transition-colors cursor-pointer">
                      <Upload size={16} />
                      <span className="text-[13px] font-medium">Upload</span>
                      <span className="text-[13px] text-[var(--color-neutral-7)]">or drop a file</span>
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden" />
                  </div>

                  <div className="h-px bg-[var(--border-subtle)]" />

                  {/* Parts */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[var(--color-neutral-11)]">Parts</span>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] border border-[var(--color-accent-10)] text-white text-[13px] font-medium hover:bg-[var(--color-accent-10)] transition-colors cursor-pointer">
                          Add <ChevronDown size={13} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" minWidth="160px">
                        <DropdownMenuItem><Plus size={13} className="mr-2" />Add Part</DropdownMenuItem>
                        <DropdownMenuItem><Plus size={13} className="mr-2" />From Inventory</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

                  {/* Tasks & Checklists */}
              <div
                onClick={() => setChecklistsOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 h-[52px] border-b border-[#F0F0F3] bg-[#F9F9FB] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer select-none"
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-[var(--color-neutral-7)]">
                  <path d="M6.75 4.5H3.75C3.33579 4.5 3 4.83579 3 5.25V14.25C3 14.6642 3.33579 15 3.75 15H14.25C14.6642 15 15 14.6642 15 14.25V5.25C15 4.83579 14.6642 4.5 14.25 4.5H11.25M6.75 4.5V3.75C6.75 3.33579 7.08579 3 7.5 3H10.5C10.9142 3 11.25 3.33579 11.25 3.75V4.5M6.75 4.5H11.25M6.75 9H11.25M6.75 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="flex-1 text-left text-[14px] font-semibold text-[var(--color-neutral-12)]">Tasks &amp; Checklists</span>
                {(() => {
                  const totalTasks = checklists.reduce((n, c) => n + c.tasks.length, 0)
                  const showEmpty = checklistsOpen && checklists.length === 0
                  return !showEmpty ? (
                    <>
                      {totalTasks > 0 && (
                        <span className="inline-flex items-center h-5 px-2 rounded-full bg-[var(--color-neutral-3)] text-[11px] font-medium text-[var(--color-neutral-9)] shrink-0">
                          {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                        </span>
                      )}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 h-6 px-2.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[12px] font-medium text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-3)] transition-colors shrink-0 cursor-pointer"
                          >
                            Add
                            <ChevronDown size={11} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => {
                            setChecklistsOpen(true)
                            setChecklists(cs => cs.length
                              ? cs.map((c, i) => i === 0 ? { ...c, tasks: [...c.tasks, { id: crypto.randomUUID(), title: 'New Task', type: 'pass-fail' as const, value: '' }] } : c)
                              : [{ id: crypto.randomUUID(), title: 'New Checklist', open: true, tasks: [{ id: crypto.randomUUID(), title: 'New Task', type: 'pass-fail' as const, value: '' }] }]
                            )
                          }}>Task</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            setChecklistsOpen(true)
                            setChecklists(cs => [...cs, { id: crypto.randomUUID(), title: 'New Checklist', open: true, tasks: [] }])
                          }}>Checklist</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : null
                })()}
                {checklistsOpen ? <ChevronUp size={16} className="text-[var(--color-neutral-9)]" /> : <ChevronDown size={16} className="text-[var(--color-neutral-9)]" />}
              </div>
              {checklistsOpen && (
                <div className="p-4 flex flex-col gap-4 max-w-[700px] mx-auto w-full">
                  {checklists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-3 gap-1.5 text-center">
                      <p className="text-[14px] font-semibold text-[var(--color-neutral-11)]">Add tasks &amp; checklists</p>
                      <p className="text-[13px] text-[var(--color-neutral-8)]">Define the tasks technicians need to complete for this preventive maintenance.</p>
                      <div>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] text-white text-[13px] font-medium hover:bg-[var(--color-accent-10)] transition-colors cursor-pointer">
                              Add
                              <ChevronDown size={13} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" minWidth="180px">
                            <DropdownMenuItem onSelect={() => setChecklists(cs => [...cs, { id: crypto.randomUUID(), title: 'New Checklist', open: true, tasks: [] }])}>
                              <Plus size={13} className="mr-2" />
                              New Checklist
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setChecklists(cs => cs.length ? cs.map((c, i) => i === 0 ? { ...c, tasks: [...c.tasks, { id: crypto.randomUUID(), title: 'New Task', type: 'pass-fail' as const, value: '' }] } : c) : [{ id: crypto.randomUUID(), title: 'New Checklist', open: true, tasks: [{ id: crypto.randomUUID(), title: 'New Task', type: 'pass-fail' as const, value: '' }] }])}>
                              <Plus size={13} className="mr-2" />
                              Add Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ) : (
                    <>
                      {checklists.map(group => (
                        <div key={group.id} className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-[var(--color-neutral-12)]">{group.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center h-6 px-2 rounded-full bg-[var(--color-neutral-3)] text-[12px] font-medium text-[var(--color-neutral-9)]">
                                {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                              </span>
                              <button onClick={() => setChecklists(cs => cs.map(c => c.id === group.id ? { ...c, open: !c.open } : c))} className="w-6 h-6 flex items-center justify-center text-[var(--color-neutral-7)] hover:text-[var(--color-neutral-11)] cursor-pointer">
                                {group.open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>
                            </div>
                          </div>
                          {group.open && (
                            <div className="flex flex-col gap-2">
                              {group.tasks.map(task => (
                                <div key={task.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 flex flex-col gap-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[14px] font-semibold text-[var(--color-neutral-12)] flex-1">{task.title}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {[User, Box, RotateCcw, ...(task.type === 'pass-fail' ? [RefreshCw] : [])].map((Icon, i) => (
                                        <button key={i} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] cursor-pointer">
                                          <Icon size={14} />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {task.type === 'pass-fail' ? (
                                    <div className="grid grid-cols-3 rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
                                      {(['Pass', 'Flag', 'Fail'] as const).map((opt, idx) => (
                                        <button key={opt} onClick={() => setChecklists(cs => cs.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === task.id ? { ...t, value: t.value === opt ? '' : opt } : t) })))}
                                          className={`py-2 text-[13px] font-medium text-center transition-colors cursor-pointer ${idx > 0 ? 'border-l border-[var(--border-default)]' : ''} ${task.value === opt ? opt === 'Pass' ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]' : opt === 'Flag' ? 'bg-[#FFF3E0] text-[#C85200]' : 'bg-[var(--color-error-subtle)] text-[var(--color-error)]' : 'bg-[var(--surface-secondary)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)]'}`}>
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <input type="text" placeholder="Response" value={task.value}
                                      onChange={e => setChecklists(cs => cs.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === task.id ? { ...t, value: e.target.value } : t) })))}
                                      className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] outline-none hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors" />
                                  )}
                                  <div className="flex items-center gap-4">
                                    {[{ icon: Camera, label: 'Photo' }, { icon: FileText, label: 'Note' }, { icon: Link2, label: 'URL' }].map(({ icon: Icon, label }) => (
                                      <button key={label} className="flex items-center gap-1.5 text-[12px] text-[var(--color-neutral-7)] hover:text-[var(--color-neutral-11)] cursor-pointer">
                                        <Icon size={13} />{label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              </div>

          </div>

          {/* TRIGGERS */}
          <div className="px-6 pb-6">
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between px-5 h-[54px] bg-[var(--color-neutral-2)] border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[var(--color-neutral-7)]" />
                  <span className="text-[15px] font-semibold text-[var(--color-neutral-12)]">Schedules</span>
                </div>
                <div className="flex items-center gap-2">
                  {triggers.length > 0 && (
                    <span className="text-[11px] font-medium text-[var(--color-neutral-8)] bg-[var(--color-neutral-3)] rounded-full px-2 py-0.5">
                      {triggers.length} {triggers.length === 1 ? 'schedule' : 'schedules'} · {triggers.reduce((sum, t) => sum + t.assignments.length, 0)} {triggers.reduce((sum, t) => sum + t.assignments.length, 0) === 1 ? 'assignment' : 'assignments'}
                    </span>
                  )}
                  {triggers.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={() => { setEditingTriggerId(null); setCalendarModalKey(k => k + 1); setShowCalendarModal(true) }}>
                      <Plus size={12} />
                      New Schedule
                    </Button>
                  )}
                </div>
              </div>

              {triggers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                  <p className="text-[14px] font-semibold text-[var(--color-neutral-11)]">No schedules yet</p>
                  <p className="text-[13px] text-[var(--color-neutral-8)]">Create a schedule to define when work orders should be generated.</p>
                  <Button variant="primary" size="md" onClick={() => { setCalendarModalKey(k => k + 1); setShowCalendarModal(true) }}>
                    <Plus size={13} className="mr-1" />
                    New Schedule
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-4">
                  {triggers.map(trigger => {
                    const hasMissingMeters = !!trigger.calendarTrigger.meterCondition && trigger.assignments.some(a => !a.meter)
                    const hasMissingTech = trigger.assignments.some(a => a.assignees.length === 0 && !a.team)
                    const hasNoAssignments = !trigger.expanded && trigger.assignments.length === 0
                    const hasError = hasMissingMeters || hasMissingTech || hasNoAssignments
                    const borderClass = hasError ? 'border-[var(--color-error,#CE2C31)]' : trigger.expanded ? 'border-[var(--color-accent-4)]' : 'border-[var(--border-default)]'
                    const shadowClass = hasError ? 'shadow-[0_0_1px_3px_rgba(206,44,49,0.2)]' : focusedTriggerIds.has(trigger.id) ? 'shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]' : ''
                    return (
                    <div key={trigger.id} id={`trigger-card-${trigger.id}`} className={`rounded-[8px] border overflow-hidden ${borderClass} ${shadowClass} ${newTriggerIds.has(trigger.id) ? 'trigger-card-new' : ''}`}>
                      {skeletonTriggerIds.has(trigger.id) ? (
                        <div className="flex flex-col bg-[var(--surface-primary)]">
                          <div className="flex items-center gap-3 px-4 py-4 bg-[var(--color-neutral-2)]">
                            <div className="w-[140px] h-3 rounded-full bg-[var(--color-neutral-4)] skeleton-shimmer" />
                            <div className="flex-1" />
                            <div className="w-[90px] h-5 rounded-full bg-[var(--color-neutral-4)] skeleton-shimmer" />
                            <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-neutral-4)] skeleton-shimmer" />
                            <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-neutral-4)] skeleton-shimmer" />
                          </div>
                          <div className="flex flex-col items-center justify-center p-8 gap-3">
                            <div className="w-[160px] h-3 rounded-full bg-[var(--color-neutral-3)] skeleton-shimmer" />
                            <div className="w-[260px] h-2.5 rounded-full bg-[var(--color-neutral-3)] skeleton-shimmer" />
                            <div className="w-[80px] h-7 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] skeleton-shimmer mt-1" />
                          </div>
                        </div>
                      ) : null}
                      {/* Trigger row */}
                      <div
                        className={`flex items-center gap-3 p-4 cursor-pointer select-none transition-colors ${skeletonTriggerIds.has(trigger.id) ? 'hidden' : ''} ${trigger.expanded ? 'bg-[var(--color-accent-1)]' : 'bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)]'}`}
                        onClick={() => {
                          const isExpanding = !trigger.expanded
                          setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, expanded: !t.expanded } : t))
                          if (isExpanding) {
                            setTimeout(() => {
                              const el = document.getElementById(`trigger-content-${trigger.id}`)
                              el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                            }, 320)
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const t = trigger.calendarTrigger
                            const parts: string[] = []
                            if (t.every && t.period) parts.push(`Every ${t.every} ${t.period}${Number(t.every) > 1 ? 's' : ''}`)
                            if (t.weekday) {
                              const fullDay = FULL_WEEKDAYS[['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(t.weekday)]
                              parts.push(`On ${fullDay ? fullDay + 's' : t.weekday + 's'}`)
                            }
                            if (t.atTime) parts.push(`At ${t.atTime}`)
                            const calText = parts.join(' · ')
                            const meterText = formatMeterText(t)
                            const fullText = calText && meterText
                              ? `${calText} or ${meterText}`
                              : calText || meterText || 'Scheduled trigger'
                            return <span className="text-[13px] font-semibold text-[var(--color-neutral-11)] truncate block">{fullText}</span>
                          })()}
                        </div>
                        {(() => {
                          const isMeter = !!trigger.calendarTrigger.meterCondition
                          const missingMeters = isMeter ? trigger.assignments.filter(a => !a.meter).length : 0
                          const missingTech = trigger.assignments.filter(a => a.assignees.length === 0 && !a.team).length
                          return (<>
                            {missingMeters > 0 && (
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setShowFillMissingModal({ triggerId: trigger.id, type: 'meter' }) }}
                                className="flex items-center gap-1 rounded-full bg-[var(--color-error-3,#FFEFEF)] text-[var(--color-error,#CE2C31)] text-[11px] px-2.5 py-0.5 font-medium shrink-0 hover:bg-[#FFDCDC] transition-colors cursor-pointer"
                              >
                                {missingMeters} missing meter{missingMeters > 1 ? 's' : ''}
                              </button>
                            )}
                            {missingTech > 0 && (
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setShowFillMissingModal({ triggerId: trigger.id, type: 'tech' }) }}
                                className="flex items-center gap-1 rounded-full bg-[var(--color-error-3,#FFEFEF)] text-[var(--color-error,#CE2C31)] text-[11px] px-2.5 py-0.5 font-medium shrink-0 hover:bg-[#FFDCDC] transition-colors cursor-pointer"
                              >
                                {missingTech} missing technician{missingTech > 1 ? 's' : ''}
                              </button>
                            )}
                          </>)
                        })()}
                        {trigger.assignments.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            {(() => {
                              const assets = trigger.assignments.filter(a => a.type === 'Asset').length
                              const locations = trigger.assignments.filter(a => a.type === 'Location').length
                              const meters = trigger.assignments.filter(a => a.type === 'Meter').length
                              const techs = new Set(trigger.assignments.flatMap(a => a.assignees)).size
                              const pills = [
                                assets > 0 && `${assets} Asset${assets !== 1 ? 's' : ''}`,
                                locations > 0 && `${locations} Location${locations !== 1 ? 's' : ''}`,
                                meters > 0 && `${meters} Meter${meters !== 1 ? 's' : ''}`,
                                techs > 0 && `${techs} Technician${techs !== 1 ? 's' : ''}`,
                              ].filter(Boolean) as string[]
                              return pills.map(label => (
                                <span key={label} className="rounded-full bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[11px] px-2 py-0.5 font-medium">
                                  {label}
                                </span>
                              ))
                            })()}
                          </div>
                        )}
                        {!trigger.expanded && trigger.assignments.length === 0 && (
                          <span className="text-[11px] text-[var(--color-error,#CE2C31)] font-medium shrink-0">At least one item is required.</span>
                        )}
                        {!trigger.expanded && (
                          <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); setShowAssignModal(trigger.id) }}>
                            <Plus size={12} />
                            Add
                          </Button>
                        )}
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button onClick={e => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer text-[var(--color-neutral-7)]">
                              <MoreHorizontal size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => { setEditingTriggerId(trigger.id); setCalendarModalKey(k => k + 1); setShowCalendarModal(true) }}>
                              <Pencil size={13} className="mr-2 text-[var(--color-neutral-8)]" />
                              Edit Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setTriggers(ts => {
                              const idx = ts.findIndex(t => t.id === trigger.id)
                              if (idx === -1) return ts
                              const dup = { ...trigger, id: crypto.randomUUID(), assignments: trigger.assignments.map(a => ({ ...a, id: crypto.randomUUID() })) }
                              return [...ts.slice(0, idx + 1), dup, ...ts.slice(idx + 1)]
                            })}>
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-2 text-[var(--color-neutral-8)]"><rect x="1" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 3V2.5A1.5 1.5 0 0 1 5.5 1h5A1.5 1.5 0 0 1 12 2.5v5A1.5 1.5 0 0 1 10.5 9H10" stroke="currentColor" strokeWidth="1.2"/></svg>
                              Duplicate Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setTriggers(ts => ts.filter(t => t.id !== trigger.id))}>
                              <Trash2 size={13} className="mr-2 text-[var(--color-error)]" />
                              <span className="text-[var(--color-error)]">Delete Schedule</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                          onClick={e => { e.stopPropagation(); setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, expanded: !t.expanded } : t)) }}
                          className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer text-[var(--color-neutral-7)]"
                        >
                          {trigger.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>

                      {/* Expanded assignments sub-card */}
                      <div id={`trigger-content-${trigger.id}`} className={`overflow-hidden transition-all duration-300 ease-in-out ${skeletonTriggerIds.has(trigger.id) ? 'hidden' : ''} ${trigger.expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 flex flex-col gap-4 bg-[var(--surface-primary)]">
                          <div className="overflow-hidden">
                            {trigger.assignments.length === 0 ? (
                              <div className="flex flex-col items-center justify-center p-4 gap-2 text-center assign-content-fadein">
                                <p className="text-[13px] font-semibold text-[var(--color-neutral-11)]">Assets, Locations & Meters</p>
                                <p className="text-[12px] text-[var(--color-neutral-8)]">Choose where this schedule applies</p>
                                <div className="assign-cta-glow rounded-[var(--radius-md)]">
                                  <Button variant="primary" size="sm" onClick={() => setShowAssignModal(trigger.id)}>
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Toolbar + Column headers */}
                                {(() => {
                                  const isMeterTrigger = !!trigger.calendarTrigger.meterCondition
                                  const q = (assignmentSearch[trigger.id] ?? '').toLowerCase()
                                  const sort = assignmentSort[trigger.id]
                                  const af = assignmentFilters[trigger.id] ?? { technicians: [], meters: [], teams: [] }
                                  const hasFilters = q || af.technicians?.length || af.meters?.length || af.teams?.length
                                  const filtered = trigger.assignments
                                    .filter(a => {
                                      if (q && !a.name.toLowerCase().includes(q) && !(a.subtext || '').toLowerCase().includes(q)) return false
                                      if (af.technicians?.length && !af.technicians.some(t => a.assignees.includes(t))) return false
                                      if (af.meters?.length && !af.meters.includes(a.meter || '')) return false
                                      if (af.teams?.length && !af.teams.includes(a.team || '')) return false
                                      return true
                                    })
                                    .sort((a, b) => {
                                      if (!sort) return 0
                                      const dir = sort.dir === 'asc' ? 1 : -1
                                      if (sort.col === 'name') return dir * a.name.localeCompare(b.name)
                                      if (sort.col === 'meter') return dir * (a.meter || '').localeCompare(b.meter || '')
                                      if (sort.col === 'user') return dir * ((a.assignees[0] || '').localeCompare(b.assignees[0] || ''))
                                      if (sort.col === 'team') return dir * ((a.team || '').localeCompare(b.team || ''))
                                      if (sort.col === 'start') return dir * ((a.startDate || '').localeCompare(b.startDate || ''))
                                      return 0
                                    })
                                  const sel = assignmentSelected[trigger.id] ?? new Set<string>()
                                  const allChecked = filtered.length > 0 && filtered.every(a => sel.has(a.id))
                                  const toggleAll = () => setAssignmentSelected(s => {
                                    const next = new Set(s[trigger.id] ?? new Set<string>())
                                    if (allChecked) filtered.forEach(a => next.delete(a.id))
                                    else filtered.forEach(a => next.add(a.id))
                                    return { ...s, [trigger.id]: next }
                                  })
                                  const toggleOne = (id: string) => setAssignmentSelected(s => {
                                    const next = new Set(s[trigger.id] ?? new Set<string>())
                                    if (next.has(id)) next.delete(id); else next.add(id)
                                    return { ...s, [trigger.id]: next }
                                  })
                                  const someChecked = !allChecked && filtered.some(a => sel.has(a.id))
                                  return (<>
                                    {/* Title / search / filters / assign row — always visible */}
                                    <div className="flex flex-wrap items-center gap-4 px-3 py-2 w-full min-h-[40px]">
                                      <span className="text-[14px] font-semibold text-[var(--color-neutral-11)] shrink-0">
                                        Assets, Locations & Meters ({trigger.assignments.length})
                                      </span>
                                      <div className="flex-1" />
                                      <div className="flex items-center gap-1.5 max-w-[180px] h-6 px-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)]">
                                        <Search size={11} className="text-[var(--color-neutral-6)] shrink-0" />
                                        <input
                                          type="text"
                                          value={assignmentSearch[trigger.id] ?? ''}
                                          onChange={e => setAssignmentSearch(s => ({ ...s, [trigger.id]: e.target.value }))}
                                          placeholder="Search"
                                          className="flex-1 min-w-0 bg-transparent outline-none text-[12px] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-6)]"
                                        />
                                      </div>
                                      <div className="w-px self-stretch bg-[var(--border-default)] shrink-0" />
                                      <div className="flex items-center gap-1.5">
                                      {/* Filter: Technician */}
                                      {(() => {
                                        const techs = Array.from(new Set(trigger.assignments.flatMap(a => a.assignees))).sort()
                                        if (techs.length === 0) return null
                                        const sel = af.technicians ?? []
                                        const toggle = (name: string) => setAssignmentFilters(f => {
                                          const cur = f[trigger.id]?.technicians ?? []
                                          return { ...f, [trigger.id]: { technicians: cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name], meters: f[trigger.id]?.meters ?? [], teams: f[trigger.id]?.teams ?? [] } }
                                        })
                                        return (
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className={`shrink-0 flex items-center gap-1 px-2 h-6 rounded-[var(--radius-md)] border text-[11px] font-medium transition-colors cursor-pointer border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-3)]`}>
                                                Technicians: {sel.length ? <span className="ml-1 flex items-center justify-center px-2 h-4 rounded-full bg-[var(--color-accent-9)] text-white text-[9px] font-bold">{sel.length}</span> : 'All'}
                                                <ChevronDown size={10} />
                                              </button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none py-1" onOpenAutoFocus={e => e.preventDefault()}>
                                                <button type="button" onClick={() => setAssignmentFilters(f => ({ ...f, [trigger.id]: { ...f[trigger.id], technicians: [] } }))} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${sel.length === 0 ? 'font-semibold text-[var(--color-neutral-12)]' : 'text-[var(--color-neutral-11)]'}`}>
                                                  All
                                                </button>
                                                <div className="my-1 mx-3 border-t border-[var(--border-subtle)]" />
                                                {techs.map(name => (
                                                  <button key={name} type="button" onClick={() => toggle(name)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]">
                                                    <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-[3px] border transition-colors ${sel.includes(name) ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                                                      {sel.includes(name) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    </span>
                                                    {name}
                                                  </button>
                                                ))}
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                        )
                                      })()}
                                      {/* Filter: Meter — hidden */}
                                      {false && (() => {
                                        const meters = Array.from(new Set(trigger.assignments.map(a => a.meter).filter(Boolean))) as string[]
                                        if (meters.length === 0) return null
                                        const sel = af.meters ?? []
                                        const toggle = (m: string) => setAssignmentFilters(f => {
                                          const cur = f[trigger.id]?.meters ?? []
                                          return { ...f, [trigger.id]: { technicians: f[trigger.id]?.technicians ?? [], meters: cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m], teams: f[trigger.id]?.teams ?? [] } }
                                        })
                                        return (
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className={`shrink-0 flex items-center gap-1 px-2 h-6 rounded-[var(--radius-md)] border text-[11px] font-medium transition-colors cursor-pointer border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-3)]`}>
                                                Meter{sel.length ? <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-accent-9)] text-white text-[9px] font-bold">{sel.length}</span> : null}
                                                <ChevronDown size={10} />
                                              </button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none py-1" onOpenAutoFocus={e => e.preventDefault()}>
                                                <button type="button" onClick={() => setAssignmentFilters(f => ({ ...f, [trigger.id]: { ...f[trigger.id], meters: [] } }))} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${sel.length === 0 ? 'font-semibold text-[var(--color-neutral-12)]' : 'text-[var(--color-neutral-11)]'}`}>
                                                  All
                                                </button>
                                                <div className="my-1 mx-3 border-t border-[var(--border-subtle)]" />
                                                {meters.map(m => (
                                                  <button key={m} type="button" onClick={() => toggle(m)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]">
                                                    <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-[3px] border transition-colors ${sel.includes(m) ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                                                      {sel.includes(m) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    </span>
                                                    {m}
                                                  </button>
                                                ))}
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                        )
                                      })()}
                                      {/* Filter: Team */}
                                      {(() => {
                                        const teams = Array.from(new Set(trigger.assignments.map(a => a.team).filter(Boolean))) as string[]
                                        if (teams.length === 0) return null
                                        const sel = af.teams ?? []
                                        const toggle = (t: string) => setAssignmentFilters(f => {
                                          const cur = f[trigger.id]?.teams ?? []
                                          return { ...f, [trigger.id]: { technicians: f[trigger.id]?.technicians ?? [], meters: f[trigger.id]?.meters ?? [], teams: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] } }
                                        })
                                        return (
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className={`shrink-0 flex items-center gap-1 px-2 h-6 rounded-[var(--radius-md)] border text-[11px] font-medium transition-colors cursor-pointer border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-3)]`}>
                                                Teams: {sel.length ? <span className="ml-1 flex items-center justify-center px-2 h-4 rounded-full bg-[var(--color-accent-9)] text-white text-[9px] font-bold">{sel.length}</span> : 'All'}
                                                <ChevronDown size={10} />
                                              </button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none py-1" onOpenAutoFocus={e => e.preventDefault()}>
                                                <button type="button" onClick={() => setAssignmentFilters(f => ({ ...f, [trigger.id]: { ...f[trigger.id], teams: [] } }))} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${sel.length === 0 ? 'font-semibold text-[var(--color-neutral-12)]' : 'text-[var(--color-neutral-11)]'}`}>
                                                  All
                                                </button>
                                                <div className="my-1 mx-3 border-t border-[var(--border-subtle)]" />
                                                {teams.map(t => (
                                                  <button key={t} type="button" onClick={() => toggle(t)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]">
                                                    <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-[3px] border transition-colors ${sel.includes(t) ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                                                      {sel.includes(t) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    </span>
                                                    <span style={{ background: TEAM_COLORS[t] }} className="w-3 h-3 rounded-full shrink-0" />
                                                    {t}
                                                  </button>
                                                ))}
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                        )
                                      })()}
                                      {/* Reset all filters */}
                                      <button type="button" disabled={!hasFilters} onClick={() => { setAssignmentSearch(s => ({ ...s, [trigger.id]: '' })); setAssignmentFilters(f => ({ ...f, [trigger.id]: { technicians: [], meters: [], teams: [] } })) }} className={`shrink-0 text-[11px] font-[500] transition-colors ${hasFilters ? 'text-[var(--color-accent-9)] hover:text-[var(--color-accent-11)] cursor-pointer' : 'text-[var(--color-neutral-5)] cursor-not-allowed'}`}>
                                        Reset
                                      </button>
                                      </div>
                                      <div className="w-px self-stretch bg-[var(--border-default)] shrink-0" />
                                      <button type="button" onClick={() => setShowAssignModal(trigger.id)} className="shrink-0 flex items-center gap-1 px-2 h-7 rounded-[var(--radius-md)] bg-[#EDF2FE] hover:bg-[#dce8fd] transition-colors cursor-pointer text-[12px] font-medium text-[var(--color-accent-11)]">
                                        <Plus size={12} /> Add
                                      </button>
                                    </div>
                                    {/* Bulk bar — fixed bottom bar when rows are selected */}
                                    {sel.size > 0 && (
                                      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-5 h-[60px] px-4 rounded-[4px] bg-[var(--color-neutral-12)] shadow-[var(--shadow-lg)] text-white max-w-[calc(100vw-2rem)] overflow-x-auto">
                                          <span className="text-[12px] font-semibold text-white/80 shrink-0">{sel.size} selected</span>
                                          <div className="w-px h-4 bg-white/20 shrink-0" />
                                          {/* Bulk: Add Meter */}
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className="flex items-center gap-1 text-[13px] font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity shrink-0">Update Meter</button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={8} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
                                                <MeterPopoverContent current="" onSelect={meter => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(a => sel.has(a.id) ? { ...a, meter } : a) } : t))} />
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          {/* Bulk: Technicians */}
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className="flex items-center gap-1 text-[13px] font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity shrink-0">Technicians</button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={8} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
                                                <BulkTechniciansContent
                                                  selectedAssignments={trigger.assignments.filter(a => sel.has(a.id))}
                                                  onToggle={name => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(a => sel.has(a.id) ? { ...a, assignees: a.assignees.includes(name) ? a.assignees.filter(n => n !== name) : [...a.assignees, name] } : a) } : t))}
                                                />
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          {/* Bulk: Team */}
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className="flex items-center gap-1 text-[13px] font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity shrink-0">Team</button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={8} align="start" className="z-[var(--z-dropdown)] w-[160px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden py-1" onOpenAutoFocus={e => e.preventDefault()}>
                                                {['', ...TEAMS.map(t => t.value)].map(team => (
                                                  <Popover.Close key={team || 'none'} asChild>
                                                    <button type="button" onClick={() => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(a => sel.has(a.id) ? { ...a, team } : a) } : t))} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]">
                                                      {team && <span style={{ background: TEAM_COLORS[team] }} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0">{team[0]}</span>}
                                                      {team || 'None'}
                                                    </button>
                                                  </Popover.Close>
                                                ))}
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          {/* Bulk: Start / End */}
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button type="button" className="flex items-center gap-1 text-[13px] font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity shrink-0">Start / End</button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={8} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none p-3 flex flex-col gap-3" onOpenAutoFocus={e => e.preventDefault()}>
                                                <DateInputMDY defaultToday label="Start" value={''} onChange={v => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(a => sel.has(a.id) ? { ...a, startDate: v } : a) } : t))} />
                                                <DateInputMDY label="End" value={''} onChange={v => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(a => sel.has(a.id) ? { ...a, endDate: v } : a) } : t))} />
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          <button type="button" onClick={() => setBulkDeleteConfirm(trigger.id)} className="flex items-center gap-1 text-[13px] font-semibold text-red-400 hover:text-red-300 cursor-pointer transition-colors shrink-0">
                                            Delete
                                          </button>
                                          <div className="w-px h-4 bg-white/20 shrink-0 mx-1" />
                                          <button type="button" onClick={() => setAssignmentSelected(s => ({ ...s, [trigger.id]: new Set() }))} className="flex items-center gap-1 text-[13px] font-semibold text-white/60 hover:text-white cursor-pointer transition-colors shrink-0">Unselect</button>
                                        </div>
                                    )}
                                    {/* Column headers — always visible */}
                                    <div className="flex items-center gap-5 px-3 h-[56px] bg-[#F9F9FB] mt-4">
                                      <button type="button" onClick={toggleAll} className={`flex-shrink-0 w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center transition-colors ${allChecked || someChecked ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                                        {allChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        {someChecked && <svg width="8" height="2" viewBox="0 0 8 2" fill="none"><rect x="0" y="0.5" width="8" height="1" rx="0.5" fill="white"/></svg>}
                                      </button>
                                      {(() => {
                                        const SortHeader = ({ col, label, className }: { col: string; label: string; className: string }) => {
                                          const active = sort?.col === col
                                          const toggle = () => setAssignmentSort(s => ({ ...s, [trigger.id]: { col, dir: active && s[trigger.id]?.dir === 'asc' ? 'desc' : 'asc' } }))
                                          return (
                                            <button type="button" onClick={toggle} className={`${className} flex items-center gap-0.5 text-[11px] font-medium uppercase tracking-wide cursor-pointer hover:text-[var(--color-neutral-11)] transition-colors ${active ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-8)]'}`}>
                                              {label}
                                              {active ? (sort?.dir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ChevronsUpDown size={10} className="opacity-40" />}
                                            </button>
                                          )
                                        }
                                        return (<>
                                          <SortHeader col="name" label="Applies To" className="flex-1 min-w-0" />
                                          {false && <SortHeader col="meter" label="Meter" className="w-[120px] shrink-0" />}
                                          <SortHeader col="user" label="Technicians" className="w-[96px] shrink-0" />
                                          <SortHeader col="team" label="Team" className="w-[80px] shrink-0" />
                                          <SortHeader col="start" label="Start / End" className="w-[140px] shrink-0" />
                                        </>)
                                      })()}
                                      <span className="w-7 shrink-0" />
                                    </div>
                                    {/* Scrollable assignment list */}
                                    <div className="overflow-y-auto max-h-[380px]">
                                      {filtered.length === 0 && hasFilters && (
                                        <div className="flex flex-col items-center justify-center py-10 gap-1 text-center">
                                          <p className="text-[13px] font-semibold text-[var(--color-neutral-11)]">No results found</p>
                                          <p className="text-[12px] text-[var(--color-neutral-7)]">Try resetting your filters or adjusting your search.</p>
                                        </div>
                                      )}
                                      {filtered.map(a => skeletonAssignmentIds.has(a.id) ? (
                                        <div key={a.id} id={`assignment-row-${a.id}`} className="flex items-center gap-5 px-3 py-4 border-b border-[#F0F0F3] last:border-0 bg-white skeleton-shimmer">
                                          <div className="flex-shrink-0 w-4 h-4 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)]" />
                                          <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="h-3 w-32 rounded-full bg-[var(--color-neutral-3)]" />
                                            <div className="h-2.5 w-20 rounded-full bg-[var(--color-neutral-3)]" />
                                          </div>
                                          <div className="w-[120px] h-3 rounded-full bg-[var(--color-neutral-3)]" />
                                          <div className="w-[96px] h-3 rounded-full bg-[var(--color-neutral-3)]" />
                                          <div className="w-[80px] h-3 rounded-full bg-[var(--color-neutral-3)]" />
                                          <div className="w-[140px] h-3 rounded-full bg-[var(--color-neutral-3)]" />
                                        </div>
                                      ) : (
                                        <div key={a.id} id={`assignment-row-${a.id}`} className={`flex items-center gap-5 px-3 py-4 border-b border-[#F0F0F3] last:border-0 text-[13px] ${newAssignmentIds.has(a.id) ? 'assignment-row-new' : ''} ${isMeterTrigger && !a.meter ? 'bg-[#FFF8F8]' : sel.has(a.id) ? 'bg-[#F8FAFF]' : 'bg-white'}`}>
                                          <button type="button" onClick={() => toggleOne(a.id)} className={`flex-shrink-0 w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center transition-colors ${sel.has(a.id) ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                                            {sel.has(a.id) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                          </button>
                                          {/* Name + type badge + subtext */}
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {a.type === 'Meter' ? (
                                              /* Meter row: name · Meter badge, then Asset: —, Location: subtext */
                                              <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span className="font-medium text-[var(--color-neutral-12)] truncate">{a.name}</span>
                                                  <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] text-[10px] font-medium bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)]">Meter</span>
                                                </div>
                                                <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Asset:</span> —</span>
                                                <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Location:</span> {a.subtext || '—'}</span>
                                              </div>
                                            ) : a.type === 'Location' ? (
                                              /* Location row: name · Location badge, then Asset: —, Meter: ... */
                                              <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span className="font-medium text-[var(--color-neutral-12)] truncate">{a.name}</span>
                                                  <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] text-[10px] font-medium bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)]">Location</span>
                                                </div>
                                                <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Asset:</span> —</span>
                                                <Popover.Root>
                                                  <Popover.Trigger asChild>
                                                    <button title={a.meter || undefined} className={`text-left text-[11px] outline-none cursor-pointer ${isMeterTrigger && !a.meter ? 'text-[var(--color-error,#CE2C31)] font-medium' : 'text-[var(--color-neutral-11)] hover:underline'}`}>
                                                      <span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Meter:</span>{' '}
                                                      {isMeterTrigger && !a.meter ? <span className="underline">Add</span> : (a.meter || '—')}
                                                    </button>
                                                  </Popover.Trigger>
                                                  <Popover.Portal>
                                                    <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
                                                      <MeterPopoverContent current={a.meter || ''} onSelect={m => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, meter: m } : x) } : t))} />
                                                    </Popover.Content>
                                                  </Popover.Portal>
                                                </Popover.Root>
                                              </div>
                                            ) : a.type === 'Asset' ? (
                                              /* Asset row: name · Asset badge, then Location: subtext, Meter: ... */
                                              <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <span className="font-medium text-[var(--color-neutral-12)] truncate">{a.name}</span>
                                                  <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] text-[10px] font-medium bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)]">Asset</span>
                                                </div>
                                                <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Location:</span> {a.subtext || '—'}</span>
                                                <Popover.Root>
                                                  <Popover.Trigger asChild>
                                                    <button title={a.meter || undefined} className={`text-left text-[11px] outline-none cursor-pointer ${isMeterTrigger && !a.meter ? 'text-[var(--color-error,#CE2C31)] font-medium' : 'text-[var(--color-neutral-11)] hover:underline'}`}>
                                                      <span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Meter:</span>{' '}
                                                      {isMeterTrigger && !a.meter ? <span className="underline">Add</span> : (a.meter || '—')}
                                                    </button>
                                                  </Popover.Trigger>
                                                  <Popover.Portal>
                                                    <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
                                                      <MeterPopoverContent current={a.meter || ''} onSelect={m => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, meter: m } : x) } : t))} />
                                                    </Popover.Content>
                                                  </Popover.Portal>
                                                </Popover.Root>
                                              </div>
                                            ) : (
                                              /* Person-only row: show empty applies-to block */
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Asset:</span> —</span>
                                                <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Location:</span> —</span>
                                                <Popover.Root>
                                                  <Popover.Trigger asChild>
                                                    <button title={a.meter || undefined} className={`text-left text-[11px] outline-none cursor-pointer ${isMeterTrigger && !a.meter ? 'text-[var(--color-error,#CE2C31)] font-medium' : 'text-[var(--color-neutral-11)] hover:underline'}`}>
                                                      <span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Meter:</span>{' '}
                                                      {isMeterTrigger && !a.meter ? <span className="underline">Add</span> : (a.meter || '—')}
                                                    </button>
                                                  </Popover.Trigger>
                                                  <Popover.Portal>
                                                    <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
                                                      <MeterPopoverContent current={a.meter || ''} onSelect={m => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, meter: m } : x) } : t))} />
                                                    </Popover.Content>
                                                  </Popover.Portal>
                                                </Popover.Root>
                                              </div>
                                            )}
                                          </div>
                                          {/* Assignee avatars — inline edit */}
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <div className="group/user w-[96px] shrink-0 flex items-center justify-between h-7 cursor-pointer rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] transition-colors px-1">
                                                {a.assignees.length === 0 ? (
                                                  <span className={`text-[12px] font-medium ${!a.team ? 'text-[var(--color-error,#CE2C31)]' : 'text-[var(--color-neutral-8)]'}`}>Add</span>
                                                ) : (
                                                  a.assignees.slice(0, 3).map((name, idx) => (
                                                    <TooltipProvider key={name} delayDuration={300}>
                                                      <Tooltip content={name} side="top">
                                                        <div style={{ marginLeft: idx > 0 ? '-6px' : '0', zIndex: 10 - idx, position: 'relative' }}>
                                                          <Avatar name={name} size="xs" className="!w-7 !h-7 border-2 border-[var(--surface-primary)]" />
                                                        </div>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  ))
                                                )}
                                                {a.assignees.length > 3 && <span className="text-[10px] text-[var(--color-neutral-8)] ml-0.5">+{a.assignees.length - 3}</span>}
                                                <IconButton label={a.assignees.length > 0 ? 'Edit assignees' : 'Add assignee'} variant="secondary" size="sm" className="opacity-0 group-hover/user:opacity-100 transition-opacity shrink-0 pointer-events-none">
                                                  {a.assignees.length > 0 ? <Pencil size={10} /> : <Plus size={11} />}
                                                </IconButton>
                                              </div>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
                                                <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[var(--border-subtle)]">
                                                  <Search size={12} className="text-[var(--color-neutral-7)] shrink-0" />
                                                  <input type="text" placeholder="Search..." autoFocus className="flex-1 text-[12px] bg-transparent outline-none text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)]" />
                                                </div>
                                                <div className="py-1 max-h-[200px] overflow-y-auto">
                                                  {ASSIGNEES.map(name => {
                                                    const checked = a.assignees.includes(name)
                                                    return (
                                                      <button key={name} type="button" onClick={() => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, assignees: checked ? x.assignees.filter(n => n !== name) : [...x.assignees, name] } : x) } : t))} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-left cursor-pointer hover:bg-[var(--color-neutral-3)] transition-colors">
                                                        <Avatar name={name} size="xs" className="shrink-0" />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                          <span className="text-[var(--color-neutral-11)] truncate">{name}</span>
                                                          {ASSIGNEE_ROLES[name] && <span className="text-[11px] text-[var(--color-neutral-7)] truncate">{ASSIGNEE_ROLES[name]}</span>}
                                                        </div>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--border-default)]'}`}>
                                                          {checked && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                        </div>
                                                      </button>
                                                    )
                                                  })}
                                                </div>
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          {/* Team — inline edit */}
                                          <Popover.Root>
                                            <div className="group/team w-[80px] shrink-0 flex items-center justify-between h-7">
                                              {a.team ? (
                                                <TooltipProvider delayDuration={300}>
                                                  <Tooltip content={`${a.team}${a.teamInherited ? ' (inherited)' : ''}`} side="top">
                                                    <div className="flex flex-col items-start">
                                                      <span style={{ background: TEAM_COLORS[a.team] }} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 cursor-default">{a.team[0]}</span>
                                                    </div>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              ) : (
                                                <span className="text-[12px] font-medium text-[var(--color-neutral-8)]">Add</span>
                                              )}
                                              <Popover.Trigger asChild>
                                                <IconButton label={a.team ? 'Edit team' : 'Assign team'} variant="secondary" size="sm" className="opacity-0 group-hover/team:opacity-100 transition-opacity shrink-0">
                                                  {a.team ? <Pencil size={10} /> : <Plus size={11} />}
                                                </IconButton>
                                              </Popover.Trigger>
                                            </div>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[160px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none overflow-hidden py-1" onOpenAutoFocus={e => e.preventDefault()}>
                                                {['', ...TEAMS.map(t => t.value)].map(team => (
                                                  <Popover.Close key={team || 'none'} asChild>
                                                    <button type="button" onClick={() => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, team } : x) } : t))} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${a.team === team ? 'text-[var(--color-accent-9)] font-medium' : 'text-[var(--color-neutral-11)]'}`}>
                                                      {team ? (
                                                        <span style={{ background: TEAM_COLORS[team] }} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0">{team[0]}</span>
                                                      ) : (
                                                        <span className="w-4 h-4 rounded-full border border-[var(--color-neutral-6)] flex items-center justify-center shrink-0"><X size={8} className="text-[var(--color-neutral-7)]" /></span>
                                                      )}
                                                      {team || 'None'}
                                                    </button>
                                                  </Popover.Close>
                                                ))}
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          {/* Date range — inline edit */}
                                          <Popover.Root>
                                            <Popover.Trigger asChild>
                                              <button className="w-[140px] shrink-0 flex flex-col justify-center items-start h-7 px-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer outline-none text-[11px] text-[var(--color-neutral-8)]">
                                                {a.startDate && <span><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">Start:</span> {displayDate(a.startDate)}</span>}
                                                {a.endDate && <span><span className="text-[10px] text-[var(--color-neutral-7)] uppercase tracking-wide">End:</span> {displayDate(a.endDate)}</span>}
                                                {!a.startDate && !a.endDate && <span>—</span>}
                                              </button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                              <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none p-3 flex flex-col gap-3" onOpenAutoFocus={e => e.preventDefault()}>
                                                <DateInputMDY defaultToday label="Start" value={a.startDate} onChange={v => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, startDate: v } : x) } : t))} />
                                                <DateInputMDY label="End" value={a.endDate} minIso={a.startDate || undefined} onChange={v => setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, assignments: t.assignments.map(x => x.id === a.id ? { ...x, endDate: v } : x) } : t))} />
                                              </Popover.Content>
                                            </Popover.Portal>
                                          </Popover.Root>
                                          {/* Actions */}
                                          <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                              <button className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer text-[var(--color-neutral-7)] shrink-0">
                                                <MoreHorizontal size={14} />
                                              </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onSelect={() => { setEditingAssignmentId({ triggerId: trigger.id, assignmentId: a.id }); setShowAssignModal(trigger.id) }}>
                                                <Pencil size={13} className="mr-2 text-[var(--color-neutral-8)]" />
                                                Edit Assignment
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onSelect={() => setPendingRemove({ triggerId: trigger.id, assignmentId: a.id, name: a.name })}>
                                                <Trash2 size={13} className="mr-2 text-[var(--color-error)]" />
                                                <span className="text-[var(--color-error)]">Remove Assignment</span>
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ))}
                                    </div>
                                  </>)
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
        <NovaPanel
          open={novaOpen}
          onClose={() => setNovaOpen(false)}
          setTitle={setTitle}
          setDescription={setDescription}
          setCategory={setCategory}
          setPriority={setPriority}
          setDetailsOpen={() => {}}
          setAssignModalOpen={() => {}}
          addAsset={() => {}}
          addTrigger={t => setTriggers(ts => {
            const existing = ts.find(x => x.id === t.id)
            if (existing) return ts.map(x => x.id === t.id ? t : x)
            return [...ts.map(x => ({ ...x, expanded: false })), t]
          })}
        />
      </div>

      {/* Calendar trigger modal */}
      <CreateCalendarTriggerModal
        key={calendarModalKey}
        open={showCalendarModal}
        onClose={() => { setShowCalendarModal(false); setEditingTriggerId(null) }}
        isEditing={!!editingTriggerId}
        initial={editingTriggerId ? triggers.find(t => t.id === editingTriggerId)?.calendarTrigger : undefined}
        onSubmit={t => {
          if (editingTriggerId) {
            setTriggers(ts => ts.map(tr => tr.id === editingTriggerId ? { ...tr, calendarTrigger: t } : tr))
          } else {
            const newId = crypto.randomUUID()
            setTriggers(ts => [...ts.map(tr => ({ ...tr, expanded: false })), { id: newId, calendarTrigger: t, assignments: [], expanded: true }])
            setNewTriggerIds(s => new Set([...s, newId]))
            setSkeletonTriggerIds(s => new Set([...s, newId]))
            setFocusedTriggerIds(s => new Set([...s, newId]))
            setTimeout(() => setNewTriggerIds(s => { const next = new Set(s); next.delete(newId); return next }), 600)
            setTimeout(() => setSkeletonTriggerIds(s => { const next = new Set(s); next.delete(newId); return next }), 1000)
            setTimeout(() => setFocusedTriggerIds(s => { const next = new Set(s); next.delete(newId); return next }), 2500)
            setTimeout(() => {
              const el = document.getElementById(`trigger-card-${newId}`)
              el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)
          }
          setShowCalendarModal(false)
          setEditingTriggerId(null)
        }}
      />

      {/* Assign modal */}
      {showAssignModal && (
        <AssignAssetModal
          open={!!showAssignModal}
          onClose={() => { setShowAssignModal(null); setEditingAssignmentId(null) }}
          onSubmit={form => handleAssignToTrigger(showAssignModal, form)}
          existingAssets={(() => {
            const t = triggers.find(t => t.id === showAssignModal)
            return (t?.assignments ?? []).map(a => ({ name: a.name, location: a.subtext, meter: a.meter }))
          })()}
          previousAssignment={(() => {
            const t = triggers.find(t => t.id === showAssignModal)
            const assignments = t?.assignments ?? []
            const prev = editingAssignmentId
              ? assignments.filter(a => a.id !== editingAssignmentId.assignmentId).at(-1)
              : assignments.at(-1)
            if (!prev) return undefined
            return { primaryAssignee: prev.assignees[0] || '', additionalAssignee: prev.assignees.slice(1), team: prev.team || '', startDate: prev.startDate || '', endDate: prev.endDate || '' }
          })()}
          initialValues={(() => {
            const t = triggers.find(t => t.id === showAssignModal)
            if (editingAssignmentId) {
              const a = t?.assignments.find(a => a.id === editingAssignmentId.assignmentId)
              if (!a) return undefined
              return {
                asset: a.type === 'Asset' ? [a.name] : [],
                location: a.type === 'Location' ? [a.name] : [],
                meter: a.type === 'Meter' ? [a.name] : (a.meter ? [a.meter] : []),
                primaryAssignee: a.assignees[0] || '',
                additionalAssignee: a.assignees.slice(1),
                team: a.team || '',
                trigger: '',
                startDate: a.startDate || '',
                endDate: a.endDate || '',
              }
            }
            return undefined
          })()}
          isMeterBased={!!(triggers.find(t => t.id === showAssignModal)?.calendarTrigger?.meterCondition)}
        />
      )}

      {/* Fill missing meters / technicians modal */}
      {showFillMissingModal && (() => {
        const trigger = triggers.find(t => t.id === showFillMissingModal.triggerId)
        if (!trigger) return null
        const missingAssignments = showFillMissingModal.type === 'meter'
          ? trigger.assignments.filter(a => !a.meter)
          : trigger.assignments.filter(a => a.assignees.length === 0 && !a.team)
        return (
          <FillMissingModal
            key={`${showFillMissingModal.triggerId}-${showFillMissingModal.type}`}
            open={!!showFillMissingModal}
            onClose={() => setShowFillMissingModal(null)}
            type={showFillMissingModal.type}
            assignments={missingAssignments}
            onSave={updates => {
              setTriggers(ts => ts.map(t => t.id === showFillMissingModal.triggerId
                ? {
                    ...t,
                    assignments: t.assignments.map(a => {
                      const u = updates.find(u => u.id === a.id)
                      if (!u) return a
                      return { ...a, ...(u.meter !== undefined ? { meter: u.meter } : {}), ...(u.assignees ? { assignees: u.assignees } : {}) }
                    }),
                  }
                : t
              ))
            }}
          />
        )
      })()}

      {/* Bulk delete confirmation modal */}
      {bulkDeleteConfirm && (
        <Modal open={!!bulkDeleteConfirm} onOpenChange={v => !v && setBulkDeleteConfirm(null)} maxWidth="400px">
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px] font-semibold text-[var(--color-neutral-12)]">Delete assignments?</h2>
              <p className="text-[14px] text-[var(--color-neutral-10)]">
                {(() => {
                  const sel = assignmentSelected[bulkDeleteConfirm]
                  const count = sel?.size ?? 0
                  return `This will permanently delete ${count} selected item${count === 1 ? '' : 's'}. This action cannot be undone.`
                })()}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setBulkDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => {
                const tid = bulkDeleteConfirm
                const sel = assignmentSelected[tid]
                setTriggers(ts => ts.map(t => t.id === tid ? { ...t, assignments: t.assignments.filter(a => !sel?.has(a.id)) } : t))
                setAssignmentSelected(s => ({ ...s, [tid]: new Set() }))
                setBulkDeleteConfirm(null)
              }}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leave without saving modal */}
      {showLeaveModal && (
        <Modal open={showLeaveModal} onOpenChange={v => !v && setShowLeaveModal(false)} maxWidth="420px">
          <div className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--color-neutral-12)]">
                {isEditing ? 'Save changes to this PM?' : 'Save before leaving?'}
              </h2>
              <p className="text-[13px] text-[var(--color-neutral-9)] mt-1">
                {isEditing
                  ? 'You have unsaved changes. Save to keep them, or discard to leave without saving.'
                  : 'You have unsaved changes. Save as a draft to continue editing later, or discard them.'}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="md" onClick={handleLeaveModalDiscard}>Discard</Button>
              <Button variant="primary" size="md" onClick={handleLeaveModalSave}>
                {isEditing ? 'Save Changes' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove assignment confirm */}
      {pendingRemove && (
        <Modal open={!!pendingRemove} onOpenChange={v => !v && setPendingRemove(null)} maxWidth="400px">
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px] font-semibold text-[var(--color-neutral-12)]">Remove item?</h2>
              <p className="text-[14px] text-[var(--color-neutral-10)]">
                <strong>{pendingRemove.name}</strong> will be removed from this schedule. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="md" onClick={() => setPendingRemove(null)}>Cancel</Button>
              <Button variant="danger" size="md" onClick={() => {
                setTriggers(ts => ts.map(t => t.id === pendingRemove.triggerId ? { ...t, assignments: t.assignments.filter(x => x.id !== pendingRemove.assignmentId) } : t))
                setPendingRemove(null)
              }}>Remove</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default function CreatePMPage() {
  return (
    <Suspense>
      <CreatePMPageContent />
    </Suspense>
  )
}
