'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { X, ArrowUp, Check } from 'lucide-react'
import { IconButton } from '@/app/components/ui/IconButton'
import { NovaText, NovaThinking, UserBubble } from '@/app/components/onboarding/nova/NovaPrimitives'

/** Pages listen for this to open their Nova panel (the top bar's "Ask Nova"). */
export const OPEN_NOVA_PANEL_EVENT = 'open-nova-panel'

type PanelMessage =
  | { id: number; kind: 'nova'; text: string }
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'thinking' }
  | { id: number; kind: 'done'; text: string }

interface NovaSidePanelProps {
  open: boolean
  onClose: () => void
  intro: string
  quickActions: string[]
  placeholder: string
  /** Creates the thing described; returns what to call it in the reply. */
  onCreate: (text: string) => string
  /** Something to create right away, as if the user had asked (e.g. a
   * suggestion card they clicked). A new `id` sends it again. */
  request?: { text: string; id: number } | null
  /** Nova started creating it — e.g. to show a placeholder row in the list. */
  onCreating?: (text: string) => void
}

/** Nova in a side panel: describe something (or pick a suggestion) and it
 * gets created in the page behind, which stays fully visible. */
export function NovaSidePanel({ open, onClose, intro, quickActions, placeholder, onCreate, request, onCreating }: NovaSidePanelProps) {
  // Mounts off-screen first so the slide-in actually animates.
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<PanelMessage[]>([])
  const [busy, setBusy] = useState(false)
  const nextId = useRef(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(open))
    if (open) {
      setMessages(m => (m.length ? m : [{ id: ++nextId.current, kind: 'nova', text: intro }]))
      window.setTimeout(() => inputRef.current?.focus(), 350)
    }
    return () => cancelAnimationFrame(frame)
  }, [open, intro])

  function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    setValue('')
    setBusy(true)
    const thinkingId = ++nextId.current
    setMessages(m => [...m, { id: ++nextId.current, kind: 'user', text: t }, { id: thinkingId, kind: 'thinking' }])
    onCreating?.(t)
    window.setTimeout(() => {
      const name = onCreate(t)
      setMessages(m => [...m.filter(x => x.id !== thinkingId), { id: ++nextId.current, kind: 'done', text: name }])
      setBusy(false)
    }, 1800)
  }

  // Send a requested item once the panel has slid in.
  const sendRef = useRef(send)
  useEffect(() => { sendRef.current = send })
  useEffect(() => {
    if (!request) return
    const t = window.setTimeout(() => sendRef.current(request.text), 450)
    return () => window.clearTimeout(t)
  }, [request])

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(value)
    }
  }

  if (!open && !visible) return null

  return (
    <aside
      className={`fixed right-0 top-0 z-50 flex h-full w-[400px] max-w-[92vw] flex-col border-l border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-xl)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-label="Nova"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-[var(--space-lg)] py-[var(--space-md)]">
        <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">Nova</span>
        <IconButton label="Close" variant="ghost" size="md" onClick={onClose}><X size={16} /></IconButton>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-md)] overflow-y-auto px-[var(--space-lg)] py-[var(--space-md)]">
        {messages.map(m => (
          <div key={m.id} className="flex flex-col nova-enter">
            {m.kind === 'nova' && <NovaText text={m.text} />}
            {m.kind === 'user' && <UserBubble>{m.text}</UserBubble>}
            {m.kind === 'thinking' && <NovaThinking labels={['Reading your request…', 'Filling in the details…']} />}
            {m.kind === 'done' && (
              <span className="flex items-start gap-1.5 text-[length:var(--font-size-base)] text-[var(--color-neutral-11)]">
                <Check size={16} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
                <span>Created <span className="font-semibold">{m.text}</span></span>
              </span>
            )}
          </div>
        ))}
        {!busy && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 nova-enter">
            {quickActions.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-[var(--border-default)] px-3 py-1.5 text-left text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-neutral-7)] hover:bg-[var(--color-neutral-2)] cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)] p-[var(--space-md)]">
        <div className="flex items-end gap-2 rounded-[var(--radius-xl)] border border-[var(--color-accent-6)] bg-[var(--surface-primary)] p-2">
          <label htmlFor="nova-side-panel-input" className="sr-only">{placeholder}</label>
          <textarea
            id="nova-side-panel-input"
            ref={inputRef}
            rows={2}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 resize-none bg-transparent px-1 text-[length:var(--font-size-base)] text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-8)] outline-none"
          />
          <button
            type="button"
            aria-label="Send"
            onClick={() => send(value)}
            disabled={!value.trim() || busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] disabled:bg-[var(--color-neutral-3)] disabled:text-[var(--color-neutral-7)] cursor-pointer disabled:cursor-default"
          >
            <ArrowUp size={15} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </aside>
  )
}
