'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Bot, Clock, Zap, GitBranch,
  CheckCircle2, AlertCircle, RefreshCw, ChevronDown,
  Send, MoreVertical, UserPlus, Cpu, Split,
  ArrowRight, Pencil, ListPlus, CalendarClock, Tag, GitMerge,
  Repeat2, AlertTriangle, Copy, History, Archive, Trash2, Check,
} from 'lucide-react'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { IconButton } from '@/app/components/ui/IconButton'
import { Modal, ModalHeader, ModalBody } from '@/app/components/ui/Modal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/app/components/ui/DropdownMenu'
import { SuperNovaStagingOrb } from '@/app/components/supernova-staging/SuperNovaStagingOrb'
import {
  getWorkflowById,
  type WorkflowStatus,
  type TriggerType,
  type StepType,
} from '../../lib/staging-workflows'

// ─── Types ───────────────────────────────────────────────────────────────────
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string }

type EditOption = {
  icon: React.ElementType
  label: string
  prompt: string
}

const EDIT_OPTIONS: EditOption[] = [
  { icon: ListPlus,      label: 'Change steps',                prompt: 'I want to add, remove, or reorder steps in this workflow.' },
  { icon: CalendarClock, label: 'Change schedule or trigger',   prompt: 'I want to change when or how this workflow is triggered.' },
  { icon: UserPlus,      label: 'Reassign agent',              prompt: 'I want to reassign this workflow to a different agent.' },
  { icon: Tag,           label: 'Rename or update description', prompt: 'I want to rename this workflow or update its description.' },
  { icon: GitMerge,      label: 'Add condition or branch',     prompt: 'I want to add a condition or branching logic to this workflow.' },
  { icon: Repeat2,       label: 'Change run frequency',        prompt: 'I want to change how often this workflow runs.' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkflowStatus }) {
  if (status === 'active')
    return <Badge severity="success" variant="subtle" size="sm" className="!font-semibold uppercase tracking-wide">Active</Badge>
  if (status === 'paused')
    return <Badge severity="warning" variant="subtle" size="sm" className="!font-semibold uppercase tracking-wide">Paused</Badge>
  if (status === 'failed')
    return <Badge severity="danger" variant="subtle" size="sm" className="!font-semibold uppercase tracking-wide">Failed</Badge>
  return <Badge severity="neutral" variant="subtle" size="sm" className="!font-semibold uppercase tracking-wide">Draft</Badge>
}

function TriggerChip({ type }: { type: TriggerType }) {
  if (type === 'scheduled')
    return (
      <span className="inline-flex items-center gap-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
        <Clock size={13} className="text-[var(--color-accent-9)]" aria-hidden /> Scheduled
      </span>
    )
  if (type === 'event')
    return (
      <span className="inline-flex items-center gap-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
        <Zap size={13} className="text-[#7c3aed]" aria-hidden /> Event-based
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
      <Play size={13} className="text-[var(--color-neutral-7)]" aria-hidden /> Manual
    </span>
  )
}

function RunStatusDot({ status }: { status: 'completed' | 'failed' | 'running' }) {
  if (status === 'running')
    return <RefreshCw size={13} className="text-[var(--color-accent-9)] animate-spin shrink-0" aria-hidden />
  if (status === 'failed')
    return <AlertCircle size={13} className="text-[var(--color-error)] shrink-0" aria-hidden />
  return <CheckCircle2 size={13} className="text-[var(--color-success)] shrink-0" aria-hidden />
}

