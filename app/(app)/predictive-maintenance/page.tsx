'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as Popover from '@radix-ui/react-popover'
import {
  SlidersHorizontal, MoreHorizontal, X, Flag,
  ChevronDown, ChevronUp, CalendarClock, CircleDot,
  CheckCircle2, Ban, Trash2, Tag, Pencil, Plus, Search,
} from 'lucide-react'
import { TableToolbar } from '@/app/components/ui/Table'
import { Tooltip, TooltipProvider, Avatar } from '@/app/components/ui'
import { PMDrawer } from '@/app/components/pm/PMDrawer'
import { pmItems as mockPMItems } from '@/app/lib/pm-data'

// ── Types ─────────────────────────────────────────────────────────────────

type PMStatus = 'Active' | 'Inactive' | 'Completed' | 'Draft'
type PMPriority = 'None' | 'Low' | 'Medium' | 'High'

interface TechAvatar { initials: string; bg: string }

interface AssignmentRow {
  id: string
  asset: string
  assetType: 'Asset' | 'Location' | 'Meter'
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
  checklists?: string[]
  schedules: PMSchedule[]
}

// For localStorage items from create page
interface LegacyPMItem {
  id: string; title: string
  assets?: Array<{ asset: string; location: string; assignees?: string[]; assignee?: string; team?: string }>
  schedules?: Array<{
    id: string; calendarTrigger: string; meterTrigger?: string
    assignments: Array<{ id: string; asset: string; assetType: string; location: string; meter?: string; startDate?: string; endDate?: string; assignees?: string[]; assignee?: string; team?: string }>
  }>
  schedule?: string; status?: string; priority?: string; woCount?: number
}

// ── Sample data (from shared lib) ────────────────────────────────────────

const pmItems: PMItem[] = mockPMItems as unknown as PMItem[]

// ── Helpers ───────────────────────────────────────────────────────────────

function totalAssignments(pm: PMItem) {
  return pm.schedules.reduce((n, s) => n + s.assignments.length, 0)
}

function displayDate(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${m.padStart(2,'0')}/${d.padStart(2,'0')}/${y}`
}

function convertLegacy(item: LegacyPMItem): PMItem {
  const makeTechs = (names?: string[], fallback?: string): TechAvatar[] => {
    const list = names?.length ? names : (fallback ? [fallback] : [])
    return list.map(n => ({ initials: n.split(' ').map((p: string) => p[0]).join('').slice(0,2).toUpperCase(), bg: '#374151' }))
  }

  const schedules: PMSchedule[] = item.schedules && item.schedules.length > 0
    ? item.schedules.map(s => ({
        id: s.id,
        calendarTrigger: s.calendarTrigger,
        meterTrigger: s.meterTrigger,
        assignments: s.assignments.map(a => ({
          id: a.id,
          asset: a.asset,
          assetType: (a.assetType === 'Location' ? 'Location' : 'Asset') as 'Asset' | 'Location',
          location: a.location ?? '',
          meter: a.meter,
          startDate: a.startDate,
          endDate: a.endDate,
          technicians: makeTechs(a.assignees, a.assignee),
        })),
      }))
    : [{
        id: `${item.id}-s1`,
        calendarTrigger: item.schedule ?? 'Scheduled trigger',
        assignments: (item.assets ?? []).map((a, i) => ({
          id: `${item.id}-a${i}`,
          asset: a.asset,
          assetType: 'Asset' as const,
          location: a.location ?? '',
          technicians: makeTechs(a.assignees, a.assignee),
        })),
      }]

  return {
    id: item.id,
    title: item.title || 'Untitled PM',
    category: 'Maintenance',
    priority: (['None','Low','Medium','High'].includes(item.priority ?? '') ? item.priority as PMPriority : 'None'),
    status: (['Active','Inactive','Completed','Draft'].includes(item.status ?? '') ? item.status as PMStatus : 'Active'),
    schedules,
  }
}

function getEditPayload(pm: PMItem): object {
  try {
    const stored: LegacyPMItem[] = JSON.parse(localStorage.getItem('upkeep_new_pms') ?? '[]')
    const original = stored.find(x => x.id === pm.id)
    if (original) return original
  } catch {}
  return pm
}

// ── Sub-components ────────────────────────────────────────────────────────

const statusConfig: Record<PMStatus, { label: string; color: string; bg: string }> = {
  Active:    { label: 'ACTIVE',    color: 'text-[var(--color-success)]',   bg: 'bg-[var(--color-success-light)]' },
  Inactive:  { label: 'PAUSED',    color: 'text-[#92400E]',                bg: 'bg-[#FEF3C7]'                    },
  Completed: { label: 'COMPLETED', color: 'text-[var(--color-neutral-7)]', bg: 'bg-[var(--color-neutral-3)]'    },
  Draft:     { label: 'DRAFT',     color: 'text-[var(--color-neutral-7)]', bg: 'bg-[var(--color-neutral-3)]'    },
}

const priorityConfig: Record<PMPriority, { label: string; color: string }> = {
  None:   { label: 'None',   color: 'text-[var(--color-neutral-5)]' },
  Low:    { label: 'Low',    color: 'text-[var(--color-success)]' },
  Medium: { label: 'Medium', color: 'text-[var(--color-warning)]' },
  High:   { label: 'High',   color: 'text-[var(--color-error)]' },
}

function StatusBadge({ status }: { status: PMStatus }) {
  const { label, color, bg } = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.04em] ${color} ${bg}`}>
      {label}
    </span>
  )
}

