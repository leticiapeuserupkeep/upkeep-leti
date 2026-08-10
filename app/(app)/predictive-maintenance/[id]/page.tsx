'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, MoreHorizontal, Plus, CalendarClock,
  Image as ImageIcon, FileText, ListChecks, Clock, ChevronDown, ChevronUp,
  Search, Activity,
} from 'lucide-react'
import { Avatar } from '@/app/components/ui'
import { Button } from '@/app/components/ui/Button'
import { pmItems, type PMItem, type TechAvatar } from '@/app/lib/pm-data'

function displayDate(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return iso
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mi] + ` ${parseInt(d, 10)}, ${y}`
}

const PRIORITY_DOT: Record<string, string> = {
  High: 'bg-[var(--color-error)]',
  Medium: 'bg-[var(--color-warning)]',
  Low: 'bg-[var(--color-success)]',
  None: 'bg-[var(--color-neutral-5)]',
}

function AvatarStack({ techs, extra = 0 }: { techs: TechAvatar[]; extra?: number }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {techs.slice(0, 4).map((t, i) => (
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

function loadPM(id: string): PMItem | null {
  // Try localStorage first (user-created PMs)
  try {
    const stored = JSON.parse(localStorage.getItem('upkeep_new_pms') ?? '[]') as Array<{
      id: string; title?: string; category?: string; priority?: string; status?: string; schedules?: PMItem['schedules']
    }>
    const found = stored.find(p => p.id === id)
    if (found) {
      return {
        id: found.id,
        title: found.title ?? 'Untitled PM',
        category: found.category ?? 'Maintenance',
        priority: found.priority ?? 'None',
        status: found.status ?? 'Active',
        schedules: found.schedules ?? [],
      }
    }
  } catch {}
  // Fall back to mock data
  return pmItems.find(p => p.id === id) ?? null
}

// ── Page ─────────────────────────────────────────────────────────────────────

type MainTab = 'Tasks' | 'Schedules' | 'Work Orders'
type SideTab = 'Details' | 'Activity'

export default function PMDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [pm, setPm] = useState<PMItem | null>(null)
  const [mainTab, setMainTab] = useState<MainTab>('Schedules')
  const [sideTab, setSideTab] = useState<SideTab>('Details')
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set())
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setPm(loadPM(id))
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [id])

  useEffect(() => {
    if (pm) {
      // Auto-expand all schedules
      setExpandedSchedules(new Set(pm.schedules.map(s => s.id)))
    }
  }, [pm?.id])

  function toggleSched(schedId: string) {
    setExpandedSchedules(prev => {
      const n = new Set(prev)
      n.has(schedId) ? n.delete(schedId) : n.add(schedId)
      return n
    })
  }

  if (!pm) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <CalendarClock size={32} className="text-[var(--color-neutral-5)]" />
          <p className="text-[14px] text-[var(--color-neutral-7)]">Loading PM…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col flex-1 min-h-0 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-default)] bg-[var(--surface-primary)] shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-[var(--color-neutral-12)] leading-5 truncate">{pm.title}</h1>
          {pm.description && (
            <p className="text-[12px] text-[var(--color-neutral-7)] truncate mt-0.5">{pm.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => router.push(`/predictive-maintenance/create?edit=${pm.id}`)}>
            <Pencil size={13} />
            Edit
          </Button>
          <button className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Body: two-column */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          {/* Tabs */}
          <div className="flex items-center gap-0 px-6 border-b border-[var(--border-default)] bg-[var(--surface-primary)] shrink-0 sticky top-0 z-10">
            {(['Tasks', 'Schedules', 'Work Orders'] as MainTab[]).map(t => (
              <button
                key={t}
                onClick={() => setMainTab(t)}
                className={`px-4 h-10 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  mainTab === t
                    ? 'border-[var(--color-accent-9)] text-[var(--color-accent-9)]'
                    : 'border-transparent text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 px-6 py-5">
            {mainTab === 'Schedules' && (
              <SchedulesContent pm={pm} expandedSchedules={expandedSchedules} onToggle={toggleSched} />
            )}
            {mainTab === 'Tasks' && <TasksContent />}
            {mainTab === 'Work Orders' && <WorkOrdersContent pm={pm} />}
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="w-[300px] shrink-0 border-l border-[var(--border-default)] flex flex-col overflow-y-auto bg-[var(--surface-primary)]">
          {/* Sidebar tabs */}
          <div className="flex items-center border-b border-[var(--border-default)] shrink-0 sticky top-0 bg-[var(--surface-primary)] z-10">
            {(['Details', 'Activity'] as SideTab[]).map(t => (
              <button
                key={t}
                onClick={() => setSideTab(t)}
                className={`flex-1 h-10 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  sideTab === t
                    ? 'border-[var(--color-accent-9)] text-[var(--color-accent-9)]'
                    : 'border-transparent text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {sideTab === 'Details' && <DetailsContent pm={pm} />}
          {sideTab === 'Activity' && <ActivityContent />}
        </div>
      </div>
    </div>
  )
}

// ── Schedules content ────────────────────────────────────────────────────────

function SchedulesContent({ pm, expandedSchedules, onToggle }: {
  pm: PMItem; expandedSchedules: Set<string>; onToggle: (id: string) => void
}) {
  if (pm.schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <CalendarClock size={32} className="text-[var(--color-neutral-5)]" />
        <p className="text-[14px] font-medium text-[var(--color-neutral-8)]">No schedules yet</p>
        <button className="mt-2 flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] text-white text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
          <Plus size={13} /> New Schedule
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Schedules</p>
        <button className="flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">
          <Plus size={11} /> New Schedule
        </button>
      </div>

      {pm.schedules.map(sched => {
        const isExp = expandedSchedules.has(sched.id)
        const missingTechCount = sched.assignments.filter(a => a.technicians.length === 0).length
        const schedHasError = sched.assignments.length === 0 || missingTechCount > 0
        return (
          <div key={sched.id} className={`rounded-[var(--radius-lg)] border overflow-hidden ${schedHasError ? 'border-[var(--color-error,#CE2C31)] shadow-[0_0_1px_3px_rgba(206,44,49,0.1)]' : 'border-[var(--color-accent-4)]'}`}>
            {/* Schedule header */}
            <div
              className="flex items-center gap-3 px-4 py-3 bg-[var(--color-accent-1)] cursor-pointer select-none"
              onClick={() => onToggle(sched.id)}
            >
              <CalendarClock size={14} className="text-[var(--color-accent-9)] shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-[var(--color-neutral-11)] truncate block">
                  {sched.calendarTrigger}{sched.meterTrigger ? ` or ${sched.meterTrigger}` : ''}
                </span>
              </div>
              {missingTechCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#FFEFEF] text-[var(--color-error)] text-[11px] px-2.5 py-0.5 font-medium shrink-0">
                  {missingTechCount} missing technician{missingTechCount !== 1 ? 's' : ''}
                </span>
              )}
              <span className={`rounded-full text-[11px] px-2.5 py-0.5 font-medium shrink-0 ${sched.assignments.length === 0 ? 'bg-[#FFEFEF] text-[var(--color-error)]' : 'bg-[var(--color-accent-2)] text-[var(--color-accent-9)]'}`}>
                {sched.assignments.length === 0 ? 'No Assignments' : `${sched.assignments.length} Assignment${sched.assignments.length !== 1 ? 's' : ''}`}
              </span>
              <button onClick={e => { e.stopPropagation(); onToggle(sched.id) }}
                className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer text-[var(--color-neutral-7)] shrink-0">
                {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Assignments */}
            {isExp && (
              <div className="bg-[var(--surface-primary)]">
                {sched.assignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-center px-4">
                    <p className="text-[13px] text-[var(--color-neutral-8)]">No assignments yet</p>
                    <button className="flex items-center gap-1 px-3 h-7 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] text-white text-[12px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
                      <Plus size={12} /> Assign
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Column headers */}
                    <div className="flex items-center gap-5 px-4 h-9 bg-[#F9F9FB] border-b border-[var(--border-subtle)]">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-7)] flex-1">Assignment</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-7)] w-[90px] shrink-0">Meter</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-7)] w-[80px] shrink-0">Technicians</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-7)] w-[100px] shrink-0">Start / End</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-7)] w-[130px] shrink-0">Work Orders</span>
                    </div>
                    {/* Rows */}
                    {sched.assignments.map(a => {
                      const missingTech = a.technicians.length === 0
                      return (
                      <div key={a.id} className={`flex items-center gap-5 px-4 py-3 border-b border-[var(--border-subtle)] last:border-0 transition-colors ${missingTech ? 'bg-[#FFF8F8] hover:bg-[#FFF0F0]' : 'hover:bg-[#F9FAFB]'}`}>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{a.asset}</span>
                            <span className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] text-[10px] font-medium text-[var(--color-neutral-8)] shrink-0">{a.assetType}</span>
                            {missingTech && <span className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[#FFEFEF] text-[10px] font-medium text-[var(--color-error)] shrink-0">Missing technician</span>}
                          </div>
                          {a.location && <span className="text-[11px] text-[var(--color-neutral-7)] truncate">{a.location}</span>}
                        </div>
                        <span className="w-[90px] shrink-0 text-[12px] text-[var(--color-neutral-7)] truncate">{a.meter ?? '—'}</span>
                        <div className="w-[80px] shrink-0">
                          {a.technicians.length > 0
                            ? <AvatarStack techs={a.technicians} extra={a.extraTechs} />
                            : <span className="text-[var(--color-error)] text-[12px] font-medium">Add</span>}
                        </div>
                        <div className="w-[100px] shrink-0 flex flex-col gap-0.5">
                          {a.startDate && <span className="text-[11px] text-[var(--color-neutral-8)]">Start: {displayDate(a.startDate)}</span>}
                          {a.endDate && <span className="text-[11px] text-[var(--color-neutral-8)]">End: {displayDate(a.endDate)}</span>}
                        </div>
                        <div className="w-[130px] shrink-0 flex flex-col gap-0.5">
                          {a.lastWO && <span className="text-[11px] text-[var(--color-neutral-8)]">Last: {a.lastWO}</span>}
                          {a.nextWO && <span className="text-[11px] text-[var(--color-neutral-8)]">Next: {a.nextWO}</span>}
                        </div>
                      </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Tasks content ────────────────────────────────────────────────────────────

function TasksContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <ListChecks size={32} className="text-[var(--color-neutral-5)]" />
      <p className="text-[14px] font-medium text-[var(--color-neutral-8)]">No tasks yet</p>
      <button className="mt-2 flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-9)] text-white text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
        <Plus size={13} /> Add Task
      </button>
    </div>
  )
}

// ── Work Orders content ──────────────────────────────────────────────────────

function WorkOrdersContent({ pm }: { pm: PMItem }) {
  const mockWOs = pm.schedules.flatMap(s => s.assignments.flatMap(a =>
    Array.from({ length: Math.min(a.woCount ?? 0, 4) }, (_, i) => ({
      id: `${pm.id}-${a.id}-${i}`,
      no: `#${45 + i * 3}`,
      title: pm.title,
      asset: a.asset,
      status: i < 2 ? 'Active' : 'Completed',
      priority: pm.priority,
      assignees: a.technicians.slice(0, 2),
      date: a.lastWO ?? '—',
    }))
  )).slice(0, 8)

  if (mockWOs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <Clock size={32} className="text-[var(--color-neutral-5)]" />
        <p className="text-[14px] font-medium text-[var(--color-neutral-8)]">No work orders yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">{mockWOs.length} items</p>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden">
        {/* Headers */}
        <div className="flex items-center gap-4 px-4 h-9 bg-[var(--color-neutral-2)] border-b border-[var(--border-default)]">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)] w-[44px] shrink-0">WO #</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)] flex-1">Title</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)] w-[70px] shrink-0">Status</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)] w-[60px] shrink-0">Priority</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)] w-[60px] shrink-0">Assigned</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-8)] w-[55px] shrink-0">Done By</span>
        </div>
        {mockWOs.map(wo => (
          <div key={wo.id} className="flex items-center gap-4 px-4 py-2.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--color-neutral-2)] transition-colors">
            <span className="text-[12px] text-[var(--color-accent-9)] font-medium w-[44px] shrink-0">{wo.no}</span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{wo.title}</span>
              <span className="text-[11px] text-[var(--color-neutral-7)] truncate">{wo.asset}</span>
            </div>
            <span className={`w-[70px] shrink-0 text-[11px] px-1.5 py-0.5 rounded-full font-medium text-center ${wo.status === 'Active' ? 'bg-[#E6F9ED] text-[#1A7A3C]' : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)]'}`}>
              {wo.status}
            </span>
            <span className="w-[60px] shrink-0 text-[12px] text-[var(--color-neutral-8)]">{wo.priority}</span>
            <div className="w-[60px] shrink-0">
              <AvatarStack techs={wo.assignees} />
            </div>
            <span className="w-[55px] shrink-0 text-[11px] text-[var(--color-neutral-7)]">{wo.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Details sidebar ──────────────────────────────────────────────────────────

function DetailsContent({ pm }: { pm: PMItem }) {
  return (
    <div className="flex flex-col">
      {/* Key fields */}
      <section className="px-4 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col gap-3">
          {[
            { label: 'Category', value: pm.category },
            { label: 'Priority', value: pm.priority },
            { label: 'Duration', value: '2 hrs 35 Mins' },
            { label: 'Created', value: 'Mon, Oct 19, 2025' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-neutral-7)] w-[72px] shrink-0">{f.label}</span>
              <span className="text-[12px] font-medium text-[var(--color-neutral-11)]">{f.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Signature Required */}
      <section className="px-4 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-[var(--color-neutral-11)]">Signature Required</span>
          <div className="w-8 h-4 rounded-full bg-[var(--color-neutral-4)] relative cursor-pointer">
            <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="px-4 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Images</p>
          <button className="text-[11px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">Add</button>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] border border-dashed border-[var(--border-default)] cursor-pointer hover:bg-[var(--color-neutral-4)] transition-colors">
            <ImageIcon size={14} className="text-[var(--color-neutral-6)]" />
          </div>
          <span className="text-[11px] text-[var(--color-neutral-6)]">No images</span>
        </div>
      </section>

      {/* Files */}
      <section className="px-4 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Files</p>
          <button className="text-[11px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">Add from Saved Files</button>
        </div>
        <button className="text-[11px] font-medium text-[var(--color-neutral-7)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-2 py-1 hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
          Upload
        </button>
        <p className="text-[11px] text-[var(--color-neutral-5)] mt-1">or drop a file</p>
      </section>

      {/* Parts */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-neutral-8)]">Parts</p>
          <button className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent-9)] hover:underline cursor-pointer">
            <Plus size={10} /> Add
          </button>
        </div>
        <span className="text-[11px] text-[var(--color-neutral-6)]">No parts added</span>
      </section>
    </div>
  )
}

// ── Activity sidebar ─────────────────────────────────────────────────────────

function ActivityContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
      <Activity size={28} className="text-[var(--color-neutral-5)]" />
      <p className="text-[13px] font-medium text-[var(--color-neutral-8)]">No activity yet</p>
    </div>
  )
}
