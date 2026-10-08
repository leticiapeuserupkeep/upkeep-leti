'use client'

import { LayoutTemplate, type LucideIcon } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { NovaComposer } from '@/app/components/onboarding/nova/NovaComposer'
import { IdeaCarousel } from '@/app/components/onboarding/nova/NovaIdeas'
import type { ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'

interface ModuleEmptyStateProps {
  /** Icon on the illustration's badge. */
  icon: LucideIcon
  title: string
  description: string
  createLabel: string
  onCreate: () => void
  /** What the message box starts with — sent to Nova as-is. */
  prompt: string
  onAskNova: (text: string) => void
  /** Start from a template; the button only shows when there's one. */
  onUseTemplate?: () => void
  /** Things Nova would create here, from what it found during setup. */
  suggestions: ModuleSuggestion[]
  creatingId?: string | null
  onSuggest: (s: ModuleSuggestion) => void
}

/** Empty module (Work Orders, Assets, Parts…): ask Nova from the message box
 * (a prompt is ready to send), create it yourself or from a template, or start
 * from what Nova already found needs doing. */
export function ModuleEmptyState({
  icon: Icon, title, description, createLabel, onCreate, prompt, onAskNova, onUseTemplate, suggestions, creatingId, onSuggest,
}: ModuleEmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-10 bg-[var(--surface-primary)] px-[var(--space-lg)] py-[var(--space-3xl)]">
      {/* Header — sizes and colors follow the Figma empty-state spec. */}
      <div className="flex w-full max-w-[816px] flex-col items-center gap-8 py-6 nova-enter">
        <div className="flex w-full flex-col items-center gap-3 text-center">
          {/* Illustration: a blank record with the module's icon badge. */}
          <div className="relative -mt-10 h-[125px] w-[194px]" aria-hidden>
            <div className="absolute left-1/2 top-1/2 h-[109px] w-[177px] -translate-x-1/2 -translate-y-1/2">
              <div className="absolute left-0 top-0 flex h-[97px] w-[160px] flex-col items-start gap-[11px] rounded-[12px] border border-[#E0E1E6] bg-white p-4">
                <span className="h-2 w-[128px] rounded-[4px] bg-[#F9F9FB]" />
                <span className="h-2 w-[104px] rounded-[4px] bg-[#F0F0F3]" />
                <span className="h-2 w-[78px] rounded-[4px] bg-[#F0F0F3]" />
                <span className="h-2 w-[92px] rounded-[4px] bg-[#F0F0F3]" />
              </div>
              <span className="absolute left-[121px] top-[53px] flex h-14 w-14 items-center justify-center rounded-[28px] border border-[#E0E1E6] bg-[#F0F0F3] text-[#60646C]">
                <Icon size={24} strokeWidth={1.4} />
              </span>
            </div>
          </div>
          <h2 className="text-[20px] font-bold leading-8 text-[#1C2024]">{title}</h2>
          <p className="text-[14px] leading-5 text-[#1C2024]">{description}</p>
        </div>
        {/* Ask Nova first: the box comes with a prompt, ready to send. */}
        <div className="w-full max-w-[640px]">
          <NovaComposer initialValue={prompt} onSend={onAskNova} placeholder="Ask Nova to help you get started" sendLabel="Create with Nova" gradientBorder />
        </div>
        <div className="-mt-4 flex items-center justify-center gap-3">
          <Button variant="secondary" size="md" onClick={onCreate}>{createLabel}</Button>
          {onUseTemplate && (
            <Button variant="secondary" size="md" onClick={onUseTemplate}><LayoutTemplate size={14} /> Use template</Button>
          )}
        </div>
      </div>

      {/* Same rotating cards as the Welcome page's ideas. */}
      {suggestions.length > 0 && (
        <IdeaCarousel
          heading="Suggested by Nova"
          className="max-w-[816px]"
          cards={suggestions.map(s => ({ id: s.id, title: s.title, description: s.reason, icon: Icon }))}
          busyId={creatingId}
          onPick={card => { const s = suggestions.find(x => x.id === card.id); if (s) onSuggest(s) }}
        />
      )}
    </div>
  )
}
