'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ChevronRight, LayoutPanelLeft, Plus, Pointer, type LucideIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { NovaComposer, type NovaComposerHandle } from '@/app/components/onboarding/nova/NovaComposer'
import { IdeaList } from '@/app/components/onboarding/nova/NovaIdeas'
import { isSourceId, sourceName, type ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'
import { useSetupState } from '@/app/lib/onboarding/setup-store'

interface ModuleEmptyStateProps {
  /** Icon on the illustration's badge. */
  icon: LucideIcon
  title: string
  createLabel: string
  /** The page header's primary action, e.g. "Create Location" — same as Create manually. */
  headerLabel: string
  onCreate: () => void
  onAskNova: (text: string) => void
  /** Start from a template; the button only shows when there's one. */
  onUseTemplate?: () => void
  /** Things Nova would create here, from what it found during setup. */
  suggestions: ModuleSuggestion[]
  creatingId?: string | null
  onSuggest: (s: ModuleSuggestion) => void
}

/** Empty module (Work Orders, Assets, Parts…): start from what Nova already
 * found needs doing, describe it to Nova in the message box, or create it
 * yourself or from a template. */
export function ModuleEmptyState({
  icon: Icon, title, createLabel, headerLabel, onCreate, onAskNova, onUseTemplate, suggestions, creatingId, onSuggest,
}: ModuleEmptyStateProps) {
  // Where Nova's findings come from: with a chat or email app connected the
  // suggestions say so; otherwise they're framed as examples, with no figures.
  const { connectedApps } = useSetupState()
  const origin = connectedApps.find(id => isSourceId(id) && id !== 'drive')
  const describe = (s: ModuleSuggestion) => {
    if (!s.example) return s.reason
    return origin && isSourceId(origin) ? `From ${sourceName(origin)} · ${s.reason.replace(' · ', ', ')}` : `Example · ${s.example}`
  }
  // The message box is where it starts: the cursor is already in it.
  const composer = useRef<NovaComposerHandle>(null)
  useEffect(() => {
    const id = window.setTimeout(() => composer.current?.focus(), 300)
    return () => window.clearTimeout(id)
  }, [])
  // Once the user prompts Nova, the other ways in step aside.
  const [asked, setAsked] = useState(false)
  // "Create Work Order" → "Work order", for the lead-in to the suggestions.
  const noun = headerLabel.replace(/^Create\s+/i, '').replace(/^./, c => c.toUpperCase()).replace(/(?<=.)[A-Z]/g, c => c.toLowerCase())
  // The header's actions slot exists only after mount.
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActionsSlot(document.getElementById('page-header-actions'))
  }, [])

  return (
    <div className="flex min-h-full flex-col items-center gap-10 bg-[var(--surface-primary)] px-[var(--space-lg)] pt-[var(--space-3xl)]">
      {actionsSlot && createPortal(
        <Button variant="primary" size="md" onClick={onCreate}><Plus size={14} /> {headerLabel}</Button>,
        actionsSlot,
      )}
      {/* Header — sizes and colors follow the Figma empty-state spec. */}
      <div className="flex w-full max-w-[816px] flex-1 flex-col items-center justify-center gap-8 py-6 nova-enter">
        <div className="flex w-full translate-y-10 flex-col items-center gap-3 text-center">
          {/* Illustration: a blank record with the module's icon badge. */}
          <div className="relative -mt-10 h-[95px] w-[148px]" aria-hidden>
            <div className="absolute left-1/2 top-1/2 h-[109px] w-[177px] -translate-x-1/2 -translate-y-1/2 scale-[0.76]">
              <div className="absolute left-0 top-0 flex h-[97px] w-[160px] flex-col items-start gap-[11px] rounded-[12px] border border-[#E0E1E6] bg-white p-4">
                <span className="h-2 w-[128px] rounded-[4px] bg-[#F9F9FB]" />
                <span className="h-2 w-[104px] rounded-[4px] bg-[#F0F0F3]" />
                <span className="h-2 w-[78px] rounded-[4px] bg-[#F0F0F3]" />
                <span className="h-2 w-[92px] rounded-[4px] bg-[#F0F0F3]" />
              </div>
              <span className="absolute left-[121px] top-[53px] flex h-14 w-14 items-center justify-center rounded-[28px] bg-[#F0F0F3] text-[#60646C]">
                <Icon size={24} strokeWidth={1.4} />
              </span>
            </div>
          </div>
          <h2 className="text-[24px] font-bold leading-8 text-[#1C2024]">{title}</h2>
        </div>
      </div>

      {/* Pinned to the bottom: the lead-in, Nova's suggestions and the message box,
          with the other ways in right under it (until the user prompts Nova). */}
      <div className="sticky bottom-0 mt-auto flex w-full max-w-[640px] flex-col gap-2 bg-[var(--surface-primary)] pb-[60px] pt-3">
        <p className="px-1 pb-4 text-[length:var(--font-size-md)] text-[var(--color-neutral-11)]">
          Create your first {noun}.<br />Describe what needs attention, or start with a Nova suggestion.
        </p>
        {/* What Nova would create here, from what it found during setup. */}
        <IdeaList
          className="pb-4"
          cards={suggestions.map(s => ({ id: s.id, title: s.title, description: describe(s) }))}
          busyId={creatingId}
          onPick={card => { const s = suggestions.find(x => x.id === card.id); if (s) onSuggest(s) }}
        />
        {/* Ask Nova: the arrow stays disabled until something is typed. */}
        <NovaComposer ref={composer} onSend={text => { setAsked(true); onAskNova(text) }} placeholder={`Describe the ${noun.toLowerCase()} you want to create…`} gradientBorder />
        {!asked && (
          <div className={`grid gap-3 ${onUseTemplate ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <StartOption icon={Pointer} label={createLabel} onClick={onCreate} />
            {onUseTemplate && <StartOption icon={LayoutPanelLeft} label="Create from template" onClick={onUseTemplate} />}
          </div>
        )}
      </div>
    </div>
  )
}

/** A way to start without Nova: icon, label, chevron — the whole card clicks. */
function StartOption({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-[var(--radius-xl)] bg-[var(--color-neutral-2)] px-[var(--space-md)] py-3.5 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-3)] cursor-pointer"
    >
      <Icon size={20} strokeWidth={1.5} className="shrink-0 text-[var(--color-neutral-12)]" />
      <span className="flex-1 text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{label}</span>
      <ChevronRight size={16} className="shrink-0 text-[var(--color-neutral-11)] transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />
    </button>
  )
}
