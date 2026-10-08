/** Mock data for the Nova-led first-run experience, built around Deere &
 * Company from public sources (10-K FY25, deere.com, press). Everything Nova
 * "finds" is tagged with where it came from, and anything that would need a
 * private source is only produced when that source is actually connected. */

export interface CompanyProfile {
  name: string
  /** Small brand mark shown next to the name. */
  logo?: string
  size: string
  industry: string
  location: string
  /** Other sites found besides the main location. */
  moreLocations?: number
}

export const MOCK_COMPANY: CompanyProfile = {
  name: 'Deere & Company',
  logo: '/images/companies/deere.svg',
  size: '73,100 employees',
  industry: 'Heavy equipment',
  location: 'Moline, IL',
  moreLocations: 32,
}

/* ── Where a piece of information came from ── */

export type InsightSource = 'company' | 'workspace' | 'connected' | 'nova'

export const SOURCE_LABEL: Record<InsightSource, string> = {
  company: 'Public sources',
  workspace: 'Workspace data',
  connected: 'Connected sources',
  nova: 'Nova insight',
}

/* ── Connectable apps ── */

export type SourceId = 'gmail' | 'slack' | 'teams' | 'drive'

export interface ConnectableSource {
  id: SourceId
  name: string
  logo: string
  description: string
  /** What Nova reads once authorized — shown on the consent step. */
  access: string[]
}

export const CONNECTABLE_SOURCES: ConnectableSource[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    logo: '/images/integrations/gmail.svg',
    description: 'Understand maintenance conversations, recurring issues, requests, and vendor communication.',
    access: ['Email subjects and bodies that mention equipment or maintenance', 'Vendor and service-provider threads'],
  },
  {
    id: 'slack',
    name: 'Slack',
    logo: '/images/integrations/slack.svg',
    description: 'Help Nova find maintenance issues and recurring problems your team is discussing.',
    access: ['Messages in channels you choose', 'Channel names and timestamps'],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    logo: '/images/integrations/teams.svg',
    description: 'Understand operational conversations and recurring issues across your team.',
    access: ['Messages in teams and channels you choose', 'Channel names and timestamps'],
  },
  {
    id: 'drive',
    name: 'Google Drive',
    logo: '/images/integrations/google-drive.svg',
    description: 'Find maintenance documents, SOPs, equipment information, reports, and existing procedures.',
    access: ['Documents and spreadsheets in folders you choose', 'File names and last-modified dates'],
  },
]

export function sourceName(id: SourceId) {
  return CONNECTABLE_SOURCES.find(s => s.id === id)?.name ?? id
}

/** Why Nova is asking for each app — shown next to its Connect button. */
export const SOURCE_REASON: Record<SourceId, string> = {
  gmail: 'to see the status of your vendor repairs and requests',
  slack: 'to spot the equipment your team keeps flagging',
  teams: 'to spot the equipment your team keeps flagging',
  drive: 'to read your PM procedures and when equipment was last serviced',
}

/* ── Public research Nova does to identify the company ── */

export type ResearchStep =
  | { kind: 'page'; url: string; domain: string }
  | { kind: 'search'; query: string; results: number }

/** Quick check before the first card — the company details already came
 * from the sign-up form, Nova just confirms them. */
export const QUICK_LOOKUP: ResearchStep[] = [
  { kind: 'search', query: 'Deere & Company Moline IL', results: 9 },
  { kind: 'page', url: 'https://www.deere.com/en/our-company/', domain: 'deere.com' },
]

/** Deeper public research for the setup report — nothing here needs the
 * user to connect anything. */
export const COMPANY_RESEARCH: ResearchStep[] = [
  { kind: 'search', query: 'Deere & Company manufacturing plants locations', results: 14 },
  { kind: 'page', url: 'https://www.deere.com/en/our-company/locations/', domain: 'deere.com' },
  { kind: 'page', url: 'https://s22.q4cdn.com/253594569/files/doc_downloads/2025/12/Deere-Company-2025-10-K.pdf', domain: 's22.q4cdn.com' },
  { kind: 'page', url: 'https://allamerican.org/investigation/john-deere/', domain: 'allamerican.org' },
  { kind: 'search', query: 'John Deere Waterloo Works employees 2026 OR "Des Moines Works" employees', results: 10 },
  { kind: 'page', url: 'https://www.qctimes.com/business/deere-recalls-workers-quad-cities', domain: 'qctimes.com' },
]

