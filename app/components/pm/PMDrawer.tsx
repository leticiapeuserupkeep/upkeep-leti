'use client'

import { useState, useEffect } from 'react'
import { X, Pencil, CalendarClock, Plus, Image as ImageIcon, FileText, ListChecks, Clock } from 'lucide-react'
import { Avatar } from '@/app/components/ui'

// ── Types shared with the list page (minimal) ────────────────────────────────

interface TechAvatar { initials: string; bg: string }

interface AssignmentRow {
  id: string; asset: string; assetType: string; location: string
  meter?: string; technicians: TechAvatar[]; extraTechs?: number
  woCount?: number; lastWO?: string; nextWO?: string; startDate?: string; endDate?: string
}

interface PMSchedule {
  id: string; calendarTrigger: string; meterTrigger?: string; assignments: AssignmentRow[]
}

interface PMItem {
  id: string; title: string; description?: string
  category: string; priority: string; status: string
  checklists?: string[]; schedules: PMSchedule[]
}

interface PMDrawerProps {
  pm: PMItem | null
  onClose: () => void
  onEdit: (pm: PMItem) => void
}

type DrawerTab = 'Details' | 'Tasks' | 'Schedules' | 'Work Orders'

const PRIORITY_COLOR: Record<string, string> = {
  High: 'text-[var(--color-error)]',
  Medium: 'text-[var(--color-warning)]',
  Low: 'text-[var(--color-success)]',
  None: 'text-[var(--color-neutral-6)]',
}