// ─── Typing bubble ───────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="flex gap-2.5 sn-fade-in">
      <div className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-[var(--color-neutral-3)] flex items-center justify-center">
        <SuperNovaStagingOrb size="sm" />
      </div>
      <div className="rounded-[var(--radius-xl)] rounded-tl-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3.5 py-3 shadow-[var(--shadow-xs)]">
        <div className="flex items-center gap-1 h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-6)] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '900ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-6)] animate-bounce" style={{ animationDelay: '180ms', animationDuration: '900ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral-6)] animate-bounce" style={{ animationDelay: '360ms', animationDuration: '900ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Workflow graph ───────────────────────────────────────────────────────────
const STEP_TYPE_META: Record<StepType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  action:    { label: 'Action',    color: 'var(--color-accent-9)',  bg: 'var(--color-accent-1)',                                                Icon: Cpu },
  condition: { label: 'Condition', color: '#7c3aed',                bg: '#fdf4ff',                                                              Icon: GitBranch },
  branch:    { label: 'Branch',    color: '#d97706',                bg: '#fffbeb',                                                              Icon: Split },
  agent:     { label: 'Agent',     color: 'var(--color-success)',   bg: 'color-mix(in srgb, var(--color-success) 10%, transparent)',            Icon: Bot },
}

function StepNode({ step, index, isLast }: {
  step: { id: string; label: string; type: StepType; description?: string; branches?: { label: string }[] }
  index: number
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = STEP_TYPE_META[step.type]
  const Icon = meta.Icon

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: meta.bg, boxShadow: `0 0 0 1.5px ${meta.color}60` }}>
          <Icon size={13} style={{ color: meta.color }} aria-hidden />
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ minHeight: 20, background: 'var(--border-default)' }} />}
      </div>

      <div className={`flex-1 min-w-0 pb-4 ${isLast ? 'pb-0' : ''}`}>
        <button type="button" onClick={() => setExpanded((p) => !p)} className="w-full text-left">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-[var(--radius-sm)] shrink-0 mt-0.5"
              style={{ color: meta.color, background: meta.bg }}>
              {index + 1} · {meta.label}
            </span>
            <span className="text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)] leading-snug flex-1 min-w-0">
              {step.label}
            </span>
            <ChevronDown size={14}
              className={`shrink-0 mt-0.5 text-[var(--color-neutral-6)] transition-transform duration-[var(--duration-fast)] ${expanded ? 'rotate-180' : ''}`}
              aria-hidden />
          </div>
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            {step.description && (
              <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] leading-relaxed">{step.description}</p>
            )}
            {step.branches && step.branches.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                {step.branches.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ArrowRight size={11} className="text-[var(--color-neutral-6)] shrink-0" aria-hidden />
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-[var(--radius-sm)]"
                      style={{ color: meta.color, background: meta.bg }}>{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Close confirmation overlay ──────────────────────────────────────────────
function CloseConfirmOverlay({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-5 sn-fade-in"
      style={{ background: 'color-mix(in srgb, var(--surface-primary) 85%, transparent)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-[272px] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex flex-col items-start gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-[var(--color-neutral-3)] flex items-center justify-center">
            <AlertTriangle size={17} className="text-[var(--color-neutral-9)]" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)] leading-snug">Discard edits?</p>
            <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] leading-relaxed">
              Your conversation with SuperNova will be lost. No changes will be applied to this workflow.
            </p>
          </div>
        </div>
        <div className="h-px bg-[var(--border-default)]" />
        <div className="px-4 py-3.5 flex flex-col gap-2">
          <button type="button" onClick={onConfirm}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-neutral-12)] text-[var(--color-neutral-1)] text-[length:var(--font-size-sm)] font-semibold hover:opacity-85 transition-opacity cursor-pointer">
            Discard &amp; close
          </button>
          <button type="button" onClick={onCancel}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
            Keep editing
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Run history modal ────────────────────────────────────────────────────────
function RunHistoryModal({ open, onClose, wf }: {
  open: boolean
  onClose: () => void
  wf: NonNullable<ReturnType<typeof getWorkflowById>>
}) {
  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose() }} maxWidth="640px">
      <ModalHeader
        title={`Run history — ${wf.title}`}
        description={`${wf.runHistory.length} run${wf.runHistory.length !== 1 ? 's' : ''} · ${wf.totalRuns} total`}
      />
      <ModalBody className="!py-0 !px-0">
        <div className="divide-y divide-[var(--border-subtle)]">
          {/* Column headers */}
          <div className="grid px-6 py-2.5 bg-[var(--surface-secondary)]"
            style={{ gridTemplateColumns: '1fr 90px 110px 120px' }}>
            {['Started', 'Duration', 'Status', 'Triggered by'].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)]">{h}</span>
            ))}
          </div>
          {wf.runHistory.length === 0 && (
            <div className="px-6 py-8 text-center text-[length:var(--font-size-sm)] text-[var(--color-neutral-6)]">No runs yet</div>
          )}
          {wf.runHistory.map((run) => (
            <div key={run.id} className="grid items-center px-6 py-3.5 hover:bg-[var(--color-neutral-2)] transition-colors"
              style={{ gridTemplateColumns: '1fr 90px 110px 120px' }}>
              <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{run.startedAt}</span>
              <span className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-9)] tabular-nums">{run.duration ?? '—'}</span>
              <span className="inline-flex items-center gap-1.5 text-[length:var(--font-size-sm)]">
                <RunStatusDot status={run.status} />
                <span className="capitalize text-[var(--color-neutral-9)]">{run.status}</span>
              </span>
              <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)] capitalize">{run.triggeredBy}</span>
            </div>
          ))}
        </div>
      </ModalBody>
    </Modal>
  )
}

