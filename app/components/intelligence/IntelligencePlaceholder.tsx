'use client'

import { Sparkles } from 'lucide-react'

export function IntelligencePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-[var(--space-xl)] py-[var(--space-4xl)] text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-accent-1)] text-[var(--color-accent-9)]">
        <Sparkles size={28} strokeWidth={1.75} />
      </div>
      <h2 className="text-[length:var(--font-size-title-3)] font-semibold text-[var(--color-neutral-12)]">{title}</h2>
      <p className="mt-2 max-w-md text-[length:var(--font-size-body-1)] leading-relaxed text-[var(--color-neutral-8)]">
        {description}
      </p>
    </div>
  )
}
