'use client'

import { forwardRef, useState, useImperativeHandle, useRef, type KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp } from 'lucide-react'

export interface NovaComposerHandle {
  prefill: (text: string) => void
}

/** "Ask Nova anything" — always available, so the user is never forced to
 * follow the scripted path. */
export const NovaComposer = forwardRef<NovaComposerHandle, {
  onSend: (text: string) => void
  disabled?: boolean
  /** Nova is answering — Send becomes Stop. */
  working?: boolean
  onStop?: () => void
}>(
  function NovaComposer({ onSend, disabled, working = false, onStop }, ref) {
    const [value, setValue] = useState('')
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
      prefill(text) {
        setValue(text)
        requestAnimationFrame(() => inputRef.current?.focus())
      },
    }))

    function send() {
      const text = value.trim()
      if (!text || disabled) return
      onSend(text)
      setValue('')
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
      }
    }

    return (
      <div className="w-full rounded-[var(--radius-2xl)] border border-[var(--color-accent-7)] bg-[var(--surface-primary)] shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-fast)] focus-within:shadow-[var(--shadow-brand-glow)]">
        <label htmlFor="nova-onboarding-composer" className="sr-only">Ask Nova anything</label>
        <textarea
          id="nova-onboarding-composer"
          ref={inputRef}
          rows={2}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Nova anything"
          className="block w-full resize-none bg-transparent px-[var(--space-md)] pt-[var(--space-md)] text-[length:var(--font-size-md)] leading-6 text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-8)] outline-none"
        />
        <div className="flex items-center justify-between px-[var(--space-md)] pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--color-neutral-10)]">
            <Plus size={18} />
          </span>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--color-neutral-10)]">
              <Mic size={16} />
            </span>
            {working ? (
              <button
                type="button"
                aria-label="Stop"
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-neutral-12)] text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-11)] cursor-pointer nova-label-in"
              >
                <span className="h-3 w-3 rounded-[2px] bg-current" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                onClick={send}
                disabled={!value.trim() || disabled}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] disabled:bg-[var(--color-neutral-3)] disabled:text-[var(--color-neutral-7)] cursor-pointer disabled:cursor-default"
              >
                <ArrowUp size={16} strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  },
)
