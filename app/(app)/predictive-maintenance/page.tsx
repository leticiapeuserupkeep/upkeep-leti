'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  SlidersHorizontal, MoreHorizontal, X, Flag,
  ChevronDown, ChevronUp, CalendarClock, CircleDot,
  CheckCircle2, Ban,
} from 'lucide-react'
import { TableToolbar } from '@/app/components/ui/Table'

// ── Types ─────────────────────────────────────────────────────────────────

type PMStatus = 'Active' | 'Inactive' | 'Completed'
type PMPriority = 'None' | 'Low' | 'Medium' | 'High'

interface TechAvatar { initials: string; bg: string }

interface AssignmentRow {
  id: string
  asset: string
  assetType: 'Asset' | 'Location'
  location: string
  meter?: string
  technicians: TechAvatar[]
  extraTechs?: number
  woCount?: number
  lastWO?: string
  nextWO?: string
  startDate?: string
  endDate?: string
}

interface PMSchedule {
  id: string
  calendarTrigger: string
  meterTrigger?: string
  assignments: AssignmentRow[]
}

interface PMItem {
  id: string
  title: string
  description?: string
  category: string
  priority: PMPriority
  status: PMStatus
  checklist?: string
  checklistCount?: number
  schedules: PMSchedule[]
}

// For localStorage items from create page
interface LegacyPMItem {
  id: string; title: string
  assets?: Array<{ asset: string; location: string; assignee?: string; team?: string }>
  schedule?: string; status?: string; priority?: string; woCount?: number
}

// ── Avatar palette ────────────────────────────────────────────────────────

const T = {
  JS: { initials: 'JS', bg: '#1E3A5F' },
  SC: { initials: 'SC', bg: '#0D7377' },
  MG: { initials: 'MG', bg: '#6B21A8' },
  TL: { initials: 'TL', bg: '#B45309' },
  CR: { initials: 'CR', bg: '#374151' },
}

// ── Sample data ───────────────────────────────────────────────────────────

