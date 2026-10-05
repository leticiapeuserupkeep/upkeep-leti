'use client'

import Image from 'next/image'
import { Button } from '@/app/components/ui/Button'

const ACCESS = [
  { logo: '/images/integrations/google-docs.svg', text: 'Create the setup report as a Google Doc in your Drive' },
  { logo: '/images/integrations/gmail.svg', text: 'Read your Gmail contacts and maintenance emails to suggest teammates' },
]

/** Google consent as a slim card floating just above the composer — the way
 * Claude asks for approval inline — instead of a modal over the page. */
export function GoogleConsentPrompt({ open, scope = 'doc', onAnswer }: {
  open: boolean
  scope?: 'doc' | 'gmail'
  onAnswer: (allowed: boolean) => void
}) {
  if (!open) return null
  const access = scope === 'gmail' ? ACCESS.filter(a => a.logo.includes('gmail')) : ACCESS
  const title = scope === 'gmail' ? 'Connect Gmail' : 'Connect your Google account'
  return (
    <div
      role="dialog"
      aria-label={title}
      className="flex items-center gap-3 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] py-2.5 pl-3 pr-2.5 shadow-[var(--shadow-lg)] nova-panel-up"
    >
      <span className="flex shrink-0 items-center -space-x-1">
        {access.map(a => (
          <span key={a.logo} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
            <Image src={a.logo} alt="" width={16} height={16} />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{title}</span>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="md" onClick={() => onAnswer(false)}>Not now</Button>
        <Button variant="primary" size="md" onClick={() => onAnswer(true)}>Connect</Button>
      </div>
    </div>
  )
}
