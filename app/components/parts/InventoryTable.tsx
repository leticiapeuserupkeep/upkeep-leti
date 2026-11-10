'use client'

import { useState } from 'react'
import { ImageIcon, MoreHorizontal, SlidersHorizontal, Tag, MapPin, ArrowDownToLine } from 'lucide-react'
import { Checkbox } from '@/app/components/ui/Checkbox'
import { FilterChip } from '@/app/components/ui/FilterChip'
import { IconButton } from '@/app/components/ui/IconButton'
import { Table, TableHeader, TableBody, TableHead, TableCell } from '@/app/components/ui/Table'

export interface InventoryRow {
  id: string
  name: string
  status: 'In stock' | 'Low stock' | 'Out of stock'
  available: number
  allocated: number
  onHand: number
  incoming: number
  location: string
  barcode: string
  tags: string[]
}

/** Stock on hand across sites (mock). */
export const INVENTORY: InventoryRow[] = [
  { id: 'i1', name: 'Conveyor Belt Splice Kit', status: 'In stock', available: 9, allocated: 1, onHand: 10, incoming: 0, location: '', barcode: '', tags: [] },
  { id: 'i2', name: 'Compressor Oil Filter', status: 'In stock', available: 8, allocated: 2, onHand: 10, incoming: 24, location: '', barcode: '', tags: [] },
  { id: 'i3', name: 'HVAC Refrigerant R-410A (25lb)', status: 'In stock', available: 10, allocated: 0, onHand: 10, incoming: 15, location: '', barcode: '', tags: [] },
  { id: 'i4', name: 'CNC Spindle Bearing Set', status: 'In stock', available: 8, allocated: 2, onHand: 10, incoming: 6, location: '', barcode: '', tags: [] },
  { id: 'i5', name: 'Fire Alarm Smoke Detector', status: 'In stock', available: 10, allocated: 0, onHand: 10, incoming: 0, location: '', barcode: '', tags: [] },
  { id: 'i6', name: 'Forklift Battery Pack', status: 'Low stock', available: 2, allocated: 0, onHand: 2, incoming: 4, location: 'East Moline Harvester Works', barcode: '', tags: [] },
  { id: 'i7', name: 'Dust Masks – FFP2', status: 'In stock', available: 1240, allocated: 2, onHand: 1242, incoming: 12, location: 'Storage Area', barcode: '', tags: ['Consumable'] },
  { id: 'i8', name: 'Latex Cleaning Gloves', status: 'In stock', available: 191, allocated: 0, onHand: 191, incoming: 0, location: 'Storage Area', barcode: '', tags: ['Consumable'] },
  { id: 'i9', name: 'Compressor Oil Cartridge – CP2', status: 'In stock', available: 64, allocated: 3, onHand: 67, incoming: 4, location: 'Moline, IL', barcode: '', tags: ['Consumable'] },
  { id: 'i10', name: 'High Temp Sealant Tube', status: 'In stock', available: 6, allocated: 1, onHand: 7, incoming: 0, location: 'Moline, IL', barcode: 'LUN-SEA-0042', tags: [] },
  { id: 'i11', name: 'Element Retainer Clip Set', status: 'In stock', available: 4, allocated: 2, onHand: 6, incoming: 0, location: 'Moline, IL', barcode: 'LUN-CLIP-0117', tags: [] },
  { id: 'i12', name: 'Hydraulic Hose Assembly – 1/2"', status: 'Low stock', available: 1, allocated: 1, onHand: 2, incoming: 6, location: 'Moline, IL', barcode: 'LUN-HOSE-0208', tags: ['Critical'] },
  { id: 'i13', name: 'Spray Nozzle – Fine Mist', status: 'In stock', available: 4, allocated: 0, onHand: 4, incoming: 0, location: 'Storage Area', barcode: 'LUN-NOZ-0031', tags: [] },
  { id: 'i14', name: 'Air Filter – Paint Booth', status: 'In stock', available: 4, allocated: 0, onHand: 4, incoming: 0, location: 'Waterloo Works', barcode: '', tags: [] },
  { id: 'i15', name: 'Proximity Sensor M18', status: 'Out of stock', available: 0, allocated: 0, onHand: 0, incoming: 8, location: 'Waterloo Works', barcode: 'LUN-SEN-0310', tags: ['Critical'] },
]