function PriorityCell({ priority }: { priority: PMPriority }) {
  const { label, color } = priorityConfig[priority]
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-neutral-9)]">
      <Flag size={12} fill="currentColor" className={color} />{label}
    </span>
  )
}

function AvatarStack({ techs, extra = 0 }: { techs: TechAvatar[]; extra?: number }) {
  const visible = techs.slice(0, 3)
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((t, i) => (
        <Avatar key={i} name={t.initials.split('').join(' ')} size="xs" className="ring-2 ring-[var(--surface-primary)]" />
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-neutral-4)] text-[var(--color-neutral-8)] text-[9px] font-bold ring-2 ring-[var(--surface-primary)] shrink-0">
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
  { key: 'title',       label: 'Title',       cls: '' },
  { key: 'schedules',   label: 'Schedules',   cls: 'w-[220px]' },
  { key: 'assignments', label: 'Assignments', cls: 'w-[180px]' },
  { key: 'cat',         label: 'Category',    cls: 'w-[130px]' },
  { key: 'pri',         label: 'Priority',    cls: 'w-[110px]' },
  { key: 'status',      label: 'Status',      cls: 'w-[110px]' },
  { key: 'actions',     label: '',            cls: 'w-[48px]' },
  { key: 'expand',      label: '',            cls: 'w-[48px]' },
]

const SCHED_COLS = ['Assignments', 'Meter', 'Technicians', 'Work Orders', 'Start / End']

