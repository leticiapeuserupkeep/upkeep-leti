'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { ModuleEmptyState } from '@/app/components/onboarding/ModuleEmptyState'
import { NovaSidePanel, OPEN_NOVA_PANEL_EVENT } from '@/app/components/onboarding/NovaSidePanel'
import { SUGGESTED_PART_CARDS, type ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'

interface Part {
  id: string
  name: string
  detail: string
  byNova?: boolean
}

/** Parts & Inventory. Starts empty for a new account, with Nova's
 * suggestions drawn from the issues it found during setup. */
export default function PartsPage() {
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
      onCreate={text => { add(text, 'Created with Nova', true); return text }}
    />
  )

  if (parts.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto">
        <ModuleEmptyState
          icon={Package}
          title="No Parts created yet"
          description="Create one yourself, or ask Nova to help you get started."
          createLabel="Create Manually"
          onCreate={() => add('New part', 'Add details', false)}
          onCreateWithNova={() => setNovaOpen(true)}
          suggestions={suggestions}
          creatingId={creatingId}
          onSuggest={createSuggestion}
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