/* ── Company report: digested from the public research ── */

export interface ReportKpi {
  label: string
  value: string
  hint: string
  estimate?: boolean
}

export interface UsPlant {
  name: string
  makes: string
  note?: string
}

export const COMPANY_REPORT = {
  kpis: [
    { label: 'Employees', value: '73.1k', hint: '32.5k in production' },
    { label: 'Plants', value: '32', hint: '15 in the US · 2 more coming' },
    { label: 'Unionized', value: '77%', hint: 'US production & maintenance · UAW to Nov 2027' },
    { label: 'Maintenance techs', value: '900–1.4k', hint: 'US estimate · 8–12% of production', estimate: true },
  ] as ReportKpi[],
  plantsByCountry: [
    { country: 'United States', plants: 15 },
    { country: 'India', plants: 4 },
    { country: 'Brazil', plants: 3 },
    { country: 'Mexico', plants: 2 },
    { country: 'Germany', plants: 2 },
    { country: 'Other', plants: 4, note: 'Argentina, Finland, France, Netherlands' },
  ],
  workforce: { total: 73100, production: 32500, us: 27000, usProduction: 11600 },
  usPlants: [
    { name: 'Waterloo, IA', makes: 'Tractors 7R/8R/9R, drivetrain, foundry', note: 'Largest · 4 operations' },
    { name: 'Waterloo, IA (Power Systems)', makes: 'Engines' },
    { name: 'Dubuque, IA', makes: 'Construction & forestry', note: '2,800 employees' },
    { name: 'East Moline, IL (Harvester Works)', makes: 'Combines', note: '+225 rehired Sep 2026' },
    { name: 'Moline, IL (Seeding & Cylinder)', makes: 'Planters & cylinders', note: '+150 rehired Sep 2026' },
    { name: 'Davenport, IA', makes: 'Motor graders, loaders, forestry' },
    { name: 'Ankeny, IA (Des Moines Works)', makes: 'Sprayers, cotton pickers' },
    { name: 'Ottumwa, IA', makes: 'Hay & forage' },
    { name: 'Coffeyville, KS', makes: 'Transmissions' },
    { name: 'Thibodaux, LA', makes: 'Cane harvesters' },
    { name: 'Valley City, ND', makes: 'Seeding' },
    { name: 'Grovetown, GA', makes: 'Small tractors' },
    { name: 'Fuquay-Varina, NC', makes: 'Golf & mowing' },
    { name: 'Greeneville, TN', makes: 'Lawn care' },
    { name: 'Horicon, WI', makes: 'Lawn care' },
  ] as UsPlant[],
  hierarchy: ['Deere', 'Division', 'Plant', 'Operation', 'Line / area', 'Asset'],
  pilot: {
    plants: 'Moline + East Moline',
    reasons: ['Rehiring now — +375 in the Quad Cities', 'Mid-size plants, close to each other', 'Good fit for Learn and technician onboarding'],
  },
  discovery: [
    'Which CMMS you use today (SAP PM is most likely)',
    'Technicians per plant and shift, and how many are contractors',
    'Asset naming standard and criticality',
    'Sensors or PLCs already installed',
    'LOTO program and work permits',
  ],
}

/* ── Action plan: what Nova can set up from the report ── */

export interface PlanItem {
  id: 'locations' | 'assets' | 'team'
  label: string
  detail: string
  count: number
}

/** Starter asset list for the pilot, by equipment type (sums to 12). */
export const STARTER_ASSETS = [
  { name: 'Robot cells', count: 3 },
  { name: 'Conveyors', count: 2 },
  { name: 'CNC machining centers', count: 2 },
  { name: 'Overhead cranes', count: 1 },
  { name: 'Test stands', count: 1 },
  { name: 'Paint line equipment', count: 1 },
  { name: 'Air compressors', count: 1 },
  { name: 'Induction furnaces', count: 1 },
]

