'use client'

import { type ReactNode, type KeyboardEvent } from 'react'
import { Sparkles, ArrowUp } from 'lucide-react'
import { IconButton } from '@/app/components/ui/IconButton'

export interface NovaMessage {
  role: 'nova' | 'user'
  content: ReactNode
}

interface NovaOnboardingPanelProps {
  messages: NovaMessage[]
  /** Extra content rendered after the message list (e.g. choice buttons). */
  children?: ReactNode
  inputValue?: string
  onInputChange?: (value: string) => void
  onSend?: () => void
  inputPlaceholder?: string
  showInput?: boolean
}

/** Shared chat shell for the onboarding split view — intentionally separate
 * from the real NovaHomePanel, which has no message history or send handler
 * and assumes a wide, full-page layout. */
export function NovaOnboardingPanel({
  messages,
  children,
  inputValue = '',
  onInputChange,
  onSend,
  inputPlaceholder = 'Escribile a Nova…',
  showInput = true,
}: NovaOnboardingPanelProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend?.()
    }
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-2 px-[var(--space-lg)] py-[var(--space-md)] border-b border-[var(--border-subtle)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white">
          <Sparkles size={14} />
        </span>
        <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">Nova</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[var(--space-lg)] py-[var(--space-md)] flex flex-col gap-[var(--space-md)]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-[var(--radius-lg)] px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--font-size-sm)] leading-5 ${
              m.role === 'nova'
                ? 'self-start bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)]'
                : 'self-end bg-[var(--color-accent-9)] text-white'
            }`}
          >
            {m.content}
          </div>
        ))}
        {children}
      </div>

      {showInput && (
        <div className="flex items-end gap-2 px-[var(--space-lg)] py-[var(--space-md)] border-t border-[var(--border-subtle)]">
          <textarea
            value={inputValue}
            onChange={e => onInputChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none placeholder:text-[var(--color-neutral-7)] hover:border-[var(--color-accent-7)] focus:border-[var(--color-accent-7)] transition-colors duration-[var(--duration-fast)]"
          />
          <IconButton label="Send" variant="primary" size="md" onClick={() => onSend?.()} disabled={!inputValue.trim()}>
            <ArrowUp size={16} />
          </IconButton>
        </div>
      )}
    </div>
  )
}
