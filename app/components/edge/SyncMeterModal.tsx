'use client'

import { useState, useRef, useEffect } from 'react'
import { Switch } from '@/app/components/ui'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/app/components/ui/Modal'

interface SyncMeterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sensorName: string
  totalRuntime: number
}

const SAMPLE_METERS = [
  'Odometer for 2023 Ford Transit-350 Crew 98795',
  'Odometer for 2022 Chevrolet Express 3500',
  'Odometer for 2024 RAM ProMaster 2500',
  'Engine Hours — CAT 320',
  'Compressor Runtime — Unit 14',
]

export function SyncMeterModal({ open, onOpenChange, sensorName, totalRuntime }: SyncMeterModalProps) {
  const [meterName, setMeterName] = useState('')
  const [runtimeValue, setRuntimeValue] = useState(totalRuntime.toFixed(2))
  const [enabled, setEnabled] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const defaultOption = sensorName ? `${sensorName} Runtime` : 'Runtime Meter'
  const allOptions = [defaultOption, ...SAMPLE_METERS]
  const filtered = allOptions.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setMeterName('')
      setRuntimeValue(totalRuntime.toFixed(2))
      setEnabled(true)
      setSearch('')
    }
  }, [open, totalRuntime])

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  function selectOption(option: string) {
    setMeterName(option)
    setSearch(option)
    setDropdownOpen(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader title="Sync Meter" />

      <ModalBody className="flex flex-col gap-[var(--space-lg)]">
        {/* Meter name combobox */}
        <div>
          <label className="block text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)] mb-[var(--space-sm)] pb-1">
            Meter name
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setMeterName(e.target.value)
                  setDropdownOpen(true)
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Select or type a meter name…"
                className="w-full px-[var(--space-md)] py-[10px] pr-9 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none focus:border-[var(--color-accent-7)] transition-colors duration-[var(--duration-fast)]"
              />
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="absolute right-0 top-0 h-full px-3 flex items-center cursor-pointer"
                tabIndex={-1}
              >
                <ChevronDown size={14} className="text-[var(--color-neutral-7)]" />
              </button>
            </div>
            {dropdownOpen && filtered.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-10 max-h-[200px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 dropdown-animate">
                {filtered.map((option) => (
                  <button
                    key={option}
                    onClick={() => selectOption(option)}
                    className="flex items-center gap-2 w-full px-[var(--space-md)] py-2 text-left text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
                    >
                    {meterName === option && (
                      <Check size={14} className="text-[var(--color-accent-9)] shrink-0" />
                    )}
                    <span className={meterName === option ? 'font-medium' : ''}>{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total runtime */}
        <div>
          <label className="block text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)] mb-[var(--space-sm)] pb-1">
            Total runtime
          </label>
          <div className="flex items-center rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden transition-colors hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus-within:border-[var(--color-accent-7)] focus-within:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]">
            <input
              type="number"
              value={runtimeValue}
              onChange={(e) => setRuntimeValue(e.target.value)}
              className="flex-1 px-[var(--space-md)] py-[10px] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none focus-visible:outline-none min-w-0"
            />
            <span className="px-[var(--space-md)] py-[10px] text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)] bg-[var(--surface-secondary)] border-l border-[var(--border-default)]">
              hours
            </span>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between py-[var(--space-xs)]">
          <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] cursor-pointer select-none">
            Enable meter syncing
          </label>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            size="md"
          />
        </div>
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={() => onOpenChange(false)}>
          Sync Meter
        </Button>
      </ModalFooter>
    </Modal>
  )
}
