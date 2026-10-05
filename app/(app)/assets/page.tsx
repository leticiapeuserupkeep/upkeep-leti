'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, Plus, Flame, Bot, Cog, PaintBucket, ImageIcon, MoreHorizontal, SlidersHorizontal, MapPin, Shapes, RefreshCw, type LucideIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { IconButton } from '@/app/components/ui/IconButton'
import { Checkbox } from '@/app/components/ui/Checkbox'
import { FilterChip } from '@/app/components/ui/FilterChip'
import { Table, TableToolbar, TableHeader, TableBody, TableHead, TableCell } from '@/app/components/ui/Table'
import { Modal, ModalHeader, ModalBody } from '@/app/components/ui/Modal'
import { CreateAssetModal } from '@/app/components/assets/CreateAssetModal'
import { ModuleEmptyState } from '@/app/components/onboarding/ModuleEmptyState'
import { NovaSidePanel, OPEN_NOVA_PANEL_EVENT } from '@/app/components/onboarding/NovaSidePanel'
import { setupStore, useSetupState } from '@/app/lib/onboarding/setup-store'
import { MOCK_COMPANY, SUGGESTED_ASSET_CARDS, starterAssetRows, type ModuleSuggestion, type StarterAssetRow } from '@/app/lib/onboarding/nova-onboarding-data'
import type { Asset } from '@/app/lib/assets-data'

const TEMPLATES: { name: string; category: string; icon: LucideIcon }[] = [
  { name: 'Induction furnace', category: 'Foundry', icon: Flame },
  { name: 'Industrial robot cell', category: 'Robotics', icon: Bot },
  { name: 'CNC machining center', category: 'Machining', icon: Cog },
  { name: 'Paint line oven', category: 'Paint', icon: PaintBucket },
]


export default function AssetsPage() {
  return (
    <Suspense>
      <AssetsView />
    </Suspense>
  )
}

/** Assets. Opens on Nova's create-from-a-sentence landing when there's
 * nothing yet, or when arriving from the setup checklist's "Add". */
function AssetsView() {
  const setup = useSetupState()

  const [added, setAdded] = useState<(Asset & { byNova?: boolean })[]>([])
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  // Anything counted in setup beyond what was added here came from Nova's
  // starter list during onboarding.
  const fromOnboarding = Math.max(0, setup.counts.assets - added.length)
  const isEmpty = added.length === 0 && fromOnboarding === 0
  const suggestions = SUGGESTED_ASSET_CARDS.filter(c => !added.some(a => c.title.startsWith(a.name)))
  const [novaOpen, setNovaOpen] = useState(false)
  const [creatingId, setCreatingId] = useState<string | null>(null)

  // Nova's panel opens only when asked — "Create with Nova" or the top bar's "Ask Nova".
  useEffect(() => {
    const open = () => setNovaOpen(true)
    window.addEventListener(OPEN_NOVA_PANEL_EVENT, open)
    return () => window.removeEventListener(OPEN_NOVA_PANEL_EVENT, open)
  }, [])

  function createFromText(text: string) {
    const [name, place] = text.split(' — ')
    add({ name: name.trim(), category: 'Equipment', location: place?.trim() ?? MOCK_COMPANY.location, byNova: true })
  }

  function createSuggestion(s: ModuleSuggestion) {
    setCreatingId(s.id)
    window.setTimeout(() => { setCreatingId(null); createFromText(s.title) }, 1200)
  }

  function add(asset: Omit<Asset, 'id' | 'createdAt'> & { byNova?: boolean }) {
    const id = `asset-${Date.now()}`
    setAdded(prev => [...prev, { ...asset, id, createdAt: new Date().toISOString() }])
    setHighlighted(id)
    setupStore.setCount('assets', setupStore.get().counts.assets + 1)
    window.setTimeout(() => setHighlighted(null), 2500)
  }

  // Nova's starter list from onboarding, plus anything added here (newest first).
  const rows: (StarterAssetRow & { byNova?: boolean })[] = useMemo(() => [
    ...added.slice().reverse().map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      location: a.location ?? '',
      barcode: '',
      operational: true,
      byNova: a.byNova,
    })),
    ...starterAssetRows(fromOnboarding).map(r => ({ ...r, byNova: true })),
  ], [added, fromOnboarding])

  const modals = (
    <>
      <CreateAssetModal
        open={manualOpen}
        onOpenChange={setManualOpen}
        onCreate={asset => add({ name: asset.name, category: asset.category, manufacturer: asset.manufacturer, model: asset.model, location: asset.location })}
      />
      <Modal open={templateOpen} onOpenChange={setTemplateOpen} maxWidth="480px">
        <ModalHeader title="Start from a template" description="Common equipment for a heavy equipment manufacturer" />
        <ModalBody className="flex flex-col gap-2">
          {TEMPLATES.map(({ name, category, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => { add({ name, category, location: MOCK_COMPANY.location }); setTemplateOpen(false) }}
              className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-default)] px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] cursor-pointer"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] text-[var(--color-neutral-10)]"><Icon size={16} /></span>
              <span className="flex flex-col">
                <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{name}</span>
                <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{category}</span>
              </span>
            </button>
          ))}
        </ModalBody>
      </Modal>
    </>
  )

  const panel = (
    <NovaSidePanel
      open={novaOpen}
      onClose={() => setNovaOpen(false)}
      intro="Which equipment should I add? Describe it, or pick one of these."
      quickActions={suggestions.map(c => c.title)}
      placeholder="Describe the equipment — name, where it is, make or model"
      onCreate={text => { createFromText(text); return text.split(' — ')[0] }}
    />
  )

  if (isEmpty) {
    return (
      <main className="flex-1 overflow-y-auto">
        <ModuleEmptyState
          icon={Box}
          title="No Assets created yet"
          description="Create one yourself, or ask Nova to help you get started."
          createLabel="Create Manually"
          onCreate={() => setManualOpen(true)}
          onCreateWithNova={() => setNovaOpen(true)}
          suggestions={suggestions}
          creatingId={creatingId}
          onSuggest={createSuggestion}
        />
        {modals}
        {panel}
      </main>
    )
  }

  return (
    <AssetsTable
      rows={rows}
      highlighted={highlighted}
      onCreate={() => setManualOpen(true)}
    >
      {modals}
      {panel}
    </AssetsTable>
  )
}

