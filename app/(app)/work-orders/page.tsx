'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  SlidersHorizontal,
  ChevronDown, X, Circle, CircleDot, Ban, CheckCircle2,
  Check, Minus, MoreHorizontal, Download, Archive, Trash2,
  Flag, MapPin, Box, User, Loader, Info, FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Switch } from '@/app/components/ui'
import Link from 'next/link'
import { Table, TableToolbar, TableHeader, TableBody, TableHead, TableCell } from '@/app/components/ui/Table'
import { Button } from '@/app/components/ui/Button'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { IconButton } from '@/app/components/ui/IconButton'
import { ModuleEmptyState } from '@/app/components/onboarding/ModuleEmptyState'
import { NovaSidePanel, OPEN_NOVA_PANEL_EVENT } from '@/app/components/onboarding/NovaSidePanel'
import { setupStore, useSetupState } from '@/app/lib/onboarding/setup-store'
import { SUGGESTED_WORK_ORDER_CARDS, type ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'

/* ── Types ── */

type WOStatus = 'Open' | 'In Progress' | 'On Hold' | 'Complete'
type WOPriority = 'None' | 'Low' | 'Medium' | 'High'
type WOCategory = 'Preventative' | 'Electrical' | 'Safety' | 'Upgrade' | 'Damage' | 'Inspection'

interface WorkOrderItem {
  id: string
  woNumber: string
  title: string
  description: string
  dueDate?: string
  startDate?: string
  status: WOStatus
  priority: WOPriority
  category: WOCategory
  hasAlert?: boolean
}

/* ── Mock Data ── */


/* ── Status Config ── */

const statusConfig: Record<WOStatus, { icon: LucideIcon; color: string }> = {
  Open: { icon: Circle, color: 'text-[var(--color-neutral-7)]' },
  'In Progress': { icon: CircleDot, color: 'text-[var(--color-info)]' },
  'On Hold': { icon: Ban, color: 'text-[var(--color-warning)]' },
  Complete: { icon: CheckCircle2, color: 'text-[var(--color-success)]' },
}

const priorityConfig: Record<WOPriority, { color: string; flagColor: string }> = {
  None: { color: 'text-[var(--color-neutral-8)]', flagColor: 'text-[var(--color-neutral-6)]' },
  Low: { color: 'text-[var(--color-neutral-11)]', flagColor: 'text-[var(--color-success)]' },
  Medium: { color: 'text-[var(--color-neutral-11)]', flagColor: 'text-[var(--color-warning)]' },
  High: { color: 'text-[var(--color-neutral-11)]', flagColor: 'text-[var(--color-error)]' },
}

/* ── Sub-components ── */

function StatusIndicator({ status }: { status: WOStatus }) {
  const { icon: Icon, color } = statusConfig[status]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon size={14} className={color} />
      <span>{status}</span>
    </span>
  )
}

function PriorityIndicator({ priority }: { priority: WOPriority }) {
  const { color, flagColor } = priorityConfig[priority]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Flag size={14} className={`${flagColor} fill-current`} />
      <span className={color}>{priority}</span>
    </span>
  )
}

function RowCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`w-[18px] h-[18px] rounded-[var(--radius-sm)] border flex items-center justify-center cursor-pointer transition-all duration-[var(--duration-fast)] select-none ${
        checked || indeterminate
          ? 'bg-[var(--color-accent-9)] border-[var(--color-accent-9)]'
          : 'border-[var(--color-neutral-5)] bg-[var(--surface-primary)] hover:border-[var(--color-neutral-7)]'
      }`}
    >
      {checked && !indeterminate && (
        <Check size={11} className="text-white" strokeWidth={3} />
      )}
      {indeterminate && (
        <Minus size={11} className="text-white" strokeWidth={3} />
      )}
    </button>
  )
}

function FilterChip({
  children,
  active,
  icon,
  hasDropdown,
  onRemove,
}: {
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
      {onRemove && (
        <X
          size={12}
          className="ml-0.5 opacity-60 hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
        />
      )}
    </button>
  )
}

/* ── Bulk More Menu ── */

