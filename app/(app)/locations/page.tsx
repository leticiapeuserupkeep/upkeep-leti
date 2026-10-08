'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Plus, MoreHorizontal, SlidersHorizontal, Users, Tag, Factory, Warehouse, Building2, Wrench } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { IconButton } from '@/app/components/ui/IconButton'
import { Checkbox } from '@/app/components/ui/Checkbox'
import { FilterChip } from '@/app/components/ui/FilterChip'
import { Skeleton } from '@/app/components/ui/Skeleton'
import { TextInput } from '@/app/components/ui/TextInput'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import { Table, TableToolbar, TableHeader, TableBody, TableHead, TableCell } from '@/app/components/ui/Table'
import { ModuleEmptyState } from '@/app/components/onboarding/ModuleEmptyState'
import { TemplatePickerModal, type ModuleTemplate } from '@/app/components/onboarding/TemplatePickerModal'
import { NovaSidePanel, OPEN_NOVA_PANEL_EVENT } from '@/app/components/onboarding/NovaSidePanel'
import { setupStore, useSetupState } from '@/app/lib/onboarding/setup-store'
import { COMPANY_REPORT, MOCK_COMPANY, SUGGESTED_LOCATION_CARDS, itemFromPrompt, type ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'

const TEMPLATES: ModuleTemplate[] = [
  { name: 'Manufacturing plant', detail: 'Production lines, assembly and paint', icon: Factory },
  { name: 'Warehouse', detail: 'Storage, docks and material handling', icon: Warehouse },
  { name: 'Office building', detail: 'HVAC, lighting and facilities', icon: Building2 },
  { name: 'Maintenance shop', detail: 'Tools, spares and repair bays', icon: Wrench },
]

interface LocationRow {
  id: string
  name: string
  hierarchy: string
  address: string
  description: string
}

/** What Nova added during onboarding: the main location first, then the US
 * plants from the setup plan — as many as the setup counts. */
function onboardingLocations(n: number): LocationRow[] {
  if (n <= 0) return []
  const hq: LocationRow = {
    id: 'hq',
    name: MOCK_COMPANY.location,
    hierarchy: `${MOCK_COMPANY.name} › Headquarters`,
    address: 'One John Deere Place, Moline, IL 61265',
    description: 'World headquarters',
  }
  const plants = COMPANY_REPORT.usPlants.slice(0, n - 1).map((p, i) => ({
    id: `plant-${i}`,
    name: p.name,
    hierarchy: `${MOCK_COMPANY.name} › Plant`,
    address: p.name.replace(/\s*\(.*\)$/, ''),
    description: p.makes,
  }))
  return [hq, ...plants]
}

export default function LocationsPage() {
  const setup = useSetupState()
  const [added, setAdded] = useState<LocationRow[]>([])
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', address: '' })
  const [templateOpen, setTemplateOpen] = useState(false)
  const [novaOpen, setNovaOpen] = useState(false)
  const [novaRequest, setNovaRequest] = useState<{ text: string; id: number } | null>(null)
  // Name of the location Nova is creating — a skeleton row holds its place.
  const [pendingName, setPendingName] = useState<string | null>(null)

  const fromOnboarding = Math.max(0, setup.counts.locations - added.length)
  const rows = [...added, ...onboardingLocations(fromOnboarding)]
  const isEmpty = rows.length === 0 && !pendingName
  const suggestions = SUGGESTED_LOCATION_CARDS.filter(c => !rows.some(r => r.name === c.title))

  // The top bar's "Ask Nova" opens the side panel.
  useEffect(() => {
    const open = () => setNovaOpen(true)
    window.addEventListener(OPEN_NOVA_PANEL_EVENT, open)
    return () => window.removeEventListener(OPEN_NOVA_PANEL_EVENT, open)
  }, [])

  function add(name: string, address: string, description: string) {
    const id = `loc-${Date.now()}`
    setAdded(prev => [{ id, name, hierarchy: `${MOCK_COMPANY.name} › Location`, address, description }, ...prev])
    setHighlighted(id)
    setupStore.setCount('locations', setupStore.get().counts.locations + 1)
    window.setTimeout(() => setHighlighted(null), 2500)
  }

  function suggest(s: ModuleSuggestion) {
    askNova(s.title)
  }

  function askNova(text: string) {
    setNovaOpen(true)
    setNovaRequest({ text, id: Date.now() })
  }

  const modal = (
    <Modal open={manualOpen} onOpenChange={setManualOpen} maxWidth="440px">
      <ModalHeader title="New location" />
      <ModalBody className="flex flex-col gap-3">
        <TextInput aria-label="Name" placeholder="Name, e.g. Cold storage" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} autoFocus />
        <TextInput aria-label="Address" placeholder="Address" value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} />
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button variant="secondary" size="md" onClick={() => setManualOpen(false)}>Cancel</Button>
        <Button
          variant="primary"
          size="md"
          disabled={!draft.name.trim()}
          onClick={() => {
            add(draft.name.trim(), draft.address.trim(), '')
            setDraft({ name: '', address: '' })
            setManualOpen(false)
          }}
        >
          Create location
        </Button>
      </ModalFooter>
    </Modal>
  )

  const templates = (
    <TemplatePickerModal
      open={templateOpen}
      onOpenChange={setTemplateOpen}
      description="Common sites for a heavy equipment manufacturer"
      templates={TEMPLATES}
      onPick={t => add(t.name, MOCK_COMPANY.location, t.detail)}
    />
  )

  const panel = (
    <NovaSidePanel
      open={novaOpen}
      onClose={() => setNovaOpen(false)}
      intro="Which location should I add? Describe it, or pick one of these."
      quickActions={suggestions.map(c => c.title)}
      placeholder="Describe the site, building or area"
      request={novaRequest}
      onCreating={setPendingName}
      onCreate={prompt => {
        const text = itemFromPrompt(prompt, SUGGESTED_LOCATION_CARDS)
        const suggested = SUGGESTED_LOCATION_CARDS.find(c => c.title === text)
        setPendingName(null)
        add(text, MOCK_COMPANY.location, suggested?.reason ?? 'Created with Nova')
        return text
      }}
    />
  )

  if (isEmpty) {
    return (
      <main className="flex-1 overflow-y-auto">
        <ModuleEmptyState
          icon={MapPin}
          title="No Locations created yet"
          description="Create one yourself, or ask Nova to help you get started."
          createLabel="Create Manually"
          onCreate={() => setManualOpen(true)}
          prompt={suggestions[0] ? `Add ${suggestions[0].title} as a location` : 'Add a new location'}
          onAskNova={askNova}
          onUseTemplate={() => setTemplateOpen(true)}
          suggestions={suggestions}
          onSuggest={suggest}
        />
        {modal}
        {templates}
        {panel}
      </main>
    )
  }

  return (
    <LocationsTable rows={rows} pendingName={pendingName} highlighted={highlighted} onCreate={() => setManualOpen(true)}>
      {modal}
      {panel}
    </LocationsTable>
  )
}

