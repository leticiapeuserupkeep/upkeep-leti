'use client'

import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Switch } from '@/app/components/ui'
import { ChevronDown, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Modal, ModalHeader } from '@/app/components/ui/Modal'

interface MeterConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sensorName: string
  totalRuntime: number
  existingMeterName?: string
  syncEnabled?: boolean
  runtimeThreshold?: number
  onReset?: () => void
}

type ScheduleMode = 'every_day' | 'weekdays' | 'custom'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const THRESHOLD_UNITS = ['amps', 'milliamps', 'watts', 'kilowatts', 'volts'] as const
type ThresholdUnit = (typeof THRESHOLD_UNITS)[number]

const TIME_OPTIONS = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '11:59 PM',
]

type ConfigTab = 'general' | 'meter' | 'hours'

const TABS: { key: ConfigTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'meter', label: 'Meter' },
  { key: 'hours', label: 'Hours' },
]

export function MeterConfigModal({
  open,
  onOpenChange,
  sensorName,
  totalRuntime,
  existingMeterName,
  syncEnabled = false,
  runtimeThreshold = 0,
  onReset,
}: MeterConfigModalProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('general')
  const [enableSync, setEnableSync] = useState(syncEnabled)
  const [meterName, setMeterName] = useState(existingMeterName ?? `#${sensorName.split(' |')[0]} Runtime`)
  const [threshold, setThreshold] = useState(runtimeThreshold)
  const [thresholdUnit, setThresholdUnit] = useState<ThresholdUnit>('amps')
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('every_day')
  const [globalFrom, setGlobalFrom] = useState('12:00 AM')
  const [globalTo, setGlobalTo] = useState('11:59 PM')
  const [customDays, setCustomDays] = useState(
    DAYS.map((day) => ({ day, enabled: true, from: '12:00 AM', to: '11:59 PM' }))
  )
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showResetToast, setShowResetToast] = useState(false)

  function updateCustomDay(index: number, field: 'enabled' | 'from' | 'to', value: boolean | string) {
    setCustomDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  const handleReset = useCallback(() => {
    setThreshold(0)
    setThresholdUnit('amps')
    setAutoUpdate(false)
    setMeterName(existingMeterName ?? `#${sensorName.split(' |')[0]} Runtime`)
    setEnableSync(syncEnabled)
    setScheduleMode('every_day')
    setGlobalFrom('12:00 AM')
    setGlobalTo('11:59 PM')
    setCustomDays(DAYS.map((day) => ({ day, enabled: true, from: '12:00 AM', to: '11:59 PM' })))
    setShowResetConfirm(false)
    onOpenChange(false)
    onReset?.()
    setShowResetToast(true)
  }, [existingMeterName, sensorName, syncEnabled, onOpenChange, onReset])

  useEffect(() => {
    if (!showResetToast) return
    const timer = setTimeout(() => setShowResetToast(false), 3000)
    return () => clearTimeout(timer)
  }, [showResetToast])

  return (
    <>
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="520px">
      <ModalHeader title="Edit Runtime" />

          {/* Tabs */}
          <div className="flex px-[var(--space-xl)] border-b border-[var(--border-subtle)]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-[length:var(--font-size-sm)] font-medium cursor-pointer transition-colors duration-[var(--duration-fast)] relative ${
                  activeTab === tab.key
                    ? 'text-[var(--color-accent-9)]'
                    : 'text-[var(--color-neutral-8)] hover:text-[var(--color-neutral-11)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent-9)] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-[var(--space-xl)] pt-[calc(var(--space-lg)+12px)] pb-[calc(var(--space-lg)+12px)] flex-1 overflow-y-auto">
            {/* ── General ── */}
            {activeTab === 'general' && (
              <div className="flex flex-col">
                <h3 className="text-[length:var(--font-size-lg)] font-bold text-[var(--color-neutral-12)] pb-1">
                  Runtime Detection
                </h3>
                <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] leading-relaxed mb-[var(--space-lg)] pb-4">
                  If current reading drops below this value, the asset is considered off.
                </p>

                <div className="mb-[var(--space-lg)]">
                  <div className="flex items-center justify-between mb-[var(--space-sm)]">
                    <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
                      Runtime threshold
                    </label>
                    <Info size={14} className="text-[var(--color-neutral-7)]" />
                  </div>
                  <div className="flex items-center gap-[var(--space-sm)] pt-1 pb-3">
                    <div className="flex items-center flex-1 h-9 rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden transition-colors hover:border-[var(--color-accent-7)] hover:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)] focus-within:border-[var(--color-accent-7)] focus-within:shadow-[0_0_1px_3px_rgba(0,106,220,0.1)]">
                      <input
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="flex-1 px-[var(--space-md)] h-full bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none focus-visible:outline-none min-w-0"
                      />
                      <div className="relative h-full border-l border-[var(--border-default)]">
                        <select
                          value={thresholdUnit}
                          onChange={(e) => setThresholdUnit(e.target.value as ThresholdUnit)}
                          className="h-full appearance-none pl-[var(--space-md)] pr-7 text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)] bg-[var(--surface-secondary)] whitespace-nowrap cursor-pointer outline-none"
                        >
                          {THRESHOLD_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="whitespace-nowrap shrink-0 h-9 py-0">
                      Suggest Threshold
                    </Button>
                  </div>
                </div>

                <div className="h-px bg-[var(--border-subtle)] my-[var(--space-md)] hidden" />

                <p className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-12)] mb-[var(--space-sm)] pt-[var(--space-md)] hidden">
                  When a reading is below the runtime threshold:
                </p>
                <label className="flex items-center gap-[var(--space-sm)] cursor-pointer select-none pt-3">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--color-accent-9)] cursor-pointer"
                  />
                  <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">
                    Auto-update asset status when below threshold
                  </span>
                </label>
              </div>
            )}

            {/* ── Meter ── */}
            {activeTab === 'meter' && (
              <div className="flex flex-col">
                <h3 className="text-[length:var(--font-size-lg)] font-bold text-[var(--color-neutral-12)] pb-1">
                  Runtime Meter
                </h3>
                <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] leading-relaxed mb-[var(--space-lg)]">
                  Sync runtime data to an UpKeep meter for maintenance tracking.
                </p>

                <div className="flex flex-col gap-[var(--space-lg)]">
                  <div>
                    <label className="block text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)] pt-4 pb-1">
                      Meter name
                    </label>
                    <div className="relative">
                      <select
                        value={meterName}
                        onChange={(e) => setMeterName(e.target.value)}
                        className="w-full appearance-none px-[var(--space-md)] py-[10px] pr-8 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none cursor-pointer"
                      >
                        <option value={meterName}>{meterName}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)] pb-1">
                      Total runtime
                    </label>
                    <div className="flex items-center rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden">
                      <input
                        type="text"
                        value={totalRuntime.toFixed(2)}
                        readOnly
                        className="flex-1 px-[var(--space-md)] py-[10px] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none"
                      />
                      <span className="px-[var(--space-md)] py-[10px] text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)] bg-[var(--surface-secondary)] border-l border-[var(--border-default)]">
                        hours
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-[var(--space-sm)] pt-[var(--space-sm)]">
                    <Switch
                      checked={enableSync}
                      onCheckedChange={setEnableSync}
                      size="md"
                    />
                    <label className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] cursor-pointer select-none">
                      Enable Meter Syncing
                    </label>
                    <div className="flex-1" />
                    {meterName && (
                      <button
                        onClick={() => {
                          setMeterName('')
                          setEnableSync(false)
                        }}
                        className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-error)] hover:underline cursor-pointer"
                      >
                        Delete Meter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Hours ── */}
            {activeTab === 'hours' && (
              <div className="flex flex-col">
                <h3 className="text-[length:var(--font-size-lg)] font-bold text-[var(--color-neutral-12)] pb-1">
                  Runtime Hours
                </h3>
                <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)] leading-relaxed mb-[var(--space-lg)]">
                  Only readings during these hours count toward runtime.
                </p>

                <div className="flex flex-col gap-[var(--space-sm)] mb-[var(--space-lg)] py-4">
                  {([
                    { value: 'every_day', label: 'Every day' },
                    { value: 'weekdays', label: 'Weekdays' },
                    { value: 'custom', label: 'Custom' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-[var(--space-sm)] cursor-pointer select-none">
                      <input
                        type="radio"
                        name="schedule"
                        value={opt.value}
                        checked={scheduleMode === opt.value}
                        onChange={() => setScheduleMode(opt.value)}
                        className="w-4 h-4 accent-[var(--color-accent-9)] cursor-pointer"
                      />
                      <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                {scheduleMode !== 'custom' && (
                  <div className="flex items-center gap-[var(--space-sm)]">
                    <TimeSelect value={globalFrom} onChange={setGlobalFrom} />
                    <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)]">to</span>
                    <TimeSelect value={globalTo} onChange={setGlobalTo} />
                  </div>
                )}

                {scheduleMode === 'custom' && (
                  <div className="flex flex-col gap-[var(--space-md)]">
                    {customDays.map((d, i) => (
                      <div key={d.day} className="flex items-center gap-[var(--space-sm)]">
                        <label className="flex items-center gap-[var(--space-xs)] cursor-pointer select-none min-w-[100px]">
                          <input
                            type="checkbox"
                            checked={d.enabled}
                            onChange={(e) => updateCustomDay(i, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded accent-[var(--color-accent-9)] cursor-pointer"
                          />
                          <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">
                            {d.day}
                          </span>
                        </label>
                        <TimeSelect
                          value={d.from}
                          onChange={(v) => updateCustomDay(i, 'from', v)}
                          disabled={!d.enabled}
                        />
                        <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)]">-</span>
                        <TimeSelect
                          value={d.to}
                          onChange={(v) => updateCustomDay(i, 'to', v)}
                          disabled={!d.enabled}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {showResetConfirm ? (
            <div className="flex items-center gap-[var(--space-sm)] px-[var(--space-xl)] py-[var(--space-md)] bg-[var(--color-error-light)] border-t border-[var(--color-error)]/20 confirm-reveal-animate">
              <span className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-error)]">
                Reset all settings to default? This can't be undone.
              </span>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-[var(--color-error)] hover:bg-[var(--color-error)]/90"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-[var(--space-sm)] px-[var(--space-xl)] py-[var(--space-md)] bg-[var(--surface-primary)] border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-error)] hover:text-[var(--color-error)]/80 cursor-pointer transition-colors duration-[var(--duration-fast)]"
              >
                Reset
              </button>
              <div className="flex-1" />
              <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={() => onOpenChange(false)}>
                Save changes
              </Button>
            </div>
          )}
    </Modal>

    {showResetToast && (
      <div className="fixed bottom-6 left-1/2 z-[var(--z-toast)] flex items-center gap-2 px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--color-neutral-12)] text-white shadow-[var(--shadow-lg)] toast-animate">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        <span className="text-[length:var(--font-size-sm)] font-medium">
          Configuration reset to defaults
        </span>
      </div>
    )}
    </>
  )
}

function TimeSelect({ value, onChange, disabled = false }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none px-[var(--space-sm)] py-[6px] pr-7 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none" />
    </div>
  )
}
