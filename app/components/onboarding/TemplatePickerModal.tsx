'use client'

import type { LucideIcon } from 'lucide-react'
import { Modal, ModalHeader, ModalBody } from '@/app/components/ui/Modal'

export interface ModuleTemplate {
  name: string
  /** Second line: category, what it covers… */
  detail: string
  icon: LucideIcon
}

/** "Start from a template" — the same picker for every module's empty state. */
export function TemplatePickerModal({ open, onOpenChange, description, templates, onPick }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
  templates: ModuleTemplate[]
  onPick: (template: ModuleTemplate) => void
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="480px">
      <ModalHeader title="Start from a template" description={description} />
      <ModalBody className="flex flex-col gap-2">
        {templates.map(t => (
          <button
            key={t.name}
            type="button"
            onClick={() => { onPick(t); onOpenChange(false) }}
            className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--border-default)] px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] cursor-pointer"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-neutral-2)] text-[var(--color-neutral-10)]"><t.icon size={16} /></span>
            <span className="flex flex-col">
              <span className="text-[length:var(--font-size-base)] font-semibold text-[var(--color-neutral-12)]">{t.name}</span>
              <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)]">{t.detail}</span>
            </span>
          </button>
        ))}
      </ModalBody>
    </Modal>
  )
}
