'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Loader2, LayoutGrid, ChevronRight } from 'lucide-react'
import { CHOICE } from '@/app/components/onboarding/nova/choiceStyles'
import { Button } from '@/app/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import { useComposerAction } from '@/app/components/onboarding/nova/composerAction'
import { IntegrationsModal } from '@/app/components/onboarding/nova/IntegrationsModal'
import { CONNECTABLE_SOURCES, INTEGRATION_CATALOG, SOURCE_REASON, isSourceId, type ConnectableSource, type SourceId } from '@/app/lib/onboarding/nova-onboarding-data'


interface ConnectSourcesCardProps {
  connected: SourceId[]
  onConnect: (id: SourceId) => void
  /** Called once — with whatever is connected at that moment (possibly none). */
  onContinue: () => void
  locked: boolean
  /** Limit to a few apps, e.g. just Teams and Gmail for finding people. */
  only?: SourceId[]
  /** Override the per-app "why" lines for this ask. */
  reasons?: Partial<Record<SourceId, string>>
  /** Just the app name — no line about what it's for. */
  hideReasons?: boolean
  /** Label for continuing once something is connected. */
  continueLabel?: (count: number) => string
  skipLabel?: string
  /** Defaults to onContinue. */
  onSkip?: () => void
  /** The conversation moves on by itself once something connects. */
  hideContinue?: boolean
  /** Just the apps — no Continue / Skip (e.g. inside the setup guide). */
  hideActions?: boolean
  /** Once something is connected, offer only Continue. */
  hideSkipWhenConnected?: boolean
  /** An "Other" row that opens every integration, with search. */
  showOther?: boolean
  /** An app from the full list that isn't one of the core sources. */
  onConnectOther?: (id: string) => void
}

/** Optional context sources, framed as "more context → better analysis".
 * Connecting never blocks the user from moving on. */