// ─── Detail page ─────────────────────────────────────────────────────────────
export default function WorkflowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = typeof params.workflowId === 'string' ? params.workflowId : ''
  const wf = getWorkflowById(workflowId)

  const [currentStatus, setCurrentStatus] = useState<WorkflowStatus>(wf?.status ?? 'active')
  const [draft, setDraft] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editMessageId, setEditMessageId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  const composerRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wf) router.replace('/supernova/staging')
  }, [wf, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Open edit panel with typing animation ────────────────────────────────
  const handleEditClick = useCallback(() => {
    if (!wf) return
    setMessages([])
    setEditMessageId(null)
    setShowCloseConfirm(false)
    setChatOpen(true)
    window.setTimeout(() => setIsTyping(true), 300)
    window.setTimeout(() => {
      const id = `asst-edit-${Date.now()}`
      setIsTyping(false)
      setMessages([{ id, role: 'assistant', text: `Hey Leti 👋 What would you like to change in **${wf.title}**? Pick one of the options below, or just type what you need.` }])
      setEditMessageId(id)
      window.setTimeout(() => composerRef.current?.focus(), 60)
    }, 1400)
  }, [wf])

  // ── Open edit panel pre-firing a specific option ─────────────────────────
  const handleEditWithOption = useCallback((opt: EditOption) => {
    if (!wf) return
    setMessages([])
    setEditMessageId(null)
    setShowCloseConfirm(false)
    setChatOpen(true)
    window.setTimeout(() => setIsTyping(true), 300)
    window.setTimeout(() => {
      setIsTyping(false)
      const uid = `u-${Date.now()}`
      setMessages([{ id: uid, role: 'user', text: opt.prompt }])
      setIsTyping(true)
      window.setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', text: `Got it — I'll help you "${opt.label.toLowerCase()}". What specifically needs to change?` },
        ])
      }, 900)
    }, 900)
  }, [wf])

  const handleCloseRequest = useCallback(() => {
    if (messages.length > 0) {
      setShowCloseConfirm(true)
    } else {
      setChatOpen(false)
      setIsTyping(false)
      setEditMessageId(null)
    }
  }, [messages])

  const handleConfirmClose = useCallback(() => {
    setChatOpen(false)
    setIsTyping(false)
    setShowCloseConfirm(false)
    setMessages([])
    setEditMessageId(null)
  }, [])

  const handleSend = useCallback(() => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }])
    setDraft('')
    setIsTyping(true)
    window.setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: 'Got it — full agent replies will be available in production. This is staging-only behaviour.' },
      ])
    }, 900)
  }, [draft])

  if (!wf) return (
    <div className="flex h-full items-center justify-center text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)]">Loading…</div>
  )

  const assignOption = EDIT_OPTIONS.find(o => o.label === 'Reassign agent')!

  return (
    <div className="sn-staging-agent-detail-enter flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-[var(--surface-canvas)]">

      {/* ── Run history modal ── */}
      <RunHistoryModal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} wf={wf} />

      {/* ── Delete confirm modal ── */}
      <Modal open={showDeleteConfirm} onOpenChange={(v) => { if (!v) setShowDeleteConfirm(false) }} maxWidth="400px" srTitle={`Delete "${wf.title}"?`}>
        <ModalBody className="!pt-6 !pb-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]">
                <Trash2 size={18} className="text-[var(--color-error)]" aria-hidden />
              </div>
              <div className="flex flex-col gap-1 min-w-0 pt-0.5">
                <p className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)] leading-snug">
                  Delete "{wf.title}"?
                </p>
                <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] leading-relaxed">
                  This workflow and its run history will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                className="!bg-[var(--color-error)] hover:!bg-[color-mix(in_srgb,var(--color-error)_85%,black)] !shadow-none"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  router.push('/supernova/staging/workflows')
                }}
              >
                <Trash2 size={13} aria-hidden />
                Delete workflow
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* ── LEFT: main content ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="shrink-0 flex items-center gap-3 min-h-[var(--supernova-staging-header-height)] px-[var(--space-2xl)] border-b border-[var(--border-default)] bg-[var(--surface-primary)]">
          <button
            type="button"
            onClick={() => router.push('/supernova/staging')}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors duration-[var(--duration-fast)] shrink-0"
            aria-label="Back to Workflows"
          >
            <ArrowLeft size={18} className="text-[var(--color-neutral-7)]" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <span className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-7)] shrink-0">Workflows</span>
            <span className="text-[var(--color-neutral-5)] shrink-0">/</span>
            <h1 className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)] truncate">{wf.title}</h1>

            {/* Status toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 cursor-pointer rounded-[var(--radius-md)] hover:opacity-75 transition-opacity focus-visible:outline-none"
                  aria-label={`Workflow status: ${currentStatus}. Click to change.`}
                >
                  <StatusBadge status={currentStatus} />
                  <ChevronDown size={11} className="text-[var(--color-neutral-6)] -ml-0.5" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" minWidth="160px">
                <DropdownMenuLabel>Change status</DropdownMenuLabel>
                {([
                  { s: 'active' as WorkflowStatus,  dot: 'var(--color-success)', label: 'Active' },
                  { s: 'paused' as WorkflowStatus,  dot: '#d97706',              label: 'Paused' },
                  { s: 'draft'  as WorkflowStatus,  dot: 'var(--color-neutral-5)', label: 'Draft' },
                  { s: 'failed' as WorkflowStatus,  dot: 'var(--color-error)',   label: 'Failed' },
                ]).map(({ s, dot, label }) => (
                  <DropdownMenuItem key={s} onSelect={() => setCurrentStatus(s)}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} aria-hidden />
                    <span className="flex-1">{label}</span>
                    {s === currentStatus && <Check size={13} className="ml-auto text-[var(--color-accent-9)] shrink-0" aria-hidden />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {wf.status !== 'failed' && wf.status !== 'draft' && (
              <Button variant="primary" size="md" type="button" className="gap-1.5">
                <Play size={14} strokeWidth={2.5} aria-hidden /> Run now
              </Button>
            )}

            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton label="More options" variant="secondary" size="md" type="button">
                  <MoreVertical size={16} aria-hidden />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" minWidth="200px">
                <DropdownMenuItem onSelect={handleEditClick}>
                  <Pencil size={14} className="text-[var(--color-neutral-7)] shrink-0" aria-hidden />
                  Edit workflow
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setHistoryModalOpen(true)}>
                  <History size={14} className="text-[var(--color-neutral-7)] shrink-0" aria-hidden />
                  View run history
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleEditWithOption(assignOption)}>
                  <UserPlus size={14} className="text-[var(--color-neutral-7)] shrink-0" aria-hidden />
                  Assign agent
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>
                  <Copy size={14} className="text-[var(--color-neutral-7)] shrink-0" aria-hidden />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => {}}>
                  <Archive size={14} className="text-[var(--color-neutral-7)] shrink-0" aria-hidden />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setShowDeleteConfirm(true)}
                  className="text-[var(--color-error)] focus:text-[var(--color-error)]"
                >
                  <Trash2 size={14} className="shrink-0" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-[var(--space-2xl)] py-[var(--space-xl)]">
          <div className="flex flex-col gap-6 w-full" style={{ maxWidth: 1200 }}>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Assigned agent */}
              <div
                onClick={() => handleEditWithOption(assignOption)}
                className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 cursor-pointer hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] transition-colors group/meta-card"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] mb-1">Assigned agent</p>
                <div className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] group-hover/meta-card:text-[var(--color-accent-10)]">
                  {wf.assignedAgent ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-accent-3)] flex items-center justify-center shrink-0">
                        <Bot size={11} className="text-[var(--color-accent-10)]" aria-hidden />
                      </span>
                      {wf.assignedAgent}
                    </span>
                  ) : (
                    <span className="text-[var(--color-neutral-6)]">Unassigned</span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--color-accent-9)] mt-1 opacity-0 group-hover/meta-card:opacity-100 transition-opacity font-medium">
                  {wf.assignedAgent ? 'Reassign →' : 'Assign agent →'}
                </p>
              </div>

              {/* Trigger */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] mb-1">Trigger</p>
                <div className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">
                  <TriggerChip type={wf.triggerType} />
                </div>
                <p className="text-[11px] text-[var(--color-neutral-7)] mt-1 font-medium">{wf.scheduleLabel}</p>
              </div>

              {/* Total runs */}
              <div
                onClick={wf.runHistory.length > 0 ? () => setHistoryModalOpen(true) : undefined}
                className={`rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 ${wf.runHistory.length > 0 ? 'cursor-pointer hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] transition-colors group/meta-card' : ''}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] mb-1">Total runs</p>
                <div className={`text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] ${wf.runHistory.length > 0 ? 'group-hover/meta-card:text-[var(--color-accent-10)]' : ''}`}>
                  <span className="tabular-nums">{wf.totalRuns}</span>
                </div>
                {wf.runHistory.length > 0 && (
                  <p className="text-[10px] text-[var(--color-accent-9)] mt-1 opacity-0 group-hover/meta-card:opacity-100 transition-opacity font-medium">View history →</p>
                )}
              </div>

              {/* Last run */}
              <div
                onClick={wf.runHistory.length > 0 ? () => setHistoryModalOpen(true) : undefined}
                className={`rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 ${wf.runHistory.length > 0 ? 'cursor-pointer hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] transition-colors group/meta-card' : ''}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] mb-1">Last run</p>
                <div className={`text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] ${wf.runHistory.length > 0 ? 'group-hover/meta-card:text-[var(--color-accent-10)]' : ''}`}>
                  {wf.lastRunStatus === 'running' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw size={13} className="text-[var(--color-accent-9)] animate-spin shrink-0" aria-hidden />
                      <span className="text-[var(--color-accent-9)]">Running now</span>
                    </span>
                  ) : wf.lastRun ? (
                    <span className="inline-flex items-center gap-1.5">
                      <RunStatusDot status={wf.lastRunStatus!} />
                      {wf.lastRun}
                    </span>
                  ) : (
                    <span className="text-[var(--color-neutral-6)]">Never</span>
                  )}
                </div>
                {wf.runHistory.length > 0 && (
                  <p className="text-[10px] text-[var(--color-accent-9)] mt-1 opacity-0 group-hover/meta-card:opacity-100 transition-opacity font-medium">View history →</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-neutral-7)] mb-1.5">Description</p>
              <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-10)] leading-relaxed">{wf.description}</p>
            </div>

            {/* Workflow graph */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border-subtle)]">
                <GitBranch size={15} className="text-[var(--color-neutral-7)] shrink-0" aria-hidden />
                <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">Workflow steps</span>
                <span className="ml-auto text-[11px] font-medium text-[var(--color-neutral-7)]">
                  {wf.steps.length} step{wf.steps.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-5 py-4">
                {wf.steps.map((step, i) => (
                  <StepNode key={step.id} step={step} index={i} isLast={i === wf.steps.length - 1} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── RIGHT: Supernova edit panel ──────────────────────────────── */}
      <div
        className="shrink-0 overflow-hidden transition-[width] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ width: chatOpen ? 340 : 0, transitionDuration: chatOpen ? '320ms' : '280ms' }}
        aria-hidden={!chatOpen}
      >
        <div className="relative flex flex-col h-full border-l border-[var(--border-default)] bg-[var(--surface-primary)]" style={{ width: 340, minWidth: 340 }}>

          {showCloseConfirm && (
            <CloseConfirmOverlay onConfirm={handleConfirmClose} onCancel={() => setShowCloseConfirm(false)} />
          )}

          {/* Panel header */}
          <div className="shrink-0 flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border-default)]">
            <SuperNovaStagingOrb size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-12)] leading-tight">SuperNova</p>
              <p className="text-[11px] text-[var(--color-neutral-7)] leading-tight">Edit assistant</p>
            </div>
            <button
              type="button"
              onClick={handleCloseRequest}
              className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-lg)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] transition-colors cursor-pointer"
              aria-label="Close edit panel"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Chat messages */}
          <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            {messages.map((m) => (
              <Fragment key={m.id}>
                {m.role === 'assistant' && !['__CONFIRM__', '__CONFIRMED__', '__CANCELLED__'].includes(m.text) && (
                  <div className="flex gap-2.5 sn-fade-in">
                    <div className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-[var(--color-neutral-3)] flex items-center justify-center">
                      <SuperNovaStagingOrb size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-[var(--radius-xl)] rounded-tl-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3.5 py-3 text-[length:var(--font-size-sm)] leading-relaxed text-[var(--color-neutral-11)] shadow-[var(--shadow-xs)]">
                        {m.text}
                      </div>
                    </div>
                  </div>
                )}

                {m.role === 'user' && (
                  <div className="flex justify-end sn-fade-in">
                    <div className="max-w-[85%] rounded-[var(--radius-xl)] rounded-tr-[var(--radius-sm)] bg-[var(--color-neutral-4)] px-3.5 py-2.5 text-[length:var(--font-size-sm)] leading-relaxed text-[var(--color-neutral-12)]">
                      {m.text}
                    </div>
                  </div>
                )}

                {/* Edit suggestion chips */}
                {m.id === editMessageId && (
                  <div className="flex flex-col gap-1.5 pl-9 sn-fade-in">
                    {EDIT_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            setEditMessageId(null)
                            const uid = `u-${Date.now()}`
                            setMessages((prev) => [...prev, { id: uid, role: 'user', text: opt.prompt }])
                            setIsTyping(true)
                            window.setTimeout(() => {
                              setIsTyping(false)
                              setMessages((prev) => [
                                ...prev,
                                { id: `a-${Date.now()}`, role: 'assistant', text: `Got it — I'll help you "${opt.label.toLowerCase()}". What specifically needs to change?` },
                              ])
                              window.setTimeout(() => {
                                setIsTyping(true)
                                window.setTimeout(() => {
                                  setIsTyping(false)
                                  setMessages((prev) => [...prev, { id: `confirm-${Date.now()}`, role: 'assistant', text: '__CONFIRM__' }])
                                }, 800)
                              }, 600)
                            }, 900)
                          }}
                          className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-left text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] hover:bg-[var(--color-accent-1)] hover:border-[var(--color-accent-4)] transition-colors cursor-pointer group/edit-opt"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Icon size={13} className="text-[var(--color-neutral-7)] group-hover/edit-opt:text-[var(--color-accent-9)] shrink-0 transition-colors" aria-hidden />
                            <span className="truncate">{opt.label}</span>
                          </span>
                          <ArrowRight size={12} className="text-[var(--color-neutral-5)] group-hover/edit-opt:text-[var(--color-accent-9)] shrink-0 transition-colors" aria-hidden />
                        </button>
                      )
                    })}
                    <p className="text-[11px] text-[var(--color-neutral-6)] px-1 mt-0.5">or just type what you need below ↓</p>
                  </div>
                )}

                {/* Confirm/cancel */}
                {m.role === 'assistant' && m.text === '__CONFIRM__' && (
                  <div className="flex flex-col gap-2 pl-9 sn-fade-in">
                    <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)] leading-relaxed">The changes look good. Do you want to apply them?</p>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => {
                          setMessages((prev) => prev.map((msg) => msg.text === '__CONFIRM__' ? { ...msg, text: '__CONFIRMED__' } : msg))
                          window.setTimeout(() => {
                            setMessages((prev) => [...prev, { id: `a-done-${Date.now()}`, role: 'assistant', text: '✓ Changes applied! The workflow has been updated.' }])
                            window.setTimeout(() => setChatOpen(false), 1800)
                          }, 300)
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--color-accent-9)] text-white text-[length:var(--font-size-sm)] font-semibold hover:bg-[var(--color-accent-10)] transition-colors cursor-pointer">
                        <CheckCircle2 size={13} aria-hidden /> Apply changes
                      </button>
                      <button type="button"
                        onClick={() => {
                          setMessages((prev) => prev.map((msg) => msg.text === '__CONFIRM__' ? { ...msg, text: '__CANCELLED__' } : msg))
                          window.setTimeout(() => {
                            setMessages((prev) => [...prev, { id: `a-cancel-${Date.now()}`, role: 'assistant', text: 'No problem — nothing was changed. Want to try something else?' }])
                          }, 300)
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Status pills */}
                {m.role === 'assistant' && (m.text === '__CONFIRMED__' || m.text === '__CANCELLED__') && (
                  <div className="pl-9">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${m.text === '__CONFIRMED__' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)]'}`}>
                      {m.text === '__CONFIRMED__' ? <><CheckCircle2 size={11} aria-hidden /> Applied</> : <>Cancelled</>}
                    </span>
                  </div>
                )}
              </Fragment>
            ))}

            {isTyping && <TypingBubble />}
            <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden />
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-[var(--border-default)] px-3 py-3">
            <div className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus-within:border-[var(--color-accent-7)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent-9)_14%,transparent)]">
              <textarea
                ref={composerRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={1}
                placeholder="Describe what you need to change…"
                className="flex-1 resize-none bg-transparent text-[length:var(--font-size-sm)] leading-5 text-[var(--color-neutral-12)] outline-none focus:outline-none focus-visible:outline-none placeholder:text-[var(--color-neutral-6)] min-h-[32px] max-h-24 py-1.5"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white shadow-sm transition-opacity hover:bg-[var(--color-accent-10)] disabled:pointer-events-none disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={14} className="shrink-0" aria-hidden />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
