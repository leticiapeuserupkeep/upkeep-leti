'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Modal, ModalHeader, ModalBody } from '@/app/components/ui/Modal'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { INTEGRATION_CATALOG, type CatalogApp } from '@/app/lib/onboarding/nova-onboarding-data'

const CATEGORIES: CatalogApp['category'][] = ['Communication', 'Documents', 'Business systems', 'Operations']

/** Every app Nova can connect to, grouped and searchable — opened from "Other". */
export function IntegrationsModal({ open, onOpenChange, connected, onConnect }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  connected: string[]
  onConnect: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [authorizing, setAuthorizing] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const apps = INTEGRATION_CATALOG.filter(a => !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))

  function connect(id: string) {
    setAuthorizing(id)
    window.setTimeout(() => {
      onConnect(id)
      setAuthorizing(null)
    }, 1200)
  }

  return (
    <Modal open={open} onOpenChange={o => { onOpenChange(o); if (!o) setQuery('') }} maxWidth="520px" height="600px">
      <ModalHeader title="All integrations" description="Connect the tools your team already uses." />
      <div className="px-[var(--space-xl)] pb-[var(--space-sm)]">
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search integrations" autoFocus />
      </div>
      <ModalBody className="flex min-h-0 flex-1 flex-col gap-[var(--space-lg)] overflow-y-auto">
        {apps.length === 0 && (
          <p className="py-10 text-center text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">
            No integrations match “{query.trim()}”.
          </p>
        )}
        {CATEGORIES.map(category => {
          const group = apps.filter(a => a.category === category)
          if (group.length === 0) return null
          return (
            <section key={category} className="flex flex-col gap-[var(--space-xs)]">
              <h3 className="text-[length:var(--font-size-xs)] font-medium uppercase tracking-[0.04em] text-[var(--color-neutral-9)]">{category}</h3>
              <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-xl)] border border-[var(--border-default)]">
                {group.map(app => {
                  const isConnected = connected.includes(app.id)
                  const isAuthorizing = authorizing === app.id
                  return (
                    <li key={app.id} className="flex items-center gap-2 px-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
                        <Image src={app.logo} alt="" width={18} height={18} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{app.name}</span>
                      {isConnected ? (
                        <span className="inline-flex h-6 items-center gap-1 text-[length:var(--font-size-sm)] font-medium text-[var(--color-success)]">
                          <Check size={14} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} />
                          Connected
                        </span>
                      ) : (
                        <Button variant="secondary" size="sm" className="shrink-0" aria-label={`Connect ${app.name}`} disabled={isAuthorizing} onClick={() => connect(app.id)}>
                          {isAuthorizing ? <><Loader2 size={12} className="animate-spin" /> Connecting…</> : 'Connect'}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </ModalBody>
    </Modal>
  )
}
