'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, Plus, Sparkles, ArrowRight, FileSpreadsheet, X } from 'lucide-react'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { Checkbox } from '@/app/components/ui/Checkbox'
import { Avatar } from '@/app/components/ui/Avatar'
import { TextInput } from '@/app/components/ui/TextInput'
import { SearchableSelect } from '@/app/components/ui/SearchableSelect'
import { COMPANY_SIZES } from '@/app/lib/onboarding/nova-onboarding-data'
import { useSetupState } from '@/app/lib/onboarding/setup-store'
import { PROFILE_OPTIONS } from '@/app/components/onboarding/nova/useNovaOnboarding'
import {
  discoveryItem, personFromEmail, suggestedAssetsFor,
  type ConfirmedDiscovery, type DiscoveryItem, type DiscoveryResult,
} from '@/app/lib/onboarding/discovery'

type ListId = 'locations' | 'assets' | 'team'

const LIST_COPY: Record<ListId, { title: string; hint?: string; one: string; many: string; add: string; empty: string }> = {
  locations: { title: 'Locations', hint: 'Found from publicly available company information.', one: 'location', many: 'locations', add: 'Add new location', empty: 'I couldn’t find your locations. Add the sites your team maintains.' },
  assets: { title: 'Assets', hint: 'Suggested based on your industry.', one: 'asset', many: 'assets', add: 'Add new asset', empty: 'No equipment suggested yet. Add what your team maintains.' },
  team: { title: 'Team', one: 'member', many: 'members', add: 'Add Team member', empty: 'Add the people on your maintenance team by email.' },
}

/** A section's count, e.g. "3 Locations". */
/** Bold section title with a small hint underneath. */
function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-[length:var(--font-size-base)] font-bold leading-[21px] text-[var(--color-neutral-12)]">{title}</span>
      {hint && <span className="text-[length:var(--font-size-sm)] leading-4 text-[var(--color-neutral-9)]">{hint}</span>}
    </span>
  )
}

function CountTag({ label }: { label: string }) {
  return <Badge severity="neutral" variant="subtle" size="lg" className="shrink-0 rounded-full font-normal">{label}</Badge>
}

/** Where a section's information came from, in one line. */
function OriginNote({ children }: { children: ReactNode }) {
  return <p className="text-[length:var(--font-size-sm)] leading-5 text-[var(--color-neutral-9)]">{children}</p>
}

/** A row to keep (checked) or leave out, renamed in place. */
function ItemRow({ item, checked, onToggle, onRename }: { item: DiscoveryItem; checked: boolean; onToggle: () => void; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.name)
  const save = () => {
    setEditing(false)
    const name = draft.trim()
    if (name && name !== item.name) onRename(name)
    else setDraft(item.name)
  }
  return (
    <li className="group flex min-h-9 items-center gap-2.5 rounded-[var(--radius-lg)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-2)] nova-enter">
      <Checkbox checked={checked} onChange={onToggle} className="shrink-0" />
      {item.email && <Avatar name={item.name} size="sm" />}
      {editing ? (
        <div className="flex-1 py-1">
          <TextInput
            autoFocus
            aria-label="Name"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={e => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') { setDraft(item.name); setEditing(false) }
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className={`flex min-w-0 flex-1 flex-col py-2 text-left transition-colors cursor-text ${checked ? 'text-[var(--color-neutral-12)]' : 'text-[var(--color-neutral-8)]'}`} title="Click to edit">
          <span className="truncate text-[length:var(--font-size-base)]">{item.name}</span>
          {item.email && <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{item.email}</span>}
        </button>
      )}
      {/* People: their role. Assets: the location Nova recommends. */}
      {!editing && (item.role || item.location) && (
        <span className="max-w-[45%] shrink-0 truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{item.role ?? item.location}</span>
      )}
      {item.origin === 'added' && !item.email && !editing && (
        <span className="shrink-0 text-[length:var(--font-size-xs)] font-medium text-[var(--color-neutral-8)]">Added by you</span>
      )}
    </li>
  )
}

/** The field to add something missing, opened from "Add …". */
function AddRow({ placeholder, email = false, onAdd, onClose }: { placeholder: string; email?: boolean; onAdd: (name: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('')
  const valid = email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) : Boolean(value.trim())
  const add = () => {
    const name = value.trim()
    if (!valid) return
    onAdd(name)
    setValue('')
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <TextInput
          autoFocus
          type={email ? 'email' : 'text'}
          aria-label={placeholder}
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={() => { if (!value.trim()) onClose() }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
            if (e.key === 'Escape') onClose()
          }}
        />
      </div>
      <Button variant="secondary" size="md" onClick={add} disabled={!valid}>Add</Button>
    </div>
  )
}

function FieldRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3">
      <label htmlFor={htmlFor} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">{label}</label>
      {children}
    </div>
  )
}