function AvatarRow({ techs, extra = 0 }: { techs: TechAvatar[]; extra?: number }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {techs.slice(0, 3).map((t, i) => (
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

export function PMDrawer({ pm, onClose, onEdit }: PMDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('Details')
  const [descExpanded, setDescExpanded] = useState(false)

  // Reset tab when PM changes
  useEffect(() => { setTab('Details'); setDescExpanded(false) }, [pm?.id])

  const isOpen = pm !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] z-50 flex flex-col bg-[var(--surface-primary)] border-l border-[var(--border-default)] shadow-[var(--shadow-xl)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {pm && (
          <>
            {/* Header */}
            <div className="flex flex-col px-5 pt-4 pb-0 shrink-0 border-b border-[var(--border-default)]">
              <div className="flex items-start gap-2 mb-3">
                <h2 className="flex-1 text-[15px] font-semibold text-[var(--color-neutral-12)] leading-5 min-w-0 break-words">
                  {pm.title}
                </h2>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(pm)}
                    className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Description */}
              {pm.description && (
                <div className="mb-3">
                  <p className={`text-[13px] text-[var(--color-neutral-9)] leading-5 ${!descExpanded ? 'line-clamp-2' : ''}`}>
                    {pm.description}
                  </p>
                  <button
                    onClick={() => setDescExpanded(p => !p)}
                    className="text-[12px] font-medium text-[var(--color-accent-9)] hover:underline mt-0.5 cursor-pointer"
                  >
                    {descExpanded ? 'Show less' : 'Show full description'}
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-0 -mx-1">
                {(['Details', 'Tasks', 'Schedules', 'Work Orders'] as DrawerTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 h-9 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                      tab === t
                        ? 'border-[var(--color-accent-9)] text-[var(--color-accent-9)]'
                        : 'border-transparent text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {tab === 'Details' && <DetailsTab pm={pm} />}
              {tab === 'Schedules' && <SchedulesTab pm={pm} />}
              {tab === 'Tasks' && <TasksTab pm={pm} />}
              {tab === 'Work Orders' && <WorkOrdersTab pm={pm} />}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ pm }: { pm: PMItem }) {
  const fields = [
    { label: 'Category', value: pm.category },
    { label: 'Priority', value: pm.priority, isPriority: true },
    { label: 'Duration', value: '2 hrs 35 Mins' },
    { label: 'Created', value: 'Monday, Oct 19, 2025' },
    { label: 'Updated', value: 'Monday, Oct 19, 2025' },
  ]

  return (
    <div className="flex flex-col">
      {/* Key fields */}
      <section className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)] mb-3">Details</p>
        <div className="flex flex-col gap-3">
          {fields.map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-[12px] text-[var(--color-neutral-7)] w-[80px] shrink-0">{f.label}</span>
              {f.isPriority ? (
                <span className={`text-[13px] font-medium ${PRIORITY_COLOR[pm.priority] ?? 'text-[var(--color-neutral-9)]'}`}>
                  {pm.priority}
                </span>
              ) : (
                <span className="text-[13px] font-medium text-[var(--color-neutral-11)]">{f.value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Images</p>
          <button className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">
            <Plus size={11} /> Add
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] bg-[var(--color-neutral-3)] border border-dashed border-[var(--border-default)] cursor-pointer hover:bg-[var(--color-neutral-4)] transition-colors">
            <ImageIcon size={16} className="text-[var(--color-neutral-6)]" />
          </div>
          <span className="text-[12px] text-[var(--color-neutral-7)]">No images added</span>
        </div>
      </section>

      {/* Files */}
      <section className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Files</p>
          <button className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">
            <Plus size={11} /> Add
          </button>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[var(--color-neutral-6)]" />
          <span className="text-[12px] text-[var(--color-neutral-7)]">No files added</span>
        </div>
      </section>

      {/* Tasks & Checklists */}
      <section className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Tasks & Checklists</p>
          <button className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">
            <Plus size={11} /> Add
          </button>
        </div>
        {pm.checklists && pm.checklists.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {pm.checklists.map((cl, i) => (
              <div key={i} className="flex items-center gap-2">
                <ListChecks size={13} className="text-[var(--color-neutral-6)] shrink-0" />
                <span className="text-[13px] text-[var(--color-neutral-9)]">{cl}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[12px] text-[var(--color-neutral-7)]">No checklists added</span>
        )}
      </section>

      {/* Schedules summary */}
      <section className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Schedules</p>
          <button className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">
            <Plus size={11} /> Add
          </button>
        </div>
        {pm.schedules.length === 0 ? (
          <span className="text-[12px] text-[var(--color-neutral-7)]">No schedules</span>
        ) : (
          <div className="flex flex-col gap-2">
            {pm.schedules.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-accent-1)] border border-[var(--color-accent-3)]">
                <CalendarClock size={13} className="text-[var(--color-accent-9)] shrink-0" />
                <span className="flex-1 text-[13px] font-medium text-[var(--color-neutral-11)] truncate">{s.calendarTrigger}</span>
                <span className="text-[11px] text-[var(--color-accent-9)] shrink-0">{s.assignments.length} assignment{s.assignments.length !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Schedules Tab ────────────────────────────────────────────────────────────

function SchedulesTab({ pm }: { pm: PMItem }) {
  return (
    <div className="flex flex-col gap-3 p-5">
      {pm.schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <CalendarClock size={28} className="text-[var(--color-neutral-5)]" />
          <p className="text-[13px] font-medium text-[var(--color-neutral-8)]">No schedules yet</p>
        </div>
      ) : (
        pm.schedules.map(sched => (
          <div key={sched.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--color-accent-1)] border-b border-[var(--color-accent-3)]">
              <CalendarClock size={13} className="text-[var(--color-accent-9)] shrink-0" />
              <span className="flex-1 text-[13px] font-semibold text-[var(--color-neutral-11)] truncate">{sched.calendarTrigger}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${sched.assignments.length === 0 ? 'bg-[#FFEFEF] text-[var(--color-error)]' : 'bg-[var(--color-accent-2)] text-[var(--color-accent-9)]'}`}>
                {sched.assignments.length === 0 ? 'No Assignments' : `${sched.assignments.length} Assignment${sched.assignments.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {sched.assignments.length > 0 && (
              <div className="divide-y divide-[var(--border-subtle)]">
                {sched.assignments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{a.asset}</span>
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] text-[10px] font-medium text-[var(--color-neutral-8)] shrink-0">{a.assetType}</span>
                      </div>
                      {a.location && <span className="text-[11px] text-[var(--color-neutral-7)] truncate">{a.location}</span>}
                    </div>
                    {a.technicians.length > 0 && (
                      <AvatarRow techs={a.technicians} extra={a.extraTechs} />
                    )}
                    <div className="flex flex-col gap-0.5 shrink-0 text-right">
                      {a.lastWO && <span className="text-[11px] text-[var(--color-neutral-7)]">Last: {a.lastWO}</span>}
                      {a.nextWO && <span className="text-[11px] text-[var(--color-neutral-7)]">Next: {a.nextWO}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ pm }: { pm: PMItem }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
      <ListChecks size={28} className="text-[var(--color-neutral-5)]" />
      <p className="text-[13px] font-medium text-[var(--color-neutral-8)]">No tasks yet</p>
      <p className="text-[12px] text-[var(--color-neutral-6)]">Add tasks and checklists to this PM to track completion.</p>
      <button className="mt-2 flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] text-white text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
        <Plus size={13} /> Add Task
      </button>
    </div>
  )
}

// ── Work Orders Tab ──────────────────────────────────────────────────────────

function WorkOrdersTab({ pm }: { pm: PMItem }) {
  const mockWOs = pm.schedules.flatMap(s => s.assignments.flatMap(a =>
    Array.from({ length: Math.min(a.woCount ?? 0, 3) }, (_, i) => ({
      id: `WO-${pm.id}-${a.id}-${i}`,
      title: pm.title,
      asset: a.asset,
      status: i === 0 ? 'Active' : i === 1 ? 'Active' : 'Completed',
      priority: pm.priority,
      date: a.lastWO ?? '—',
    }))
  )).slice(0, 8)

  if (mockWOs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
        <Clock size={28} className="text-[var(--color-neutral-5)]" />
        <p className="text-[13px] font-medium text-[var(--color-neutral-8)]">No work orders yet</p>
        <p className="text-[12px] text-[var(--color-neutral-6)]">Work orders will appear here once this PM is active.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
      {mockWOs.map(wo => (
        <div key={wo.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-neutral-2)] transition-colors">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{wo.title}</span>
            <span className="text-[11px] text-[var(--color-neutral-7)] truncate">{wo.asset}</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${wo.status === 'Active' ? 'bg-[#E6F9ED] text-[#1A7A3C]' : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)]'}`}>
            {wo.status}
          </span>
          <span className="text-[11px] text-[var(--color-neutral-6)] shrink-0">{wo.date}</span>
        </div>
      ))}
    </div>
  )
}