const STATUS_STYLE: Record<InventoryRow['status'], string> = {
  'In stock': 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  'Low stock': 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  'Out of stock': 'bg-[var(--color-error-light)] text-[var(--color-error)]',
}

const qty = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Inventory: filters and the stock table. The page owns the header and toolbar. */
export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = rows.length > 0 && rows.every(r => selected.has(r.id))

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-full px-[var(--space-2xl)] py-[var(--space-xl)]">
      <div className="mb-4 flex flex-wrap items-center gap-2 nova-enter">
        <FilterChip icon={<SlidersHorizontal size={13} />}>Filters</FilterChip>
        <FilterChip hasDropdown>Status</FilterChip>
        <FilterChip hasDropdown icon={<ArrowDownToLine size={13} />}>Incoming Qty</FilterChip>
        <FilterChip hasDropdown icon={<MapPin size={13} />}>Location</FilterChip>
        <FilterChip hasDropdown icon={<Tag size={13} />}>Tags</FilterChip>
        <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)] transition-colors hover:text-[var(--color-accent-10)] cursor-pointer">Reset Filters</button>
        <div className="flex-1" />
        <button type="button" className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] transition-colors hover:text-[var(--color-neutral-12)] cursor-pointer">Save View</button>
      </div>

      <div className="overflow-x-auto rounded-[var(--widget-radius)] border border-[var(--widget-border)] bg-[var(--surface-primary)] nova-enter">
        <Table>
          <TableHeader>
            <tr>
              <th className="w-[52px] border-b border-[var(--border-default)] py-3 pl-6 pr-2">
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && rows.some(r => selected.has(r.id))}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map(r => r.id)))}
                />
              </th>
              <TableHead className="pl-2">Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Available Qty</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">On Hand Qty</TableHead>
              <TableHead className="text-right">Incoming</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12" aria-label="Actions" />
            </tr>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <tr key={r.id} className={`transition-colors ${selected.has(r.id) ? 'bg-[var(--color-accent-1)]' : 'hover:bg-[var(--color-neutral-2)]'}`}>
                <td className="py-3 pl-6 pr-2"><Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <TableCell className="pl-2 whitespace-nowrap text-[var(--color-neutral-12)]">{r.name}</TableCell>
                <TableCell>
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--color-neutral-2)] text-[var(--color-neutral-7)]">
                    <ImageIcon size={16} />
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-[var(--radius-sm)] px-2 text-[length:var(--font-size-sm)] font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-[var(--color-neutral-11)]">{qty(r.available)}</TableCell>
                <TableCell className="text-right tabular-nums text-[var(--color-neutral-11)]">{qty(r.allocated)}</TableCell>
                <TableCell className="text-right tabular-nums text-[var(--color-neutral-11)]">{qty(r.onHand)}</TableCell>
                <TableCell className="text-right tabular-nums text-[var(--color-neutral-11)]">{qty(r.incoming)}</TableCell>
                <TableCell className="max-w-[180px] truncate text-[var(--color-neutral-11)]">{r.location || '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-[var(--color-neutral-11)]">{r.barcode || '—'}</TableCell>
                <TableCell>
                  <span className="flex gap-1">
                    {r.tags.map(t => (
                      <span key={t} className="inline-flex h-6 items-center rounded-full border border-[var(--border-subtle)] px-2 text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)]">{t}</span>
                    ))}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
                  <IconButton label={`More for ${r.name}`} variant="ghost" size="sm" className="text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)]"><MoreHorizontal size={16} /></IconButton>
                </TableCell>
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
