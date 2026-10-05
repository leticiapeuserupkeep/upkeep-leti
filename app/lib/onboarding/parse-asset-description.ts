export interface AssetFormValues {
  name: string
  category: string
  manufacturer: string
  model: string
  serialNumber: string
  location: string
}

const BRANDS = [
  'atlas copco', 'trane', 'carrier', 'caterpillar', 'cat', 'cummins', 'grundfos',
  'siemens', 'abb', 'ingersoll rand', 'york', 'lennox', 'daikin', 'honeywell',
  'schneider', 'ge', 'general electric', 'bosch', 'john deere',
]

const CATEGORY_KEYWORDS: Record<string, string> = {
  'compresor': 'Compressor', 'compressor': 'Compressor',
  'bomba': 'Pump', 'pump': 'Pump',
  'motor': 'Motor',
  'generador': 'Generator', 'generator': 'Generator',
  'aire acondicionado': 'HVAC', 'hvac': 'HVAC', 'chiller': 'HVAC', 'rooftop': 'HVAC',
  'cinta': 'Conveyor', 'conveyor': 'Conveyor', 'transportadora': 'Conveyor',
  'electrico': 'Electrical', 'electrical': 'Electrical', 'tablero': 'Electrical',
  'vehiculo': 'Vehicle', 'vehicle': 'Vehicle', 'camion': 'Vehicle', 'truck': 'Vehicle',
}

/**
 * Heuristic, keyword-based stand-in for a real AI extraction call — no backend
 * exists yet, so this simulates "Nova reads what you typed" with simple
 * pattern matching instead. Swap for a real call once one exists.
 */
export function parseAssetDescription(text: string): { values: Partial<AssetFormValues>; highlighted: (keyof AssetFormValues)[] } {
  const lower = text.toLowerCase()
  const values: Partial<AssetFormValues> = {}
  const highlighted: (keyof AssetFormValues)[] = []

  const brand = BRANDS.find(b => lower.includes(b))
  if (brand) {
    values.manufacturer = brand.replace(/\b\w/g, c => c.toUpperCase())
    highlighted.push('manufacturer')
  }

  const categoryKey = Object.keys(CATEGORY_KEYWORDS).find(k => lower.includes(k))
  if (categoryKey) {
    values.category = CATEGORY_KEYWORDS[categoryKey]
    highlighted.push('category')
  }

  // A trailing alphanumeric token that mixes letters and digits reads as a
  // model number (e.g. "GA37", "YCD180") — the last such token in the text.
  const modelMatch = text.match(/\b(?=[A-Za-z]*\d|[0-9]*[A-Za-z])[A-Za-z0-9-]{3,}\b/g)
  if (modelMatch && modelMatch.length > 0) {
    values.model = modelMatch[modelMatch.length - 1]
    highlighted.push('model')
  }

  const name = text.trim().replace(/\s+/g, ' ')
  if (name) {
    values.name = name.length > 60 ? `${name.slice(0, 57)}...` : name
    values.name = values.name.charAt(0).toUpperCase() + values.name.slice(1)
    highlighted.push('name')
  }

  return { values, highlighted }
}
