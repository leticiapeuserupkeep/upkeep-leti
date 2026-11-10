'use client'

import Image from 'next/image'
import { CONNECTABLE_SOURCES, type SourceId } from '@/app/lib/onboarding/nova-onboarding-data'

/** The apps the user has connected so far, as a row of logos. */
export function ConnectedApps({ connected }: { connected: SourceId[] }) {
  const apps = CONNECTABLE_SOURCES.filter(s => connected.includes(s.id))
  if (apps.length === 0) return null

  return (
    <section className="flex flex-col gap-[var(--space-sm)] nova-enter">
      <span className="px-1 pt-[var(--space-xs)] text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-11)]">Connections</span>
      <div className="flex flex-wrap gap-2 px-1">
        {apps.map(app => (
          <span
            key={app.id}
            title={app.name}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] nova-row-pop"
          >
            <Image src={app.logo} alt={app.name} width={18} height={18} />
          </span>
        ))}
      </div>
    </section>
  )
}
