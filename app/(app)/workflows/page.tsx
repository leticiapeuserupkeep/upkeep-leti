'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Zap, Clock, Users, Play, Pause, Pencil, Trash2, Copy } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import {
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '@/app/components/ui/Table'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/app/components/ui/DropdownMenu'

interface Workflow {
  id: string
  name: string
  description: string
  trigger: string
  steps: number
  aiMate: { name: string; photo: string } | null
  integrations: { name: string; logo: string }[]
  status: 'active' | 'paused' | 'draft'
  lastRun: string | null
  runs: number
}

const workflows: Workflow[] = [
  {
    id: 'wf1',
    name: 'Weekly PM digest',
    description: 'Sends PM summary to maintenance leads every Friday',
    trigger: 'Schedule · Every Friday 5pm',
    steps: 4,
    aiMate: { name: 'Sofia', photo: 'https://i.pravatar.cc/150?u=sofia-chen-upkeep' },
    integrations: [
      { name: 'Slack', logo: '/images/integrations/slack.svg' },
      { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
    ],
    status: 'active',
    lastRun: '2 hours ago',
    runs: 47,
  },
  {
    id: 'wf2',
    name: 'Inventory low-stock alert',
    description: 'Scans stock levels and flags items below threshold',
    trigger: 'Schedule · Every Monday 8am',
    steps: 3,
    aiMate: { name: 'Elena', photo: 'https://i.pravatar.cc/150?u=elena-rodriguez-upkeep' },
    integrations: [
      { name: 'QuickBooks', logo: '/images/integrations/quickbooks.svg' },
    ],
    status: 'active',
    lastRun: '3 days ago',
    runs: 23,
  },
  {
    id: 'wf3',
    name: 'SLA compliance report',
    description: 'Calculates SLA % and alerts on misses daily',
    trigger: 'Schedule · Daily 6am',
    steps: 5,
    aiMate: { name: 'Sofia', photo: 'https://i.pravatar.cc/150?u=sofia-chen-upkeep' },
    integrations: [
      { name: 'Google Sheets', logo: '/images/integrations/google-sheets.svg' },
      { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
    ],
    status: 'active',
    lastRun: '18 hours ago',
    runs: 112,
  },
  {
    id: 'wf4',
    name: 'Vendor invoice sync',
    description: 'Imports invoices from connected vendors',
    trigger: 'Schedule · Daily 9am',
    steps: 3,
    aiMate: { name: 'Elena', photo: 'https://i.pravatar.cc/150?u=elena-rodriguez-upkeep' },
    integrations: [
      { name: 'QuickBooks', logo: '/images/integrations/quickbooks.svg' },
      { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
    ],
    status: 'paused',
    lastRun: '1 week ago',
    runs: 34,
  },
  {
    id: 'wf5',
    name: 'Shift handoff summary',
    description: 'Summarizes open items for next shift',
    trigger: 'Schedule · Daily 3pm',
    steps: 4,
    aiMate: { name: 'Marcus', photo: 'https://i.pravatar.cc/150?u=marcus-johnson-upkeep' },
    integrations: [
      { name: 'Slack', logo: '/images/integrations/slack.svg' },
    ],
    status: 'active',
    lastRun: '5 hours ago',
    runs: 89,
  },
  {
    id: 'wf6',
    name: 'New work order triage',
    description: 'Auto-categorizes and assigns priority to incoming work orders',
    trigger: 'Event · New work order created',
    steps: 6,
    aiMate: { name: 'Marcus', photo: 'https://i.pravatar.cc/150?u=marcus-johnson-upkeep' },
    integrations: [
      { name: 'Slack', logo: '/images/integrations/slack.svg' },
      { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
    ],
    status: 'active',
    lastRun: '30 min ago',
    runs: 256,
  },
  {
    id: 'wf7',
    name: 'Asset warranty expiration alert',
    description: 'Notifies team 30 days before warranty expires',
    trigger: 'Schedule · Daily 7am',
    steps: 3,
    aiMate: null,
    integrations: [
      { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
    ],
    status: 'draft',
    lastRun: null,
    runs: 0,
  },
  {
    id: 'wf8',
    name: 'Monthly maintenance report',
    description: 'Compiles KPIs and sends report to management',
    trigger: 'Schedule · 1st of month 9am',
    steps: 7,
    aiMate: { name: 'Sofia', photo: 'https://i.pravatar.cc/150?u=sofia-chen-upkeep' },
    integrations: [
      { name: 'Google Sheets', logo: '/images/integrations/google-sheets.svg' },
      { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
      { name: 'Slack', logo: '/images/integrations/slack.svg' },
    ],
    status: 'active',
    lastRun: '2 weeks ago',
    runs: 8,
  },
]

const statusConfig = {
  active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { label: 'Paused', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft: { label: 'Draft', bg: 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-8)] border-[var(--color-neutral-5)]' },
}

export default function WorkflowsPage() {
  const [search, setSearch] = useState('')

  const filtered = workflows.filter(wf => {
    if (!search) return true
    return wf.name.toLowerCase().includes(search.toLowerCase()) ||
      wf.description.toLowerCase().includes(search.toLowerCase())
  })

  const activeCount = workflows.filter(w => w.status === 'active').length
  const totalRuns = workflows.reduce((sum, w) => sum + w.runs, 0)

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex flex-col flex-1 w-full relative">
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">

            {/* Table */}
            <div
              className="bg-[var(--surface-primary)] rounded-[var(--widget-radius)] border border-[var(--widget-border)] overflow-hidden opacity-0"
              style={{ animation: 'fadeInUp 0.35s var(--ease-default) 0.06s forwards' }}
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--font-size-sm)] text-[var(--color-neutral-8)] font-medium">
                    {filtered.length} workflows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search automations…"
                    className="h-8 px-3 text-[13px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-6)] focus:outline-none focus:border-[var(--color-accent-8)] transition-colors w-[200px]"
                  />
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-center">Steps</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Integrations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-center">Runs</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((wf) => {
                    const status = statusConfig[wf.status]
                    return (
                      <TableRow key={wf.id} className="group">
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[var(--color-neutral-12)] truncate">{wf.name}</p>
                            <p className="text-[11px] text-[var(--color-neutral-7)] truncate mt-0.5">{wf.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-neutral-9)]">
                            {wf.trigger.startsWith('Event') ? <Zap size={12} className="text-amber-500" /> : <Clock size={12} className="text-[var(--color-neutral-6)]" />}
                            {wf.trigger}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[13px] font-medium text-[var(--color-neutral-11)]">{wf.steps}</span>
                        </TableCell>
                        <TableCell>
                          {wf.aiMate ? (
                            <div className="flex items-center gap-1.5">
                              <img src={wf.aiMate.photo} alt={wf.aiMate.name} className="w-5 h-5 rounded-full object-cover" />
                              <span className="text-[12px] text-[var(--color-neutral-11)]">{wf.aiMate.name}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-[var(--color-neutral-6)]">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {wf.integrations.map((integ) => (
                              <img key={integ.name} src={integ.logo} alt={integ.name} title={integ.name} className="w-4 h-4 rounded-[2px] object-cover" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${status.bg}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[12px] text-[var(--color-neutral-8)]">{wf.lastRun ?? '—'}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[13px] font-medium text-[var(--color-neutral-11)]">{wf.runs}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal size={15} className="text-[var(--color-neutral-7)]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" minWidth="160px">
                              <DropdownMenuItem>
                                <Pencil size={13} className="text-[var(--color-neutral-7)]" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy size={13} className="text-[var(--color-neutral-7)]" />
                                Duplicate
                              </DropdownMenuItem>
                              {wf.status === 'active' ? (
                                <DropdownMenuItem>
                                  <Pause size={13} className="text-[var(--color-neutral-7)]" />
                                  Pause
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem>
                                  <Play size={13} className="text-[var(--color-neutral-7)]" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 size={13} />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