/** Locations Nova added during onboarding, by name: the main location
 * first, then the US plants from the setup plan. */
export function onboardingLocationNames(n: number): string[] {
  if (n <= 0) return []
  return [MOCK_COMPANY.location, ...COMPANY_REPORT.usPlants.slice(0, n - 1).map(p => p.name)]
}

/** The starter assets as individual records, for the Assets list —
 * the first `n` of them, in a stable order. */
const STARTER_ASSET_CODES: Record<string, { name: string; code: string; category: string }> = {
  'Robot cells': { name: 'Welding robot cell', code: 'RC', category: 'Robotics' },
  Conveyors: { name: 'Assembly conveyor', code: 'CV', category: 'Material handling' },
  'CNC machining centers': { name: 'CNC machining center', code: 'CNC', category: 'Machining' },
  'Overhead cranes': { name: 'Overhead crane', code: 'OC', category: 'Material handling' },
  'Test stands': { name: 'Engine test stand', code: 'TS', category: 'Testing' },
  'Paint line equipment': { name: 'Paint line booth', code: 'PL', category: 'Paint' },
  'Air compressors': { name: 'Air compressor', code: 'AC', category: 'Utilities' },
  'Induction furnaces': { name: 'Induction furnace', code: 'IF', category: 'Foundry' },
}
// All at the main location — that's what the setup plan offers.
const STARTER_ASSET_LOCATIONS = ['Moline, IL · Line 1', 'Moline, IL · Line 2']

export interface StarterAssetRow {
  id: string
  name: string
  category: string
  location: string
  barcode: string
  operational: boolean
}

export function starterAssetRows(n: number): StarterAssetRow[] {
  // One list per type, then interleaved so the list reads like a real plant.
  const groups = STARTER_ASSETS.map(group => {
    const meta = STARTER_ASSET_CODES[group.name]
    return Array.from({ length: group.count }, (_, k) => {
      const i = k + 1
      const tag = `${meta.code}-${String(i).padStart(2, '0')}`
      return {
        id: `starter-${tag}`,
        name: `${meta.name} ${tag}`,
        category: meta.category,
        location: STARTER_ASSET_LOCATIONS[i % 2],
        barcode: '',
        // A few flagged by the findings (stoppages, failures) start out down.
        operational: !(meta.code === 'CV' && i === 2) && !(meta.code === 'AC' && i === 1),
      }
    })
  })
  const rows: StarterAssetRow[] = []
  for (let k = 0; k < Math.max(...STARTER_ASSETS.map(g => g.count)); k++) {
    for (const g of groups) if (g[k]) rows.push({ ...g[k], barcode: String(4503120000 + rows.length * 37) })
  }
  return rows.slice(0, n)
}

export const ACTION_PLAN: PlanItem[] = [
  { id: 'locations', label: '15 locations', detail: 'US locations that may be relevant to your account.', count: 15 },
  { id: 'assets', label: '12 assets', detail: 'Equipment associated with your main location.', count: 12 },
  { id: 'team', label: '23 team members', detail: 'People who may be part of your maintenance team.', count: 23 },
]

/* ── Analysis sequence ── */

/** Loading lines depend on what's connected — Nova never claims to be
 * reading a source it doesn't have. */
export function analysisSteps(connected: SourceId[]): string[] {
  if (connected.length === 0) {
    return ['Reading the FY25 10-K…', 'Mapping plants and divisions…', 'Estimating maintenance headcount…', 'Building your action plan…']
  }
  const steps = ['Reading your company report…', 'Checking your UpKeep workspace…']
  if (connected.includes('gmail')) steps.push('Looking for recurring maintenance conversations…')
  if (connected.includes('slack') || connected.includes('teams')) steps.push('Looking for recurring issues your team is discussing…')
  if (connected.includes('drive')) steps.push('Reviewing PM procedures and service records…')
  steps.push('Identifying patterns…')
  return steps
}

