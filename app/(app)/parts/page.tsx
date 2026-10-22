'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LayoutGrid, ChevronDown, Boxes, ClipboardCheck } from 'lucide-react'
import { TableToolbar } from '@/app/components/ui/Table'
import { InventoryTable, INVENTORY } from '@/app/components/parts/InventoryTable'
import { planById } from '@/app/lib/billing/plans'
import { Package, Plus, Sparkles, Filter, Cog, Zap, Droplets } from 'lucide-react'
import { TemplatePickerModal, type ModuleTemplate } from '@/app/components/onboarding/TemplatePickerModal'
import { Button } from '@/app/components/ui/Button'
import { ModuleEmptyState } from '@/app/components/onboarding/ModuleEmptyState'
import { NovaSidePanel, OPEN_NOVA_PANEL_EVENT } from '@/app/components/onboarding/NovaSidePanel'
import { SUGGESTED_PART_CARDS, itemFromPrompt, type ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'

interface Part {
  id: string
  name: string
  detail: string
  byNova?: boolean
}

/** Parts & Inventory. Starts empty for a new account, with Nova's
 * suggestions drawn from the issues it found during setup. */
const TEMPLATES: ModuleTemplate[] = [
  { name: 'Hydraulic filter', detail: 'Presses and hydraulic units', icon: Filter },
  { name: 'Bearing kit', detail: 'Conveyors and motors', icon: Cog },
  { name: 'Contactor / relay', detail: 'Electrical panels', icon: Zap },
  { name: 'Lubricant, 5 gal', detail: 'General lubrication', icon: Droplets },
]

type InventoryTab = 'inventory' | 'parts' | 'sets' | 'cycle-counts'

const TABS: { id: InventoryTab; label: string; pro?: boolean }[] = [
  { id: 'inventory', label: 'Inventory' },
  // Parts & inventory management with costing is a Premium feature.
  { id: 'parts', label: 'Parts', pro: true },
  { id: 'sets', label: 'Sets' },
  { id: 'cycle-counts', label: 'Cycle Counts' },
]

/** Inventory: stock on hand, with tabs for the parts catalog, sets and cycle
 * counts. Tabs and actions live in the page header. */
export default function InventoryPage() {
  const [tab, setTab] = useState<InventoryTab>('inventory')
  const [search, setSearch] = useState('')
  const [slots, setSlots] = useState<{ afterTitle: HTMLElement | null; actions: HTMLElement | null; toolbar: HTMLElement | null }>({ afterTitle: null, actions: null, toolbar: null })

  // The layout's slots exist only after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots({
      afterTitle: document.getElementById('page-after-title'),
      actions: document.getElementById('page-header-actions'),
      toolbar: document.getElementById('page-toolbar-portal'),
    })
  }, [])

  const rows = search ? INVENTORY.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) : INVENTORY

  return (
    <>
      {slots.afterTitle && createPortal(
        <div className="flex items-center self-stretch">
          <nav className="ml-4 flex items-center self-stretch border-l border-[var(--border-subtle)] pl-3" aria-label="Inventory sections">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`inline-flex h-full items-center gap-1.5 border-b-2 px-3 text-[length:var(--font-size-base)] font-medium transition-colors cursor-pointer ${
                  tab === t.id ? 'border-[var(--color-accent-9)] text-[var(--color-neutral-12)]' : 'border-transparent text-[var(--color-neutral-9)] hover:text-[var(--color-neutral-12)]'
                }`}
              >
                {t.label}
                {t.pro && (
                  <span title={`Free during your trial — included in ${planById('premium').name}`} className="inline-flex h-[18px] items-center rounded-full bg-[var(--color-purple-light)] px-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--color-purple)]">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </nav>
          {tab === 'inventory' && (
            <button type="button" className="ml-3 inline-flex items-center gap-1.5 border-l border-[var(--border-subtle)] pl-4 text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-11)] cursor-pointer">
              <LayoutGrid size={15} className="text-[var(--color-neutral-9)]" /> Table <ChevronDown size={14} className="text-[var(--color-neutral-8)]" />
            </button>
          )}
        </div>,
        slots.afterTitle,
      )}
      {tab === 'inventory' && slots.actions && createPortal(
        <Button variant="primary" size="md"><Plus size={14} /> Create Part</Button>,
        slots.actions,
      )}
      {tab === 'inventory' && slots.toolbar && createPortal(
        <TableToolbar itemCountLabel={`${rows.length} Results Returned`} sortLabel="Sort: Date Created" searchValue={search} onSearchChange={setSearch} />,
        slots.toolbar,
      )}

      {tab === 'inventory' ? (
        <main className="flex-1 overflow-y-auto"><InventoryTable rows={rows} /></main>
      ) : tab === 'parts' ? (
        <PartsTab />
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-2 py-[var(--space-3xl)] text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-3)] text-[var(--color-neutral-9)]">
            {tab === 'sets' ? <Boxes size={20} /> : <ClipboardCheck size={20} />}
          </span>
          <p className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">{tab === 'sets' ? 'No sets yet' : 'No cycle counts yet'}</p>
          <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">{tab === 'sets' ? 'Group parts that are used together, like a PM kit.' : 'Schedule counts to keep stock levels accurate.'}</p>
        </main>
      )}
    </>
  )
}

