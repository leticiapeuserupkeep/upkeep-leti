'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as Popover from '@radix-ui/react-popover'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, FileText, Box,
  Plus, X, MapPin, Gauge, Clock, Users, Upload, Trash2, PanelLeft,
  Calendar, ArrowRight, ArrowDown, Sparkle, MoreHorizontal, Pencil, Activity, CalendarClock,
  User, RotateCcw, RefreshCw, Camera, Link2, Search, Ban,
} from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
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
  atTime: string
  // WO creation
  woCreationMode: 'relative' | 'on-the' | ''
  woRelativeN: string
  woRelativePeriod: string
  woOnThePeriod: string
  woAtTime: string
  // Meter trigger
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
const ASSETS = ASSET_NAMES
const LOCATIONS = LOCATION_NAMES
const METERS = METER_NAMES
const TRIGGERS = ['Every Wednesday', 'Daily', 'Weekly', 'Monthly', 'On Meter Reading']
const ASSIGNEES = ['Leticia Peuser', 'John Smith', 'Maria Garcia', 'David Chen']
const TEAMS = ['Maintenance', 'Electrical', 'Safety', 'Operations']

/* ── Select field component ── */

function Select({
  label, required, value, onChange, options, placeholder = 'Select…',
}: {
  label?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
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
          <button className="w-full h-10 flex items-center pl-3 pr-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] hover:border-[var(--color-neutral-7)] data-[state=open]:border-[var(--color-accent-7)] transition-colors cursor-pointer outline-none">
            <span className={`flex-1 text-left text-[13px] truncate ${value ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-7)]'}`}>
              {value}
            </span>
            <ChevronDown size={14} className="shrink-0 text-[var(--color-neutral-7)] ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" minWidth="var(--radix-dropdown-menu-trigger-width)">
          {options.map(o => (
            <DropdownMenuItem
              key={o}
              onSelect={() => onChange(o)}
              className={value === o ? 'font-medium text-[var(--color-accent-9)] bg-[var(--color-accent-1)]' : ''}
            >
              {o}
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
const FULL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1))

const EMPTY_TRIGGER: Omit<CalendarTrigger, 'id'> = {
  scheduleType: 'Regular Interval', every: '', period: '',
  weekday: 'Mon',
  monthMode: 'on-day', monthDay: '1', monthOrdinal: 'first', monthWeekday: 'Day',
  atTime: '',
  woCreationMode: '', woRelativeN: '3', woRelativePeriod: 'Day',
  woOnThePeriod: 'Monday', woAtTime: '',
  meterValue: '', meterUnit: 'Units', meterDueN: '1', meterDuePeriod: 'Day',
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

function InlineSelect({ value, onChange, options, placeholder, className }: { value: string; onChange: (v: string) => void; options: InlineOption[]; placeholder?: string; className?: string }) {
  const items = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  const displayLabel = value ? (items.find(i => i.value === value)?.label ?? value) : (placeholder ?? '')
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] font-medium hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer ${value ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-7)]'} ${className ?? ''}`}
        >
          <span>{displayLabel}</span>
          <ChevronDown size={12} className="text-[var(--color-neutral-7)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" minWidth="140px">
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
}

function CreateCalendarTriggerModal({
  open, onClose, onSubmit, initial,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (t: CalendarTrigger) => void
  initial?: CalendarTrigger
}) {
  const [form, setForm] = useState<Omit<CalendarTrigger, 'id'>>(initial ?? EMPTY_TRIGGER)
  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const [showInactivePeriods, setShowInactivePeriods] = useState(false)
  const [showMeterTrigger, setShowMeterTrigger] = useState(false)
  const [inactivePeriods, setInactivePeriods] = useState<Array<{ id: string; fromDate: string; fromTime: string; toDate: string; toTime: string }>>([])
  const [newPeriod, setNewPeriod] = useState({ fromDate: '', fromTime: '', toDate: '', toTime: '' })
  const lastAddedIdRef = useRef<string | null>(null)
  const inactiveInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
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
  const [meterCondition, setMeterCondition] = useState('is above')
  const [meterValue, setMeterValue] = useState('')
  const [meterUnit, setMeterUnit] = useState('Units')
  const [meterDueN, setMeterDueN] = useState('1')
  const [meterDuePeriod, setMeterDuePeriod] = useState('Day')

  function handleSubmit() {
    onSubmit({ ...form, id: initial?.id ?? crypto.randomUUID(), meterValue, meterUnit, meterDueN, meterDuePeriod })
    setForm(EMPTY_TRIGGER)
    onClose()
  }

  function handleClose() {
    setForm(initial ?? EMPTY_TRIGGER)
    onClose()
  }

  const woPeriodOptions = form.period === 'Day' ? ['Hour(s)'] : PERIODS.map(p => `${p}(s)`)

  const timeInput = (value: string, onChange: (v: string) => void, className?: string) => (
    <TimePicker value={value} onChange={onChange} className={className ?? ''} />
  )

  return (
    <Modal open={open} onOpenChange={v => !v && handleClose()} maxWidth="620px">
      <ModalHeader title="Create Calendar Trigger" />
      <ModalBody className="flex flex-col gap-6 p-6">

        {/* Schedule type */}
        <div className="flex flex-col gap-3">
          <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">Schedule Type</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'Regular Interval', label: 'Fixed schedule', desc: 'Repeat on set calendar dates.' },
              { value: 'After Completion', label: 'After completion', desc: 'Repeat after the previous work order.' },
            ].map(({ value, label, desc }) => {
              const active = form.scheduleType === value
              return (
                <button key={value} type="button" onClick={() => {
                  set('scheduleType')(value)
                  if (value === 'After Completion') setForm(f => ({ ...f, scheduleType: value, every: '1', period: 'Day', atTime: '', weekday: 'Mon', monthDay: '1' }))
                }}
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
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">Maintenance Due</p>
            {form.scheduleType !== 'After Completion' && (
              <button type="button" onClick={() => setForm(f => ({ ...f, every: '', period: '', atTime: '', weekday: 'Mon', monthDay: '1' }))}
                className={`text-[13px] font-medium text-[var(--color-error-9,#CE2C31)] underline underline-offset-2 cursor-pointer transition-opacity duration-200 ${(form.every || form.period) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                Reset
              </button>
            )}
          </div>
          {form.scheduleType === 'After Completion' ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">Every</span>
              <NumberInput value={form.every} onChange={set('every')} min={1} className="w-14 shrink-0" />
              <InlineSelect value={form.period} onChange={set('period')} options={PERIODS.map(p => ({ value: p, label: `${p}(s)` }))} className="justify-between" />
              <span className="text-[13px] text-[var(--color-neutral-10)]">After the previous work order is completed</span>
              <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
              {timeInput(form.atTime, set('atTime'), 'w-28 min-w-0')}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">Every</span>
              <NumberInput value={form.every} onChange={set('every')} min={1} className="w-14 shrink-0" />
              <InlineSelect value={form.period}
                onChange={v => { set('period')(v); set('woRelativePeriod')(v === 'Day' ? 'Hour(s)' : `${v}(s)`) }}
                options={PERIODS.map(p => ({ value: p, label: `${p}(s)` }))}
                placeholder="Period"
                className="flex-1 justify-between" />
              {form.period === 'Week' && (
                <>
                  <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">On</span>
                  <InlineSelect value={form.weekday} onChange={set('weekday')}
                    options={WEEKDAY_LETTERS.map((wd, i) => ({ value: wd.value, label: FULL_WEEKDAYS[i] }))} />
                </>
              )}
              {form.period === 'Month' && (
                <>
                  <InlineSelect value={form.monthDay} onChange={set('monthDay')} options={MONTH_DAYS} />
                </>
              )}
              <span className="text-[13px] text-[var(--color-neutral-10)] shrink-0">At</span>
              {timeInput(form.atTime, set('atTime'), 'flex-1 min-w-0')}
            </div>
          )}
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Create Work Order */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-[var(--color-neutral-12)]">Create Work Order</p>
            <button type="button" onClick={() => setForm(f => ({ ...f, woCreationMode: '', woRelativeN: '3', woRelativePeriod: 'Day(s)', woOnThePeriod: 'Monday', woAtTime: '' }))}
              className={`text-[13px] font-medium text-[var(--color-error-9,#CE2C31)] underline underline-offset-2 cursor-pointer transition-opacity duration-200 ${form.woCreationMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              Reset
            </button>
          </div>
          {form.period === 'Day' ? (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <NumberInput value={form.woRelativeN} onChange={set('woRelativeN')} min={1} className="w-16" />
              <InlineSelect value="Hour(s)" onChange={() => {}} options={['Hour(s)']} />
              <span className="text-[13px] text-[var(--color-neutral-10)]">before the due date At</span>
              {timeInput(form.woAtTime, set('woAtTime'))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {([
                { mode: 'relative' as const, label: 'Relative' },
                { mode: 'on-the' as const, label: 'Weekday' },
              ] as const).map(({ mode, label }) => {
                const isSelected = form.woCreationMode === mode
                return (
                  <div key={mode} onClick={() => set('woCreationMode')(mode)}
                    className={`flex flex-col rounded-lg border overflow-hidden cursor-pointer transition-colors ${isSelected ? 'border-[var(--color-accent-7)] bg-[var(--color-accent-1)]' : 'border-[#F0F0F3] bg-[#FCFCFD]'}`}>
                    <div className={`flex items-center gap-[10px] px-4 h-[52px] shrink-0 ${isSelected ? 'bg-[var(--color-accent-2)]' : 'bg-[#F0F0F3]'}`}>
                      <input type="radio" name="wo-mode" checked={isSelected} onChange={() => set('woCreationMode')(mode)}
                        className="accent-[var(--color-accent-9)]" onClick={e => e.stopPropagation()} />
                      <span className="text-[14px] text-[var(--color-neutral-12)]">{label}</span>
                    </div>
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {mode === 'relative' ? (
                        <div className="flex items-center gap-2">
                          <NumberInput value={form.woRelativeN} onChange={set('woRelativeN')} min={1} className="w-14 shrink-0" />
                          <InlineSelect value={form.woRelativePeriod} onChange={set('woRelativePeriod')} options={woPeriodOptions} className="flex-1 justify-between" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[var(--color-neutral-9)] shrink-0">On</span>
                          <InlineSelect value={form.woOnThePeriod} onChange={set('woOnThePeriod')} options={FULL_WEEKDAYS} className="flex-1 justify-between" />
                        </div>
                      )}
                      <span className="text-[12px] text-[var(--color-neutral-9)]">Before the due date</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[var(--color-neutral-9)] shrink-0">At</span>
                        {timeInput(form.woAtTime, set('woAtTime'), 'flex-1 min-w-0')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Add Meter-Based Trigger */}
        <div className="flex flex-col gap-3">
          {(() => {
            const meterComplete = meterValue.trim() !== '' && meterDueN.trim() !== ''
            return (
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] overflow-hidden">
                <button type="button" onClick={() => setShowMeterTrigger(v => !v)}
                  className="flex items-center gap-4 px-4 py-3 bg-[#FCFCFD] w-full text-left cursor-pointer hover:bg-[var(--color-neutral-2)] transition-colors">
                  <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0">
                    <Gauge size={15} className="text-[var(--color-neutral-9)]" />
                  </div>
                  <span className="flex-1 text-[14px] font-medium text-[var(--color-neutral-12)]">Add Meter-Based Trigger</span>
                  {showMeterTrigger ? (
                    meterComplete ? (
                      <button type="button" onClick={e => { e.stopPropagation(); setShowMeterTrigger(false); setMeterValue(''); setMeterDueN('1') }}
                        className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-error-9,#e5352b)] hover:opacity-80 cursor-pointer shrink-0">
                        <Trash2 size={13} />
                        Reset
                      </button>
                    ) : (
                      <button type="button" onClick={e => { e.stopPropagation(); setShowMeterTrigger(false) }}
                        className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0 hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer">
                        <X size={13} className="text-[var(--color-neutral-9)]" />
                      </button>
                    )
                  ) : (
                    <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0">
                      <Plus size={14} className="text-[var(--color-neutral-11)]" />
                    </div>
                  )}
                </button>
                <div style={{ display: 'grid', gridTemplateRows: showMeterTrigger ? '1fr' : '0fr', transition: 'grid-template-rows 220ms ease' }}>
                  <div style={{ overflow: 'hidden' }}>
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">When Meter</label>
                      <InlineSelect value={meterCondition} onChange={setMeterCondition}
                        options={['is above', 'is below', 'equals']} className="w-full justify-between" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">Units</label>
                      <NumberInput value={meterValue} onChange={setMeterValue} min={0} placeholder="0" className="w-full" />
                    </div>
                    <div className="flex flex-col gap-1.5 border-l border-[var(--border-default)] pl-4">
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">Work Order Due Date</label>
                      <div className="flex items-center gap-2">
                        <NumberInput value={meterDueN} onChange={setMeterDueN} min={1} className="w-14 shrink-0" />
                        <InlineSelect value={meterDuePeriod} onChange={setMeterDuePeriod} options={['Day', 'Week', 'Month']} />
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Add Inactive Periods */}
          <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 bg-[#FCFCFD]">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] flex items-center justify-center shrink-0">
                <Ban size={15} className="text-[var(--color-neutral-9)]" />
              </div>
              <span className="flex-1 text-[14px] font-medium text-[var(--color-neutral-12)]">Add Inactive Periods</span>
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
            </div>
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
                        className="h-8 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors w-full" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[var(--color-neutral-11)]">To</label>
                      <input type="date" value={p.toDate}
                        onChange={e => setInactivePeriods(ps => ps.map(x => x.id === p.id ? { ...x, toDate: e.target.value } : x))}
                        className="h-8 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors w-full" />
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

        </div>{/* end animated reveal */}

      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2 px-6 py-4">
        <Button variant="secondary" size="md" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" size="md" onClick={handleSubmit} disabled={!form.scheduleType || !form.period || !form.woCreationMode}>Create Trigger</Button>
      </ModalFooter>
    </Modal>
  )
}

/* ── Trigger row ── */

function TriggerRow({ trigger, onRemove, onEdit, meterMissing }: { trigger: CalendarTrigger; onRemove: () => void; onEdit: () => void; meterMissing?: boolean }) {
  const onLabel = trigger.period === 'Week'
    ? `On ${trigger.weekday === 'Mon' ? 'Mondays' : trigger.weekday === 'Tue' ? 'Tuesdays' : trigger.weekday === 'Wed' ? 'Wednesdays' : trigger.weekday === 'Thu' ? 'Thursdays' : trigger.weekday === 'Fri' ? 'Fridays' : trigger.weekday === 'Sat' ? 'Saturdays' : 'Sundays'}`
    : trigger.period === 'Month' ? (trigger.monthMode === 'on-day' ? `On day ${trigger.monthDay}` : `On the ${trigger.monthOrdinal} ${trigger.monthWeekday}`)
    : ''
  const everyPart = `Every ${trigger.every} ${trigger.period === 'Day' ? (Number(trigger.every) === 1 ? 'day' : 'days') : trigger.period === 'Week' ? (Number(trigger.every) === 1 ? 'week' : 'weeks') : (Number(trigger.every) === 1 ? 'month' : 'months')}`
  const timePart = trigger.atTime ? ` - At ${trigger.atTime}` : ''
  const calSummary = [everyPart, onLabel].filter(Boolean).join(', ') + timePart

  return (
    <div className="flex items-center gap-2 px-3 py-4 rounded-[12px] border border-[#F0F0F3] bg-[#FCFCFD]">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-[14px] font-medium text-[#1C2024]">{calSummary}</span>
        {trigger.meterValue && (
          <>
            <span className="inline-flex items-center justify-center px-2 h-5 rounded-full bg-[#F0F0F3] text-[12px] font-medium text-[#1C2024] shrink-0">or</span>
            <span className={`text-[14px] font-medium ${meterMissing ? 'text-[#CE2C31]' : 'text-[#1C2024]'}`}>When a reading is greater than {trigger.meterValue} {trigger.meterUnit}</span>
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
        className="relative flex items-center min-h-10 px-3 pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] cursor-pointer transition-colors focus-within:border-[var(--color-accent-7)] hover:border-[var(--color-neutral-6)]"
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
        <SearchableSelect label="Primary Assignee" value={form.primaryAssignee} onChange={set('primaryAssignee')} options={ASSIGNEES} />
        <SearchableMultiSelect label="Additional Assignee" values={form.additionalAssignee} onChange={v => setForm(f => ({ ...f, additionalAssignee: v }))} options={ASSIGNEES} />
        <Select label="Team" value={form.team} onChange={set('team')} options={TEAMS} />
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
    <p className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)] mb-2">{children}</p>
  )
}

function AssignAssetModal({
  open, onClose, onSubmit, existingAssets = [], initialValues,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: AssignAssetForm) => void
  existingAssets?: AssignedAsset[]
  initialValues?: AssignAssetForm
}) {
  const [form, setForm] = useState<AssignAssetForm>(EMPTY_FORM)
  const [appliesToType, setAppliesToType] = useState<AppliesToType>('Asset')

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm(initialValues)
        setAppliesToType(initialValues.asset.length ? 'Asset' : initialValues.location.length ? 'Location' : initialValues.meter.length ? 'Meter' : 'Asset')
      } else {
        setForm(EMPTY_FORM)
        setAppliesToType('Asset')
      }
    }
  }, [open])
  const [valueOpen, setValueOpen] = useState(false)
  const [valueQuery, setValueQuery] = useState('')
  const valueInputRef = useRef<HTMLInputElement>(null)
  const appliesToTriggerRef = useRef<HTMLButtonElement>(null)
  const appliesToMeasureRef = useRef<HTMLDivElement>(null)
  const [appliesToVisibleCount, setAppliesToVisibleCount] = useState(99)
  const set = (k: keyof AssignAssetForm) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const usedAssets = existingAssets.map(a => a.name).filter(Boolean)
  const usedLocations = existingAssets.map(a => a.location).filter(Boolean)
  const usedMeters = existingAssets.map(a => a.meter).filter(Boolean)
  const allAppliesToOptions = appliesToType === 'Asset' ? ASSETS : appliesToType === 'Location' ? LOCATIONS : METERS
  const appliesToOptions = allAppliesToOptions.filter(o =>
    !(appliesToType === 'Asset' ? usedAssets : appliesToType === 'Location' ? usedLocations : usedMeters).includes(o)
  )
  const appliesToSelected: string[] = appliesToType === 'Asset' ? form.asset
    : appliesToType === 'Location' ? form.location
    : form.meter
  const filteredAppliesToOptions = appliesToOptions.filter(o =>
    o.toLowerCase().includes(valueQuery.toLowerCase())
  )

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

  const canSubmit = !!(form.asset.length || form.location.length || form.meter.length || form.primaryAssignee || form.additionalAssignee.length || form.team)

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(form)
    setForm(EMPTY_FORM)
    setAppliesToType('Asset')
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    setAppliesToType('Asset')
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={v => !v && handleClose()} maxWidth="520px">
      <ModalHeader
        title="Assignments"
        description="Choose where or to whom this preventive maintenance should be assigned."
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
                  <div className="py-1 max-h-[220px] overflow-y-auto">
                    {filteredAppliesToOptions.length === 0 ? (
                      <p className="px-3 py-2 text-[13px] text-[var(--color-neutral-7)]">No results</p>
                    ) : filteredAppliesToOptions.map(o => {
                      const checked = appliesToSelected.includes(o)
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => toggleAppliesToValue(o)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${checked ? 'text-[var(--color-neutral-12)] bg-[var(--color-accent-1)]' : 'text-[var(--color-neutral-11)]'}`}
                        >
                          <span className={`flex-shrink-0 w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center transition-colors ${checked ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                            {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </span>
                          <span className="flex-1 truncate">{o}</span>
                        </button>
                      )
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)] mb-6" />

        {/* PEOPLE */}
        <div className="flex flex-col gap-4 mb-6">
          <SearchableSelect label="Primary Assignee" value={form.primaryAssignee} onChange={set('primaryAssignee')} options={ASSIGNEES} />
          <div className={form.primaryAssignee ? '' : 'opacity-40 pointer-events-none'}>
            <SearchableMultiSelect label="Additional Assignee" values={form.additionalAssignee} onChange={v => setForm(f => ({ ...f, additionalAssignee: v }))} options={ASSIGNEES} />
          </div>
          <Select label="Team" value={form.team} onChange={set('team')} options={TEAMS} />
        </div>

        <div className="h-px bg-[var(--border-subtle)] mb-6" />

        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Start"
            type="date"
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: (e.target as HTMLInputElement).value }))}
          />
          <TextInput
            label="End"
            type="date"
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: (e.target as HTMLInputElement).value }))}
          />
        </div>

      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2 px-6 py-4">
        <Button variant="secondary" size="lg" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={!canSubmit}>Assign</Button>
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
                  className="h-10 px-3 pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors appearance-none cursor-pointer"
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
                  className="w-14 h-9 px-2 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors shrink-0"
                />
                <div className="relative shrink-0">
                  <select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="h-9 pl-3 pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors appearance-none cursor-pointer"
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
                        className="h-8 pl-3 pr-7 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors appearance-none cursor-pointer"
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
                        className="h-8 pl-3 pr-7 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors appearance-none cursor-pointer"
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
                        className="h-8 pl-3 pr-7 min-w-[120px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors appearance-none cursor-pointer"
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
          Create Trigger
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
}

function NovaPanel(props: NovaPanelProps) {
  const { open, onClose, setTitle, setDescription, setCategory, setPriority, setDetailsOpen, setAssignModalOpen, addAsset } = props
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

    // Step 1 — open Details, type title
    setStatusText('Opening Details section…')
    setDetailsOpen(true)
    await sleep(500)

    setStatusText('Typing title…')
    await typeText(setTitle, fill.title ?? '')
    await sleep(300)

    setStatusText('Writing description…')
    await typeText(setDescription, fill.description ?? '', 12)
    await sleep(300)

    setStatusText('Setting category…')
    setCategory(fill.category ?? '')
    await sleep(350)

    setStatusText('Setting priority…')
    setPriority(fill.priority ?? '')
    await sleep(500)

    // Step 2 — assign asset
    setStatusText('Assigning asset…')
    setAssignModalOpen(true)
    await sleep(700)

    const assetKey = ASSETS[0]
    const assetMeta = getAssetData(assetKey)
    const newAsset: AssignedAsset = {
      id: crypto.randomUUID(),
      name: assetKey,
      location: assetMeta?.location ?? '',
      meter: assetMeta?.meter ?? '',
      trigger: '',
      frequency: '',
      primaryAssignee: ASSIGNEES[0],
      team: TEAMS[0],
      timeRange: '07/06/26 - 2:30 PM | 07/06/26 - 4:30 PM',
    }
    setAssignModalOpen(false)
    addAsset(newAsset)
    await sleep(600)

    setStatusText('')
    setBusy(false)

    pushMsg('nova', "✅ Your PM is ready! Review the details on the left and hit **Create PM** when you're happy.", [
      { label: 'Title', value: fill.title ?? '' },
      { label: 'Category', value: fill.category ?? '' },
      { label: 'Priority', value: fill.priority ?? '' },
      { label: 'Asset', value: assetKey },
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
          <div className="flex items-end gap-2 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2 focus-within:border-[var(--color-accent-7)] transition-colors">
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

export default function CreatePMPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [duration, setDuration] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [signature, setSignature] = useState(false)
  const [createWONow, setCreateWONow] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [extraDetailsOpen, setExtraDetailsOpen] = useState(true)
  const [assets, setAssets] = useState<AssignedAsset[]>([])
  const [removingAssets, setRemovingAssets] = useState<Set<string>>(new Set())
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [triggerModal, setTriggerModal] = useState<{ assetId: string; type: 'meter' | 'calendar' | 'both' } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [calendarTriggers, setCalendarTriggers] = useState<CalendarTrigger[]>([])
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [triggerDropdownOpen, setTriggerDropdownOpen] = useState(false)
  const [novaOpen, setNovaOpen] = useState(false)
  const [checklistsOpen, setChecklistsOpen] = useState(false)
  const [filesPartsOpen, setFilesPartsOpen] = useState(false)
  const [checklists, setChecklists] = useState<ChecklistGroup[]>([])

  const hasMeterTrigger = calendarTriggers.some(t => t.meterValue?.trim())
  const meterMissing = hasMeterTrigger && assets.some(a => !a.meter)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const imageScrollRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const raf = requestAnimationFrame(() => scrollContainerRef.current?.scrollTo(0, 0))
    return () => cancelAnimationFrame(raf)
  }, [])

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach(f => {
      const url = URL.createObjectURL(f)
      setImages(imgs => [...imgs, url])
    })
    e.target.value = ''
  }

  function handleAssignAsset(form: AssignAssetForm) {
    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : ''
    const timeRange = form.startDate ? `${fmt(form.startDate)}${form.endDate ? ' | ' + fmt(form.endDate) : ''}` : ''
    const shared = {
      trigger: form.trigger,
      frequency: form.trigger,
      primaryAssignee: form.primaryAssignee || 'Unassigned',
      additionalAssignees: form.additionalAssignee,
      team: form.team || '',
      timeRange,
    }
    // Create one card per selected item, filling missing fields from the database
    const items: AssignedAsset[] = form.asset.length > 0
      ? form.asset.map(a => {
          const db = getAssetData(a)
          return { id: crypto.randomUUID(), name: a, location: form.location[0] || db?.location || '', meter: form.meter[0] || db?.meter || '', ...shared, team: form.team || db?.team || shared.team, primaryAssignee: form.primaryAssignee || db?.assignee || shared.primaryAssignee }
        })
      : form.location.length > 0
        ? form.location.map(l => {
            const db = getLocationData(l)
            return { id: crypto.randomUUID(), name: '', location: l, meter: form.meter[0] || '', ...shared, team: form.team || db?.team || shared.team, primaryAssignee: form.primaryAssignee || db?.assignees?.[0] || shared.primaryAssignee }
          })
        : form.meter.length > 0
          ? form.meter.map(m => {
              const db = getMeterData(m)
              return { id: crypto.randomUUID(), name: '', location: form.location[0] || db?.locationName || '', meter: m, ...shared }
            })
          : [{ id: crypto.randomUUID(), name: '', location: '', meter: '', ...shared }]
    if (editingAssetId) {
      setAssets(a => a.map(x => x.id === editingAssetId ? { ...items[0], id: editingAssetId } : x))
      setEditingAssetId(null)
    } else {
      setAssets(a => [...a, ...items])
    }
    setAssignModalOpen(false)
  }

  function handleCreatePM() {
    if (!title) return
    setSubmitted(true)
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
            <strong className="text-[var(--color-neutral-11)]">{title}</strong> has been added to Predictive Maintenance.
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
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-[var(--z-sticky)] flex items-center gap-3 h-[60px] px-4 bg-[var(--surface-primary)] border-b border-[var(--border-subtle)]">
        <button
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
          className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] transition-colors text-[var(--color-neutral-7)] cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={20} />
        </button>
        <Link
          href="/predictive-maintenance"
          className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] transition-colors text-[var(--color-neutral-8)] cursor-pointer"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[16px] font-semibold text-[var(--color-neutral-12)] flex-1">
          New Preventive Maintenance
        </h1>
        <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
        <Link href="/predictive-maintenance">
          <Button variant="secondary" size="md">Cancel</Button>
        </Link>
        <Button
          variant="primary"
          size="md"
          onClick={handleCreatePM}
          disabled={!title}
        >
          Create PM
        </Button>
      </div>

      {/* Content + Nova side by side */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-white" ref={scrollContainerRef}>
        <div className="max-w-[1100px] mx-auto px-6 py-6 flex flex-col gap-7">

          {/* Page header row */}
          <div className="flex items-end gap-5">
            <p className="flex-1 text-[14px] text-[var(--color-neutral-10)] leading-5">
              Automatically generate work orders based on a schedule or meter reading.<br />Add the details, assign technicians, and help prevent equipment failures.
            </p>
            <button
              onClick={() => setNovaOpen(true)}
              className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-2)] text-[var(--color-neutral-11)] text-[13px] font-medium transition-colors cursor-pointer"
            >
              <Sparkle size={16} className="text-[var(--color-accent-9)]" />
              Create with Nova
            </button>
          </div>

          <CreateCalendarTriggerModal
            open={showCalendarModal}
            onClose={() => setShowCalendarModal(false)}
            onSubmit={t => setCalendarTriggers(ts => [...ts, t])}
          />

          {/* Two-column layout */}
          <div className="flex gap-4 items-start">

            {/* LEFT: Details sidebar */}
            <div className="w-[320px] shrink-0 flex flex-col gap-4">
              <div className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-neutral-5)] bg-[var(--surface-primary)] overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 h-[52px] border-b border-[var(--border-subtle)] bg-[var(--color-neutral-2)]">
                  <div className="w-6 h-6 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] flex items-center justify-center">
                    <FileText size={13} className="text-[var(--color-neutral-8)]" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-[var(--color-neutral-12)]">Details</h2>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-5 p-4">

              {/* Title */}
              <TextInput
                label="Title"
                required
                autoFocus
                placeholder="e.g. Monthly HVAC filter replacement"
                value={title}
                onChange={e => setTitle((e.target as HTMLInputElement).value)}
              />

              {/* Description */}
              <Textarea
                label="Description"
                placeholder="Describe this maintenance task…"
                value={description}
                onChange={e => setDescription((e.target as HTMLTextAreaElement).value)}
                className="h-[88px] resize-none"
              />

              {/* Category + Priority */}
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
                </div>
                <div className="flex-1 min-w-0">
                  <Select label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
                </div>
              </div>

              {/* Duration */}
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

              {/* Create first Work Order Now */}
              <div
                onClick={() => setCreateWONow(v => !v)}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-[var(--radius-xl)] border transition-colors cursor-pointer ${createWONow ? 'border-transparent bg-[var(--color-accent-1)]' : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)] hover:bg-[var(--color-neutral-2)]'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--color-neutral-12)]">Create first Work Order Now</p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <Switch checked={createWONow} onCheckedChange={setCreateWONow} size="md" aria-label="Create first Work Order Now" />
                </div>
              </div>

              {/* Signature Required */}
              <div
                onClick={() => setSignature(v => !v)}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-[var(--radius-xl)] border transition-colors cursor-pointer ${signature ? 'border-transparent bg-[var(--color-accent-1)]' : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)] hover:bg-[var(--color-neutral-2)]'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--color-neutral-12)]">Signature Required</p>
                  <p className="text-[12px] text-[var(--color-neutral-9)] mt-0.5 leading-4">
                    Technicians must sign to complete this work order.
                  </p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <Switch checked={signature} onCheckedChange={setSignature} size="md" aria-label="Signature required" />
                </div>
              </div>

                </div>{/* end fields */}
              </div>{/* end card */}

              {/* Tasks & Checklists card */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
                <div
                  onClick={() => setChecklistsOpen(o => !o)}
                  className="w-full flex items-center gap-2 px-4 h-[52px] border-b border-[var(--border-subtle)] bg-[var(--color-neutral-2)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer select-none"
                >
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-[var(--color-neutral-7)]">
                    <path d="M6.75 4.5H3.75C3.33579 4.5 3 4.83579 3 5.25V14.25C3 14.6642 3.33579 15 3.75 15H14.25C14.6642 15 15 14.6642 15 14.25V5.25C15 4.83579 14.6642 4.5 14.25 4.5H11.25M6.75 4.5V3.75C6.75 3.33579 7.08579 3 7.5 3H10.5C10.9142 3 11.25 3.33579 11.25 3.75V4.5M6.75 4.5H11.25M6.75 9H11.25M6.75 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="flex-1 text-left text-[14px] font-semibold text-[var(--color-neutral-12)]">Tasks &amp; Checklists</span>
                  {!checklistsOpen && (
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
                  )}
                  {checklistsOpen ? <ChevronUp size={16} className="text-[var(--color-neutral-9)]" /> : <ChevronDown size={16} className="text-[var(--color-neutral-9)]" />}
                </div>
                {checklistsOpen && (
                  <div className="p-4 flex flex-col gap-4">
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
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-[var(--color-neutral-9)]">{checklists.reduce((n, c) => n + c.tasks.length, 0)} tasks</span>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] border border-[var(--color-accent-10)] text-white text-[13px] font-medium hover:bg-[var(--color-accent-10)] transition-colors cursor-pointer">
                                Add <ChevronDown size={13} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" minWidth="180px">
                              <DropdownMenuItem onSelect={() => setChecklists(cs => [...cs, { id: crypto.randomUUID(), title: 'New Checklist', open: true, tasks: [] }])}>
                                <Plus size={13} className="mr-2" />New Checklist
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setChecklists(cs => cs.map((c, i) => i === 0 ? { ...c, tasks: [...c.tasks, { id: crypto.randomUUID(), title: 'New Task', type: 'pass-fail' as const, value: '' }] } : c))}>
                                <Plus size={13} className="mr-2" />Add Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                                        className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] outline-none focus:border-[var(--color-accent-7)] transition-colors" />
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

              {/* Images, Files & Parts card */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
                <button
                  onClick={() => setFilesPartsOpen(o => !o)}
                  className="w-full flex items-center gap-2 px-4 h-[52px] border-b border-[var(--border-subtle)] bg-[var(--color-neutral-2)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer"
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
              </div>
            </div>

            {/* RIGHT: Cards stack */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Assigned To card */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
                <div className="flex items-center gap-3 px-4 h-[52px] border-b border-[var(--border-subtle)] bg-[var(--color-neutral-2)]">
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-[var(--color-neutral-7)]">
                    <path d="M9.77262 9.98537C9.52237 9.95379 9.26492 9.9375 9.00086 9.9375C8.9638 9.9375 8.92688 9.93782 8.89009 9.93846C6.10032 9.98688 4.06885 11.8632 3.50452 14.3743C3.40762 14.8055 3.75773 15.1875 4.19967 15.1875H8.62586M8.89009 9.93846C8.40253 9.94692 7.93842 10.0112 7.50093 10.125M9.77262 9.98537C10.0229 10.0169 10.2659 10.0638 10.5011 10.125M9.77262 9.98537C10.2991 10.0518 10.7936 10.1859 11.2509 10.3785M11.0634 13.95L12.7134 15.1875L15.1884 11.0625M11.8134 4.875C11.8134 6.4283 10.5542 7.6875 9.00086 7.6875C7.44756 7.6875 6.18836 6.4283 6.18836 4.875C6.18836 3.3217 7.44756 2.0625 9.00086 2.0625C10.5542 2.0625 11.8134 3.3217 11.8134 4.875Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="flex-1 text-[14px] font-semibold text-[var(--color-neutral-12)]">Assigned To</span>
                  {assets.length > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[var(--color-neutral-4)] text-[11px] font-bold text-[var(--color-neutral-10)]">{assets.length}</span>
                  )}
                  {assets.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={() => setAssignModalOpen(true)}>
                      <Plus size={13} />
                      Assign
                    </Button>
                  )}
                </div>
                <div className="p-4">
                  {assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-center">
                      <p className="text-[14px] font-semibold text-[var(--color-neutral-11)]">Assign your preventive maintenance</p>
                      <p className="text-[13px] text-[var(--color-neutral-8)] max-w-[400px]">Choose where this preventive maintenance applies.</p>
                      <Button variant="primary" size="md" onClick={() => setAssignModalOpen(true)}>
                        Assign
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {assets.map((a, idx) => (
                        <div
                          key={a.id}
                          className={removingAssets.has(a.id) ? 'animate-card-out' : 'animate-card-in'}
                        >
                          <AssignmentCard
                            asset={a}
                            defaultExpanded={idx < 5}
                            isSelected={selectedAssets.has(a.id)}
                            meterError={hasMeterTrigger && !a.meter}
                            onToggleSelect={() => setSelectedAssets(s => {
                              const next = new Set(s)
                              next.has(a.id) ? next.delete(a.id) : next.add(a.id)
                              return next
                            })}
                            onRemove={() => {
                              setRemovingAssets(s => new Set(s).add(a.id))
                              setTimeout(() => {
                                setAssets(list => list.filter(x => x.id !== a.id))
                                setRemovingAssets(s => { const n = new Set(s); n.delete(a.id); return n })
                              }, 180)
                            }}
                            onSelectTrigger={type => setTriggerModal({ assetId: a.id, type })}
                            onUpdate={patch => setAssets(list => list.map(x => x.id === a.id ? { ...x, ...patch } : x))}
                            onEdit={() => {
                              setEditingAssetId(a.id)
                              setAssignModalOpen(true)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Triggers card */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 h-[52px] border-b border-[var(--border-subtle)] bg-[var(--color-neutral-2)]">
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-[var(--color-neutral-7)]">
                    <path d="M9 9.75L6.75 7.5M7.3125 1.6875H10.6875M15.1875 9.75C15.1875 13.1673 12.4173 15.9375 9 15.9375C5.58274 15.9375 2.8125 13.1673 2.8125 9.75C2.8125 6.33274 5.58274 3.5625 9 3.5625C12.4173 3.5625 15.1875 6.33274 15.1875 9.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="flex-1 text-[14px] font-semibold text-[var(--color-neutral-12)]">Triggers</span>
                  {calendarTriggers.length > 0 && (
                    meterMissing ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#CE2C31] text-white text-[13px] font-bold">!</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#30A46C]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )
                  )}
                </div>
                <div className="px-4 pt-4 pb-4 flex flex-col gap-4">
                  {calendarTriggers.length > 0 && assets.length === 0 && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] bg-[#FFF8E1] border border-[#F5D97A]">
                      <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#946800] text-white text-[9px] font-bold leading-none">!</span>
                      <p className="text-[12px] text-[#946800] leading-relaxed flex-1">
                        <span className="font-semibold">No assignment yet.</span>{' '}
                        Assign assets, locations, or meters so this trigger can generate work orders.{' '}
                        <button type="button" onClick={() => setAssignModalOpen(true)} className="font-semibold underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity">
                          Add assignment
                        </button>
                      </p>
                    </div>
                  )}
                  {meterMissing && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] bg-[#FFF1EE] border border-[#FFCDC2]">
                      <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#CE2C31] text-white text-[9px] font-bold leading-none">!</span>
                      <p className="text-[12px] text-[#CE2C31] leading-relaxed">
                        <span className="font-semibold">{assets.filter(a => !a.meter).length} {assets.filter(a => !a.meter).length === 1 ? 'assignment is' : 'assignments are'} missing a meter.</span>{' '}
                        Assign a meter to enable this trigger.
                      </p>
                    </div>
                  )}
                  {calendarTriggers.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {calendarTriggers.map(t => (
                        <TriggerRow key={t.id} trigger={t} meterMissing={meterMissing} onRemove={() => setCalendarTriggers(ts => ts.filter(x => x.id !== t.id))} onEdit={() => setShowCalendarModal(true)} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                      <p className="text-[14px] font-semibold text-[var(--color-neutral-12)]">Create your first trigger</p>
                      <p className="text-[13px] text-[var(--color-neutral-9)]">Choose how this preventive maintenance should generate work orders.</p>
                      <Button variant="primary" size="md" onClick={() => setShowCalendarModal(true)}>
                        Create trigger
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Nova AI Panel — in-flow, pushes form left */}
      <NovaPanel
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        setTitle={setTitle}
        setDescription={setDescription}
        setCategory={setCategory}
        setPriority={setPriority}
        setDetailsOpen={setDetailsOpen}
        setAssignModalOpen={setAssignModalOpen}
        addAsset={a => setAssets(prev => [...prev, a])}
      />

      </div>{/* end flex row wrapper */}

      {/* Assign modal */}
      <AssignAssetModal
        open={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setEditingAssetId(null) }}
        onSubmit={handleAssignAsset}
        existingAssets={editingAssetId ? assets.filter(x => x.id !== editingAssetId) : assets}
        initialValues={(() => {
          const a = editingAssetId ? assets.find(x => x.id === editingAssetId) : null
          if (!a) return undefined
          const [sd, ed] = (a.timeRange || '').split('|').map(s => s.trim())
          return {
            asset: a.name ? [a.name] : [],
            location: !a.name && a.location ? [a.location] : [],
            meter: !a.name && !a.location && a.meter ? [a.meter] : [],
            primaryAssignee: a.primaryAssignee === 'Unassigned' ? '' : (a.primaryAssignee || ''),
            additionalAssignee: a.additionalAssignees || [],
            team: a.team || '',
            trigger: a.trigger || '',
            startDate: sd || '',
            endDate: ed || '',
          } satisfies AssignAssetForm
        })()}
      />

      {/* Trigger setup modal */}
      {triggerModal && (
        <TriggerSetupModal
          type={triggerModal.type}
          onClose={() => setTriggerModal(null)}
          onSave={label => {
            setAssets(list => list.map(a =>
              a.id === triggerModal.assetId ? { ...a, trigger: label, frequency: label, triggerType: triggerModal.type } : a
            ))
            setTriggerModal(null)
          }}
        />
      )}
    </>
  )
}
