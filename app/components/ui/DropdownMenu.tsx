'use client'

import { type ReactNode, type ComponentPropsWithoutRef } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

export const DropdownMenu = DropdownMenuPrimitive.Root

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

interface DropdownMenuContentProps extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  children: ReactNode
  minWidth?: string
  maxHeight?: string
}

export function DropdownMenuContent({
  children,
  className = '',
  minWidth = '180px',
  maxHeight,
  sideOffset = 4,
  align = 'start',
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={`z-[var(--z-dropdown)] rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-[var(--space-2xs)] dropdown-animate outline-none ${className}`}
        style={{ minWidth, ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}) }}
        sideOffset={sideOffset}
        align={align}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  children,
  className = '',
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={`flex items-center gap-[var(--space-xs)] w-full px-[var(--space-md)] py-[var(--space-xs)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none cursor-pointer data-[highlighted]:bg-[var(--color-neutral-3)] transition-colors duration-[var(--duration-fast)] ${className}`}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuSeparator({ className = '' }: { className?: string }) {
  return (
    <DropdownMenuPrimitive.Separator
      className={`h-px my-[var(--space-2xs)] bg-[var(--border-subtle)] ${className}`}
    />
  )
}

export const DropdownMenuLabel = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <DropdownMenuPrimitive.Label
    className={`px-[var(--space-md)] py-1.5 text-[length:var(--font-size-xs)] font-medium text-[var(--color-neutral-8)] ${className}`}
  >
    {children}
  </DropdownMenuPrimitive.Label>
)
