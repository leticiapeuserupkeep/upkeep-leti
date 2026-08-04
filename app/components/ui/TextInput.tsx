'use client'

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef, type ReactNode } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  suffix?: ReactNode
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, suffix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-[var(--space-xs)]">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]"
          >
            {label}
            {props.required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
          </label>
        )}
        <div className="flex items-center rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden focus-within:border-[var(--color-accent-7)] transition-colors duration-[var(--duration-fast)]">
          <input
            ref={ref}
            id={inputId}
            className={`flex-1 px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none min-w-0 placeholder:text-[var(--color-neutral-7)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {suffix && (
            <span className="px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)] bg-[var(--surface-secondary)] border-l border-[var(--border-default)]">
              {suffix}
            </span>
          )}
        </div>
      </div>
    )
  }
)
TextInput.displayName = 'TextInput'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-[var(--space-xs)]">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none placeholder:text-[var(--color-neutral-7)] focus:border-[var(--color-accent-7)] transition-colors duration-[var(--duration-fast)] resize-y min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
