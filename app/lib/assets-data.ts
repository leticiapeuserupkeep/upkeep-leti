export interface Asset {
  id: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  location?: string
  createdAt: string
}

export const seedAssets: Asset[] = [
  {
    id: 'seed-1',
    name: 'HVAC Rooftop Unit',
    category: 'HVAC',
    manufacturer: 'TRANE',
    model: 'YCD180',
    serialNumber: 'TR-8842019',
    location: 'Suite B – UpKeep HQ',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
]

export const ASSET_CATEGORIES = [
  'HVAC',
  'Compressor',
  'Pump',
  'Motor',
  'Generator',
  'Conveyor',
  'Electrical',
  'Vehicle',
  'Other',
]