/** The Parts tab: the catalog Nova helps fill (a Premium feature). */
function PartsTab() {
  const [parts, setParts] = useState<Part[]>([])
  const [novaOpen, setNovaOpen] = useState(false)
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)

  useEffect(() => {
    const open = () => setNovaOpen(true)
    window.addEventListener(OPEN_NOVA_PANEL_EVENT, open)
    return () => window.removeEventListener(OPEN_NOVA_PANEL_EVENT, open)
  }, [])

  const suggestions = SUGGESTED_PART_CARDS.filter(c => !parts.some(p => p.name === c.title))

  function add(name: string, detail: string, byNova: boolean) {
    const id = `part-${Date.now()}`
    setParts(prev => [{ id, name, detail, byNova }, ...prev])
    setHighlighted(id)
    window.setTimeout(() => setHighlighted(null), 2500)
  }

  const [templateOpen, setTemplateOpen] = useState(false)
  const [novaRequest, setNovaRequest] = useState<{ text: string; id: number } | null>(null)
  function askNova(text: string) {
    setNovaOpen(true)
    setNovaRequest({ text, id: Date.now() })
  }

  function createSuggestion(s: ModuleSuggestion) {
    setCreatingId(s.id)
    window.setTimeout(() => { setCreatingId(null); add(s.title, s.reason, true) }, 1200)
  }

  const panel = (
    <NovaSidePanel
      open={novaOpen}
      onClose={() => setNovaOpen(false)}
      intro="Which part should I add? Describe it, or pick one of these."
      quickActions={suggestions.map(c => c.title)}
      placeholder="Describe the part — name, quantity, where it's stored"
      request={novaRequest}
      onCreate={prompt => { const text = itemFromPrompt(prompt, SUGGESTED_PART_CARDS); add(text, 'Created with Nova', true); return text }}
    />
  )

  if (parts.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto">
        <ModuleEmptyState
          icon={Package}
          title="No parts created yet"
          headerLabel="Create Part"
          description="Create one yourself, or ask Nova to help you get started."
          createLabel="Create Manually"
          onCreate={() => add('New part', 'Add details', false)}
          prompt={suggestions[0] ? `Add ${suggestions[0].title} to my parts inventory` : 'Add a part to my inventory'}
          onAskNova={askNova}
          onUseTemplate={() => setTemplateOpen(true)}
          suggestions={suggestions}
          creatingId={creatingId}
          onSuggest={createSuggestion}
        />
        <TemplatePickerModal
          open={templateOpen}
          onOpenChange={setTemplateOpen}
          description="Common spares to keep in stock"
          templates={TEMPLATES}
          onPick={t => add(t.name, t.detail, false)}
        />
        {panel}
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-[var(--space-lg)] px-[var(--space-2xl)] py-[var(--space-xl)]">
        <div className="flex items-center justify-between nova-enter">
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{parts.length} {parts.length === 1 ? 'part' : 'parts'}</span>
          <Button variant="primary" size="md" onClick={() => setNovaOpen(true)}>
            <Plus size={14} /> Add part
          </Button>
        </div>
        <ul className="flex flex-col gap-2">
          {parts.map(p => (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-[var(--radius-xl)] border bg-[var(--surface-primary)] px-4 py-3 nova-enter ${
                highlighted === p.id ? 'nova-row-pop border-[var(--color-accent-7)]' : 'border-[var(--border-default)]'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] text-[var(--color-neutral-10)]"><Package size={16} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{p.name}</span>
                <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{p.detail}</span>
              </span>
              {p.byNova && (
                <span className="inline-flex h-5 items-center gap-1 rounded-full bg-[var(--color-accent-2)] px-2 text-[length:var(--font-size-xs)] font-medium text-[var(--color-accent-11)]">
                  <Sparkles size={11} /> Nova
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {panel}
    </main>
  )
}
