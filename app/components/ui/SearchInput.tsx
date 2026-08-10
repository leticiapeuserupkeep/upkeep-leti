'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string
  onValueChange: (value: string) => void
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onValueChange, onClear, placeholder = 'Search', className = '', ...props }, ref) => {
    return (
      <div className={`flex items-center gap-[var(--space-xs)] px-[var(--space-sm)] py-[var(--space-xs)] border border-[var(--border-default)] rounded-[var(--radius-lg)] bg-[var(--surface-primary)] focus-within:border-[var(--color-accent-7)] focus-within:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] transition-colors duration-[var(--duration-fast)] ${className}`}>
        <Search size={16} className="text-[var(--color-neutral-8)] shrink-0" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[length:var(--font-size-base)] outline-none bg-transparent text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)]"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onValueChange('')
              onClear?.()
            }}
            className="text-[var(--color-neutral-7)] hover:text-[var(--color-neutral-9)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'
