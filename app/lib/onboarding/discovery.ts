/** Onboarding V2: what Nova finds about a new company before setup starts.
 *
 * The prototype simulates it (`simulateDiscovery`), but the shape is what a
 * real discovery service would return: one operation per step, each either
 * succeeding with data or coming back empty. The UI only says something was
 * found when its operation returned it — everything else is a suggestion. */

/** Found = about this company (public sources). Suggested = typical for the
 * industry, not known about the company. Added = typed by the user. */
export type DiscoveryOrigin = 'found' | 'suggested' | 'added'

export interface DiscoveryItem {
  id: string
  name: string
  origin: DiscoveryOrigin
  /** Assets: the location Nova recommends putting it in. */
  location?: string
  /** Team members: how to reach them, and what they do. */
  email?: string
  role?: string
}

export interface DiscoveredCompany {
  name: string
  industry: string
  size: string
  origin: DiscoveryOrigin
}

export interface DiscoveryResult {
  /** Null when no company could be matched. */
  company: DiscoveredCompany | null
  locations: DiscoveryItem[]
  assets: DiscoveryItem[]
  /** Roles to invite. Never invented people: names only when a source
   * verified them (`teamVerified`). */
  team: DiscoveryItem[]
  teamVerified: boolean
  /** Where the found information came from, for the results card. */
  sources: string[]
}

/** What the user confirmed — the only thing that goes into the workspace. */
export interface ConfirmedDiscovery {
  company: { name: string; industry: string; size: string } | null
  locations: string[]
  assets: string[]
  /** Verified people only; roles alone don't create members. */
  members: string[]
  roles: string[]
  /** A spreadsheet the user added to import with the rest. */
  importFile?: string
}

export type DiscoveryStepId = 'company' | 'industry' | 'locations' | 'assets' | 'team' | 'workspace'

/** The loading sequence, in order — one operation each. */
export const DISCOVERY_STEPS: { id: DiscoveryStepId; message: string }[] = [
  { id: 'company', message: 'Finding your company information…' },
  { id: 'industry', message: 'Understanding your business…' },
  { id: 'locations', message: 'Discovering your locations…' },
  { id: 'assets', message: 'Identifying your equipment…' },
  { id: 'workspace', message: 'Getting your workspace ready…' },
]

export const DISCOVERY_STEP_MS = 2000

/** Prototype edge cases, picked with `?scenario=` on the V2 URL. */
export type DiscoveryScenario = 'full' | 'partial' | 'none' | 'slow'

export function discoveryScenario(search: string): DiscoveryScenario {
  const s = new URLSearchParams(search).get('scenario')
  return s === 'partial' || s === 'none' || s === 'slow' ? s : 'full'
}

let nextItemId = 0
export function discoveryItem(name: string, origin: DiscoveryOrigin, extra?: Partial<DiscoveryItem>): DiscoveryItem {
  return { id: `d${++nextItemId}`, name, origin, ...extra }
}

