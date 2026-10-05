'use client'

import { useState, useEffect, type KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp, Pointer, LayoutTemplate, ChevronRight, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/Skeleton'

const SKELETON_MS = 1500

interface NovaCreateLandingProps {
  /** Icon on the illustration's badge, e.g. FileText for work orders. */
  icon: LucideIcon
  title: string
  greeting: string
  quickActions: string[]
  placeholder: string
  onSubmit: (text: string) => void
  onCreateManually?: () => void
  onUseTemplate?: () => void
}

/** The empty state of a module the user hasn't used yet: Nova offers to
 * create the first item from a sentence, with manual and template routes
 * right below. Shared by Work Orders, Locations, and any module like them. */
export function NovaCreateLanding({
  icon: Icon, title, greeting, quickActions, placeholder, onSubmit, onCreateManually, onUseTemplate,
}: NovaCreateLandingProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), SKELETON_MS)
    return () => window.clearTimeout(timer)
  }, [])

  function send(text: string) {
    const value = text.trim()
    if (value) onSubmit(value)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(prompt)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-16 px-[var(--space-lg)] py-[var(--space-3xl)]">
        <div className="flex flex-col items-center gap-8">
          <Skeleton className="h-[134px] w-[220px]" rounded="lg" />
          <Skeleton className="h-7 w-[380px]" />
        </div>
        <div className="flex w-full max-w-[760px] flex-col gap-4">
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-3">
            {['w-[150px]', 'w-[170px]', 'w-[120px]', 'w-[110px]'].map(w => <Skeleton key={w} className={`h-10 ${w}`} rounded="full" />)}
          </div>
          <Skeleton className="h-[128px] w-full" rounded="lg" />
          <div className="grid grid-cols-2 gap-8 px-4">
            <Skeleton className="h-[72px] w-full" rounded="lg" />
            <Skeleton className="h-[72px] w-full" rounded="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-16 px-[var(--space-lg)] py-[var(--space-3xl)]">
      <div className="flex flex-col items-center gap-8 nova-enter">
        {/* Illustration: a blank record with the module's icon badge. */}
        <div className="relative h-[134px] w-[244px]">
          <div className="absolute left-0 top-0 flex h-[134px] w-[220px] flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-5 py-5">
            <span className="h-2 w-full rounded-full bg-[var(--color-neutral-2)]" />
            <span className="h-2 w-4/5 rounded-full bg-[var(--color-neutral-2)]" />
            <span className="h-2 w-3/5 rounded-full bg-[var(--color-neutral-2)]" />
            <span className="h-2 w-4/5 rounded-full bg-[var(--color-neutral-2)]" />
          </div>
          <span className="absolute bottom-[-18px] right-0 flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--color-neutral-2)] text-[var(--color-neutral-10)]">
            <Icon size={26} strokeWidth={1.5} />
          </span>
        </div>
        <h1 className="text-center text-[length:var(--font-size-2xl)] font-bold tracking-tight text-[var(--color-neutral-12)]">{title}</h1>
      </div>

      <div className="flex w-full max-w-[760px] flex-col gap-4 nova-enter" style={{ animationDelay: '120ms' }}>
        <p className="text-[length:var(--font-size-md)] text-[var(--color-neutral-12)]">{greeting}</p>

        <div className="flex flex-wrap items-center gap-3">
          {quickActions.map(label => (
            <button
              key={label}
              type="button"
              onClick={() => send(label)}
              className="h-10 rounded-full border border-[var(--border-default)] px-3.5 text-[length:var(--font-size-base)] text-[var(--color-neutral-11)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-2)] cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-[var(--radius-2xl)] bg-[var(--color-accent-1)] p-1">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-accent-6)] bg-[var(--surface-primary)]">
            <label htmlFor="nova-create-prompt" className="sr-only">{placeholder}</label>
            <textarea
              id="nova-create-prompt"
              rows={2}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus
              className="block w-full resize-none bg-transparent px-5 pt-4 text-[length:var(--font-size-md)] leading-6 text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-8)] outline-none"
            />
            <div className="flex items-center justify-between px-5 pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--color-neutral-10)]">
                <Plus size={18} />
              </span>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--color-neutral-10)]">
                  <Mic size={16} />
                </span>
                <button
                  type="button"
                  aria-label="Send"
                  onClick={() => send(prompt)}
                  disabled={!prompt.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] disabled:bg-[var(--color-neutral-3)] disabled:text-[var(--color-neutral-7)] cursor-pointer disabled:cursor-default"
                >
                  <ArrowUp size={16} strokeWidth={2.25} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 px-4 pt-2">
          {[
            { label: 'Create manually', icon: Pointer, onClick: onCreateManually },
            { label: 'Use a template', icon: LayoutTemplate, onClick: onUseTemplate },
          ].map(({ label, icon: OptionIcon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex h-[72px] items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--color-neutral-1)] px-6 text-left transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-neutral-6)] hover:bg-[var(--surface-primary)] cursor-pointer"
            >
              <OptionIcon size={22} strokeWidth={1.5} className="shrink-0 text-[var(--color-neutral-11)]" />
              <span className="flex-1 text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">{label}</span>
              <ChevronRight size={16} className="text-[var(--color-neutral-9)]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