/** "Here’s what Nova found": what Nova found about the company and what it
 * suggests, laid out to read at a glance — fix and confirm before anything
 * is set up. */
export function DiscoveryResults({ result, onConfirm, onSkip, leaving = false }: {
  result: DiscoveryResult
  onConfirm: (confirmed: ConfirmedDiscovery) => void
  onSkip: () => void
  leaving?: boolean
}) {
  const { userName } = useSetupState()
  const [company, setCompany] = useState({
    name: result.company?.name ?? '',
    industry: result.company?.industry ?? '',
    size: result.company?.size ?? '',
  })
  // Shown as plain text; fields only to fix it (or when nothing was found).
  const [editingCompany, setEditingCompany] = useState(!result.company)
  const [lists, setLists] = useState<Record<ListId, DiscoveryItem[]>>({
    locations: result.locations,
    assets: result.assets,
    team: result.team,
  })
  const [open, setOpen] = useState<ListId | null>(null)
  // Everything starts checked; unchecked items stay out of the workspace.
  const [unchecked, setUnchecked] = useState<string[]>([])
  const toggle = (itemId: string) => setUnchecked(prev => (prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]))
  const kept = (id: ListId) => lists[id].filter(i => !unchecked.includes(i.id))
  const [adding, setAdding] = useState<ListId | null>(null)
  // A spreadsheet to bring in on top of what Nova found.
  const [importFile, setImportFile] = useState<string | null>(null)

  const edit = (id: ListId, fn: (items: DiscoveryItem[]) => DiscoveryItem[]) => setLists(prev => ({ ...prev, [id]: fn(prev[id]) }))


  const companyComplete = Boolean(company.name.trim() && company.industry && company.size)
  function confirm() {
    onConfirm({
      company: companyComplete ? { name: company.name.trim(), industry: company.industry, size: company.size } : null,
      locations: kept('locations').map(i => i.name),
      assets: kept('assets').map(i => i.name),
      // The team isn't invited during onboarding — Nova suggests people
      // later, e.g. when a work order needs someone.
      members: [],
      roles: [],
      importFile: importFile ?? undefined,
    })
  }

  const foundAnything = Boolean(result.company) || result.locations.length > 0

  function listSection(id: ListId) {
    const copy = LIST_COPY[id]
    const items = lists[id]
    const n = kept(id).length
    const isOpen = open === id
    const industry = company.industry
    return (
      <section key={id} className="border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setOpen(o => (o === id ? null : id))}
          aria-expanded={isOpen}
          aria-controls={`discovery-${id}`}
          className={`flex w-full items-center gap-3 text-left cursor-pointer py-5`}
        >
          <SectionTitle title={copy.title} hint={copy.hint} />
          {items.length > 0
            ? <CountTag label={`${n} ${id === 'locations' ? (n === 1 ? copy.one : copy.many) : (n === 1 ? copy.one : copy.many).replace(/^./, c => c.toUpperCase())}`} />
            : <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">{id === 'locations' ? 'None found' : 'None yet'}</span>}
          <ChevronDown size={16} className={`shrink-0 text-[var(--color-neutral-8)] transition-transform duration-[var(--duration-normal)] ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {/* Folds open smoothly, like the setup steps. */}
        <div id={`discovery-${id}`} inert={!isOpen} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-2 pb-3">
              {items.length === 0 && <OriginNote>{copy.empty}</OriginNote>}
              {items.length > 0 && (
                <ul className="-mx-2 flex max-h-[220px] flex-col overflow-y-auto">
                  {items.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      checked={!unchecked.includes(item.id)}
                      onToggle={() => toggle(item.id)}
                      onRename={name => edit(id, list => list.map(i => (i.id === item.id ? { ...i, name, origin: 'added' } : i)))}
                    />
                  ))}
                </ul>
              )}
              {id === 'assets' && items.length === 0 && industry && (
                <Button variant="secondary" size="sm" className="self-start" onClick={() => edit('assets', () => suggestedAssetsFor(industry).map(a => discoveryItem(a, 'suggested')))}>
                  <Sparkles size={12} /> Suggest common {industry.toLowerCase()} equipment
                </Button>
              )}
              {adding === id ? (
                <AddRow
                  placeholder={id === 'team' ? 'name@company.com' : copy.add}
                  email={id === 'team'}
                  onAdd={value => edit(id, list => [...list, id === 'team' ? personFromEmail(value) : discoveryItem(value, 'added')])}
                  onClose={() => setAdding(null)}
                />
              ) : (
                <Button variant="ghost" size="sm" className="self-start px-0" onClick={() => setAdding(id)}>
                  <Plus size={12} /> {copy.add}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className={`flex w-full max-w-[640px] flex-col items-center gap-[var(--space-2xl)] ${leaving ? 'nova-discovery-out' : 'nova-enter'}`}>
    {/* The welcome, on the dark backdrop above the card. */}
    <h1 className="text-center text-[40px] font-bold leading-tight tracking-[-0.02em] text-white">
      Hi {userName}! Welcome to UpKeep
    </h1>
    <div className="flex w-full flex-col gap-[var(--space-xl)] rounded-[28px] bg-[var(--surface-primary)] p-10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
      <header className="flex flex-col gap-1.5">
        <h2 className="text-[length:var(--font-size-xl)] font-bold leading-6 text-[var(--color-neutral-12)]">
          {foundAnything ? 'Here’s what Nova found' : 'Let’s set up your workspace'}
        </h2>
        <p className="text-[length:var(--font-size-base)] leading-5 text-[var(--color-neutral-10)]">
          {foundAnything
            ? 'Take a look at what I found about your company. You can review and make changes before I set things up.'
            : 'Nova couldn’t find public information about your company. Add a few details and it’ll suggest the rest.'}
        </p>
      </header>

      <div className="flex flex-col">
        {/* Company: in plain sight, editable on demand. */}
        <section className="flex flex-col gap-2 pb-5">
          <div className="flex items-center gap-3">
            <SectionTitle title="Company" />
            {!editingCompany && (
              <button type="button" onClick={() => setEditingCompany(true)} className="shrink-0 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">
                Edit
              </button>
            )}
          </div>
          {editingCompany ? (
            <div className="flex flex-col gap-2.5">
              <FieldRow label="Company name" htmlFor="discovery-company-name">
                <TextInput id="discovery-company-name" value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
              </FieldRow>
              <FieldRow label="Industry" htmlFor="discovery-industry">
                <SearchableSelect value={company.industry} onChange={v => setCompany(c => ({ ...c, industry: v }))} options={PROFILE_OPTIONS.industry} />
              </FieldRow>
              <FieldRow label="Company size" htmlFor="discovery-size">
                <SearchableSelect value={company.size} onChange={v => setCompany(c => ({ ...c, size: v }))} options={COMPANY_SIZES} />
              </FieldRow>
              <Button variant="secondary" size="sm" className="self-end" disabled={!companyComplete} onClick={() => setEditingCompany(false)}>Done</Button>
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 leading-[21px]">
                {[['Company name', company.name], ['Industry', company.industry], ['Company size', company.size]].map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">{label}</dt>
                    <dd className="text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>
        {(['locations', 'assets'] as const).map(listSection)}
        <ImportData file={importFile} onChange={setImportFile} />
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-[var(--border-default)] pt-[var(--space-xl)]">
        <button type="button" onClick={onSkip} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] underline underline-offset-2 transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-neutral-12)] cursor-pointer">
          I’ll set this up later
        </button>
        <Button variant="primary" size="lg" className="rounded-[var(--radius-xl)] px-5" onClick={confirm}>
          Create My Workspace <ArrowRight size={16} />
        </Button>
      </footer>
    </div>
    </div>
  )
}

/** Already keep locations and assets in a spreadsheet? Bring it in — Nova
 * adds it alongside what it found when it sets the workspace up. */
function ImportData({ file, onChange }: { file: string | null; onChange: (name: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <section className="flex items-center gap-3 border-t border-[var(--border-subtle)] pt-5">
      <SectionTitle title="Import data" hint="Add your locations or assets from CSV or Excel." />
      {file ? (
        <span className="nova-text-in inline-flex max-w-[220px] shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-neutral-3)] py-1 pl-2.5 pr-1.5 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">
          <FileSpreadsheet size={14} className="shrink-0" />
          <span className="truncate">{file}</span>
          <button type="button" aria-label="Remove file" onClick={() => onChange(null)} className="shrink-0 rounded-full p-0.5 text-[var(--color-neutral-9)] hover:text-[var(--color-neutral-12)] cursor-pointer">
            <X size={12} />
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="shrink-0 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">
          Import
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f.name); e.target.value = '' }}
      />
    </section>
  )
}
