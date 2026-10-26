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
  /** Typed out one after another as the placeholder while the box is empty.
   * Tab fills in the one showing; sending an empty box sends it. */
  placeholderExamples?: string[]
  /** One row: + · input · mic · send, for the chat side panel. */
  compact?: boolean
  /** What sending the empty box does while Nova waits on a card — its label
   * replaces the placeholder. */
  emptyAction?: { label: string; run: () => void } | null
}>(
  function NovaComposer({ onSend, disabled, working = false, onStop, placeholder = 'Ask Nova anything', sendLabel, gradientBorder = false, initialValue = '', placeholderExamples, compact = false, emptyAction }, ref) {
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Placeholder examples: each holds a few seconds, then fades into the next.
    const [exampleIndex, setExampleIndex] = useState(0)
    const [exampleVisible, setExampleVisible] = useState(true)
    const animate = Boolean(placeholderExamples?.length) && !value
    useEffect(() => {
      if (!animate || !placeholderExamples || placeholderExamples.length < 2) return
      let swap: number
      const hold = window.setInterval(() => {
        setExampleVisible(false)
        swap = window.setTimeout(() => {
          setExampleIndex(n => n + 1)
          setExampleVisible(true)
        }, 350)
      }, 3200)
      return () => { window.clearInterval(hold); window.clearTimeout(swap) }
    }, [animate, placeholderExamples])
    const currentExample = placeholderExamples?.[exampleIndex % placeholderExamples.length] ?? ''

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
      if (!value.trim() && emptyAction) { emptyAction.run(); return }
      // Empty box with examples: send the one being shown.
      const text = value.trim() || (placeholderExamples?.length ? currentExample : '')
      if (!text || disabled) return
      onSend(text)
      setValue('')
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === 'Tab' && !value && currentExample) {
        e.preventDefault()
        setValue(currentExample)
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
      }
    }

    if (compact) {
      return (
        <div className="flex w-full items-center gap-2 rounded-full border border-[var(--color-accent-7)] bg-[var(--surface-primary)] py-1.5 pl-1.5 pr-1.5 shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-fast)] focus-within:shadow-[var(--shadow-brand-glow)]">
          <label htmlFor="nova-onboarding-composer" className="sr-only">{placeholder}</label>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-neutral-10)]">
            <Plus size={18} />
          </span>
          <textarea
            id="nova-onboarding-composer"
            ref={inputRef}
            rows={1}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={emptyAction ? `${emptyAction.label} ↵` : placeholder}
            className="block min-w-0 flex-1 resize-none bg-transparent py-1 text-[length:var(--font-size-base)] leading-6 text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-8)] outline-none"
          />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-neutral-10)]">
            <Mic size={16} />
          </span>
          {working ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={onStop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-neutral-12)] text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-11)] cursor-pointer nova-label-in"
            >
              <span className="h-3 w-3 rounded-[2px] bg-current" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={send}
              disabled={(!value.trim() && !emptyAction) || disabled}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] disabled:bg-[var(--color-neutral-3)] disabled:text-[var(--color-neutral-7)] cursor-pointer disabled:cursor-default"
            >
              <ArrowUp size={16} strokeWidth={2.25} />
            </button>
          )}
        </div>
      )
    }

    return (
      <div className={gradientBorder ? 'nova-glow w-full rounded-[var(--radius-2xl)]' : 'contents'}>
      <div className={`w-full bg-[var(--surface-primary)] transition-shadow duration-[var(--duration-fast)] ${
        gradientBorder
          ? 'rounded-[calc(var(--radius-2xl)-1px)]'
          : 'rounded-[var(--radius-2xl)] border border-[var(--color-accent-7)] shadow-[var(--shadow-sm)] focus-within:shadow-[var(--shadow-brand-glow)]'
      }`}>
        <label htmlFor="nova-onboarding-composer" className="sr-only">Ask Nova anything</label>
        <div className="relative">
        {/* The rotating example, faded in and out over the empty box. */}
        {placeholderExamples?.length && !value ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 truncate px-[var(--space-md)] pt-[var(--space-md)] text-[length:var(--font-size-md)] leading-6 text-[var(--color-neutral-8)] transition-opacity duration-300 ease-out ${exampleVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            {currentExample}
          </span>
        ) : null}
        <textarea
          id="nova-onboarding-composer"
          ref={inputRef}
          rows={2}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderExamples?.length ? '' : placeholder}
          className="block w-full resize-none bg-transparent px-[var(--space-md)] pt-[var(--space-md)] text-[length:var(--font-size-md)] leading-6 text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-8)] outline-none"
        />
        </div>
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
                disabled={(!value.trim() && !placeholderExamples?.length) || disabled}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-accent-9)] px-4 text-[length:var(--font-size-base)] font-medium text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] disabled:bg-[var(--color-neutral-3)] disabled:text-[var(--color-neutral-7)] cursor-pointer disabled:cursor-default"
              >
                {sendLabel} <ArrowRight size={15} strokeWidth={2.25} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                onClick={send}
                disabled={(!value.trim() && !placeholderExamples?.length) || disabled}
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
