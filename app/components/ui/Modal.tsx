'use client'

import { type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onOpenChange, children, maxWidth = '480px' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-[var(--z-overlay)] bg-black/40" />
        <Dialog.Content
          className="modal-content fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-full max-h-[85vh] rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-xl)] focus:outline-none flex flex-col overflow-visible"
          style={{ maxWidth }}
        >
          <div className="flex flex-col overflow-hidden rounded-[var(--radius-2xl)] max-h-[85vh]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface ModalHeaderProps {
  title: string
  description?: string
  closeDisabled?: boolean
  children?: ReactNode
}

export function ModalHeader({ title, description, closeDisabled = false, children }: ModalHeaderProps) {
  return (
    <div className="relative px-[var(--space-xl)] pt-[var(--space-xl)] pb-[var(--space-md)]">
      <Dialog.Close asChild>
        <button
          className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-primary)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-11)] transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close"
          disabled={closeDisabled}
        >
          <X size={16} />
        </button>
      </Dialog.Close>
      <Dialog.Title className="text-[length:var(--font-size-lg)] font-semibold text-[var(--color-neutral-12)]">
        {title}
      </Dialog.Title>
      {description && (
        <Dialog.Description className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-10)] mt-0.5">
          {description}
        </Dialog.Description>
      )}
      {children}
    </div>
  )
}

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto px-[var(--space-xl)] py-[var(--space-lg)] ${className}`}>
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex items-center gap-[var(--space-sm)] px-[var(--space-xl)] py-[var(--space-md)] ${className}`}>
      {children}
    </div>
  )
}