/** One fact, tagged with where it came from. */
export interface Evidence {
  text: string
  source: InsightSource
  /** Specific app, when source is 'connected'. */
  app?: SourceId
}

/* ── Plant health dashboard (needs connected sources) ── */

export interface HealthItem {
  name: string
  detail: string
  app?: SourceId
}

export interface PlantHealth {
  score: number
  urgent: HealthItem[]
  watch: HealthItem[]
  good: HealthItem[]
}

/** Only facts from sources that are actually connected make it in. */
export function plantHealth(connected: SourceId[]): PlantHealth {
  const urgent: HealthItem[] = []
  const watch: HealthItem[] = []
  const good: HealthItem[] = []
  if (connected.includes('gmail')) {
    urgent.push({ name: 'Induction Furnace #2', detail: 'Waterloo Foundry · 5 emergency vendor calls in 30 days', app: 'gmail' })
    good.push({ name: 'Harvester Works conveyors', detail: 'No vendor issues in 90 days', app: 'gmail' })
  }
  if (connected.includes('drive')) {
    urgent.push({ name: 'Paint line oven', detail: 'Dubuque · PM procedure last updated in 2019', app: 'drive' })
    good.push({ name: 'Seeding & Cylinder CNCs', detail: 'Inspection logs up to date', app: 'drive' })
  }
  if (connected.includes('slack')) watch.push({ name: 'Robot Cell 4', detail: 'East Moline · faults raised 11 times, mostly 2nd shift', app: 'slack' })
  if (connected.includes('teams')) watch.push({ name: 'Robot Cell 4', detail: 'East Moline · downtime reported 7 times', app: 'teams' })
  if (watch.length === 0) watch.push({ name: 'Quad Cities ramp-up', detail: '+375 rehires with no training records in UpKeep yet' })
  const score = Math.max(42, 86 - urgent.length * 14 - watch.length * 6)
  return { score, urgent, watch, good }
}

/* ── Full report ── */

export interface ReportSection {
  source: InsightSource
  title: string
  items: Evidence[]
}

export function buildReport(company: CompanyProfile, connected: SourceId[]): ReportSection[] {
  const sections: ReportSection[] = [
    {
      source: 'company',
      title: `About ${company.name}`,
      items: [
        { text: '73,100 employees worldwide · 27,000 in the US (10-K FY25)', source: 'company' },
        { text: '32 plants: 15 in the US and 17 abroad, plus 2 on the way', source: 'company' },
        { text: '77% of US production and maintenance staff are UAW members', source: 'company' },
      ],
    },
    {
      source: 'workspace',
      title: 'Your UpKeep workspace',
      items: [
        { text: `1 location — ${company.location}`, source: 'workspace' },
        { text: '0 assets and 0 work orders tracked so far', source: 'workspace' },
      ],
    },
  ]

  const connectedItems: Evidence[] = []
  if (connected.includes('gmail')) {
    connectedItems.push({ text: 'Induction Furnace #2 at Waterloo Foundry had 5 emergency vendor calls in 30 days', source: 'connected', app: 'gmail' })
  }
  if (connected.includes('slack')) connectedItems.push({ text: '#east-moline-ops raised Robot Cell 4 faults 11 times, mostly on 2nd shift', source: 'connected', app: 'slack' })
  if (connected.includes('teams')) connectedItems.push({ text: 'East Moline reported Robot Cell 4 downtime 7 times', source: 'connected', app: 'teams' })
  if (connected.includes('drive')) connectedItems.push({ text: 'Dubuque paint line oven PM procedure was last updated in 2019', source: 'connected', app: 'drive' })
  if (connectedItems.length > 0) {
    sections.push({ source: 'connected', title: 'From your connected sources', items: connectedItems })
  }

  sections.push({
    source: 'nova',
    title: 'What Nova sees',
    items: [
      { text: 'Start with a pilot at Moline + East Moline — rehiring now and close together', source: 'nova' },
      { text: 'Lines moving to Mexico mean assets and PMs changing hands between plants', source: 'nova' },
      { text: 'Maintenance headcount is an estimate (8–12% of production) — confirm it with your team', source: 'nova' },
    ],
  })

  return sections
}

