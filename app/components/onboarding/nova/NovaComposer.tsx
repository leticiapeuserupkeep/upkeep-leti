'use client'

import { forwardRef, useEffect, useState, useImperativeHandle, useRef, type KeyboardEvent } from 'react'
import { Plus, Mic, ArrowUp, ArrowRight } from 'lucide-react'

export interface NovaComposerHandle {
  prefill: (text: string) => void
  /** Focus the box with the cursor after any text. */
  focus: () => void
}

/** "Ask Nova anything" — always available, so the user is never forced to
 * follow the scripted path. */
export const NovaComposer = forwardRef<NovaComposerHandle, {
  onSend: (text: string) => void
  disabled?: boolean
  /** Nova is answering — Send becomes Stop. */
  working?: boolean
  onStop?: () => void
  placeholder?: string
  /** Turns the round send button into a labeled one, e.g. "Start setup". */
  sendLabel?: string
  /** An animated pink → blue gradient border with a soft glow, for a hero prompt box. */
  gradientBorder?: boolean
  /** Text it starts with — focused, cursor at the end, ready to send. */
  initialValue?: string
}>(
  function NovaComposer({ onSend, disabled, working = false, onStop, placeholder = 'Ask Nova anything', sendLabel, gradientBorder = false, initialValue = '' }, ref) {
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // A box that starts with text is the one to type in: focus it, cursor last.
    useEffect(() => {
      if (!initialValue) return
      const id = window.setTimeout(() => {
        const input = inputRef.current
        if (!input || input.offsetParent === null) return
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
      }, 600)
      return () => window.clearTimeout(id)
    }, [initialValue])

    useImperativeHandle(ref, () => ({
      focus() {
        const input = inputRef.current
        if (!input) return
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
      },
      prefill(text) {
        setValue(text)
        requestAnimationFrame(() => {
          const input = inputRef.current
          if (!input) return
          // Focused, with the cursor after the text, ready to send or edit.
          input.focus()
          input.setSelectionRange(text.length, text.length)
        })
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
      <div className={gradientBorder ? 'nova-glow w-full rounded-[var(--radius-2xl)]' : 'contents'}>
      <div className={`w-full bg-[var(--surface-primary)] transition-shadow duration-[var(--duration-fast)] ${
        gradientBorder
          ? 'rounded-[calc(var(--radius-2xl)-1px)]'
          : 'rounded-[var(--radius-2xl)] border border-[var(--color-accent-7)] shadow-[var(--shadow-sm)] focus-within:shadow-[var(--shadow-brand-glow)]'
      }`}>
        <label htmlFor="nova-onboarding-composer" className="sr-only">Ask Nova anything</label>
        <textarea
          id="nova-onboarding-composer"
          ref={inputRef}
          rows={2}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
            ) : sendLabel ? (
              <button
                type="button"
                onClick={send}
                disabled={!value.trim() || disabled}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-accent-9)] px-4 text-[length:var(--font-size-base)] font-medium text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] disabled:bg-[var(--color-neutral-3)] disabled:text-[var(--color-neutral-7)] cursor-pointer disabled:cursor-default"
              >
                {sendLabel} <ArrowRight size={15} strokeWidth={2.25} />
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
      </div>
    )
  },
)
