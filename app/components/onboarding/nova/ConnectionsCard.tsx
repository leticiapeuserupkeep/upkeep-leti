'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/app/components/ui/Modal'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { CONNECTABLE_SOURCES, INTEGRATION_CATALOG, type CatalogApp } from '@/app/lib/onboarding/nova-onboarding-data'

/** The apps shown as tiles — one row; every other app lives in the list. */
const CORE_APPS = ['gmail', 'slack', 'teams', 'drive']

const appById = (id: string) => INTEGRATION_CATALOG.find(a => a.id === id)

interface ConnectionsCardProps {
  connected: string[]
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
  className?: string
}

/** The main apps Nova can connect to, as one row of logo tiles: connected ones
 * in full with a blue check, the rest faded and one tap from connecting. The
 * last tile opens the full list. Sits under the setup panel. */
export function ConnectionsCard({ connected, onConnect, onDisconnect, className = '' }: ConnectionsCardProps) {
  const [connecting, setConnecting] = useState<CatalogApp | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState<CatalogApp | null>(null)
  const tiles = CORE_APPS.map(appById).filter((app): app is CatalogApp => Boolean(app))

  return (
    <section
      aria-label="Connections"
      className={`flex flex-col gap-[var(--space-md)] rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-[var(--space-lg)] shadow-[var(--shadow-sm)] ${className}`}
    >
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">Connections</span>
        <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">
          Connect your tools so Nova can work smarter, anticipate issues, and act early.
        </span>
      </div>
      <ul className="flex gap-2 px-1">
        {tiles.map(app => (
          <li key={app.id}>
            <AppTile app={app} connected={connected.includes(app.id)} onAdd={() => setConnecting(app)} onRemove={() => setDisconnecting(app)} />
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setListOpen(true)}
            aria-label="See all connections"
            title="See all connections"
            className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-[var(--border-subtle)] text-[var(--color-neutral-9)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-2)] hover:text-[var(--color-neutral-12)] cursor-pointer"
          >
            <Plus size={20} />
          </button>
        </li>
      </ul>

      <ConnectAppModal app={connecting} onClose={() => setConnecting(null)} onConnect={onConnect} />
      <DisconnectAppModal app={disconnecting} onClose={() => setDisconnecting(null)} onDisconnect={onDisconnect} />
      <ConnectionsListModal open={listOpen} onOpenChange={setListOpen} connected={connected} onConnect={onConnect} onDisconnect={onDisconnect} />
    </section>
  )
}

/** One logo tile. Connected: full, with a blue check that turns into a cross
 * on hover (click to disconnect). Not yet: faded, and a plus eases in over it
 * on hover. */
function AppTile({ app, connected, onAdd, onRemove }: { app: CatalogApp; connected: boolean; onAdd: () => void; onRemove: () => void }) {
  const logo = <Image src={app.logo} alt="" width={20} height={20} className="transition-opacity duration-[var(--duration-normal)] group-hover:opacity-20" />
  if (connected) {
    return (
      <button
        type="button"
        onClick={onRemove}
        title={`${app.name} · connected — click to disconnect`}
        aria-label={`Disconnect ${app.name}`}
        className="group relative flex rounded-[12px] border border-[var(--border-subtle)] p-3 transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-neutral-5)] cursor-pointer"
      >
        <Image src={app.logo} alt="" width={20} height={20} />
        <span className="nova-text-in absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white ring-2 ring-[var(--surface-primary)] transition-colors duration-[var(--duration-fast)] group-hover:bg-[var(--color-error)]">
          <Check size={10} strokeWidth={3} className="transition-[opacity,transform] duration-[var(--duration-fast)] group-hover:scale-50 group-hover:opacity-0" />
          <X size={10} strokeWidth={3} className="absolute scale-50 opacity-0 transition-[opacity,transform] duration-[var(--duration-fast)] group-hover:scale-100 group-hover:opacity-100" />
        </span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      title={`Connect ${app.name}`}
      aria-label={`Connect ${app.name}`}
      className="group relative flex rounded-[12px] border border-[var(--border-subtle)] p-3 opacity-50 transition-[opacity,border-color] duration-[var(--duration-normal)] hover:border-[var(--color-neutral-5)] hover:opacity-100 cursor-pointer"
    >
      {logo}
      <span className="pointer-events-none absolute inset-0 flex scale-75 items-center justify-center text-[var(--color-neutral-12)] opacity-0 transition-[opacity,transform] duration-[var(--duration-normal)] ease-out group-hover:scale-100 group-hover:opacity-100">
        <Plus size={18} />
      </span>
    </button>
  )
}

/** The connect step for one app: what Nova will read, and the choice to
 * connect. Reached from the list it offers Back (left); on its own, Cancel. */
function ConnectAppContent({ app, onCancel, onConnect, back = false }: { app: CatalogApp; onCancel: () => void; onConnect: () => void; back?: boolean }) {
  const source = CONNECTABLE_SOURCES.find(s => s.id === app.id)
  const access = source?.access ?? ['What you choose to share on the next screen', 'Only used to help Nova find issues and requests']
  return (
    <>
      <ModalHeader title={`Connect ${app.name}`} description={source?.description ?? app.description} />
      <ModalBody className="flex flex-1 flex-col gap-[var(--space-md)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[var(--border-subtle)]">
          <Image src={app.logo} alt="" width={24} height={24} />
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">Nova will be able to read</span>
          <ul className="flex flex-col gap-1">
            {access.map(line => (
              <li key={line} className="flex items-start gap-2 text-[length:var(--font-size-sm)] text-[var(--color-neutral-10)]">
                <Check size={14} className="mt-px shrink-0 text-[var(--color-success)]" /> {line}
              </li>
            ))}
          </ul>
        </div>
      </ModalBody>
      <ModalFooter className={back ? 'justify-between' : 'justify-end'}>
        <Button variant="secondary" size="md" onClick={onCancel}>{back ? 'Back' : 'Cancel'}</Button>
        <Button variant="primary" size="md" onClick={onConnect}>Connect</Button>
      </ModalFooter>
    </>
  )
}

/** Connect one app from its tile. */
function ConnectAppModal({ app, onClose, onConnect }: { app: CatalogApp | null; onClose: () => void; onConnect: (id: string) => void }) {
  return (
    <Modal open={Boolean(app)} onOpenChange={open => { if (!open) onClose() }} maxWidth="440px">
      {app && <ConnectAppContent app={app} onCancel={onClose} onConnect={() => { onConnect(app.id); onClose() }} />}
    </Modal>
  )
}

/** Confirms disconnecting one app: what Nova stops reading. Reached from the
 * list it offers Back (left); on its own, Cancel. */
function DisconnectAppContent({ app, onCancel, onDisconnect, back = false }: { app: CatalogApp; onCancel: () => void; onDisconnect: () => void; back?: boolean }) {
  return (
    <>
      <ModalHeader title={`Disconnect ${app.name}?`} />
      <ModalBody className="flex flex-1 flex-col gap-[var(--space-md)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[var(--border-subtle)]">
          <Image src={app.logo} alt="" width={24} height={24} />
        </span>
        <p className="text-[length:var(--font-size-base)] leading-5 text-[var(--color-neutral-10)]">
          Nova will stop reading {app.name}, so it won’t use it to find issues, requests or people. You can connect it again any time.
        </p>
      </ModalBody>
      <ModalFooter className={back ? 'justify-between' : 'justify-end'}>
        <Button variant="secondary" size="md" onClick={onCancel}>{back ? 'Back' : 'Cancel'}</Button>
        <Button variant="danger" size="md" onClick={onDisconnect}>Disconnect</Button>
      </ModalFooter>
    </>
  )
}

/** Disconnect one app from its tile, after confirming. */
function DisconnectAppModal({ app, onClose, onDisconnect }: { app: CatalogApp | null; onClose: () => void; onDisconnect: (id: string) => void }) {
  return (
    <Modal open={Boolean(app)} onOpenChange={open => { if (!open) onClose() }} maxWidth="440px">
      {app && <DisconnectAppContent app={app} onCancel={onClose} onDisconnect={() => { onDisconnect(app.id); onClose() }} />}
    </Modal>
  )
}

/** Every app Nova can connect to, one per row, searchable. The plus (on hover)
 * switches the modal to that app's connect step and comes back to the list
 * once connected; a connected app shows a check that turns into a red trash on
 * hover. Changes are held until Continue; Cancel drops them. */
function ConnectionsListModal({ open, onOpenChange, connected, onConnect, onDisconnect }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  connected: string[]
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="560px" height="600px">
      {/* Mounted only while open, so every visit starts from what's connected. */}
      <ConnectionsListContent connected={connected} onConnect={onConnect} onDisconnect={onDisconnect} close={() => onOpenChange(false)} />
    </Modal>
  )
}

function ConnectionsListContent({ connected, onConnect, onDisconnect, close }: {
  connected: string[]
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
  close: () => void
}) {
  const [query, setQuery] = useState('')
  // What's connected as of the changes made in this modal.
  const [draft, setDraft] = useState<string[]>(connected)
  // The app whose connect (or disconnect) step is open, instead of the list.
  const [step, setStep] = useState<{ app: CatalogApp; action: 'connect' | 'disconnect' } | null>(null)
  // Each step slides in from the side it came from.
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const goTo = (next: typeof step) => { setDirection(next ? 'next' : 'prev'); setStep(next) }

  const apply = () => {
    draft.filter(id => !connected.includes(id)).forEach(onConnect)
    connected.filter(id => !draft.includes(id)).forEach(onDisconnect)
    close()
  }

  const q = query.trim().toLowerCase()
  const apps = INTEGRATION_CATALOG.filter(a => !q || `${a.name} ${a.description} ${a.category}`.toLowerCase().includes(q))
  return (
    // Keyed by step so the whole content — buttons included — plays the slide.
    <div key={step ? `${step.action}-${step.app.id}` : 'list'} className={`flex min-h-0 flex-1 flex-col ${direction === 'next' ? 'nova-idea-in-next' : 'nova-idea-in-prev'}`}>
    {step?.action === 'connect' ? (
      <ConnectAppContent
        back
        app={step.app}
        onCancel={() => goTo(null)}
        onConnect={() => { setDraft(prev => (prev.includes(step.app.id) ? prev : [...prev, step.app.id])); goTo(null) }}
      />
    ) : step?.action === 'disconnect' ? (
      <DisconnectAppContent
        back
        app={step.app}
        onCancel={() => goTo(null)}
        onDisconnect={() => { setDraft(prev => prev.filter(id => id !== step.app.id)); goTo(null) }}
      />
    ) : (
      <>
        <ModalHeader title="Connections" description="Connect the tools Nova can learn from.">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search apps" className="mt-[var(--space-md)]" aria-label="Search apps" />
        </ModalHeader>
        <ModalBody className="pt-0">
          {apps.length === 0 ? (
            <p className="py-[var(--space-xl)] text-center text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">No apps match “{query.trim()}”.</p>
          ) : (
            <ul className="flex flex-col">
              {apps.map(app => {
                const isConnected = draft.includes(app.id)
                return (
                  <li key={app.id} className="border-b border-[var(--border-subtle)] last:border-b-0">
                    {/* The whole row is the button: the connect step or, if it's connected,
                        the disconnect confirmation. */}
                    <button
                      type="button"
                      onClick={() => goTo({ app, action: isConnected ? 'disconnect' : 'connect' })}
                      aria-label={`${isConnected ? 'Disconnect' : 'Connect'} ${app.name}`}
                      className="group flex w-full items-center gap-3 rounded-[10px] py-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-2)] cursor-pointer"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
                        <Image src={app.logo} alt="" width={22} height={22} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{app.name}</span>
                        <span className="truncate text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{app.description}</span>
                      </span>
                      {isConnected ? (
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full" aria-hidden>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white transition-opacity duration-[var(--duration-fast)] group-hover:opacity-0">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <Trash2 size={16} className="absolute text-[var(--color-error)] opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--color-neutral-10)] opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
                          <Plus size={18} />
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ModalBody>
        <ModalFooter className="justify-end border-t border-[var(--border-subtle)]">
          <Button variant="secondary" size="md" onClick={close}>Cancel</Button>
          <Button variant="primary" size="md" onClick={apply}>Continue</Button>
        </ModalFooter>
      </>
    )}
    </div>
  )
}