/* ── Actions Nova can take on the findings ── */

export const PM_PLAN = [
  { task: 'Inspect furnace refractory and coils', asset: 'Induction Furnace #2 · Waterloo', frequency: 'Monthly' },
  { task: 'Calibrate robot sensors and grippers', asset: 'Robot Cell 4 · East Moline', frequency: 'Every 2 weeks' },
  { task: 'Clean burners and check oven temperature', asset: 'Paint line oven · Dubuque', frequency: 'Weekly' },
]

export function affectedAssets(connected: SourceId[]): Evidence[] {
  return [
    { text: 'Induction Furnace #2 — Waterloo Foundry', source: connected.includes('gmail') ? 'connected' : 'nova', app: connected.includes('gmail') ? 'gmail' : undefined },
    { text: 'Robot Cell 4 — East Moline', source: connected.includes('slack') ? 'connected' : 'nova', app: connected.includes('slack') ? 'slack' : undefined },
    { text: 'Paint line oven — Dubuque', source: connected.includes('drive') ? 'connected' : 'nova', app: connected.includes('drive') ? 'drive' : undefined },
  ]
}

/** First work orders Nova would create, from what it learned about the plants. */
export const SUGGESTED_WORK_ORDERS = [
  'Inspect Induction Furnace #2 — Waterloo',
  'Reset faults on Robot Cell 4',
  'Clean Dubuque paint oven burners',
  'Weekly LOTO audit — Moline',
]

/* ── Team members Nova can find once Teams / Gmail are connected ── */

/** UpKeep account roles, most to least access. */
export const UPKEEP_ROLES = ['Administrator', 'Limited Admin', 'Technician', 'Requester'] as const
export type UpkeepRole = typeof UPKEEP_ROLES[number]

/** Seats included in the trial plan; more needs an upgrade. */
export const TRIAL_SEATS = 10

export interface SuggestedPerson {
  id: string
  name: string
  role: string
  plant: string
  /** UpKeep role Nova suggests from their job title. */
  suggestedRole: UpkeepRole
  /** Where Nova found them — only shown if that app is connected. */
  app: SourceId
}

export const SUGGESTED_PEOPLE: SuggestedPerson[] = [
  { id: 'sarah', name: 'Sarah Olsen', role: 'Plant Engineering Lead', plant: 'Moline', suggestedRole: 'Administrator', app: 'gmail' },
  { id: 'mark', name: 'Mark Hansen', role: 'Maintenance Supervisor', plant: 'East Moline', suggestedRole: 'Administrator', app: 'gmail' },
  { id: 'lisa', name: 'Lisa Brandt', role: 'Maintenance Planner', plant: 'Moline', suggestedRole: 'Limited Admin', app: 'gmail' },
  { id: 'omar', name: 'Omar Haddad', role: 'Reliability Engineer', plant: 'East Moline', suggestedRole: 'Limited Admin', app: 'gmail' },
  { id: 'david', name: 'David Reyes', role: 'Maintenance Technician II', plant: 'Moline', suggestedRole: 'Technician', app: 'gmail' },
  { id: 'tom', name: 'Tom Becker', role: 'Controls Technician', plant: 'East Moline', suggestedRole: 'Technician', app: 'gmail' },
  { id: 'ana', name: 'Ana Morales', role: 'Millwright', plant: 'East Moline', suggestedRole: 'Technician', app: 'gmail' },
  { id: 'jake', name: 'Jake Wilson', role: 'Electrician', plant: 'Moline', suggestedRole: 'Technician', app: 'gmail' },
  { id: 'nina', name: 'Nina Park', role: 'Robotics Technician', plant: 'East Moline', suggestedRole: 'Technician', app: 'gmail' },
  { id: 'chris', name: 'Chris Dalton', role: 'Maintenance Technician I', plant: 'Moline', suggestedRole: 'Technician', app: 'gmail' },
  { id: 'priya', name: 'Priya Shah', role: 'EHS Coordinator', plant: 'Moline', suggestedRole: 'Requester', app: 'gmail' },
  { id: 'luis', name: 'Luis Ortega', role: 'Production Supervisor', plant: 'East Moline', suggestedRole: 'Requester', app: 'gmail' },
  { id: 'maria', name: 'Maria Lopez', role: 'Maintenance Manager', plant: 'East Moline', suggestedRole: 'Administrator', app: 'teams' },
  { id: 'james', name: 'James Carter', role: 'Reliability Engineer', plant: 'Moline', suggestedRole: 'Limited Admin', app: 'teams' },
  { id: 'kevin', name: 'Kevin Nguyen', role: 'Maintenance Planner', plant: 'East Moline', suggestedRole: 'Limited Admin', app: 'teams' },
]