function BulkMoreMenu({ onExport }: { onExport?: () => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ bottom: 0, right: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({
      bottom: window.innerHeight - r.top + 4,
      right: window.innerWidth - r.right,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      )
        close()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, close])

  const menuEl =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-[160px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 dropdown-animate"
            style={{ bottom: pos.bottom, right: pos.right }}
          >
            <button
              onClick={() => close()}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
            >
              <User size={14} className="text-[var(--color-neutral-8)]" />
              Update team
            </button>
            <button
              onClick={() => { close(); onExport?.() }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
            >
              <Download size={14} className="text-[var(--color-neutral-8)]" />
              Export
            </button>
            <button
              onClick={() => close()}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
            >
              <Archive size={14} className="text-[var(--color-neutral-8)]" />
              Archive
            </button>
            <div className="h-px bg-[var(--border-subtle)] mx-2 my-1" />
            <button
              onClick={() => close()}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[length:var(--font-size-sm)] text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="shrink-0 p-1 rounded-[var(--radius-sm)] hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="More actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {menuEl}
    </>
  )
}

/* ── Export Modal ── */

const pdfToggles = [
  { id: 'images', label: 'Images', description: 'Include all attached images (tasks, parts, etc.)' },
  { id: 'parts', label: 'Parts & Costs', description: 'Include a breakdown of items and total cost.' },
  { id: 'activity', label: 'Activity', description: 'Include a log of all updates and changes.' },
  { id: 'comments', label: 'Comments', description: 'Include all work order comments and notes.' },
] as const

function ExportModal({
  open,
  onOpenChange,
  selectedCount,
  onExport,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedCount: number
  onExport: () => void
}) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf')
  const [template, setTemplate] = useState<'bulk' | 'individual'>('individual')
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({
    images: true,
    parts: true,
    activity: false,
    comments: false,
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-dialog-overlay
          className="fixed inset-0 z-[var(--z-overlay)] bg-black/40"
        />
        <Dialog.Content
          data-dialog-content
          className="fixed left-1/2 top-1/2 z-[var(--z-modal)] w-full max-w-[640px] max-h-[85vh] rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] focus:outline-none flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[var(--space-xl)] pt-[var(--space-xl)] pb-[var(--space-md)]">
            <Dialog.Title className="text-[length:var(--font-size-lg)] font-bold text-[var(--color-neutral-12)]">
              Export Work Orders
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton variant="ghost" size="md" label="Close">
                <X size={18} />
              </IconButton>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-[var(--space-xl)] pb-[var(--space-md)]">
            {/* Format Selection */}
            <div className="grid grid-cols-2 gap-3 mb-[var(--space-lg)]">
              {(['csv', 'pdf'] as const).map((f) => {
                const selected = format === f
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border text-left transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                      selected
                        ? 'border-[var(--color-accent-9)] bg-[var(--color-accent-1)]'
                        : 'border-[var(--border-default)] hover:bg-[var(--color-neutral-2)]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected
                          ? 'border-[var(--color-accent-9)]'
                          : 'border-[var(--color-neutral-5)]'
                      }`}
                    >
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent-9)]" />
                      )}
                    </span>
                    <div
                      className={`w-10 h-12 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border ${
                        f === 'csv'
                          ? 'bg-[var(--color-success-light)] border-[var(--color-success-border)]'
                          : 'bg-[var(--color-error-light)] border-[var(--color-error-border)]'
                      }`}
                    >
                      <span
                        className={`text-[length:var(--font-size-xs)] font-bold ${
                          f === 'csv'
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-error)]'
                        }`}
                      >
                        {f.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">
                      Export {selectedCount} work orders as {f.toUpperCase()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* PDF-only sections */}
            {format === 'pdf' && (
              <>
                {/* Template Selection */}
                <h3 className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)] mb-3">
                  Select a PDF Template
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-[var(--space-xl)]">
                  <button
                    type="button"
                    onClick={() => setTemplate('bulk')}
                    className={`p-4 rounded-[var(--radius-lg)] border text-left transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                      template === 'bulk'
                        ? 'border-[var(--color-accent-9)] bg-[var(--color-accent-1)]'
                        : 'border-[var(--border-default)] hover:bg-[var(--color-neutral-2)]'
                    }`}
                  >
                    <p
                      className={`text-[length:var(--font-size-sm)] font-semibold mb-1.5 ${
                        template === 'bulk'
                          ? 'text-[var(--color-accent-9)]'
                          : 'text-[var(--color-neutral-12)]'
                      }`}
                    >
                      Bulk Work Order List
                    </p>
                    <p className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-8)] leading-[var(--line-height-normal)]">
                      A printable PDF of your current work order list, limited to the first five
                      visible columns. Best used for sharing or printing large sets of work orders
                      in a simple table format.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate('individual')}
                    className={`p-4 rounded-[var(--radius-lg)] border text-left transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                      template === 'individual'
                        ? 'border-[var(--color-accent-9)] bg-[var(--color-accent-1)]'
                        : 'border-[var(--border-default)] hover:bg-[var(--color-neutral-2)]'
                    }`}
                  >
                    <p
                      className={`text-[length:var(--font-size-sm)] font-semibold mb-1.5 ${
                        template === 'individual'
                          ? 'text-[var(--color-accent-9)]'
                          : 'text-[var(--color-neutral-12)]'
                      }`}
                    >
                      Individual Summary with Update Notes. Limited to 20 Work Orders
                    </p>
                    <p className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-8)] leading-[var(--line-height-normal)]">
                      A detailed work order report including all update notes and comments. Best
                      for complete documentation and record-keeping.
                    </p>
                  </button>
                </div>

                {/* Content Toggles */}
                <h3 className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)] mb-3">
                  Customize the content of your PDF.
                </h3>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {pdfToggles.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
                          {t.label}
                        </p>
                        <p className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-8)] mt-0.5">
                          {t.description}
                        </p>
                      </div>
                      <Switch
                        checked={toggleState[t.id]}
                        onCheckedChange={(v) =>
                          setToggleState((s) => ({ ...s, [t.id]: v }))
                        }
                        size="md"
                        className="shrink-0 ml-4"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-[var(--space-xl)] py-[var(--space-md)] border-t border-[var(--border-subtle)]">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button variant="primary" onClick={() => { onOpenChange(false); onExport() }}>
              Export
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ── Page ── */

export default function WorkOrdersPage() {
  // Only what this user (or Nova, during setup) actually created.
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showToast, setShowToast] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [toolbarPortal, setToolbarPortal] = useState<HTMLElement | null>(null)

  const setup = useSetupState()
  const [novaOpen, setNovaOpen] = useState(false)
  // Title of the work order Nova is creating — shown as a skeleton row first.
  const [pendingTitle, setPendingTitle] = useState<string | null>(null)
  const [highlightedWoId, setHighlightedWoId] = useState<string | null>(null)

  useEffect(() => {
    setToolbarPortal(document.getElementById('table-toolbar-portal'))
  }, [])

  // The top bar's "Ask Nova" opens the side panel.
  useEffect(() => {
    const open = () => setNovaOpen(true)
    window.addEventListener(OPEN_NOVA_PANEL_EVENT, open)
    return () => window.removeEventListener(OPEN_NOVA_PANEL_EVENT, open)
  }, [])

  // Work orders Nova created during onboarding show up here.
  useEffect(() => {
    const fromSetup = setup.created.filter(c => c.kind === 'work-order')
    setWorkOrders(prev => {
      const missing = fromSetup.filter(c => !prev.some(wo => wo.id === c.id))
      if (missing.length === 0) return prev
      return [
        ...missing.map((c, i) => ({
          id: c.id,
          woNumber: String(prev.length + i + 1).padStart(3, '0'),
          title: c.title,
          description: 'Created by Nova from this week’s maintenance overview',
          status: 'Open' as WOStatus,
          priority: (c.detail?.includes('High') ? 'High' : 'Medium') as WOPriority,
          category: 'Inspection' as WOCategory,
        })),
        ...prev,
      ]
    })
  }, [setup.created])

  const addWorkOrder = useCallback((title: string, byNova: boolean, priority: WOPriority = 'Medium') => {
    const id = `wo-${Date.now()}`
    setWorkOrders(prev => [{
      id,
      woNumber: String(prev.length + 1).padStart(3, '0'),
      title,
      description: byNova ? 'Created with Nova' : '',
      status: 'Open',
      priority,
      category: 'Inspection',
    }, ...prev])
    setHighlightedWoId(id)
    setupStore.update(prev => ({ counts: { ...prev.counts, workOrders: prev.counts.workOrders + 1 } }))
    window.setTimeout(() => setHighlightedWoId(null), 4000)
  }, [])

  // A suggestion card opens Nova, which creates it there — then it's in the list.
  const [novaRequest, setNovaRequest] = useState<{ text: string; id: number } | null>(null)
  const createSuggestion = useCallback((s: ModuleSuggestion) => {
    setNovaOpen(true)
    setNovaRequest({ text: s.title, id: Date.now() })
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === workOrders.length) return new Set()
      return new Set(workOrders.map((wo) => wo.id))
    })
  }, [])

  const deselectAll = useCallback(() => setSelectedIds(new Set()), [])

  const allSelected = selectedIds.size === workOrders.length
  const someSelected = selectedIds.size > 0 && !allSelected
  const selectedCount = selectedIds.size

  const filtered = searchValue
    ? workOrders.filter(
        (wo) =>
          wo.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          wo.woNumber.includes(searchValue) ||
          wo.description.toLowerCase().includes(searchValue.toLowerCase()) ||
          wo.category.toLowerCase().includes(searchValue.toLowerCase()),
      )
    : workOrders

  const isEmpty = workOrders.length === 0 && !pendingTitle
  const suggestions = SUGGESTED_WORK_ORDER_CARDS.filter(c => !workOrders.some(wo => wo.title === c.title))

  return (
    <div className="flex flex-col flex-1 w-full relative">
      {toolbarPortal && createPortal(
        <TableToolbar
          itemCountLabel={`${filtered.length} of ${workOrders.length} items`}
          sortLabel="Sort: Work Order Title"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search"
        />,
        toolbarPortal
      )}
      {isEmpty ? (
        <main className="flex-1 overflow-y-auto">
          <ModuleEmptyState
            icon={FileText}
            title="No Work Orders created yet"
            description="Create one yourself, or ask Nova to help you get started."
            createLabel="Create Manually"
            onCreate={() => addWorkOrder('New work order', false)}
            onCreateWithNova={() => setNovaOpen(true)}
            suggestions={suggestions}
            onSuggest={createSuggestion}
          />
        </main>
      ) : (
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">
          {/* ── Filters ── */}
          <div
            className="flex items-center gap-2 mb-4 flex-wrap opacity-0"
            style={{
              animation: 'fadeInUp 0.35s var(--ease-default) 0.04s forwards',
            }}
          >
            <FilterChip active icon={<SlidersHorizontal size={13} />}>
              Filters (3)
            </FilterChip>
            <FilterChip active icon={<Circle size={13} />} onRemove={() => {}}>
              Status: Open
            </FilterChip>
            <FilterChip active icon={<Flag size={13} />} onRemove={() => {}}>
              Priority: Low
            </FilterChip>
            <FilterChip hasDropdown icon={<MapPin size={13} />}>
              Location
            </FilterChip>
            <FilterChip hasDropdown icon={<Box size={13} />}>
              Asset
            </FilterChip>
            <FilterChip hasDropdown icon={<User size={13} />}>
              Assigned To
            </FilterChip>

            <div className="flex-1" />

            <button
              type="button"
              className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] hover:text-[var(--color-accent-10)] transition-colors cursor-pointer"
            >
              Save View
            </button>
          </div>

          {/* ── Table Card ── */}
          <div
            className="bg-[var(--surface-primary)] rounded-[var(--widget-radius)] border border-[var(--widget-border)] overflow-hidden opacity-0"
            style={{
              animation: 'fadeInUp 0.4s var(--ease-default) 0.06s forwards',
            }}
          >
            <Table>
              <TableHeader>
                <tr>
                  <th className="py-3 pl-6 pr-2 border-b border-[var(--border-default)] w-[52px]">
                    <RowCheckbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <TableHead className="w-[80px]">
                    <span className="inline-flex items-center gap-1">
                      WO #
                      <ChevronDown size={12} className="text-[var(--color-neutral-7)]" />
                    </span>
                  </TableHead>
                  <TableHead>Work Order Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {pendingTitle && (
                  // Nova is still writing it — a placeholder row holds its place.
                  <tr aria-label={`Creating ${pendingTitle}`} className="nova-enter">
                    <td className="py-4 pl-6 pr-2"><Skeleton className="h-[18px] w-[18px]" rounded="sm" /></td>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14" rounded="full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14" rounded="full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </tr>
                )}
                {filtered.map((wo, i) => {
                  const isSelected = selectedIds.has(wo.id)
                  const isHighlighted = wo.id === highlightedWoId
                  return (
                    <tr
                      key={wo.id}
                      className={`transition-colors duration-500 cursor-pointer select-none opacity-0 ${
                        isHighlighted
                          ? 'bg-[var(--color-accent-2)]'
                          : isSelected
                          ? 'bg-[var(--color-accent-1)] hover:bg-[var(--color-accent-2)]'
                          : 'hover:bg-[var(--color-neutral-2)]'
                      }`}
                      style={{
                        animation: `fadeInUp 0.3s var(--ease-default) ${0.08 + i * 0.025}s forwards`,
                      }}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <RowCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(wo.id)}
                        />
                      </td>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium tabular-nums text-[var(--color-accent-9)]">
                            {wo.woNumber}
                          </span>
                          {wo.hasAlert && (
                            <Circle size={8} className="text-[var(--color-error)] fill-[var(--color-error)] shrink-0" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-[var(--color-neutral-12)] whitespace-nowrap max-w-[200px] truncate">
                        {wo.title}
                      </TableCell>
                      <TableCell className="text-[var(--color-neutral-8)] max-w-[220px] truncate">
                        {wo.description}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[var(--color-neutral-8)]">
                        {wo.dueDate || ''}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[var(--color-neutral-8)]">
                        {wo.startDate || ''}
                      </TableCell>
                      <TableCell>
                        <StatusIndicator status={wo.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityIndicator priority={wo.priority} />
                      </TableCell>
                      <TableCell>
                        {wo.category}
                      </TableCell>
                    </tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      )}

      {/* ── Bulk Actions ── */}
      {selectedCount > 0 && (
        <div
          className="fixed bottom-6 z-[var(--z-toast)] toast-animate pointer-events-none"
          style={{ left: 'calc(280px + (100vw - 280px) / 2)', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-[var(--radius-xl)] bg-[var(--color-neutral-12)] text-white shadow-[var(--shadow-xl)] pointer-events-auto">
            <span className="text-[length:var(--font-size-sm)] font-semibold whitespace-nowrap">
              {selectedCount} selected
            </span>
            <button
              type="button"
              className="text-[length:var(--font-size-sm)] font-medium hover:text-white/80 transition-colors cursor-pointer whitespace-nowrap"
            >
              Update Status
            </button>
            <button
              type="button"
              className="text-[length:var(--font-size-sm)] font-medium hover:text-white/80 transition-colors cursor-pointer whitespace-nowrap"
            >
              Update Assignee
            </button>
            <BulkMoreMenu onExport={() => setShowExportModal(true)} />
            <button
              type="button"
              onClick={deselectAll}
              className="shrink-0 p-1 rounded-[var(--radius-sm)] hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Export Status Banner ── */}
      {showToast && (
        <div className="absolute bottom-5 right-5 z-[var(--z-toast)] banner-animate max-w-[400px]">
          <div className="relative flex items-start gap-2.5 pl-3.5 pr-2 pt-2.5 pb-3 rounded-[var(--radius-lg)] bg-[var(--color-accent-1)] border border-[var(--color-accent-4)] shadow-[var(--shadow-lg)] overflow-hidden">
            <div className="flex-1 min-w-0">
              <p className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)] leading-snug">
                Generating PDF...
              </p>
              <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] mt-0.5 leading-snug">
                {"We'll email it to "}
                <strong className="font-semibold text-[var(--color-neutral-11)]">leti@upkeep.com</strong>
              </p>
              <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] mt-1 leading-snug">
                {"Track the progress and download anytime on "}
                <Link
                  href="/exports"
                  className="font-semibold text-[var(--color-accent-9)] hover:text-[var(--color-accent-10)] transition-colors"
                >
                  Exports
                </Link>
              </p>
            </div>
            <IconButton variant="ghost" size="sm" label="Dismiss" onClick={() => setShowToast(false)}>
              <X size={14} />
            </IconButton>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent-2)] overflow-hidden">
              <div className="h-full w-1/4 bg-[var(--color-accent-9)] rounded-full progress-bar-animate" />
            </div>
          </div>
        </div>
      )}

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        selectedCount={selectedCount}
        onExport={() => setShowToast(true)}
      />

      <NovaSidePanel
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        intro="What needs to be done? Describe the job, or pick one of these."
        quickActions={suggestions.map(c => c.title)}
        placeholder="Describe the job you need to be done"
        onCreate={text => {
          const suggested = SUGGESTED_WORK_ORDER_CARDS.find(c => c.title === text)
          setPendingTitle(null)
          addWorkOrder(text, true, suggested?.tone === 'error' ? 'High' : 'Medium')
          return text
        }}
        request={novaRequest}
        onCreating={setPendingTitle}
      />
    </div>
  )
}
