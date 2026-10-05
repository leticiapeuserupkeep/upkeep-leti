'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, TextInput, Chip, FilterSelect } from '@/app/components/ui'
import { ASSET_CATEGORIES, type Asset } from '@/app/lib/assets-data'
import type { AssetFormValues } from '@/app/lib/onboarding/parse-asset-description'

const EMPTY_VALUES: AssetFormValues = {
  name: '', category: '', manufacturer: '', model: '', serialNumber: '', location: '',
}

interface CreateAssetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Partial<AssetFormValues>
  /** Fields Nova filled in — rendered with an accent ring + "AI" chip so the
   * user knows exactly what to review before confirming. */
  highlightedFields?: (keyof AssetFormValues)[]
  onCreate: (asset: Asset) => void
}

export function CreateAssetModal({ open, onOpenChange, initial, highlightedFields = [], onCreate }: CreateAssetModalProps) {
  const [values, setValues] = useState<AssetFormValues>({ ...EMPTY_VALUES, ...initial })

  useEffect(() => {
    if (open) setValues({ ...EMPTY_VALUES, ...initial })
  }, [open, initial])

  function set<K extends keyof AssetFormValues>(key: K, value: AssetFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  function isHighlighted(field: keyof AssetFormValues) {
    return highlightedFields.includes(field)
  }

  function handleCreate() {
    if (!values.name.trim()) return
    onCreate({
      id: crypto.randomUUID(),
      name: values.name.trim(),
      category: values.category || 'Other',
      manufacturer: values.manufacturer || undefined,
      model: values.model || undefined,
      serialNumber: values.serialNumber || undefined,
      location: values.location || undefined,
      createdAt: new Date().toISOString(),
    })
    onOpenChange(false)
  }

  const fieldLabel = (label: string, field: keyof AssetFormValues) => (
    <span className="flex items-center gap-1.5">
      {label}
      {isHighlighted(field) && (
        <Chip size="xs" variant="soft" icon={<Sparkles size={10} />} className="text-[var(--color-accent-10)]">
          AI
        </Chip>
      )}
    </span>
  )

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="480px">
      <ModalHeader title="Create Asset" description="Add the equipment your team maintains." />
      <ModalBody className="flex flex-col gap-[var(--space-md)]">
        <TextInput
          label="Name"
          required
          placeholder="e.g. Rooftop HVAC Unit 3"
          value={values.name}
          onChange={e => set('name', e.target.value)}
          highlight={isHighlighted('name')}
        />
        <div className="flex flex-col gap-[var(--space-xs)]">
          <label className="flex items-center gap-1.5 text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-12)]">
            {fieldLabel('Category', 'category')}
          </label>
          <FilterSelect
            ariaLabel="Category"
            value={values.category}
            options={[{ value: '', label: 'Select category' }, ...ASSET_CATEGORIES.map(c => ({ value: c, label: c }))]}
            onChange={v => set('category', v)}
            triggerClassName={`w-full justify-start !h-9 ${isHighlighted('category') ? 'border-[var(--color-accent-7)]' : ''}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-[var(--space-md)]">
          <TextInput
            label="Manufacturer"
            placeholder="e.g. Atlas Copco"
            value={values.manufacturer}
            onChange={e => set('manufacturer', e.target.value)}
            highlight={isHighlighted('manufacturer')}
          />
          <TextInput
            label="Model"
            placeholder="e.g. GA37"
            value={values.model}
            onChange={e => set('model', e.target.value)}
            highlight={isHighlighted('model')}
          />
        </div>
        <TextInput
          label="Serial Number"
          placeholder="e.g. SN-2024-0091"
          value={values.serialNumber}
          onChange={e => set('serialNumber', e.target.value)}
          highlight={isHighlighted('serialNumber')}
        />
        <TextInput
          label="Location"
          placeholder="e.g. Planta Norte"
          value={values.location}
          onChange={e => set('location', e.target.value)}
          highlight={isHighlighted('location')}
        />
      </ModalBody>
      <ModalFooter className="justify-end border-t border-[var(--border-subtle)]">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleCreate} disabled={!values.name.trim()}>Create Asset</Button>
      </ModalFooter>
    </Modal>
  )
}