export function ConnectSourcesCard({ connected, onConnect, onContinue, locked, only, reasons, hideReasons, continueLabel, skipLabel, onSkip, hideContinue, hideSkipWhenConnected, hideActions, showOther, onConnectOther }: ConnectSourcesCardProps) {
  // `only` also sets the order the apps are shown in.
  const sources = only
    ? only.map(id => CONNECTABLE_SOURCES.find(s => s.id === id)).filter((s): s is ConnectableSource => Boolean(s))
    : CONNECTABLE_SOURCES
  // Apps connected from the full list that aren't shown above — listed as extra rows.
  const [catalogConnected, setCatalogConnected] = useState<string[]>([])
  const [catalogOpen, setCatalogOpen] = useState(false)
  const extraApps = INTEGRATION_CATALOG.filter(a => catalogConnected.includes(a.id) && !sources.some(s => s.id === a.id))
  const relevantConnected = [...connected.filter(id => sources.some(s => s.id === id)), ...extraApps.map(a => a.id)]

  function connectFromCatalog(id: string) {
    setCatalogConnected(prev => [...prev, id])
    if (isSourceId(id)) onConnect(id)
    else onConnectOther?.(id)
  }
  // Kept separate from `consentOpen` so the dialog keeps its content (and
  // title) while it animates closed.
  const [consentFor, setConsentFor] = useState<ConnectableSource | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const [authorizing, setAuthorizing] = useState<SourceId | null>(null)

  // The chat box offers the same answer: Enter continues with what's
  // connected, or skips.
  const canContinue = relevantConnected.length > 0 && !hideContinue
  const continueText = continueLabel
    ? continueLabel(relevantConnected.length)
    : `Analyze with ${relevantConnected.length} ${relevantConnected.length === 1 ? 'source' : 'sources'}`
  const skipText = skipLabel ?? (relevantConnected.length > 0 ? 'Skip the rest' : 'Continue without connecting')
  useComposerAction(locked || hideActions || authorizing !== null ? null
    : canContinue ? { label: continueText, run: onContinue }
    : { label: skipText, run: onSkip ?? onContinue })

  function authorize(source: ConnectableSource) {
    setConsentOpen(false)
    setAuthorizing(source.id)
    window.setTimeout(() => {
      onConnect(source.id)
      setAuthorizing(null)
    }, 1400)
  }

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-[var(--space-md)] nova-enter">
      <div className="flex flex-col gap-[var(--space-sm)]">
        {sources.map((source, i) => {
          const isConnected = connected.includes(source.id)
          const isAuthorizing = authorizing === source.id
          return (
            <div
              key={source.id}
              className={`flex items-center gap-2 rounded-[var(--radius-xl)] border p-3 transition-colors duration-[var(--duration-normal)] nova-enter ${
                isConnected ? 'border-[var(--color-success-border)] bg-[var(--color-success-light)]' : 'border-[var(--border-default)] bg-[var(--surface-primary)]'
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
                <Image src={source.logo} alt="" width={18} height={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{source.name}</span>
                {/* Why Nova is asking for this one, specifically. */}
                {!hideReasons && <span className="text-[length:var(--font-size-xs)] leading-4 text-[var(--color-neutral-9)]">{reasons?.[source.id] ?? SOURCE_REASON[source.id]}</span>}
              </span>
              {isConnected ? (
                <span className="inline-flex h-8 items-center gap-1.5 text-[length:var(--font-size-base)] font-medium text-[var(--color-success)]">
                  <Check size={16} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} />
                  Connected
                </span>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  aria-label={`Connect ${source.name}`}
                  disabled={locked || isAuthorizing}
                  onClick={() => { setConsentFor(source); setConsentOpen(true) }}
                >
                  {isAuthorizing ? <><Loader2 size={12} className="animate-spin" /> Connecting…</> : 'Connect'}
                </Button>
              )}
            </div>
          )
        })}
        {extraApps.map(app => (
          <div key={app.id} className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--color-success-border)] bg-[var(--color-success-light)] p-3 nova-enter">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]">
              <Image src={app.logo} alt="" width={18} height={18} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{app.name}</span>
            <span className="inline-flex h-8 items-center gap-1.5 text-[length:var(--font-size-base)] font-medium text-[var(--color-success)]">
              <Check size={16} style={{ animation: 'checkPop 0.4s var(--ease-default)' }} />
              Connected
            </span>
          </div>
        ))}
        {showOther && !locked && (
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="group flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 text-left transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-5)] hover:bg-[var(--color-accent-1)] cursor-pointer nova-enter"
            style={{ animationDelay: `${sources.length * 80}ms` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] text-[var(--color-neutral-10)]">
              <LayoutGrid size={16} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">Other</span>
              <span className="text-[length:var(--font-size-xs)] leading-4 text-[var(--color-neutral-9)]">Browse all {INTEGRATION_CATALOG.length} integrations</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[var(--color-neutral-8)] transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {showOther && (
        <IntegrationsModal
          open={catalogOpen}
          onOpenChange={setCatalogOpen}
          connected={[...connected, ...catalogConnected]}
          onConnect={connectFromCatalog}
        />
      )}

      {!locked && !hideActions && (
        <div className="flex items-center gap-2">
          {relevantConnected.length > 0 && !hideContinue && (
            <button type="button" className={CHOICE.replace('flex-1 ', '')} onClick={onContinue} disabled={authorizing !== null}>
              {continueText}
            </button>
          )}
          {!((hideContinue || hideSkipWhenConnected) && relevantConnected.length > 0) && <button type="button" className={CHOICE.replace('flex-1 ', '')} onClick={onSkip ?? onContinue} disabled={authorizing !== null}>
            {skipText}
          </button>}
        </div>
      )}

      <Modal open={consentOpen} onOpenChange={setConsentOpen} maxWidth="440px">
        {consentFor && (
          <>
            <ModalHeader title={`Connect ${consentFor.name} to Nova`} description={consentFor.description} />
            <ModalBody className="flex flex-col gap-2">
              <span className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)]">Nova can read:</span>
              <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
                {consentFor.access.map(a => (
                  <li key={a} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[length:var(--font-size-base)] text-[var(--color-neutral-11)]">
                    {a}
                    <Check size={15} className="shrink-0 text-[var(--color-success)]" />
                  </li>
                ))}
              </ul>
            </ModalBody>
            <ModalFooter className="justify-end">
              <Button variant="secondary" size="md" onClick={() => setConsentOpen(false)}>Cancel</Button>
              <Button variant="primary" size="md" onClick={() => authorize(consentFor)}>Connect</Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  )
}
