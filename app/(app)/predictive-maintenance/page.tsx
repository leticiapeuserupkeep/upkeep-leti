'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  SlidersHorizontal, MoreHorizontal, Search,
  CalendarClock, Circle, CircleDot, CheckCircle2, Ban,
  MapPin, Flag, ChevronRight, ChevronDown, X,
} from 'lucide-react'
import { TableToolbar } from '@/app/components/ui/Table'

type PMStatus = 'Active' | 'Inactive' | 'Completed'
type PMPriority = 'None' | 'Low' | 'Medium' | 'High'

interface AssetEntry {
  asset: string
  location: string
  assignee?: string
  additionalAssignee?: string
  team?: string
  nextDue?: string
  lastCompleted?: string
}

interface PMItem {
  id: string
  title: string
  assets: AssetEntry[]
  schedule: string
  status: PMStatus
  priority: PMPriority
  woCount: number
}

const pmItems: PMItem[] = [
  {
    id: 'pm-001',
    title: 'Quarterly HVAC filter replacement',
    assets: [
      { asset: 'HVAC Unit AHU-01', location: 'Main Building — Floor 1', assignee: 'John Smith', additionalAssignee: 'Sarah Chen', team: 'Maintenance', nextDue: '09/15/26', lastCompleted: '06/15/26' },
      { asset: 'HVAC Unit AHU-02', location: 'Main Building — Floor 2', assignee: 'John Smith', team: 'Maintenance', nextDue: '09/15/26', lastCompleted: '06/15/26' },
      { asset: 'HVAC Unit AHU-03', location: 'Warehouse Zone A', assignee: 'Sarah Chen', team: 'Maintenance', nextDue: '09/20/26', lastCompleted: '06/20/26' },
    ],
    schedule: 'Every 3 Month(s)',
    status: 'Active',
    priority: 'Medium',
    woCount: 8,
  },
  {
    id: 'pm-002',
    title: 'Monthly fire extinguisher inspection',
    assets: [
      { asset: 'Fire Extinguisher FE-12', location: 'Warehouse Zone B', assignee: 'Maria Garcia', team: 'Safety', nextDue: '08/01/26', lastCompleted: '07/01/26' },
      { asset: 'Fire Extinguisher FE-07', location: 'Main Building — Floor 1', assignee: 'Maria Garcia', additionalAssignee: 'Tom Lee', team: 'Safety', nextDue: '08/01/26', lastCompleted: '07/01/26' },
      { asset: 'Fire Extinguisher FE-03', location: 'R&D Lab', assignee: 'Carlos Rivera', team: 'Safety', nextDue: '08/05/26', lastCompleted: '07/05/26' },
      { asset: 'Fire Extinguisher FE-15', location: 'Utility Room', assignee: 'Tom Lee', team: 'Safety', nextDue: '08/01/26', lastCompleted: '07/01/26' },
    ],
    schedule: 'Every 1 Month(s)',
    status: 'Active',
    priority: 'High',
    woCount: 24,
  },
  {
    id: 'pm-003',
    title: 'Annual electrical panel inspection',
    assets: [
      { asset: 'Panel EP-03', location: 'R&D Lab', assignee: 'Carlos Rivera', nextDue: '02/20/27', lastCompleted: '02/20/26' },
      { asset: 'Panel EP-01', location: 'Main Building — Basement', assignee: 'Carlos Rivera', nextDue: '02/20/27', lastCompleted: '02/20/26' },
    ],
    schedule: 'Every 1 Year(s)',
    status: 'Active',
    priority: 'High',
    woCount: 3,
  },
  {
    id: 'pm-004',
    title: 'Forklift battery check',
    assets: [
      { asset: 'Forklift FL-204', location: 'Warehouse Zone A', assignee: 'Tom Lee', nextDue: '07/28/26', lastCompleted: '07/14/26' },
      { asset: 'Forklift FL-205', location: 'Warehouse Zone A', assignee: 'Tom Lee', nextDue: '07/28/26', lastCompleted: '07/14/26' },
    ],
    schedule: 'Every 2 Week(s) on Mon',
    status: 'Active',
    priority: 'Medium',
    woCount: 12,
  },
  {
    id: 'pm-005',
    title: 'Conveyor belt lubrication',
    assets: [
      { asset: 'Conveyor Belt CB-12', location: 'Production Floor', assignee: 'Sarah Chen', team: 'Operations', nextDue: '07/25/26', lastCompleted: '07/18/26' },
      { asset: 'Conveyor Belt CB-14', location: 'Production Floor', assignee: 'Sarah Chen', additionalAssignee: 'Carlos Rivera', team: 'Operations', nextDue: '07/25/26', lastCompleted: '07/18/26' },
      { asset: 'Conveyor Belt CB-09', location: 'Warehouse Zone B', assignee: 'Tom Lee', team: 'Operations', nextDue: '07/26/26', lastCompleted: '07/19/26' },
    ],
    schedule: 'Every 1 Week(s) on Fri',
    status: 'Active',
    priority: 'Low',
    woCount: 36,
  },
  {
    id: 'pm-006',
    title: 'Emergency generator load bank test',
    assets: [
      { asset: 'Generator GEN-01', location: 'Utility Room', assignee: 'John Smith', nextDue: '08/10/26', lastCompleted: '07/10/26' },
    ],
    schedule: 'Every 1 Month(s)',
    status: 'Active',
    priority: 'High',
    woCount: 18,
  },
  {
    id: 'pm-007',
    title: 'Compressor oil change',
    assets: [
      { asset: 'Compressor CR-01', location: 'Cold Room', assignee: 'Maria Garcia', nextDue: '01/05/27', lastCompleted: '07/05/26' },
      { asset: 'Compressor CR-02', location: 'Cold Room', assignee: 'Maria Garcia', nextDue: '01/08/27', lastCompleted: '07/08/26' },
    ],
    schedule: 'Every 6 Month(s)',
    status: 'Active',
    priority: 'Medium',
    woCount: 6,
  },
  {
    id: 'pm-008',
    title: 'Roof drain seasonal cleaning',
    assets: [
      { asset: 'Roof Drain RD-N', location: 'Main Building — Rooftop North', assignee: 'Carlos Rivera', nextDue: '10/01/26', lastCompleted: '07/01/26' },
      { asset: 'Roof Drain RD-S', location: 'Main Building — Rooftop South', assignee: 'Carlos Rivera', nextDue: '10/01/26', lastCompleted: '07/01/26' },
    ],
    schedule: 'Every 3 Month(s)',
    status: 'Inactive',
    priority: 'Low',
    woCount: 4,
  },
  {
    id: 'pm-009',
    title: 'Floor scrubber blade replacement',
    assets: [
      { asset: 'Floor Scrubber FS-02', location: 'Warehouse Zone B', nextDue: '09/30/26', lastCompleted: '06/30/26' },
    ],
    schedule: 'Every 3 Month(s)',
    status: 'Active',
    priority: 'Low',
    woCount: 5,
  },
  {
    id: 'pm-010',
    title: 'Parking lot lighting inspection',
    assets: [
      { asset: 'Lighting Array PL-01', location: 'Employee Parking Lot — North', assignee: 'Tom Lee', nextDue: '09/01/26' },
      { asset: 'Lighting Array PL-02', location: 'Employee Parking Lot — South', assignee: 'Tom Lee', nextDue: '09/01/26' },
      { asset: 'Lighting Array PL-03', location: 'Visitor Parking Lot', assignee: 'Tom Lee', nextDue: '09/01/26' },
    ],
    schedule: 'Every 2 Month(s)',
    status: 'Active',
    priority: 'None',
    woCount: 2,
  },
]

