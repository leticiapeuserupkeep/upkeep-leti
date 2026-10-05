'use client'

import { Sparkles, Loader2, type LucideIcon } from 'lucide-react'
import type { ModuleSuggestion } from '@/app/lib/onboarding/nova-onboarding-data'

interface ModuleEmptyStateProps {
  /** Icon on the illustration's badge. */
  icon: LucideIcon
  title: string
  description: string
  createLabel: string
  onCreate: () => void
  onCreateWithNova: () => void
  /** Things Nova would create here, from what it found during setup. */
  suggestions: ModuleSuggestion[]
  creatingId?: string | null
  onSuggest: (s: ModuleSuggestion) => void
}

/** Empty module (Work Orders, Assets, Parts…): create it yourself, ask Nova,
 * or start from what Nova already found needs doing. */
export function ModuleEmptyState({
  icon: Icon, title, description, createLabel, onCreate, onCreateWithNova, suggestions, creatingId, onSuggest,
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
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-[8px] bg-[#F0F0F3] px-3 py-1 text-[14px] font-medium leading-5 text-[#1C2024] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-4)] cursor-pointer"
          >
            {createLabel}
          </button>
          <button
            type="button"
            onClick={onCreateWithNova}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-[8px] bg-[#3E63DD] px-3 py-1 text-[14px] font-medium leading-5 text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] cursor-pointer"
          >
            <Sparkles size={16} strokeWidth={1.5} /> Create with Nova
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="flex w-full max-w-[960px] flex-col gap-3 nova-enter" style={{ animationDelay: '150ms' }}>
          <div className="my-6 h-px w-full bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5">
            <h3 className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">Suggested by Nova</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {suggestions.map((s, i) => {
              const busy = creatingId === s.id
              return (
                // The whole card creates it — just what and why, no extra controls.
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onSuggest(s)}
                  className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 text-left transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] cursor-pointer disabled:cursor-default nova-enter"
                  style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                  <span className="flex shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-accent-1)] p-4 text-[var(--color-accent-9)]">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{s.title}</span>
                    <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{busy ? 'Creating…' : s.reason}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
