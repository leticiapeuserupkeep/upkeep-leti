'use client'

import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface NumberInputProps {
  value: string | number
  onChange: (v: string) => void
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  error?: boolean
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onChange, onBlur, min, max, step = 1, placeholder, className = '', error = false },
  ref
) {
  const num = parseFloat(String(value))

  function increment() {
    const next = (isNaN(num) ? (min ?? 0) : num) + step
    if (max !== undefined && next > max) return
    onChange(String(next))
  }

  function decrement() {
    const next = (isNaN(num) ? (min ?? 0) : num) - step
    if (min !== undefined && next < min) return
    onChange(String(next))
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={`w-full h-8 pl-3 pr-7 rounded-[var(--radius-md)] border bg-[var(--surface-primary)] text-[13px] text-[var(--color-neutral-11)] outline-none focus-visible:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${error ? 'border-[#CE2C31] shadow-[0_0_1px_3px_rgba(206,44,49,0.1)]' : 'border-[var(--border-default)] hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]'} focus:border-[var(--color-accent-7)] focus:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]`}
      />
      <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-[var(--border-default)] rounded-r-[var(--radius-md)] overflow-hidden">
        <button
          type="button"
          tabIndex={-1}
          onClick={increment}
          className="flex-1 flex items-center justify-center w-6 hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer border-b border-[var(--border-default)]"
        >
          <ChevronUp size={10} className="text-[var(--color-neutral-7)]" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={decrement}
          className="flex-1 flex items-center justify-center w-6 hover:bg-[var(--color-neutral-3)] transition-colors cursor-pointer"
        >
          <ChevronDown size={10} className="text-[var(--color-neutral-7)]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
})
