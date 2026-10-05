'use client'

import { type RefObject } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Button } from '@/app/components/ui/Button'

interface CoachMarkProps {
  open: boolean
  targetRef: RefObject<HTMLElement | null>
  title: string
  description: string
  onDismiss: () => void
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** A single, purpose-built spotlight for one real button — not a generic
 * multi-step tour engine, which isn't justified until a later step needs a
 * sequence of these. */
export function CoachMark({ open, targetRef, title, description, onDismiss, side = 'left' }: CoachMarkProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[var(--z-overlay)] bg-black/20 pointer-events-none" />
      <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root open={open}>
        <TooltipPrimitive.Trigger asChild>
          <span
            className="fixed pointer-events-none"
            style={(() => {
              const rect = targetRef.current?.getBoundingClientRect()
              if (!rect) return { top: 0, left: 0, width: 0, height: 0 }
              return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
            })()}
          />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={10}
            className="z-[var(--z-toast)] w-[260px] rounded-[var(--radius-lg)] bg-[var(--color-neutral-12)] px-[var(--space-md)] py-[var(--space-sm)] text-white shadow-[var(--shadow-lg)]"
          >
            <p className="text-[length:var(--font-size-sm)] font-semibold">{title}</p>
            <p className="mt-1 text-[length:var(--font-size-sm)] text-white/80">{description}</p>
            <Button variant="secondary" size="sm" className="mt-3 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20" onClick={onDismiss}>
              Got it
            </Button>
            <TooltipPrimitive.Arrow className="fill-[var(--color-neutral-12)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    </>
  )
}