const statusConfig: Record<PMStatus, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  Active: { icon: CircleDot, color: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info-alpha)]', label: 'Active' },
  Inactive: { icon: Ban, color: 'text-[var(--color-neutral-7)]', bg: 'bg-[var(--color-neutral-3)]', label: 'Inactive' },
  Completed: { icon: CheckCircle2, color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-alpha)]', label: 'Completed' },
}

const priorityConfig: Record<PMPriority, { color: string }> = {
  None: { color: 'text-[var(--color-neutral-6)]' },
  Low: { color: 'text-[var(--color-success)]' },
  Medium: { color: 'text-[var(--color-warning)]' },
  High: { color: 'text-[var(--color-error)]' },
}

function StatusBadge({ status }: { status: PMStatus }) {
  const cfg = statusConfig[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function Initials({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('')
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent-3)] text-[var(--color-accent-9)] text-[10px] font-semibold shrink-0">
      {initials}
    </span>
  )
}

function FilterChip({ children, active, icon, hasDropdown, onRemove }: {
  children: React.ReactNode
  active?: boolean
  icon?: React.ReactNode
  hasDropdown?: boolean
  onRemove?: () => void
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-[var(--radius-md)] border text-[length:var(--font-size-sm)] font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)] cursor-pointer ${
        active
          ? 'border-[var(--color-accent-9)] text-[var(--color-accent-9)] bg-[var(--color-accent-1)]'
          : 'border-[var(--border-default)] text-[var(--color-neutral-9)] bg-[var(--surface-primary)] hover:bg-[var(--color-neutral-3)]'
      }`}
    >
      {icon}
      {children}
      {hasDropdown && <ChevronDown size={12} />}
      {onRemove && <X size={12} className="ml-0.5 opacity-60 hover:opacity-100" onClick={e => { e.stopPropagation(); onRemove() }} />}
    </button>
  )
}

export default function PreventiveMaintenancePage() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedPMs, setSelectedPMs] = useState<Set<string>>(new Set())
  const [toolbarPortal, setToolbarPortal] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setToolbarPortal(document.getElementById('table-toolbar-portal'))
  }, [])

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const filtered = pmItems.filter(pm =>
    pm.title.toLowerCase().includes(search.toLowerCase()) ||
    pm.assets.some(a => a.asset.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col flex-1 w-full relative">
      {toolbarPortal && createPortal(
        <TableToolbar
          itemCountLabel={`${filtered.length} of ${pmItems.length} items`}
          sortLabel="Sort: Title"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search PMs..."
        />,
        toolbarPortal
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">
          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-4 flex-wrap opacity-0" style={{ animation: 'fadeInUp 0.35s var(--ease-default) 0.04s forwards' }}>
            <FilterChip active icon={<SlidersHorizontal size={13} />}>Filters (2)</FilterChip>
            <FilterChip active icon={<CircleDot size={13} />} onRemove={() => {}}>Status: Active</FilterChip>
            <FilterChip hasDropdown icon={<CalendarClock size={13} />}>Schedule</FilterChip>
            <FilterChip hasDropdown icon={<Flag size={13} />}>Priority</FilterChip>
            <div className="flex-1" />
            <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer">Reset Filters</button>
            <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] hover:text-[var(--color-accent-10)] transition-colors cursor-pointer">Save View</button>
          </div>

          {/* Table card */}
          <div className="bg-[var(--surface-primary)] rounded-[var(--widget-radius)] border border-[var(--widget-border)] overflow-hidden opacity-0" style={{ animation: 'fadeInUp 0.35s var(--ease-default) 0.08s forwards' }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="[&>tr]:py-2">
            <tr>
              {/* Select-all checkbox */}
              <th className="py-3 pl-6 pr-2 border-b border-[var(--border-default)] w-[52px]">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selectedPMs.size === filtered.length && filtered.length > 0}
                  onClick={() => setSelectedPMs(selectedPMs.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))}
                  className={`w-[18px] h-[18px] rounded-[var(--radius-sm)] border flex items-center justify-center cursor-pointer transition-all duration-[var(--duration-fast)] select-none ${selectedPMs.size === filtered.length && filtered.length > 0 ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-5)] bg-[var(--surface-primary)] hover:border-[var(--color-neutral-7)]'}`}
                >
                  {selectedPMs.size === filtered.length && filtered.length > 0 && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>
              </th>
              {[
                { label: 'Title', w: 'w-[280px]' },
                { label: 'Assets', w: 'w-[160px]' },
                { label: 'Location', w: 'w-[160px]' },
                { label: 'Next Due', w: 'w-[110px]' },
                { label: 'Last Completed', w: 'w-[130px]' },
                { label: 'Status', w: 'w-[100px]' },
                { label: 'WOs created', w: 'w-[100px]' },
                { label: '', w: 'w-[40px]' },
              ].map(col => (
                <th key={col.label} className={`${col.w} text-left text-[length:var(--font-size-sm)] leading-4 font-bold text-[var(--color-neutral-12)] tracking-[0.01em] h-12 px-[var(--space-xl)] border-b border-[var(--border-default)] whitespace-nowrap align-middle`}>
                  {col.label && (
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ChevronDown size={12} className="text-[var(--color-neutral-7)]" />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(pm => {
              const isExpanded = expanded.has(pm.id)
              const multiAsset = pm.assets.length > 1
              const firstAsset = pm.assets[0]

              return (
                <>
                  {/* Parent row */}
                  <tr
                    key={pm.id}
                    className={`border-b border-[var(--border-default)] transition-colors group cursor-pointer ${selectedPMs.has(pm.id) ? 'bg-[var(--color-accent-1)]' : 'hover:bg-[var(--color-neutral-2)]'}`}
                    onClick={() => multiAsset && toggle(pm.id)}
                  >
                    {/* Checkbox */}
                    <td className="py-3 pl-6 pr-2 w-[52px]" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selectedPMs.has(pm.id)}
                        onClick={() => setSelectedPMs(prev => { const next = new Set(prev); next.has(pm.id) ? next.delete(pm.id) : next.add(pm.id); return next })}
                        className={`w-[18px] h-[18px] rounded-[var(--radius-sm)] border flex items-center justify-center cursor-pointer transition-all duration-[var(--duration-fast)] select-none ${selectedPMs.has(pm.id) ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]' : 'border-[var(--color-neutral-5)] bg-[var(--surface-primary)] hover:border-[var(--color-neutral-7)]'}`}
                      >
                        {selectedPMs.has(pm.id) && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    </td>
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Flag size={12} className={`shrink-0 ${priorityConfig[pm.priority].color}`} />
                        <span className="font-medium text-[var(--color-neutral-12)] truncate max-w-[230px]">
                          {pm.title}
                        </span>
                      </div>
                    </td>

                    {/* Assets cell */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[var(--color-neutral-11)] truncate max-w-[150px]">
                          {firstAsset.asset}
                        </span>
                        {multiAsset && (
                          <button
                            className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] border border-[var(--color-neutral-5)] text-[11px] font-medium text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-4)] transition-colors cursor-pointer shrink-0"
                            onClick={e => { e.stopPropagation(); toggle(pm.id) }}
                          >
                            +{pm.assets.length - 1}
                            {isExpanded
                              ? <ChevronDown size={10} className="text-[var(--color-neutral-7)]" />
                              : <ChevronRight size={10} className="text-[var(--color-neutral-7)]" />
                            }
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-[var(--color-neutral-8)] truncate max-w-[160px]">
                      {!multiAsset && firstAsset.location
                        ? firstAsset.location
                        : <span className="text-[var(--color-neutral-5)]">—</span>
                      }
                    </td>

                    {/* Next Due */}
                    <td className="px-4 py-3">
                      {!multiAsset && firstAsset.nextDue ? (
                        <span className="text-[var(--color-neutral-11)]">
                          {firstAsset.nextDue}
                        </span>
                      ) : multiAsset ? (
                        <span className="text-[var(--color-neutral-6)] text-[12px]">—</span>
                      ) : (
                        <span className="text-[var(--color-neutral-6)]">—</span>
                      )}
                    </td>

                    {/* Last Completed */}
                    <td className="px-4 py-3 text-[var(--color-neutral-8)]">
                      {!multiAsset && firstAsset.lastCompleted
                        ? firstAsset.lastCompleted
                        : <span className="text-[var(--color-neutral-6)]">—</span>
                      }
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={pm.status} />
                    </td>

                    {/* WOs */}
                    <td className="px-4 py-3 text-[var(--color-neutral-9)] text-center">
                      {pm.woCount}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)] transition-all">
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded mini-table */}
                  {isExpanded && (
                    <tr className="border-b border-[var(--border-default)]">
                      <td colSpan={9} className="pl-10 pr-4 py-0 bg-[var(--color-neutral-1)]">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-[var(--border-subtle)]">
                              {['Asset', 'Location', 'Assignee', 'Additional Assignee', 'Team', 'Next Due', 'Last Completed'].map(h => (
                                <th key={h} className="py-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pm.assets.map((a, i) => (
                              <tr key={i} className="border-b border-[var(--border-subtle)] last:border-b-0">
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-11)] whitespace-nowrap">{a.asset}</td>
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-8)] whitespace-nowrap">{a.location || <span className="text-[var(--color-neutral-5)]">—</span>}</td>
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-10)] whitespace-nowrap">{a.assignee || <span className="text-[var(--color-neutral-5)]">—</span>}</td>
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-10)] whitespace-nowrap">{a.additionalAssignee || <span className="text-[var(--color-neutral-5)]">—</span>}</td>
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-10)] whitespace-nowrap">{a.team || <span className="text-[var(--color-neutral-5)]">—</span>}</td>
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-10)] whitespace-nowrap">{a.nextDue || <span className="text-[var(--color-neutral-5)]">—</span>}</td>
                                <td className="py-2.5 pr-4 text-[var(--color-neutral-8)] whitespace-nowrap">{a.lastCompleted || <span className="text-[var(--color-neutral-5)]">—</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CalendarClock size={36} className="text-[var(--color-neutral-5)] mb-3" />
            <p className="text-[var(--color-neutral-9)] font-medium">No preventive maintenance found</p>
            <p className="text-[var(--color-neutral-7)] text-[13px] mt-1">Try adjusting your search or create a new PM</p>
          </div>
        )}
      </div>

          {/* Footer */}
          <p className="mt-4 text-[12px] text-[var(--color-neutral-7)]">
            {filtered.length} of {pmItems.length} preventive maintenance schedules
          </p>
        </div>
        </div>
      </main>
    </div>
  )
}