export default function PreventiveMaintenancePage() {
  const [search, setSearch] = useState('')
  const [expandedPMs, setExpandedPMs] = useState<Set<string>>(new Set())
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set())
  const [selectedPMs, setSelectedPMs] = useState<Set<string>>(new Set())
  const [toolbarPortal, setToolbarPortal] = useState<HTMLElement | null>(null)
  const [newItems, setNewItems] = useState<PMItem[]>([])
  const [skeletonRowId, setSkeletonRowId] = useState<string | null>(null)
  const [fadingInId, setFadingInId] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [inlineEdit, setInlineEdit] = useState<{ pmId: string; field: 'status' | 'priority' | 'category' } | null>(null)
  const inlineEditRef = useRef<HTMLDivElement>(null)
  const [pmOverrides, setPMOverrides] = useState<Record<string, Partial<Pick<PMItem, 'status' | 'priority' | 'category'>>>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [pageReady, setPageReady] = useState(false)
  const [bulkMenu, setBulkMenu] = useState<'priority' | 'status' | 'category' | null>(null)
  const bulkMenuRef = useRef<HTMLDivElement>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [selectedPM, setSelectedPM] = useState<PMItem | null>(null)
  // Which drawer section to land on — the schedule titles deep-link to Schedules.
  const [drawerTab, setDrawerTab] = useState<'Details' | 'Schedules'>('Details')
  const openDrawer = (pm: PMItem, tab: 'Details' | 'Schedules' = 'Details') => { setDrawerTab(tab); setSelectedPM(pm) }
  const [createdToast, setCreatedToast] = useState<{ title: string; scheduleCount: number; assignmentCount: number } | null>(null)
  const router = useRouter()

  const [filterPriority, setFilterPriority] = useState<string[]>([])
  const [filterLocation, setFilterLocation] = useState<string[]>([])
  const [filterAsset, setFilterAsset] = useState<string[]>([])
  const [filterAssignee, setFilterAssignee] = useState<string[]>([])

  const PM_CATEGORIES = ['Maintenance', 'Safety', 'Electrical', 'Fleet', 'Operations', 'Facilities', 'Compliance', 'Other']

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
      if (inlineEditRef.current && !inlineEditRef.current.contains(e.target as Node)) {
        setInlineEdit(null)
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setBulkMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setToolbarPortal(document.getElementById('table-toolbar-portal'))
    setPageReady(true)
    try {
      const stored = JSON.parse(localStorage.getItem('upkeep_new_pms') ?? '[]') as LegacyPMItem[]
      if (stored.length) setNewItems(stored.map(convertLegacy))
      const deleted = JSON.parse(localStorage.getItem('upkeep_deleted_pm_ids') ?? '[]') as string[]
      if (deleted.length) setDeletedIds(new Set(deleted))
      const skelId = localStorage.getItem('upkeep_pm_skeleton_id')
      if (skelId) {
        localStorage.removeItem('upkeep_pm_skeleton_id')
        setSkeletonRowId(skelId)
        setTimeout(() => { setSkeletonRowId(null); setFadingInId(skelId) }, 1500)
        setTimeout(() => setFadingInId(null), 2500)
      }
      const toastRaw = localStorage.getItem('upkeep_pm_created_toast')
      if (toastRaw) {
        localStorage.removeItem('upkeep_pm_created_toast')
        const t = JSON.parse(toastRaw)
        setCreatedToast(t)
        setTimeout(() => setCreatedToast(null), 5000)
      }
    } catch {}
  }, [])

  const allItems = [...newItems, ...pmItems]
    .filter(pm => !deletedIds.has(pm.id))
    .filter((pm, idx, arr) => arr.findIndex(x => x.id === pm.id) === idx)

  const allAssignments = allItems.flatMap(pm => pm.schedules.flatMap(s => s.assignments))
  const priorityOptions: string[] = ['None', 'Low', 'Medium', 'High']
  const locationOptions = Array.from(new Set(allAssignments.map(a => a.location).filter(Boolean))).sort()
  const assetOptions = Array.from(new Set(allAssignments.map(a => a.asset).filter(Boolean))).sort()
  const assigneeOptions = Array.from(new Set(allAssignments.flatMap(a => a.technicians.map(t => t.initials)))).sort()

  const filtered = allItems.filter(pm => {
    const effectivePriority = (pmOverrides[pm.id]?.priority ?? pm.priority) as string
    const q = search.toLowerCase()
    if (q && !pm.title.toLowerCase().includes(q) && !pm.category.toLowerCase().includes(q)
      && !pm.schedules.some(s => s.assignments.some(a => a.asset.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)))) return false
    if (filterPriority.length && !filterPriority.includes(effectivePriority)) return false
    if (filterLocation.length && !pm.schedules.some(s => s.assignments.some(a => filterLocation.includes(a.location)))) return false
    if (filterAsset.length && !pm.schedules.some(s => s.assignments.some(a => filterAsset.includes(a.asset)))) return false
    if (filterAssignee.length && !pm.schedules.some(s => s.assignments.some(a => a.technicians.some(t => filterAssignee.includes(t.initials))))) return false
    return true
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

  const deleteTarget = deleteConfirmId ? allItems.find(p => p.id === deleteConfirmId) ?? null : null

  return (
    <TooltipProvider delayDuration={300}>
    <style>{`
      @keyframes pm-row-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .pm-row-entry {
        animation: pm-row-in 350ms ease-out both;
      }
      @keyframes fadeInRow {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
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

      {/* Bulk action bar */}
      {selectedPMs.size > 0 && (
        <div ref={bulkMenuRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 h-[60px] px-2 rounded-[4px] bg-[var(--color-neutral-12)] shadow-[var(--shadow-lg)] text-white">
          <span className="text-[13px] font-semibold text-white/60 px-2 shrink-0">{selectedPMs.size} selected</span>
          <div className="w-px h-5 bg-white/15 mx-1 shrink-0" />

          {/* Priority bulk */}
          <div className="relative">
            <button type="button" onClick={() => setBulkMenu(bulkMenu === 'priority' ? null : 'priority')}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-[var(--radius-lg)] text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0">
              Priority <ChevronDown size={12} className="opacity-60" />
            </button>
            {bulkMenu === 'priority' && (
              <div className="absolute bottom-full mb-2 left-0 w-[150px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 z-10">
                {(['None', 'Low', 'Medium', 'High'] as PMPriority[]).map(pri => (
                  <button key={pri} onClick={() => {
                    setPMOverrides(p => {
                      const next = { ...p }
                      selectedPMs.forEach(id => { next[id] = { ...next[id], priority: pri } })
                      return next
                    })
                    setBulkMenu(null)
                  }} className="w-full flex items-center px-3 py-1.5 hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer">
                    <PriorityCell priority={pri} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status bulk */}
          <div className="relative">
            <button type="button" onClick={() => setBulkMenu(bulkMenu === 'status' ? null : 'status')}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-[var(--radius-lg)] text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0">
              Status <ChevronDown size={12} className="opacity-60" />
            </button>
            {bulkMenu === 'status' && (
              <div className="absolute bottom-full mb-2 left-0 w-[150px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 z-10">
                {(['Active', 'Inactive', 'Draft'] as PMStatus[]).map(st => (
                  <button key={st} onClick={() => {
                    setPMOverrides(p => {
                      const next = { ...p }
                      selectedPMs.forEach(id => { next[id] = { ...next[id], status: st } })
                      return next
                    })
                    setBulkMenu(null)
                  }} className="w-full flex items-center px-3 py-1.5 hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer">
                    <StatusBadge status={st} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category bulk */}
          <div className="relative">
            <button type="button" onClick={() => setBulkMenu(bulkMenu === 'category' ? null : 'category')}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-[var(--radius-lg)] text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0">
              Category <ChevronDown size={12} className="opacity-60" />
            </button>
            {bulkMenu === 'category' && (
              <div className="absolute bottom-full mb-2 left-0 w-[180px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 z-10">
                {PM_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => {
                    setPMOverrides(p => {
                      const next = { ...p }
                      selectedPMs.forEach(id => { next[id] = { ...next[id], category: cat } })
                      return next
                    })
                    setBulkMenu(null)
                  }} className="w-full flex items-center px-3 py-1.5 text-[13px] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer">
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-white/15 mx-1 shrink-0" />
          <button type="button" onClick={() => setBulkDeleteConfirm(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-lg)] text-[13px] font-medium text-[#F87171] hover:bg-white/10 transition-colors cursor-pointer shrink-0">
            Delete
          </button>
          <div className="w-px h-5 bg-white/15 mx-1 shrink-0" />
          <button type="button" onClick={() => setSelectedPMs(new Set())} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-lg)] text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0">
            Unselect
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)] max-w-[1300px] mx-auto">

          {/* Filter chips row */}
          {(() => {
            const anyFilter = filterPriority.length || filterLocation.length || filterAsset.length || filterAssignee.length
            function FilterDropdown({ label, options, selected, onToggle, onClear }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; onClear: () => void }) {
              return (
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <FilterChip hasDropdown active={selected.length > 0}>
                      {label}{selected.length > 0 && <span className="flex items-center justify-center px-1.5 h-4 rounded-full bg-[var(--color-accent-9)] text-white text-[9px] font-bold min-w-[16px]">{selected.length}</span>}
                    </FilterChip>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content sideOffset={4} align="start" className="z-[var(--z-dropdown)] w-[200px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] outline-none py-1" onOpenAutoFocus={e => e.preventDefault()}>
                      <button type="button" onClick={onClear} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] ${selected.length === 0 ? 'font-semibold text-[var(--color-neutral-12)]' : 'text-[var(--color-neutral-11)]'}`}>All</button>
                      <div className="my-1 mx-3 border-t border-[var(--border-subtle)]" />
                      {options.map(o => (
                        <button key={o} type="button" onClick={() => onToggle(o)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer transition-colors hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]">
                          <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-[3px] border transition-colors ${selected.includes(o) ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-6)] bg-[var(--surface-primary)]'}`}>
                            {selected.includes(o) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </span>
                          {o}
                        </button>
                      ))}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )
            }
            function toggle(set: string[], val: string): string[] { return set.includes(val) ? set.filter(x => x !== val) : [...set, val] }
            return (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <FilterChip active icon={<SlidersHorizontal size={13} />}>Filters (2)</FilterChip>
                <FilterChip active icon={<CircleDot size={13} />} onRemove={() => {}}>Status: Open +2</FilterChip>
                <FilterDropdown label="Priority" options={priorityOptions} selected={filterPriority} onToggle={v => setFilterPriority(p => toggle(p, v))} onClear={() => setFilterPriority([])} />
                <FilterDropdown label="Location" options={locationOptions} selected={filterLocation} onToggle={v => setFilterLocation(p => toggle(p, v))} onClear={() => setFilterLocation([])} />
                <FilterDropdown label="Asset" options={assetOptions} selected={filterAsset} onToggle={v => setFilterAsset(p => toggle(p, v))} onClear={() => setFilterAsset([])} />
                <FilterDropdown label="Assigned To" options={assigneeOptions} selected={filterAssignee} onToggle={v => setFilterAssignee(p => toggle(p, v))} onClear={() => setFilterAssignee([])} />
                <div className="flex-1" />
                <button type="button" disabled={!anyFilter} onClick={() => { setFilterPriority([]); setFilterLocation([]); setFilterAsset([]); setFilterAssignee([]) }} className={`text-[13px] font-medium transition-colors ${anyFilter ? 'text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)] cursor-pointer' : 'text-[var(--color-neutral-7)] cursor-not-allowed'}`}>Reset</button>
                <button type="button" className="text-[13px] font-medium text-[var(--color-accent-9)] hover:text-[var(--color-accent-10)] transition-colors cursor-pointer">Save View</button>
                <button type="button" className="inline-flex items-center gap-1 h-7 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[13px] font-medium text-[var(--color-neutral-9)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
                  Saved Views<ChevronDown size={12} />
                </button>
              </div>
            )
          })()}

          {/* Table card */}
          <div className="bg-[var(--surface-primary)] rounded-[8px] border border-[var(--border-default)] overflow-hidden">
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
                        className={`${col.cls} text-left text-[13px] font-semibold text-[var(--color-neutral-12)] h-[50px] px-4 border-b border-[var(--border-default)] whitespace-nowrap align-middle`}>
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
                  {skeletonRowId && (
                    <tr className="border-b border-[var(--border-default)] animate-pulse">
                      <td className="px-3 py-4 w-8"><div className="w-4 h-4 rounded bg-[var(--color-neutral-3)]" /></td>
                      <td className="px-3 py-4"><div className="h-3 w-48 rounded-full bg-[var(--color-neutral-3)]" /></td>
                      <td className="px-3 py-4"><div className="h-3 w-20 rounded-full bg-[var(--color-neutral-3)]" /></td>
                      <td className="px-3 py-4"><div className="h-3 w-16 rounded-full bg-[var(--color-neutral-3)]" /></td>
                      <td className="px-3 py-4"><div className="h-3 w-12 rounded-full bg-[var(--color-neutral-3)]" /></td>
                      <td className="px-3 py-4"><div className="h-3 w-12 rounded-full bg-[var(--color-neutral-3)]" /></td>
                      <td className="px-3 py-4 w-8" />
                    </tr>
                  )}
                  {filtered.map((pm, pmIdx) => {
                    const isExpanded = expandedPMs.has(pm.id)
                    const schedCount = pm.schedules.length
                    const assnCount = totalAssignments(pm)
                    const ov = pmOverrides[pm.id] ?? {}
                    const hasEdits = Object.keys(ov).length > 0
                    const effectiveStatus = (ov.status ?? (hasEdits ? 'Draft' : pm.status)) as PMStatus
                    const effectivePriority = (ov.priority ?? pm.priority) as PMPriority
                    const effectiveCategory = ov.category ?? pm.category
                    const isEditingStatus = inlineEdit?.pmId === pm.id && inlineEdit.field === 'status'
                    const isEditingPriority = inlineEdit?.pmId === pm.id && inlineEdit.field === 'priority'
                    const isEditingCategory = inlineEdit?.pmId === pm.id && inlineEdit.field === 'category'

                    return (
                      <React.Fragment key={pm.id}>
                        {/* Main PM row */}
                        <tr
                          className={`transition-colors group cursor-pointer ${isExpanded ? '' : 'border-b border-[var(--border-default)]'}
                            ${selectedPMs.has(pm.id) ? 'bg-[var(--color-accent-1)]' : isExpanded ? 'bg-[#F9F9FB]' : 'hover:bg-[#FCFCFD]'}
                            ${fadingInId === pm.id ? 'animate-[fadeInRow_600ms_ease-out_forwards]' : ''}
                            ${pageReady && fadingInId !== pm.id ? 'pm-row-entry' : ''}`}
                          style={{ ...(pageReady && fadingInId !== pm.id ? { animationDelay: `${pmIdx * 35}ms` } : {}), ...((openMenu === pm.id || inlineEdit?.pmId === pm.id) ? { position: 'relative', zIndex: 10 } : {}) }}
                          onClick={() => { if (pm.schedules.length > 0) togglePM(pm.id) }}
                        >
                          {/* Checkbox */}
                          <td className="py-4 pl-6 pr-3 w-[52px] align-middle" onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedPMs.has(pm.id)}
                              onChange={() => setSelectedPMs(prev => { const n = new Set(prev); n.has(pm.id) ? n.delete(pm.id) : n.add(pm.id); return n })}
                            />
                          </td>

                          {/* Title */}
                          <td className="px-4 py-4 align-middle">
                            {(() => {
                              const isUntitled = !pm.title || pm.title.toLowerCase() === 'untitled pm' || pm.title.toLowerCase() === 'untitled'
                              return isUntitled ? (
                                <button type="button" onClick={e => { e.stopPropagation(); router.push(`/predictive-maintenance/create?edit=${pm.id}`) }} className="text-[13px] font-semibold text-[var(--color-error)] leading-5 hover:underline cursor-pointer text-left">
                                  {pm.title || 'Untitled PM'}
                                </button>
                              ) : (
                                <button type="button" onClick={e => { e.stopPropagation(); openDrawer(pm) }} className="text-[13px] font-semibold text-[var(--color-neutral-12)] leading-5 group-hover:text-[var(--color-accent-9)] transition-colors hover:underline cursor-pointer text-left">{pm.title}</button>
                              )
                            })()}
                          </td>

                          {/* Schedules */}
                          <td className="px-4 py-4 align-middle">
                            {pm.schedules.length > 0 ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] text-[var(--color-neutral-9)] truncate max-w-[160px]">{pm.schedules[0].calendarTrigger.replace(/\s*·\s*On\s+\w+/i, '').replace(/\s*·\s*At\s+\d+:\d+\s*(AM|PM)?/i, '')}</span>
                                {pm.schedules.length > 1 && (
                                  <Tooltip
                                    side="bottom"
                                    sideOffset={6}
                                    content={
                                      <div className="flex flex-col gap-1 py-0.5 max-w-[280px]">
                                        {pm.schedules.map((s, i) => (
                                          <span key={i} className="text-[12px] leading-5">
                                            {s.calendarTrigger}{s.meterTrigger ? ` or ${s.meterTrigger}` : ''}
                                          </span>
                                        ))}
                                      </div>
                                    }
                                  >
                                    <button
                                      className="inline-flex items-center justify-center h-5 min-w-[28px] px-1.5 rounded-full bg-[var(--color-neutral-3)] text-[11px] font-semibold text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-4)] transition-colors shrink-0 cursor-pointer"
                                      onClick={e => { e.stopPropagation(); togglePM(pm.id) }}
                                    >
                                      +{pm.schedules.length - 1}
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            ) : <span className="text-[var(--color-neutral-5)]">—</span>}
                          </td>

                          {/* Assignments */}
                          <td className="px-4 py-4 align-middle">
                            {assnCount === 0 ? (
                              <span className="text-[var(--color-neutral-5)]">—</span>
                            ) : (
                              <Tooltip
                                side="right"
                                sideOffset={8}
                                content={
                                  <div className="flex flex-col gap-2 min-w-[160px] max-w-[240px]">
                                    {pm.schedules.filter(s => s.assignments.length > 0).map((sched, si) => (
                                      <div key={sched.id}>
                                        <div className="text-[10px] font-semibold text-white uppercase tracking-wide mb-1">
                                          {sched.calendarTrigger || sched.meterTrigger || `Schedule ${si + 1}`}
                                        </div>
                                        {sched.assignments.map(a => (
                                          <div key={a.id} className="text-[12px] text-white/90 py-0.5">{a.asset}</div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                }
                              >
                                <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-[var(--color-neutral-3)] text-[12px] font-semibold text-[var(--color-neutral-9)] cursor-default">
                                  {assnCount} Assignment{assnCount !== 1 ? 's' : ''}
                                </span>
                              </Tooltip>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-4 align-middle" onClick={e => e.stopPropagation()}>
                            <div className="relative" ref={isEditingCategory ? inlineEditRef : undefined}>
                              <button onClick={() => setInlineEdit(isEditingCategory ? null : { pmId: pm.id, field: 'category' })}
                                className="inline-flex items-center gap-1 text-[13px] text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)] px-1.5 py-0.5 rounded-[var(--radius-md)] transition-colors cursor-pointer">
                                {effectiveCategory}
                                <ChevronDown size={12} className="text-[var(--color-neutral-8)] shrink-0" />
                              </button>
                              {isEditingCategory && (
                                <div className="absolute left-0 top-full mt-1 z-50 w-[180px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1">
                                  {PM_CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => { setPMOverrides(p => ({ ...p, [pm.id]: { ...p[pm.id], category: cat } })); setInlineEdit(null) }}
                                      className={`w-full flex items-center px-3 py-1.5 text-[13px] hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer ${cat === effectiveCategory ? 'font-semibold text-[var(--color-accent-9)]' : 'text-[var(--color-neutral-11)]'}`}>
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-4 align-middle" onClick={e => e.stopPropagation()}>
                            <div className="relative" ref={isEditingPriority ? inlineEditRef : undefined}>
                              <button onClick={() => setInlineEdit(isEditingPriority ? null : { pmId: pm.id, field: 'priority' })}
                                className="inline-flex items-center gap-1 hover:bg-[var(--color-neutral-3)] px-1.5 py-0.5 rounded-[var(--radius-md)] transition-colors cursor-pointer">
                                <PriorityCell priority={effectivePriority} />
                                <ChevronDown size={12} className="text-[var(--color-neutral-8)] shrink-0" />
                              </button>
                              {isEditingPriority && (
                                <div className="absolute left-0 top-full mt-1 z-50 w-[150px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1">
                                  {(['None', 'Low', 'Medium', 'High'] as PMPriority[]).map(pri => (
                                    <button key={pri} onClick={() => { setPMOverrides(p => ({ ...p, [pm.id]: { ...p[pm.id], priority: pri } })); setInlineEdit(null) }}
                                      className={`w-full flex items-center px-3 py-1.5 hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer ${pri === effectivePriority ? 'bg-[var(--color-neutral-2)]' : ''}`}>
                                      <PriorityCell priority={pri} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 align-middle" onClick={e => e.stopPropagation()}>
                            <div className="relative" ref={isEditingStatus ? inlineEditRef : undefined}>
                              <button onClick={() => setInlineEdit(isEditingStatus ? null : { pmId: pm.id, field: 'status' })}
                                className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer rounded-full">
                                <StatusBadge status={effectiveStatus} />
                                <ChevronDown size={12} className="text-[var(--color-neutral-8)] shrink-0" />
                              </button>
                              {isEditingStatus && (
                                <div className="absolute left-0 top-full mt-1 z-50 w-[150px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1">
                                  {(['Active', 'Inactive', 'Draft'] as PMStatus[]).map(st => (
                                    <button key={st} onClick={() => { setPMOverrides(p => ({ ...p, [pm.id]: { ...p[pm.id], status: st } })); setInlineEdit(null) }}
                                      className={`w-full flex items-center px-3 py-1.5 hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer ${st === effectiveStatus ? 'bg-[var(--color-neutral-2)]' : ''}`}>
                                      <StatusBadge status={st} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>


                          {/* Actions */}
                          <td className="px-2 py-4 align-middle" style={{ position: 'relative', zIndex: openMenu === pm.id ? 200 : undefined }} onClick={e => e.stopPropagation()}>
                            <div className="relative" ref={openMenu === pm.id ? menuRef : undefined}>
                              <button
                                className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)] transition-all cursor-pointer"
                                onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === pm.id ? null : pm.id) }}
                              >
                                <MoreHorizontal size={15} />
                              </button>
                              {openMenu === pm.id && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-[160px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 overflow-hidden">
                                  <button
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer"
                                    onClick={() => {
                                      setOpenMenu(null)
                                      try { localStorage.setItem('upkeep_editing_pm', JSON.stringify(getEditPayload(pm))) } catch {}
                                      router.push(`/predictive-maintenance/create?edit=${pm.id}`)
                                    }}
                                  >
                                    <Pencil size={14} className="text-[var(--color-neutral-7)] shrink-0" />
                                    Edit
                                  </button>
                                  <div className="my-1 h-px bg-[var(--border-subtle)]" />
                                  <button
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-neutral-2)] transition-colors cursor-pointer"
                                    onClick={() => { setOpenMenu(null); setDeleteConfirmId(pm.id) }}
                                  >
                                    <Trash2 size={14} className="shrink-0" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Expand chevron */}
                          <td className="px-2 py-4 align-middle" onClick={e => { e.stopPropagation(); pm.schedules.length > 0 && togglePM(pm.id) }}>
                            {pm.schedules.length > 0 ? (
                              <div className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] border border-[var(--border-default)] hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-7)] transition-colors cursor-pointer">
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-7 h-7">
                                <ChevronDown size={15} className="text-[var(--color-neutral-4)]" />
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expanded schedules section */}
                        <tr className={isExpanded ? 'border-b border-[var(--border-default)]' : ''}>
                          <td colSpan={10} className="p-0 w-full" style={{ background: isExpanded ? '#F9F9FB' : 'transparent' }}>
                            <div
                              style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0 }}
                              className="overflow-hidden transition-all duration-300 ease-in-out"
                            >
                              <div className="px-8 py-5 w-full max-w-[1150px] mx-auto">
                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-9)] mb-3">Schedules</p>
                                <div className="flex flex-col gap-3">
                                  {pm.schedules.map(sched => {
                                    const key = `${pm.id}|${sched.id}`
                                    const isSchedExp = expandedSchedules.has(key)
                                    const missingTechCount = sched.assignments.filter(a => a.technicians.length === 0).length
                                    const schedHasError = sched.assignments.length === 0 || missingTechCount > 0
                                    return (
                                      <div key={sched.id} className={`rounded-[8px] border overflow-hidden ${schedHasError ? 'border-[var(--color-error,#CE2C31)] shadow-[0_0_1px_3px_rgba(206,44,49,0.1)]' : 'border-[var(--border-default)]'}`}>
                                        {/* Schedule card header */}
                                        <div
                                          className="flex items-center gap-3 p-4 bg-[var(--surface-secondary)] cursor-pointer select-none"
                                          onClick={() => toggleSched(pm.id, sched.id)}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <button
                                              type="button"
                                              onClick={e => { e.stopPropagation(); openDrawer(pm, 'Schedules') }}
                                              className="text-[13px] font-semibold text-[var(--color-neutral-11)] hover:text-[var(--color-accent-9)] hover:underline transition-colors cursor-pointer truncate block max-w-full text-left"
                                            >
                                              {sched.calendarTrigger}{sched.meterTrigger ? ` or ${sched.meterTrigger}` : ''}
                                            </button>
                                          </div>
                                          {missingTechCount > 0 && (
                                            <span className="flex items-center gap-1 rounded-full bg-[#FFEFEF] text-[var(--color-error)] text-[11px] px-2.5 py-0.5 font-medium shrink-0">
                                              {missingTechCount} missing technician{missingTechCount !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                          {sched.assignments.length === 0 ? (
                                            <span className="rounded-full text-[11px] px-2.5 py-0.5 font-medium shrink-0 bg-[#FFEFEF] text-[var(--color-error)]">
                                              No Assignments
                                            </span>
                                          ) : (() => {
                                            const assets = sched.assignments.filter(a => a.assetType === 'Asset').length
                                            const locations = sched.assignments.filter(a => a.assetType === 'Location').length
                                            const meters = sched.assignments.filter(a => a.assetType === 'Meter').length
                                            return [
                                              assets > 0 && `${assets} Asset${assets !== 1 ? 's' : ''}`,
                                              locations > 0 && `${locations} Location${locations !== 1 ? 's' : ''}`,
                                              meters > 0 && `${meters} Meter${meters !== 1 ? 's' : ''}`,
                                            ].filter(Boolean).map(label => (
                                              <span key={label as string} className="rounded-full bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)] text-[11px] px-2 py-0.5 font-medium shrink-0">
                                                {label}
                                              </span>
                                            ))
                                          })()}
                                          {!isSchedExp && (
                                            <button
                                              onClick={e => { e.stopPropagation(); try { localStorage.setItem('upkeep_editing_pm', JSON.stringify(getEditPayload(pm))) } catch {}; router.push(`/predictive-maintenance/create?edit=${pm.id}`) }}
                                              className="shrink-0 flex items-center gap-1 px-2 h-7 rounded-[var(--radius-md)] bg-[#EDF2FE] hover:bg-[#dce8fd] transition-colors cursor-pointer text-[12px] font-medium text-[var(--color-accent-11)]"
                                            >
                                              <Plus size={12} /> Assign
                                            </button>
                                          )}
                                          <button
                                            onClick={e => { e.stopPropagation(); toggleSched(pm.id, sched.id) }}
                                            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer text-[var(--color-neutral-7)] shrink-0"
                                          >
                                            {isSchedExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                          </button>
                                        </div>

                                        {/* Expanded assignment section */}
                                        {isSchedExp && (
                                          <div className="bg-[var(--surface-primary)]">
                                            {sched.assignments.length === 0 ? (
                                              <div className="flex flex-col items-center justify-center p-6 gap-2 text-center">
                                                <p className="text-[13px] font-semibold text-[var(--color-neutral-11)]">Assign to this schedule</p>
                                                <p className="text-[12px] text-[var(--color-neutral-8)]">Choose assets or locations for this schedule to apply to.</p>
                                                <button onClick={() => { try { localStorage.setItem('upkeep_editing_pm', JSON.stringify(getEditPayload(pm))) } catch {}; router.push(`/predictive-maintenance/create?edit=${pm.id}`) }} className="flex items-center gap-1 px-3 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] text-white text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
                                                  <Plus size={13} /> Assign
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                {/* Column headers */}
                                                <div className="flex items-center gap-5 px-3 h-[40px] bg-[var(--surface-primary)] border-y border-[var(--border-subtle)]">
                                                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)] flex-1 min-w-0">Applies To</span>
                                                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)] w-[120px] shrink-0">Meter</span>
                                                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)] w-[90px] shrink-0">Technicians</span>
                                                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)] w-[100px] shrink-0">Start / End</span>
                                                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)] w-[110px] shrink-0">Work Orders</span>
                                                  <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-8)] w-[90px] shrink-0">Next Due</span>
                                                </div>
                                                {/* Assignment rows */}
                                                <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                                                {sched.assignments.map(a => {
                                                  const missingTech = a.technicians.length === 0
                                                  return (
                                                  <div key={a.id} className={`flex items-center gap-5 px-3 py-3 border-b border-[#F0F0F3] last:border-0 transition-colors ${missingTech ? 'bg-[#FFF8F8] hover:bg-[#FFF0F0]' : 'hover:bg-[#F9FAFB]'}`}>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                      <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="font-medium text-[var(--color-neutral-12)] truncate">{a.asset}</span>
                                                        <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] text-[10px] font-medium bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)]">{a.assetType}</span>
                                                      </div>
                                                      {a.assetType === 'Asset' ? (
                                                        <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-8)] uppercase tracking-wide">Location:</span> {a.location || '—'}</span>
                                                      ) : a.assetType === 'Meter' ? (
                                                        <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-8)] uppercase tracking-wide">Location:</span> {a.location || '—'}</span>
                                                      ) : (
                                                        <span className="text-[11px] text-[var(--color-neutral-11)] truncate"><span className="text-[10px] text-[var(--color-neutral-8)] uppercase tracking-wide">Asset:</span> —</span>
                                                      )}
                                                    </div>
                                                    <div className="w-[120px] shrink-0 text-[12px] text-[var(--color-neutral-11)] truncate" title={a.meter || undefined}>
                                                      {a.meter || <span className="text-[var(--color-neutral-7)]">—</span>}
                                                    </div>
                                                    <div className="w-[90px] shrink-0">
                                                      {a.technicians.length > 0
                                                        ? <AvatarStack techs={a.technicians} extra={a.extraTechs} />
                                                        : <button type="button" onClick={e => { e.stopPropagation(); try { localStorage.setItem('upkeep_editing_pm', JSON.stringify(getEditPayload(pm))) } catch {}; router.push(`/predictive-maintenance/create?edit=${pm.id}`) }} className="text-[var(--color-error)] text-[12px] font-medium hover:underline cursor-pointer">Add</button>
                                                      }
                                                    </div>
                                                    <div className="w-[100px] shrink-0 flex flex-col gap-0.5">
                                                      {a.startDate && <span className="text-[11px] text-[var(--color-neutral-8)] leading-4">Start: {displayDate(a.startDate)}</span>}
                                                      {a.endDate && <span className="text-[11px] text-[var(--color-neutral-8)] leading-4">End: {displayDate(a.endDate)}</span>}
                                                    </div>
                                                    <div className="w-[110px] shrink-0 flex flex-col gap-0.5">
                                                      {a.lastWO && <span className="text-[11px] text-[var(--color-neutral-9)] leading-4">Last: {a.lastWO}</span>}
                                                      {a.nextWO && <span className="text-[11px] text-[var(--color-neutral-9)] leading-4">Next: {a.nextWO}</span>}
                                                      {!a.lastWO && !a.nextWO && <span className="text-[11px] text-[var(--color-neutral-7)]">—</span>}
                                                    </div>
                                                    <div className="w-[90px] shrink-0">
                                                      {a.nextWO
                                                        ? <span className="text-[12px] font-semibold text-[var(--color-neutral-12)] leading-4">{a.nextWO}</span>
                                                        : <span className="text-[11px] text-[var(--color-neutral-7)]">—</span>}
                                                    </div>
                                                  </div>
                                                  )
                                                })}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <CalendarClock size={36} className="text-[var(--color-neutral-5)] mb-3" />
                  <p className="text-[14px] font-semibold text-[var(--color-neutral-9)]">No preventive maintenance found</p>
                  <p className="text-[13px] text-[var(--color-neutral-9)] mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Table footer */}
            <div className="px-6 py-3 border-t border-[var(--border-subtle)]">
              <p className="text-[12px] text-[var(--color-neutral-9)]">
                {filtered.length} of {allItems.length} preventive maintenance schedules
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>

    {/* Delete confirmation modal */}
    {bulkDeleteConfirm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setBulkDeleteConfirm(false)} />
        <div className="relative z-10 w-[420px] rounded-[var(--radius-xl)] bg-[var(--surface-primary)] shadow-[var(--shadow-xl)] border border-[var(--border-default)] p-6">
          <h2 className="text-[15px] font-semibold text-[var(--color-neutral-12)] mb-1">Delete {selectedPMs.size} Preventive Maintenance{selectedPMs.size !== 1 ? 's' : ''}?</h2>
          <p className="text-[13px] text-[var(--color-neutral-9)] mb-5">
            These <span className="font-semibold text-[var(--color-neutral-11)]">{selectedPMs.size} PM{selectedPMs.size !== 1 ? 's' : ''}</span> will be permanently deleted. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setBulkDeleteConfirm(false)}
              className="inline-flex items-center h-8 px-4 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[13px] font-medium text-[var(--color-neutral-11)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDeletedIds(prev => {
                  const next = new Set([...prev, ...selectedPMs])
                  try { localStorage.setItem('upkeep_deleted_pm_ids', JSON.stringify([...next])) } catch {}
                  return next
                })
                setSelectedPMs(new Set())
                setBulkDeleteConfirm(false)
              }}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[var(--radius-md)] text-[13px] font-medium text-white bg-[var(--color-error)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {deleteConfirmId && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirmId(null)} />
        <div className="relative z-10 w-[420px] rounded-[var(--radius-xl)] bg-[var(--surface-primary)] shadow-[var(--shadow-xl)] border border-[var(--border-default)] p-6">
          <h2 className="text-[15px] font-semibold text-[var(--color-neutral-12)] mb-1">Delete Preventive Maintenance?</h2>
          <p className="text-[13px] text-[var(--color-neutral-9)] mb-5">
            <span className="font-semibold text-[var(--color-neutral-11)]">{deleteTarget?.title ?? 'This PM'}</span> will be permanently deleted. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="inline-flex items-center h-8 px-4 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[13px] font-medium text-[var(--color-neutral-11)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDeletedIds(prev => {
                  const next = new Set([...prev, deleteConfirmId])
                  try { localStorage.setItem('upkeep_deleted_pm_ids', JSON.stringify([...next])) } catch {}
                  return next
                })
                setSelectedPMs(prev => { const n = new Set(prev); n.delete(deleteConfirmId); return n })
                setDeleteConfirmId(null)
              }}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[var(--radius-md)] text-[13px] font-medium text-white bg-[var(--color-error)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    <PMDrawer
      pm={selectedPM}
      initialTab={drawerTab}
      onClose={() => setSelectedPM(null)}
      onEdit={(pm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        try { localStorage.setItem('upkeep_editing_pm', JSON.stringify(getEditPayload(pm as any))) } catch {}
        router.push(`/predictive-maintenance/create?edit=${pm.id}`)
      }}
    />

    {/* Success toast after Create PM */}
    {createdToast && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-[var(--radius-xl)] bg-[var(--color-neutral-12)] text-white shadow-[var(--shadow-lg)] text-[13px] animate-[pm-row-in_250ms_ease-out_forwards]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#22c55e"/><path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span>
          <strong>{createdToast.title}</strong> created
          {createdToast.scheduleCount > 0 && <> · {createdToast.scheduleCount} schedule{createdToast.scheduleCount !== 1 ? 's' : ''}</>}
          {createdToast.assignmentCount > 0 && <> · {createdToast.assignmentCount} assignment{createdToast.assignmentCount !== 1 ? 's' : ''}</>}
        </span>
        <button onClick={() => setCreatedToast(null)} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
          <X size={14} />
        </button>
      </div>
    )}
    </TooltipProvider>
  )
}