export function suggestedPeople(connected: SourceId[]) {
  return SUGGESTED_PEOPLE.filter(p => connected.includes(p.app))
}

/** The report doc Nova creates in the user's Google Drive. */
export const REPORT_DOC = {
  id: 'report-doc',
  title: 'Deere & Company — Setup report',
  url: 'https://docs.google.com/document/d/deere-setup-report',
}

/* ── This week's maintenance overview (from connected Teams / Slack / Gmail) ── */

export const MAINTENANCE_OVERVIEW = {
  metrics: [
    { label: 'Maintenance-related issues found', value: 12 },
    { label: 'Open', value: 8 },
    { label: 'Recurring', value: 5 },
    { label: 'Need attention', value: 3, highlight: true },
  ],
  /** Open vs resolved. */
  byStatus: [
    { label: 'Open', value: 8, color: 'var(--color-accent-9)' },
    { label: 'In progress', value: 2, color: 'var(--color-purple)' },
    { label: 'Resolved', value: 2, color: 'var(--color-success)' },
  ],
  byLocation: [
    { label: 'Moline', value: 6 },
    { label: 'East Moline', value: 4 },
    { label: 'Waterloo', value: 2 },
  ],
  byAsset: [
    { label: 'Hydraulic presses', value: 4 },
    { label: 'Conveyors', value: 3 },
    { label: 'Forklifts', value: 3 },
    { label: 'Compressors', value: 2 },
  ],
  // Reported or mentioned in connected tools — not confirmed failures.
  top: [
    { title: 'Hydraulic leak', where: 'Moline Plant · Hydraulic Press #4', detail: 'Mentioned 4 times this week · Last reported yesterday', tag: 'High priority', tone: 'error' as const },
    { title: 'Conveyor #3 stopping intermittently', where: 'Moline Plant · Production Line 2', detail: 'Reported 3 times this week', tag: 'Recurring issue', tone: 'warning' as const },
    { title: 'Forklift battery failures', where: 'Forklifts #12 and #18', detail: 'Reported across 2 locations', tag: 'Needs attention', tone: 'accent' as const },
  ],
}

/** The plan Nova proposes from the overview's findings. */
export interface MaintenancePlanItem {
  id: string
  kind: 'pm' | 'work-order'
  title: string
  detail: string
  meta: string
}

export const MAINTENANCE_PLAN: MaintenancePlanItem[] = [
  { id: 'wo-hydraulic', kind: 'work-order', title: 'Inspect Hydraulic Press #4', detail: 'Moline Plant', meta: 'High priority' },
  { id: 'wo-conveyor', kind: 'work-order', title: 'Inspect Conveyor #3', detail: 'Moline Plant · Production Line 2', meta: 'Recurring reports' },
  { id: 'pm-forklift', kind: 'pm', title: 'Forklift battery inspection', detail: 'Forklifts #12 and #18', meta: 'Every 2 weeks' },
]

/* ── Suggestions on empty modules, from what Nova found ── */

export interface ModuleSuggestion {
  id: string
  title: string
  /** Why Nova suggests it — tied to a finding. */
  reason: string
  tag: string
  tone: 'error' | 'warning' | 'accent'
}

