'use client'

import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

const ACCESS = [
  { logo: '/images/integrations/google-docs.svg', text: 'Create the setup report as a Google Doc in your Drive' },
  { logo: '/images/integrations/gmail.svg', text: 'Read your Gmail contacts and maintenance emails to suggest teammates' },
  { logo: '/images/integrations/outlook.svg', text: 'Read your Outlook contacts and maintenance emails to suggest teammates' },
]

/** Why Nova asks, and what it will (and won't) do with the access. */
const COPY = {
  // What Nova may read is the user's call on the provider's own screen next,
  // so this card promises only what UpKeep controls.
  gmail: {
    title: 'Connect your email',
    why: 'Nova looks at who you email about maintenance to suggest your teammates, so you don’t have to add them one by one.',
    safety: ['You choose what Nova can access on the next screen', 'Only used to find your team; email content isn’t stored', 'Disconnect anytime from Settings'],
  },
  doc: {
    title: 'Connect your Google account',
    why: 'Nova saves your setup report as a Google Doc and uses your contacts to suggest teammates.',
    safety: ['Nova only creates the report; it doesn’t edit your other files', 'Read-only access to Gmail, email content isn’t stored', 'Disconnect anytime from Settings'],
  },
}

/** Google consent as a card floating just above the composer — the way Claude
 * asks for approval inline — with why it's needed and what's safe about it. */
export function GoogleConsentPrompt({ open, scope = 'doc', onAnswer }: {
  open: boolean
  scope?: 'doc' | 'gmail'
  onAnswer: (allowed: boolean, provider?: 'gmail' | 'outlook') => void
}) {
  if (!open) return null
  const access = scope === 'gmail' ? ACCESS.filter(a => /gmail|outlook/.test(a.logo)) : ACCESS.filter(a => !a.logo.includes('outlook'))
  const copy = COPY[scope]
  return (
    <div
      role="dialog"
      aria-label={copy.title}
      className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3.5 shadow-[var(--shadow-lg)] nova-panel-up"
    >
      <div className="flex items-center gap-3">
        {scope !== 'gmail' && <span className="flex shrink-0 items-center -space-x-1">
          {access.map(a => (
            <span key={a.logo} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
              <Image src={a.logo} alt="" width={16} height={16} />
            </span>
          ))}
        </span>}
        <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{copy.title}</span>
      </div>

      <p className="text-[length:var(--font-size-sm)] leading-5 text-[var(--color-neutral-11)]">{copy.why}</p>

      {/* What keeps it safe — short, scannable. */}
      <ul className="flex flex-col gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] px-3 py-2.5">
        {copy.safety.map(line => (
          <li key={line} className="flex items-start gap-2 text-[length:var(--font-size-sm)] leading-4 text-[var(--color-neutral-11)]">
            <ShieldCheck size={14} className="mt-px shrink-0 text-[var(--color-success)]" /> {line}
          </li>
        ))}
      </ul>

      {scope === 'gmail' ? (
        // Two equal choices, then a quiet way out.
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => onAnswer(true, 'outlook')}>
              <Image src="/images/integrations/outlook.svg" alt="" width={18} height={18} /> Outlook
            </Button>
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => onAnswer(true, 'gmail')}>
              <Image src="/images/integrations/gmail.svg" alt="" width={18} height={18} /> Gmail
            </Button>
          </div>
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="px-2 py-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-9)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-neutral-12)] cursor-pointer"
          >
            Not now
          </button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={() => onAnswer(false)}>Not now</Button>
          <Button variant="primary" size="md" onClick={() => onAnswer(true)}>Connect</Button>
        </div>
      )}
    </div>
  )
}