/** Locations as a table, like the rest of the product's lists. */
function LocationsTable({ rows, pendingName, highlighted, onCreate, children }: {
  rows: LocationRow[]
  pendingName: string | null
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
    ? rows.filter(r => `${r.name} ${r.address} ${r.description}`.toLowerCase().includes(search.toLowerCase()))
    : rows
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id))

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      {slots.actions && createPortal(
        <>
          <Button variant="primary" size="md" onClick={onCreate}><Plus size={14} /> Create Location</Button>
          <IconButton label="More" variant="secondary" size="md"><MoreHorizontal size={16} /></IconButton>
        </>,
        slots.actions,
      )}
      {slots.toolbar && createPortal(
        <TableToolbar
          itemCountLabel={`${filtered.length} Results Returned`}
          sortLabel="Sort: Date Created"
          searchValue={search}
          onSearchChange={setSearch}
        />,
        slots.toolbar,
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">
          <div className="mb-4 flex flex-wrap items-center gap-2 nova-enter">
            <FilterChip icon={<SlidersHorizontal size={13} />}>Filters</FilterChip>
            <FilterChip hasDropdown icon={<Users size={13} />}>Assigned To</FilterChip>
            <FilterChip hasDropdown icon={<Tag size={13} />}>Tags</FilterChip>
            <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">Reset Filters</button>
            <div className="flex-1" />
            <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] transition-colors hover:text-[var(--color-neutral-12)] cursor-pointer">Save View</button>
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
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12" aria-label="Actions" />
                </tr>
              </TableHeader>
              <TableBody>
                {pendingName && (
                  <tr aria-label={`Creating ${pendingName}`} className="nova-enter">
                    <td className="py-4 pl-6 pr-2"><Skeleton className="h-[18px] w-[18px]" rounded="sm" /></td>
                    <TableCell className="pl-2"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell />
                  </tr>
                )}
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className={`transition-colors duration-500 ${
                      highlighted === r.id ? 'bg-[var(--color-accent-2)]' : selected.has(r.id) ? 'bg-[var(--color-accent-1)]' : 'hover:bg-[var(--color-neutral-2)]'
                    }`}
                  >
                    <td className="py-3 pl-6 pr-2"><Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                    <TableCell className="pl-2 whitespace-nowrap text-[var(--color-neutral-12)]">{r.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--color-neutral-11)]">{r.hierarchy}</TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--color-neutral-11)]">{r.address}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-[var(--color-neutral-9)]">{r.description}</TableCell>
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
