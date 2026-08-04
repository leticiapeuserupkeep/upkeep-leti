'use client'

import { useState, useCallback, useMemo, type ReactNode } from 'react'
import {
  Plus,
  History,
  Mic,
  ArrowUp,
  ChevronRight,
  Mail,
} from 'lucide-react'
import { IconButton } from '@/app/components/ui/IconButton'
import { NovaModelSwitcher } from '@/app/components/intelligence/NovaModelSwitcher'
import { NovaTokenMeter } from '@/app/components/intelligence/NovaTokenMeter'

const USER_FIRST_NAME = 'Leticia'

/** Placeholder budget until Nova usage is wired to an API */
const TOKEN_CONTEXT_MAX = 128_000

const QUICK_ACTION_LABELS = [
  'Analyze my reactive work',
  'Increase my PM coverage',
  'Triage my requests',
  'Clean up work order data',
] as const

/** Small brand-style tiles for the 30px-tall integration strip. */
function IntegrationMark({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] text-[7px] font-bold leading-none text-white ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

export function NovaHomePanel() {
  const [prompt, setPrompt] = useState('')
  const [slide, setSlide] = useState(1)

  const carouselSlides = useMemo(
    (): { title: string; body: ReactNode }[] => [
      {
        title: 'Forward emails to Nova',
        body: (
          <>
            Forward invoices, purchase orders, and vendor quotes to{' '}
            <span className="font-semibold text-[var(--color-neutral-11)]">nova@intelligence.onupkeep.com</span>
            {' '}— get them summarized, logged, or turned into work orders automatically.
          </>
        ),
      },
      {
        title: 'Connect your data sources',
        body: 'Link CMMS, ERP, and spreadsheets so Nova can answer with your live operational context.',
      },
      {
        title: 'Automate follow-ups',
        body: 'Let Nova draft reminders and status updates so your team stays aligned without extra clicks.',
      },
      {
        title: 'Stay audit-ready',
        body: 'Capture decisions and references in one place for compliance reviews and handoffs.',
      },
      {
        title: 'Ask in plain language',
        body: 'Describe outcomes, not queries — Nova translates intent into dashboards, lists, and next steps.',
      },
    ],
    [],
  )

  const goNext = useCallback(() => {
    setSlide((s) => (s + 1) % carouselSlides.length)
  }, [carouselSlides.length])

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div className="sn-fade-in flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-[var(--space-md)] pb-[var(--space-xl)] pt-[var(--space-2xl)]">
      <div className="flex h-full min-h-full w-full max-w-[720px] flex-col items-stretch gap-5">
        {/* Greeting — target ~48px line box per spec */}
        <header className="flex w-full min-h-[48px] items-center justify-center text-center">
          <h1 className="pb-[12px] text-[28px] font-bold leading-[48px] tracking-tight text-[var(--color-neutral-12)]">
            Hi {USER_FIRST_NAME}. How can I help?
          </h1>
        </header>

        {/* Composer shell — prompt block fixed 80px; toolbar row below; integration strip 30px */}
        <div className="overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-col bg-[var(--surface-primary)]">
            {/* Prompt area: exactly 80px tall (incl. pt-3); stops flex-1 from stretching to ~108px */}
            <div className="flex h-[80px] shrink-0 flex-col px-[var(--space-md)] pt-3">
              <label htmlFor="nova-prompt" className="sr-only">
                Ask Nova
              </label>
              <textarea
                id="nova-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything"
                className="min-h-0 w-full flex-1 resize-none bg-transparent text-[length:var(--font-size-body-1)] leading-6 text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-7)] outline-none"
              />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 px-[var(--space-md)] pb-3 pt-1">
              <div className="flex items-center gap-2">
                <IconButton
                  type="button"
                  label="Add context"
                  variant="secondary"
                  size="md"
                  className="!h-9 !w-9 shrink-0 rounded-full border-[var(--border-default)] bg-[var(--color-neutral-3)]"
                >
                  <Plus size={18} className="text-[var(--color-neutral-9)]" />
                </IconButton>
                <IconButton
                  type="button"
                  label="History"
                  variant="secondary"
                  size="md"
                  className="!h-9 !w-9 shrink-0 rounded-full border-[var(--border-default)] bg-[var(--color-neutral-3)]"
                >
                  <History size={18} className="text-[var(--color-neutral-9)]" />
                </IconButton>
                <NovaModelSwitcher />
              </div>
              <div className="flex items-center gap-2">
              <NovaTokenMeter
                max={TOKEN_CONTEXT_MAX}
                used={Math.min(TOKEN_CONTEXT_MAX, prompt.length * 380)}
              />
              <IconButton
                type="button"
                label="Voice input"
                variant="secondary"
                size="md"
                className="!h-9 !w-9 shrink-0 rounded-full border-[var(--border-default)] bg-[var(--color-neutral-3)]"
              >
                <Mic size={18} className="text-[var(--color-neutral-8)]" />
              </IconButton>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-7)] text-white shadow-sm transition-colors hover:bg-[var(--color-accent-8)] active:bg-[var(--color-accent-10)] disabled:opacity-40"
                aria-label="Send message"
                disabled={!prompt.trim()}
              >
                <ArrowUp size={18} strokeWidth={2.25} className="text-white" />
              </button>
              </div>
            </div>
          </div>

          {/* Integration strip — 30px tall per layout spec */}
          <div className="flex h-[30px] shrink-0 items-center justify-between gap-2 border-t border-[var(--border-default)] bg-[var(--color-neutral-3)] px-[var(--space-md)]">
            <p className="min-w-0 truncate text-[length:var(--font-size-xs)] leading-none text-[var(--color-neutral-9)]">
              Connect your tools to Nova
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <IntegrationMark className="bg-[#EA4335]">M</IntegrationMark>
              <IntegrationMark className="bg-[#0078D4]">O</IntegrationMark>
              <IntegrationMark className="bg-[#34A853]">S</IntegrationMark>
              <IntegrationMark className="bg-[#4285F4]">D</IntegrationMark>
              <IntegrationMark className="bg-[#6264A7]">T</IntegrationMark>
              <button
                type="button"
                onClick={goNext}
                className="ml-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-neutral-11)] transition-colors"
                aria-label="More integrations"
              >
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick chips — Figma: row wrap, gap 8px, pills 34px h, 12/16 medium #60646C, border #E0E1E6 */}
        <div className="flex w-full flex-row flex-wrap content-center items-start justify-center gap-2 p-0">
          {QUICK_ACTION_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              className="box-border flex h-[34px] max-w-full shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[#E0E1E6] bg-[var(--surface-primary)] px-2 py-2 text-center text-[12px] font-medium leading-4 text-[#60646C] shadow-[0_1px_2px_rgba(0,0,0,0.05)] whitespace-nowrap transition-colors hover:bg-[var(--color-neutral-2)] hover:border-[var(--color-neutral-5)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Feature carousel — full width of main column (matches scroll strip above); sits above bottom nav */}
    <div className="flex w-full shrink-0 justify-center px-[var(--space-md)] pb-5 pt-2">
      <div className="pointer-events-auto flex w-full max-w-[720px] flex-col items-center gap-3">
        <div
          className="w-full rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--color-neutral-3)] px-[var(--space-lg)] py-[var(--space-lg)] shadow-[var(--shadow-md)]"
          role="region"
          aria-label="Nova tips"
        >
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[#ffe3e8] text-[#e03131]">
              <Mail size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">
                {carouselSlides[slide].title}
              </h3>
              <p className="mt-1.5 text-[length:var(--font-size-body-2)] leading-relaxed text-[var(--color-neutral-9)]">
                {carouselSlides[slide].body}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-1.5">
          {carouselSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === slide ? 'w-5 bg-[var(--color-neutral-10)]' : 'w-1.5 bg-[var(--color-neutral-6)] hover:bg-[var(--color-neutral-8)]'
              }`}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === slide}
            />
          ))}
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}