/** Assets as a table, like the rest of the product's lists. */
function AssetsTable({ rows, highlighted, onCreate, children }: {
  rows: (StarterAssetRow & { byNova?: boolean })[]
  highlighted: string | null
  onCreate: () => void
  children: React.ReactNode
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [slots, setSlots] = useState<{ toolbar: HTMLElement | null; actions: HTMLElement | null }>({ toolbar: null, actions: null })

  // The layout's slots exist only after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots({ toolbar: document.getElementById('page-toolbar-portal'), actions: document.getElementById('page-header-actions') })
  }, [])

  const filtered = search
    ? rows.filter(r => `${r.name} ${r.location} ${r.category}`.toLowerCase().includes(search.toLowerCase()))
    : rows
  const operational = rows.filter(r => r.operational).length
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id))

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const stats = [
    { label: 'Total assets', value: rows.length, dot: 'bg-[var(--color-accent-9)]', active: true },
    { label: 'Operational', value: operational, dot: 'bg-[var(--color-success)]' },
    { label: 'Not Operational', value: rows.length - operational, dot: 'bg-[var(--color-error)]' },
    { label: 'Warranty expired', value: 0, dot: 'bg-[var(--color-warning)]' },
  ]

  return (
    <div className="flex w-full flex-1 flex-col">
      {slots.actions && createPortal(
        <>
          <Button variant="primary" size="md" onClick={onCreate}><Plus size={14} /> Create Asset</Button>
          <IconButton label="More" variant="secondary" size="md"><MoreHorizontal size={16} /></IconButton>
        </>,
        slots.actions,
      )}
      {slots.toolbar && createPortal(
        <>
          <div className="flex h-11 items-center gap-1 border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-[var(--space-lg)]">
            {stats.map((st, i) => (
              <span key={st.label} className="flex items-center">
                {i > 0 && <span className="mx-2 h-4 w-px bg-[var(--border-default)]" aria-hidden />}
                <span className={`inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-md)] px-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-10)] ${st.active ? 'border border-[var(--border-default)] bg-[var(--color-neutral-2)]' : ''}`}>
                  <span className={`h-2 w-2 rounded-[2px] ${st.dot}`} aria-hidden />
                  {st.label}
                  <span className="font-semibold tabular-nums text-[var(--color-neutral-12)]">{st.value}</span>
                </span>
              </span>
            ))}
          </div>
          <TableToolbar
            itemCountLabel={`${filtered.length} Results Returned`}
            sortLabel="Sort: Date Created"
            searchValue={search}
            onSearchChange={setSearch}
          />
        </>,
        slots.toolbar,
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">
          <div className="mb-4 flex flex-wrap items-center gap-2 nova-enter">
            <FilterChip active icon={<SlidersHorizontal size={13} />}>Filters (1)</FilterChip>
            <FilterChip hasDropdown icon={<MapPin size={13} />}>Location</FilterChip>
            <FilterChip hasDropdown icon={<Shapes size={13} />}>Asset Type</FilterChip>
            <IconButton label="Refresh" variant="ghost" size="sm" className="text-[var(--color-neutral-9)]"><RefreshCw size={14} /></IconButton>
            <div className="flex-1" />
            <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">Save View</button>
          </div>

          <div className="overflow-hidden rounded-[var(--widget-radius)] border border-[var(--widget-border)] bg-[var(--surface-primary)] nova-enter">
            <Table>
              <TableHeader>
                <tr>
                  <th className="w-[52px] border-b border-[var(--border-default)] py-3 pl-6 pr-2">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={!allSelected && filtered.some(r => selected.has(r.id))}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map(r => r.id)))}
                    />
                  </th>
                  <TableHead className="pl-2">Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="w-12" aria-label="Actions" />
                </tr>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className={`transition-colors duration-500 ${
                      highlighted === r.id ? 'bg-[var(--color-accent-2)]' : selected.has(r.id) ? 'bg-[var(--color-accent-1)]' : 'hover:bg-[var(--color-neutral-2)]'
                    }`}
                  >
                    <td className="py-3 pl-6 pr-2"><Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                    <TableCell className="pl-2 text-[var(--color-neutral-12)] whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        {r.name}
                        {!r.operational && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" title="Not operational" />}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-neutral-3)] text-[var(--color-neutral-7)]"><ImageIcon size={16} /></span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--color-neutral-11)]">{r.location}</TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--color-neutral-9)]">{r.category}</TableCell>
                    <TableCell className="tabular-nums text-[var(--color-neutral-9)]">{r.barcode}</TableCell>
                    <TableCell className="pr-4">
                      <IconButton label={`More for ${r.name}`} variant="ghost" size="sm" className="text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)]"><MoreHorizontal size={16} /></IconButton>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      {children}
    </div>
  )
}
