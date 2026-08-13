'use client'

import React from 'react'
import { X } from 'lucide-react'

// `soft` is the quiet neutral fill used for tags sitting inside a form control,
// where a blue chip would compete with the field's own focus colour.
export type ChipStyle = 'solid' | 'surface' | 'outline' | 'soft'
export type ChipSize = 'xs' | 'sm' | 'base' | 'lg'

interface ChipProps {
  children: React.ReactNode
  /** Visual treatment. `surface` is the default — the quiet one for value tags. */
  variant?: ChipStyle
  size?: ChipSize
  disabled?: boolean
  /** Leading icon, sized by the caller to match `iconSize` for this size. */
  icon?: React.ReactNode
  /** Renders a trailing dismiss button. */
  onRemove?: () => void
  /** Trailing node (e.g. a chevron). Ignored when `onRemove` is set. */
  trailing?: React.ReactNode
  /** Makes the whole chip clickable, which enables the hover/pressed states. */
  onClick?: () => void
  className?: string
  title?: string
  /**
   * Selected-state shorthand for filter pills: `true` renders solid,
   * `false` renders outline. Overrides `variant` when provided.
   */
  active?: boolean
}

/** Icon px per size — callers use this so leading/trailing glyphs stay on spec. */
export const CHIP_ICON_SIZE: Record<ChipSize, number> = { xs: 12, sm: 16, base: 16, lg: 20 }

const sizeStyles: Record<ChipSize, string> = {
  /** Borderless in-input tag — sits inside a control without competing with it. */
  xs: 'h-5 px-2 gap-0.5 text-[11px] leading-4',
  sm: 'h-6 px-2 gap-0.5 text-[14px] leading-5',
  base: 'h-8 px-3 gap-1 text-[14px] leading-5',
  lg: 'h-10 px-4 gap-2 text-[16px] leading-6',
}

const restStyles: Record<ChipStyle, string> = {
  solid: 'bg-[var(--chip-solid-bg)] text-[var(--chip-solid-fg)] border border-transparent',
  surface: 'bg-[var(--chip-surface-bg)] text-[var(--chip-surface-fg)] border border-[var(--chip-surface-border)]',
  outline: 'bg-transparent text-[var(--chip-outline-fg)] border border-[var(--chip-outline-border)]',
  soft: 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-11)] border border-transparent',
}

const interactiveStyles: Record<ChipStyle, string> = {
  solid: 'hover:bg-[var(--chip-solid-bg-hover)] active:bg-[var(--chip-solid-bg-pressed)]',
  surface:
    'hover:bg-[var(--chip-surface-bg-hover)] hover:border-[var(--chip-surface-border-hover)] active:bg-[var(--chip-surface-bg-pressed)] active:border-[var(--chip-surface-border-pressed)]',
  outline: 'hover:border-[var(--chip-outline-border-hover)] active:border-[var(--chip-outline-border-pressed)]',
  soft: 'hover:bg-[var(--color-neutral-4)] active:bg-[var(--color-neutral-5)]',
}

const disabledStyles: Record<ChipStyle, string> = {
  solid: 'bg-[var(--chip-disabled-bg)] text-[var(--chip-disabled-fg-solid)] border border-transparent',
  surface: 'bg-[var(--chip-disabled-bg)] text-[var(--chip-disabled-fg)] border border-[var(--chip-disabled-border)]',
  outline: 'bg-transparent text-[var(--chip-disabled-fg)] border border-[var(--chip-disabled-border)]',
  soft: 'bg-[var(--chip-disabled-bg)] text-[var(--chip-disabled-fg)] border border-transparent',
}

export function Chip({
  children, variant = 'surface', size = 'base', disabled = false,
  icon, onRemove, trailing, onClick, className = '', title, active,
}: ChipProps) {
  const resolved: ChipStyle = active === undefined ? variant : active ? 'solid' : 'outline'
  const interactive = !disabled && (!!onClick || !!onRemove)
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick, disabled } : {})}
      title={title}
      className={`inline-flex items-center justify-center shrink-0 rounded-full font-medium whitespace-nowrap transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chip-focus-ring)]
        ${sizeStyles[size]}
        ${disabled ? disabledStyles[resolved] : restStyles[resolved]}
        ${interactive && onClick ? `cursor-pointer ${interactiveStyles[resolved]}` : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${className}`}
    >
      {icon}
      <span className="px-1 truncate">{children}</span>
      {onRemove ? (
        <span
          role="button"
          aria-label="Remove"
          onClick={e => { if (disabled) return; e.stopPropagation(); onRemove() }}
          className={disabled ? 'shrink-0' : 'shrink-0 cursor-pointer opacity-70 hover:opacity-100 transition-opacity'}
        >
          <X size={CHIP_ICON_SIZE[size] - 4} />
        </span>
      ) : trailing}
    </Tag>
  )
}