export const SUGGESTED_WORK_ORDER_CARDS: ModuleSuggestion[] = [
  { id: 'wo-hydraulic', title: 'Fix hydraulic leak', reason: 'Reported 4 times · last yesterday', tag: 'High priority', tone: 'error' },
  { id: 'wo-conveyor', title: 'Inspect Conveyor #3', reason: '3 stoppages this week', tag: 'Recurring', tone: 'warning' },
  { id: 'wo-forklift', title: 'Replace forklift batteries', reason: 'Failing at 2 locations', tag: 'Needs attention', tone: 'accent' },
]

export const SUGGESTED_LOCATION_CARDS: ModuleSuggestion[] = [
  { id: 'loc-hq', title: 'Moline, IL', reason: 'World headquarters · main location', tag: 'Main location', tone: 'accent' },
  { id: 'loc-harvester', title: 'East Moline Harvester Works', reason: 'Combines · where Conveyor #3 runs', tag: 'Plant', tone: 'warning' },
  { id: 'loc-waterloo', title: 'Waterloo Works', reason: 'Tractors · largest plant', tag: 'Plant', tone: 'accent' },
]

export const SUGGESTED_ASSET_CARDS: ModuleSuggestion[] = [
  { id: 'asset-press', title: 'Hydraulic press HP-2 — Moline', reason: 'Hydraulic leak continues', tag: 'High priority', tone: 'error' },
  { id: 'asset-conveyor', title: 'Conveyor #3 — East Moline', reason: 'Stopping intermittently', tag: 'Recurring', tone: 'warning' },
  { id: 'asset-forklifts', title: 'Forklift Fleet', reason: 'Battery failures at 2 locations', tag: 'Needs attention', tone: 'accent' },
]

export const SUGGESTED_PART_CARDS: ModuleSuggestion[] = [
  { id: 'part-seals', title: 'Hydraulic seal kit', reason: 'For the recurring leak at Moline', tag: 'Reorder soon', tone: 'error' },
  { id: 'part-belt', title: 'Conveyor drive belt', reason: 'Likely cause of Conveyor #3 stoppages', tag: 'Recurring', tone: 'warning' },
  { id: 'part-batteries', title: 'Forklift batteries (×2)', reason: 'Replacements for the failing units', tag: 'Needs attention', tone: 'accent' },
]

/** "Jump straight in" ideas on the Welcome page — the Nova moments that land
 * best with new users. Each card hands its prompt to Nova as-is. */
export interface NovaIdea {
  id: string
  icon: 'report' | 'app' | 'pm'
  title: string
  description: string
  prompt: string
}

// Picked from Mixpanel (90 days to Oct 2026): recurring performance reports
// are the top scheduled task, Nova Apps get the most engagement per user, and
// PM checklists from a plain description work with zero history.
export const NOVA_IDEAS: NovaIdea[] = [
  {
    id: 'weekly-report',
    icon: 'report',
    title: 'Get a weekly performance report',
    description: 'Nova sends you a summary of your team’s work every Monday.',
    prompt: 'Create a weekly maintenance performance report I get every Monday at 8am: work orders completed vs. opened, overdue items, PM compliance and top assets by downtime. Show me a preview first.',
  },
  {
    id: 'dashboard-app',
    icon: 'app',
    title: 'Build your maintenance dashboard',
    description: 'Describe what you want to track and Nova builds a live app.',
    prompt: 'Build me an app that shows open work orders by priority and location, overdue PMs and technician workload. Ask me a couple of questions first to tailor it.',
  },
  {
    id: 'pm-checklist',
    icon: 'pm',
    title: 'Turn a task into a PM checklist',
    description: 'Describe a routine inspection and Nova builds the checklist and schedule.',
    prompt: 'Create a monthly preventive maintenance plan with a checklist for inspecting a hydraulic press: check fluid level, inspect hoses and seals for leaks, record pressure readings, and require a signature.',
  },
]

/** A prompt sent from an empty state usually names one of Nova's suggestions —
 * create that item, not one titled with the whole sentence. */
export function itemFromPrompt(text: string, cards: ModuleSuggestion[]): string {
  const hit = cards.find(c => text.toLowerCase().includes(c.title.toLowerCase()))
  return hit ? hit.title : text
}