const pmItems: PMItem[] = [
  {
    id: 'pm-001',
    title: 'Quarterly HVAC filter replacement',
    description: 'Replace all air handler filters and inspect ductwork for debris',
    category: 'Maintenance',
    priority: 'Medium',
    status: 'Active',
    checklist: 'HVAC Maintenance Checklist',
    checklistCount: 2,
    schedules: [
      {
        id: 's1',
        calendarTrigger: 'Every 3 Months · At 08:00 AM',
        assignments: [
          { id: 'a1', asset: 'HVAC Unit AHU-01', assetType: 'Asset', location: 'Main Building — Floor 1', technicians: [T.JS, T.SC], woCount: 8, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'a2', asset: 'HVAC Unit AHU-02', assetType: 'Asset', location: 'Main Building — Floor 2', technicians: [T.JS], woCount: 8, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'a3', asset: 'HVAC Unit AHU-03', assetType: 'Asset', location: 'Warehouse Zone A', technicians: [T.SC], woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        ],
      },
    ],
  },
  {
    id: 'pm-002',
    title: 'Monthly fire extinguisher inspection',
    description: 'Visual inspection and pressure check of all fire suppression units',
    category: 'Safety',
    priority: 'High',
    status: 'Active',
    checklist: 'Fire Safety Checklist',
    checklistCount: 4,
    schedules: [
      {
        id: 's2a',
        calendarTrigger: 'Every 2 Weeks · On Mondays · At 11:00 AM',
        meterTrigger: 'When reading is greater than 4 units',
        assignments: [
          { id: 'b1', asset: 'Fire Extinguisher FE-12', assetType: 'Asset', location: 'Warehouse Zone B', technicians: [T.MG, T.TL], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'b2', asset: 'Fire Extinguisher FE-07', assetType: 'Asset', location: 'Main Building — Floor 1', technicians: [T.MG, T.TL], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        ],
      },
      {
        id: 's2b',
        calendarTrigger: 'Every 2 Weeks · On Mondays · At 11:00 AM',
        meterTrigger: 'When reading is greater than 4 units',
        assignments: [
          { id: 'b3', asset: 'Fire Extinguisher FE-03', assetType: 'Asset', location: 'R&D Lab', technicians: [T.CR, T.MG], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'b4', asset: 'Fire Extinguisher FE-15', assetType: 'Asset', location: 'Utility Room', technicians: [T.TL, T.CR], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        ],
      },
    ],
  },
  {
    id: 'pm-003',
    title: 'Annual electrical panel inspection',
    description: 'Full thermal imaging and breaker testing for all distribution panels',
    category: 'Electrical',
    priority: 'High',
    status: 'Active',
    schedules: [
      {
        id: 's3',
        calendarTrigger: 'Every 1 Year · At 07:00 AM',
        assignments: [
          { id: 'c1', asset: 'Panel EP-01', assetType: 'Asset', location: 'Main Building — Basement', technicians: [T.CR], woCount: 3, lastWO: '02/20', nextWO: '02/20/27', startDate: '02/20', endDate: '02/20/27' },
          { id: 'c2', asset: 'Panel EP-03', assetType: 'Asset', location: 'R&D Lab', technicians: [T.CR], woCount: 3, lastWO: '02/20', nextWO: '02/20/27', startDate: '02/20', endDate: '02/20/27' },
        ],
      },
    ],
  },
  {
    id: 'pm-004',
    title: 'Forklift battery check',
    description: 'Battery voltage, electrolyte level, and charging station inspection',
    category: 'Fleet',
    priority: 'Medium',
    status: 'Active',
    checklist: 'Battery Inspection Checklist',
    checklistCount: 1,
    schedules: [
      {
        id: 's4',
        calendarTrigger: 'Every 2 Weeks · On Mondays',
        meterTrigger: 'When reading is above 500 hours',
        assignments: [
          { id: 'd1', asset: 'Forklift FL-204', assetType: 'Asset', location: 'Warehouse Zone A', technicians: [T.TL, T.JS], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'd2', asset: 'Forklift FL-205', assetType: 'Asset', location: 'Warehouse Zone A', technicians: [T.TL, T.JS], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        ],
      },
    ],
  },
  {
    id: 'pm-005',
    title: 'Conveyor belt lubrication',
    description: 'Apply food-grade lubricant to all conveyor rollers and tensioners',
    category: 'Operations',
    priority: 'Low',
    status: 'Active',
    schedules: [
      {
        id: 's5',
        calendarTrigger: 'Every 1 Week · On Fridays',
        assignments: [
          { id: 'e1', asset: 'Conveyor Belt CB-12', assetType: 'Asset', location: 'Production Floor', technicians: [T.SC], woCount: 36, lastWO: '07/19', nextWO: '07/25/26', startDate: '07/19', endDate: '07/25/26' },
          { id: 'e2', asset: 'Conveyor Belt CB-14', assetType: 'Asset', location: 'Production Floor', technicians: [T.SC, T.CR], woCount: 36, lastWO: '07/19', nextWO: '07/25/26', startDate: '07/19', endDate: '07/25/26' },
          { id: 'e3', asset: 'Conveyor Belt CB-09', assetType: 'Asset', location: 'Warehouse Zone B', technicians: [T.TL], woCount: 12, lastWO: '07/19', nextWO: '07/26/26', startDate: '07/19', endDate: '07/26/26' },
        ],
      },
    ],
  },
  {
    id: 'pm-006',
    title: 'Emergency generator load bank test',
    description: 'Full load test at 100% rated capacity for minimum 2 hours',
    category: 'Electrical',
    priority: 'High',
    status: 'Active',
    checklist: 'Generator Test Procedure',
    checklistCount: 3,
    schedules: [
      {
        id: 's6',
        calendarTrigger: 'Every 1 Month · At 06:00 AM',
        assignments: [
          { id: 'f1', asset: 'Generator GEN-01', assetType: 'Asset', location: 'Utility Room', technicians: [T.JS, T.CR], woCount: 18, lastWO: '07/10', nextWO: '08/10/26', startDate: '07/10', endDate: '08/10/26' },
        ],
      },
    ],
  },
  {
    id: 'pm-007',
    title: 'Compressor oil change',
    description: 'Drain, flush, and refill compressor oil with manufacturer-approved grade',
    category: 'Maintenance',
    priority: 'Medium',
    status: 'Active',
    schedules: [
      {
        id: 's7',
        calendarTrigger: 'Every 6 Months · At 07:00 AM',
        assignments: [
          { id: 'g1', asset: 'Compressor CR-01', assetType: 'Asset', location: 'Cold Room', technicians: [T.MG], woCount: 6, lastWO: '07/05', nextWO: '01/05/27', startDate: '07/05', endDate: '01/05/27' },
          { id: 'g2', asset: 'Compressor CR-02', assetType: 'Asset', location: 'Cold Room', technicians: [T.MG], woCount: 6, lastWO: '07/08', nextWO: '01/08/27', startDate: '07/08', endDate: '01/08/27' },
        ],
      },
    ],
  },
  {
    id: 'pm-008',
    title: 'Roof drain seasonal cleaning',
    description: 'Clear debris from all roof drainage points and inspect gutters',
    category: 'Facilities',
    priority: 'Low',
    status: 'Inactive',
    schedules: [
      {
        id: 's8',
        calendarTrigger: 'Every 3 Months · At 09:00 AM',
        assignments: [
          { id: 'h1', asset: 'Roof Drain RD-N', assetType: 'Asset', location: 'Main Building — Rooftop North', technicians: [T.CR], woCount: 4, lastWO: '07/01', nextWO: '10/01/26', startDate: '07/01', endDate: '10/01/26' },
          { id: 'h2', asset: 'Roof Drain RD-S', assetType: 'Asset', location: 'Main Building — Rooftop South', technicians: [T.CR], woCount: 4, lastWO: '07/01', nextWO: '10/01/26', startDate: '07/01', endDate: '10/01/26' },
        ],
      },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function totalAssignments(pm: PMItem) {
  return pm.schedules.reduce((n, s) => n + s.assignments.length, 0)
}

function convertLegacy(item: LegacyPMItem): PMItem {
  return {
    id: item.id,
    title: item.title || 'Untitled PM',
    category: 'Maintenance',
    priority: (['None','Low','Medium','High'].includes(item.priority ?? '') ? item.priority as PMPriority : 'None'),
    status: (['Active','Inactive','Completed'].includes(item.status ?? '') ? item.status as PMStatus : 'Active'),
    schedules: [{
      id: `${item.id}-s1`,
      calendarTrigger: item.schedule ?? 'Scheduled trigger',
      assignments: (item.assets ?? []).map((a, i) => ({
        id: `${item.id}-a${i}`,
        asset: a.asset,
        assetType: 'Asset' as const,
        location: a.location ?? '',
        technicians: a.assignee
          ? [{ initials: a.assignee.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase(), bg: '#374151' }]
          : [],
      })),
    }],
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

const statusConfig: Record<PMStatus, { label: string; color: string; bg: string; Icon: typeof CircleDot }> = {
  Active:    { label: 'Active',    color: 'text-[var(--color-info)]',     bg: 'bg-[var(--color-info-light)]',    Icon: CircleDot },
  Inactive:  { label: 'Inactive',  color: 'text-[var(--color-neutral-7)]', bg: 'bg-[var(--color-neutral-3)]',   Icon: Ban },
  Completed: { label: 'Completed', color: 'text-[var(--color-success)]',  bg: 'bg-[var(--color-success-light)]', Icon: CheckCircle2 },
}

const priorityConfig: Record<PMPriority, { label: string; color: string }> = {
  None:   { label: 'None',   color: 'text-[var(--color-neutral-5)]' },
  Low:    { label: 'Low',    color: 'text-[var(--color-success)]' },
  Medium: { label: 'Medium', color: 'text-[var(--color-warning)]' },
  High:   { label: 'High',   color: 'text-[var(--color-error)]' },
}

function StatusBadge({ status }: { status: PMStatus }) {
  const { label, color, bg, Icon } = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${color} ${bg}`}>
      <Icon size={10} />{label}
    </span>
  )
}

function PriorityCell({ priority }: { priority: PMPriority }) {
  const { label, color } = priorityConfig[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${color}`}>
      <Flag size={12} fill="currentColor" />{label}
    </span>
  )
}

function AvatarStack({ techs, extra = 0 }: { techs: TechAvatar[]; extra?: number }) {
  const visible = techs.slice(0, 3)
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((t, i) => (
        <span key={i} style={{ background: t.bg }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-[10px] font-bold ring-2 ring-[var(--surface-primary)] shrink-0">
          {t.initials}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-neutral-4)] text-[var(--color-neutral-8)] text-[10px] font-bold ring-2 ring-[var(--surface-primary)] shrink-0">
          +{extra}
        </span>
      )}
    </div>
  )
}

function Checkbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange}
      className={`w-[18px] h-[18px] rounded-[var(--radius-sm)] border flex items-center justify-center cursor-pointer transition-all shrink-0
        ${checked || indeterminate ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-5)] bg-[var(--surface-primary)] hover:border-[var(--color-neutral-7)]'}`}>
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {!checked && indeterminate && <svg width="8" height="2" viewBox="0 0 8 2" fill="none"><rect x="0" y="0.5" width="8" height="1" rx="0.5" fill="white"/></svg>}
    </button>
  )
}

function FilterChip({ children, active, icon, hasDropdown, onRemove }: {
  children: React.ReactNode; active?: boolean; icon?: React.ReactNode; hasDropdown?: boolean; onRemove?: () => void
}) {
  return (
    <button type="button" className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-[var(--radius-md)] border text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer
      ${active ? 'border-[var(--color-accent-9)] text-[var(--color-accent-9)] bg-[var(--color-accent-1)]' : 'border-[var(--border-default)] text-[var(--color-neutral-9)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-3)]'}`}>
      {icon}{children}
      {hasDropdown && <ChevronDown size={12} />}
      {onRemove && <X size={12} className="ml-0.5 opacity-60 hover:opacity-100" onClick={e => { e.stopPropagation(); onRemove() }} />}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

const COLS = [
  { key: 'title',    label: 'Title',                   cls: '' },
  { key: 'cat',      label: 'Category',                cls: 'w-[130px]' },
  { key: 'pri',      label: 'Priority',                cls: 'w-[110px]' },
  { key: 'status',   label: 'Status',                  cls: 'w-[110px]' },
  { key: 'checklist',label: 'Checklist',               cls: 'w-[200px]' },
  { key: 'schedules',label: 'Schedules / Assignments', cls: 'w-[220px]' },
  { key: 'actions',  label: '',                        cls: 'w-[48px]' },
  { key: 'expand',   label: '',                        cls: 'w-[48px]' },
]

const SCHED_COLS = ['Assignments', 'Meter', 'Technicians', 'Work Orders', 'Start / End']

export default function PreventiveMaintenancePage() {
  const [search, setSearch] = useState('')
  const [expandedPMs, setExpandedPMs] = useState<Set<string>>(new Set())
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set())
  const [selectedPMs, setSelectedPMs] = useState<Set<string>>(new Set())
  const [toolbarPortal, setToolbarPortal] = useState<HTMLElement | null>(null)
  const [newItems, setNewItems] = useState<PMItem[]>([])

  useEffect(() => {
    setToolbarPortal(document.getElementById('table-toolbar-portal'))
    try {
      const stored = JSON.parse(localStorage.getItem('upkeep_new_pms') ?? '[]') as LegacyPMItem[]
      if (stored.length) setNewItems(stored.map(convertLegacy))
    } catch {}
  }, [])

  const allItems = [...newItems, ...pmItems]

  const filtered = allItems.filter(pm => {
    const q = search.toLowerCase()
    return !q
      || pm.title.toLowerCase().includes(q)
      || pm.category.toLowerCase().includes(q)
      || pm.schedules.some(s => s.assignments.some(a => a.asset.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)))
  })

  function togglePM(id: string) {
    const isOpening = !expandedPMs.has(id)
    setExpandedPMs(prev => { const n = new Set(prev); isOpening ? n.add(id) : n.delete(id); return n })
    if (isOpening) {
      const pm = filtered.find(p => p.id === id)
      if (pm) setExpandedSchedules(prev => { const n = new Set(prev); pm.schedules.forEach(s => n.add(`${id}|${s.id}`)); return n })
    } else {
      setExpandedSchedules(prev => { const n = new Set(prev); [...n].forEach(k => k.startsWith(`${id}|`) && n.delete(k)); return n })
    }
  }

  function toggleSched(pmId: string, schedId: string) {
    const key = `${pmId}|${schedId}`
    setExpandedSchedules(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const allSel = filtered.length > 0 && selectedPMs.size === filtered.length
  const someSel = selectedPMs.size > 0 && !allSel

  return (
    <div className="flex flex-col flex-1 w-full relative">
      {toolbarPortal && createPortal(
        <TableToolbar
          itemCountLabel={`${filtered.length} of ${allItems.length} items`}
          sortLabel="Sort: Work Order Title"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search"
        />,
        toolbarPortal
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">

          {/* Filter chips row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <FilterChip active icon={<SlidersHorizontal size={13} />}>Filters (2)</FilterChip>
            <FilterChip active icon={<CircleDot size={13} />} onRemove={() => {}}>Status: Open +2</FilterChip>
            <FilterChip hasDropdown>Priority</FilterChip>
            <FilterChip hasDropdown>Location</FilterChip>
            <FilterChip hasDropdown>Asset</FilterChip>
            <FilterChip hasDropdown>Assigned To</FilterChip>
            <div className="flex-1" />
            <button type="button" className="text-[13px] font-medium text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer">Reset</button>
            <button type="button" className="text-[13px] font-medium text-[var(--color-accent-9)] hover:text-[var(--color-accent-10)] transition-colors cursor-pointer">Save View</button>
            <button type="button" className="inline-flex items-center gap-1 h-7 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[13px] font-medium text-[var(--color-neutral-9)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
              Saved Views<ChevronDown size={12} />
            </button>
          </div>

          {/* Table card */}
          <div className="bg-[var(--surface-primary)] rounded-[var(--widget-radius)] border border-[var(--widget-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {/* Select-all checkbox */}
                    <th className="py-3 pl-6 pr-3 border-b border-[var(--border-default)] w-[52px] align-middle">
                      <Checkbox
                        checked={allSel}
                        indeterminate={someSel}
                        onChange={() => setSelectedPMs(allSel ? new Set() : new Set(filtered.map(p => p.id)))}
                      />
                    </th>
                    {COLS.map(col => (
                      <th key={col.key}
                        className={`${col.cls} text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--color-neutral-8)] h-11 px-4 border-b border-[var(--border-default)] whitespace-nowrap align-middle`}>
                        {col.label && (
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            <ChevronDown size={11} className="text-[var(--color-neutral-5)]" />
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(pm => {
                    const isExpanded = expandedPMs.has(pm.id)
                    const schedCount = pm.schedules.length
                    const assnCount = totalAssignments(pm)

                    return (
                      <React.Fragment key={pm.id}>
                        {/* Main PM row */}
                        <tr
                          className={`border-b border-[var(--border-default)] transition-colors group cursor-pointer
                            ${isExpanded ? 'bg-[var(--color-neutral-2)]' : selectedPMs.has(pm.id) ? 'bg-[var(--color-accent-1)]' : 'hover:bg-[var(--color-neutral-2)]'}`}
                          onClick={() => togglePM(pm.id)}
                        >
                          {/* Checkbox */}
                          <td className="py-4 pl-6 pr-3 w-[52px] align-middle" onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedPMs.has(pm.id)}
                              onChange={() => setSelectedPMs(prev => { const n = new Set(prev); n.has(pm.id) ? n.delete(pm.id) : n.add(pm.id); return n })}
                            />
                          </td>

                          {/* Title + description */}
                          <td className="px-4 py-4 align-middle">
                            <p className="text-[13px] font-semibold text-[var(--color-neutral-12)] leading-5">{pm.title}</p>
                            {pm.description && (
                              <p className="text-[12px] text-[var(--color-neutral-7)] leading-4 mt-0.5 max-w-[320px] truncate">{pm.description}</p>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-4 align-middle">
                            <span className="text-[13px] text-[var(--color-neutral-9)]">{pm.category}</span>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-4 align-middle">
                            <PriorityCell priority={pm.priority} />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 align-middle">
                            <StatusBadge status={pm.status} />
                          </td>

                          {/* Checklist */}
                          <td className="px-4 py-4 align-middle">
                            {pm.checklist ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[13px] text-[var(--color-neutral-9)] truncate">{pm.checklist}</span>
                                {pm.checklistCount !== undefined && pm.checklistCount > 0 && (
                                  <span className="inline-flex items-center justify-center h-5 min-w-[22px] px-1.5 rounded-full bg-[var(--color-accent-2)] border border-[var(--color-accent-4)] text-[10px] font-semibold text-[var(--color-accent-9)] shrink-0">
                                    +{pm.checklistCount}
                                  </span>
                                )}
                              </div>
                            ) : <span className="text-[var(--color-neutral-5)]">—</span>}
                          </td>

                          {/* Schedules / Assignments */}
                          <td className="px-4 py-4 align-middle">
                            <span className="text-[13px] text-[var(--color-neutral-9)]">
                              {schedCount} {schedCount === 1 ? 'Schedule' : 'Schedules'}
                              <span className="mx-1.5 text-[var(--color-neutral-4)]">|</span>
                              {assnCount} {assnCount === 1 ? 'Assignment' : 'Assignments'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-2 py-4 align-middle" onClick={e => e.stopPropagation()}>
                            <button className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)] transition-all cursor-pointer">
                              <MoreHorizontal size={15} />
                            </button>
                          </td>

                          {/* Expand chevron */}
                          <td className="px-2 py-4 align-middle">
                            <div className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-7)] transition-colors cursor-pointer">
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded schedules section */}
                        {isExpanded && (
                          <tr className="border-b border-[var(--border-default)]">
                            <td colSpan={9} className="p-0 bg-[var(--color-neutral-2)]">
                              <div className="px-6 py-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-7)] mb-3">Schedules</p>
                                <div className="flex flex-col gap-3">
                                  {pm.schedules.map(sched => {
                                    const key = `${pm.id}|${sched.id}`
                                    const isSchedExp = expandedSchedules.has(key)
                                    return (
                                      <div key={sched.id} className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden shadow-[var(--shadow-xs)]">
                                        {/* Schedule card header */}
                                        <div
                                          className="flex items-center gap-2.5 px-4 py-3.5 cursor-pointer hover:bg-[var(--color-neutral-2)] transition-colors select-none"
                                          onClick={() => toggleSched(pm.id, sched.id)}
                                        >
                                          <CalendarClock size={14} className="text-[var(--color-neutral-6)] shrink-0" />
                                          <span className="text-[13px] font-medium text-[var(--color-neutral-11)]">{sched.calendarTrigger}</span>
                                          {sched.meterTrigger && (
                                            <>
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-[var(--border-default)] text-[10px] font-semibold text-[var(--color-neutral-7)] shrink-0 leading-none">
                                                or
                                              </span>
                                              <span className="text-[13px] font-medium text-[var(--color-neutral-11)]">{sched.meterTrigger}</span>
                                            </>
                                          )}
                                          <div className="flex-1" />
                                          <span className="rounded-full bg-[var(--color-accent-2)] text-[var(--color-accent-9)] text-[11px] px-2.5 py-0.5 font-semibold shrink-0">
                                            {sched.assignments.length} Assignment{sched.assignments.length !== 1 ? 's' : ''}
                                          </span>
                                          {isSchedExp
                                            ? <ChevronUp size={15} className="text-[var(--color-neutral-6)] shrink-0" />
                                            : <ChevronDown size={15} className="text-[var(--color-neutral-6)] shrink-0" />
                                          }
                                        </div>

                                        {/* Assignment sub-table */}
                                        {isSchedExp && (
                                          <div className="border-t border-[var(--border-default)]">
                                            <table className="w-full">
                                              <thead>
                                                <tr className="bg-[var(--color-neutral-2)]">
                                                  {SCHED_COLS.map(h => (
                                                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-neutral-7)] whitespace-nowrap border-b border-[var(--border-subtle)]">
                                                      {h}
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {sched.assignments.map((a, idx) => (
                                                  <tr key={a.id} className={`${idx < sched.assignments.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''} hover:bg-[var(--color-neutral-2)] transition-colors`}>
                                                    {/* Asset */}
                                                    <td className="px-4 py-3">
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[13px] font-semibold text-[var(--color-neutral-11)]">{a.asset}</span>
                                                        <span className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] text-[10px] font-medium text-[var(--color-neutral-8)]">
                                                          {a.assetType}
                                                        </span>
                                                      </div>
                                                      <p className="text-[11px] text-[var(--color-neutral-7)] mt-0.5">{a.location}</p>
                                                    </td>

                                                    {/* Meter */}
                                                    <td className="px-4 py-3 text-[13px] text-[var(--color-neutral-6)]">
                                                      {a.meter ?? '—'}
                                                    </td>

                                                    {/* Technicians */}
                                                    <td className="px-4 py-3">
                                                      {a.technicians.length > 0
                                                        ? <AvatarStack techs={a.technicians} extra={a.extraTechs} />
                                                        : <span className="text-[var(--color-neutral-5)] text-[13px]">—</span>
                                                      }
                                                    </td>

                                                    {/* Work Orders */}
                                                    <td className="px-4 py-3">
                                                      {a.woCount !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                          <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[var(--color-neutral-12)] text-white text-[10px] font-bold shrink-0">
                                                            {a.woCount}
                                                          </span>
                                                          <span className="text-[11px] text-[var(--color-neutral-7)] leading-4">
                                                            {a.lastWO && (
                                                              <>Last: <Link href="#" className="text-[var(--color-accent-9)] hover:underline">{a.lastWO}</Link></>
                                                            )}
                                                            {a.nextWO && <> &nbsp;Next: {a.nextWO}</>}
                                                          </span>
                                                        </div>
                                                      ) : <span className="text-[var(--color-neutral-5)]">—</span>}
                                                    </td>

                                                    {/* Start / End */}
                                                    <td className="px-4 py-3 text-[11px] text-[var(--color-neutral-8)] leading-5">
                                                      {a.startDate && <p>Start: {a.startDate}</p>}
                                                      {a.endDate && <p>End: {a.endDate}</p>}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <CalendarClock size={36} className="text-[var(--color-neutral-5)] mb-3" />
                  <p className="text-[14px] font-semibold text-[var(--color-neutral-9)]">No preventive maintenance found</p>
                  <p className="text-[13px] text-[var(--color-neutral-7)] mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Table footer */}
            <div className="px-6 py-3 border-t border-[var(--border-subtle)]">
              <p className="text-[12px] text-[var(--color-neutral-7)]">
                {filtered.length} of {allItems.length} preventive maintenance schedules
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