/** Someone added by email: their name until they accept is the address's. */
export function personFromEmail(email: string): DiscoveryItem {
  const local = email.split('@')[0] ?? email
  const name = local.split(/[._-]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || email
  return discoveryItem(name, 'added', { email, role: 'Invited' })
}

/** Common equipment by industry — suggestions, not discoveries. */
const INDUSTRY_ASSETS: Record<string, string[]> = {
  Manufacturing: [
    'Conveyor Systems', 'Air Compressors', 'HVAC Units', 'Forklifts', 'Industrial Pumps', 'Packaging Machines',
    'CNC Machines', 'Hydraulic Presses', 'Industrial Boilers', 'Chillers', 'Dust Collectors', 'Electrical Panels',
  ],
  Facilities: ['HVAC Units', 'Elevators', 'Fire Alarm Panels', 'Boilers', 'Generators', 'Lighting Systems', 'Plumbing Fixtures', 'Roof Units'],
  Fleet: ['Trucks', 'Vans', 'Trailers', 'Forklifts', 'Lift Gates', 'Tire Inventory'],
  'Food & Beverage': ['Mixers', 'Ovens', 'Refrigeration Units', 'Conveyor Systems', 'Packaging Machines', 'Boilers', 'Air Compressors', 'Pumps'],
}
const GENERIC_ASSETS = ['HVAC Units', 'Generators', 'Air Compressors', 'Pumps', 'Electrical Panels']

export function suggestedAssetsFor(industry: string): string[] {
  return INDUSTRY_ASSETS[industry] ?? GENERIC_ASSETS
}

/** Where each piece of equipment usually lives, among the found locations. */
const ASSET_LOCATIONS: Record<string, string> = {
  'Conveyor Systems': 'Distribution Center',
  'Air Compressors': 'Main Manufacturing Facility',
  'HVAC Units': 'Corporate Headquarters',
  Forklifts: 'Distribution Center',
  'Industrial Pumps': 'Main Manufacturing Facility',
  'Packaging Machines': 'Distribution Center',
  'CNC Machines': 'Main Manufacturing Facility',
  'Hydraulic Presses': 'Main Manufacturing Facility',
  'Industrial Boilers': 'Main Manufacturing Facility',
  Chillers: 'Corporate Headquarters',
  'Dust Collectors': 'Main Manufacturing Facility',
  'Electrical Panels': 'Main Manufacturing Facility',
}

/** The maintenance team found on the company's public pages (mock). Not
 * invited during onboarding; Nova suggests them when work needs assigning. */
const FOUND_PEOPLE = [
  { name: 'Maria Lopez', role: 'Maintenance Manager' },
  { name: 'James Carter', role: 'Maintenance Technician' },
  { name: 'Priya Shah', role: 'Electrician' },
  { name: 'Daniel Kim', role: 'Facilities Coordinator' },
  { name: 'Emma Novak', role: 'Safety Lead' },
]

/** A simulated discovery run: how long each step takes, and what came back. */
export function simulateDiscovery(scenario: DiscoveryScenario): { stepMs: number[]; result: DiscoveryResult } {
  const stepMs = DISCOVERY_STEPS.map(() => DISCOVERY_STEP_MS)
  // A slow run: the last operation takes much longer than expected.
  if (scenario === 'slow') stepMs[stepMs.length - 1] = 9000

  if (scenario === 'none') {
    return { stepMs, result: { company: null, locations: [], assets: [], team: [], teamVerified: true, sources: [] } }
  }

  const company: DiscoveredCompany = { name: 'Acme Manufacturing', industry: 'Manufacturing', size: '250–500 employees', origin: 'found' }
  const partial = scenario === 'partial'
  const assets = suggestedAssetsFor(company.industry).map(a => discoveryItem(a, 'suggested', { location: partial ? undefined : ASSET_LOCATIONS[a] }))
  const locations = partial
    ? []
    : ['Main Manufacturing Facility', 'Distribution Center', 'Corporate Headquarters'].map(l => discoveryItem(l, 'found'))
  const team = FOUND_PEOPLE.map(p => discoveryItem(p.name, 'found', {
    role: p.role,
    email: `${p.name.toLowerCase().replace(' ', '.')}@acme-mfg.com`,
  }))
  return {
    stepMs,
    result: { company, locations, assets, team, teamVerified: true, sources: ['acme-mfg.com', 'public business listings'] },
  }
}

/** Who Nova suggests for a first work order, from the found team. */
export const SUGGESTED_TECH = FOUND_PEOPLE[1]

/** What came out of an imported spreadsheet. */
export interface ImportedData {
  locations: DiscoveryItem[]
  assets: DiscoveryItem[]
}

/** A sample import, used when a file can't be read in the browser (Excel). */
const SAMPLE_IMPORT: { name: string; location: string }[] = [
  { name: 'CNC Machine #1', location: 'Plant 1 – Machining' },
  { name: 'CNC Machine #2', location: 'Plant 1 – Machining' },
  { name: 'Hydraulic Press', location: 'Plant 1 – Machining' },
  { name: 'Air Compressor A', location: 'Plant 1 – Utilities' },
  { name: 'Boiler #1', location: 'Plant 1 – Utilities' },
  { name: 'Conveyor Line 3', location: 'Plant 2 – Assembly' },
  { name: 'Robotic Welder', location: 'Plant 2 – Assembly' },
  { name: 'Packaging Machine', location: 'Plant 2 – Packaging' },
  { name: 'Forklift #4', location: 'Warehouse' },
  { name: 'Forklift #5', location: 'Warehouse' },
]

/** Splits one CSV line, honoring quoted values. */
function csvCells(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted
    } else if ((ch === ',' || ch === ';') && !quoted) { cells.push(cell.trim()); cell = '' }
    else cell += ch
  }
  cells.push(cell.trim())
  return cells
}

/** Reads assets and their locations from a CSV: an asset/equipment/name
 * column and a location/site column. Locations are the unique sites used. */
export async function parseImportFile(file: File): Promise<ImportedData> {
  let rows: { name: string; location: string }[] = []
  if (/\.csv$/i.test(file.name)) {
    const lines = (await file.text()).split(/\r?\n/).filter(l => l.trim())
    const header = csvCells(lines[0] ?? '').map(h => h.toLowerCase())
    const locationCol = header.findIndex(h => /location|site|facility|building|area/.test(h))
    let assetCol = header.findIndex(h => /asset|equipment|machine/.test(h) && !/id$|type|category/.test(h))
    if (assetCol < 0) assetCol = header.findIndex((h, i) => /name/.test(h) && i !== locationCol)
    if (assetCol >= 0 || locationCol >= 0) {
      rows = lines.slice(1).map(csvCells).map(c => ({ name: assetCol >= 0 ? c[assetCol] ?? '' : '', location: locationCol >= 0 ? c[locationCol] ?? '' : '' }))
    }
  }
  if (rows.length === 0) rows = SAMPLE_IMPORT
  const locations = [...new Set(rows.map(r => r.location).filter(Boolean))]
  return {
    locations: locations.map(l => discoveryItem(l, 'added')),
    assets: rows.filter(r => r.name).map(r => discoveryItem(r.name, 'added', { location: r.location || undefined })),
  }
}
