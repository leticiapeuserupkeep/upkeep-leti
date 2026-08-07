// Shared PM mock data used by both the list and detail pages

export interface TechAvatar { initials: string; bg: string }

export interface AssignmentRow {
  id: string; asset: string; assetType: string; location: string
  meter?: string; technicians: TechAvatar[]; extraTechs?: number
  woCount?: number; lastWO?: string; nextWO?: string; startDate?: string; endDate?: string
}

export interface PMSchedule {
  id: string; calendarTrigger: string; meterTrigger?: string; assignments: AssignmentRow[]
}

export interface PMItem {
  id: string; title: string; description?: string
  category: string; priority: string; status: string
  checklist?: string; checklistCount?: number; checklists?: string[]
  schedules: PMSchedule[]
}

const T = {
  JS: { initials: 'JS', bg: '#1E3A5F' },
  SC: { initials: 'SC', bg: '#0D7377' },
  MG: { initials: 'MG', bg: '#6B21A8' },
  TL: { initials: 'TL', bg: '#B45309' },
  CR: { initials: 'CR', bg: '#374151' },
}

export const pmItems: PMItem[] = [
  {
    id: 'pm-001',
    title: 'Quarterly HVAC filter replacement',
    description: 'Replace all air handler filters and inspect ductwork for debris',
    category: 'Maintenance', priority: 'Medium', status: 'Active',
    checklist: 'HVAC Maintenance Checklist', checklistCount: 2,
    checklists: ['HVAC Maintenance Checklist', 'Filter Replacement Log', 'Ductwork Inspection Form'],
    schedules: [{
      id: 's1', calendarTrigger: 'Every 3 Months · At 08:00 AM',
      assignments: [
        { id: 'a1', asset: 'HVAC Unit AHU-01', assetType: 'Asset', location: 'Main Building — Floor 1', technicians: [T.JS, T.SC], woCount: 8, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        { id: 'a2', asset: 'HVAC Unit AHU-02', assetType: 'Asset', location: 'Main Building — Floor 2', technicians: [T.JS], woCount: 8, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        { id: 'a3', asset: 'HVAC Unit AHU-03', assetType: 'Asset', location: 'Warehouse Zone A', technicians: [T.SC], woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
      ],
    }],
  },
  {
    id: 'pm-002',
    title: 'Monthly fire extinguisher inspection',
    description: 'Visual inspection and pressure check of all fire suppression units',
    category: 'Safety', priority: 'High', status: 'Active',
    checklist: 'Fire Safety Checklist', checklistCount: 4,
    checklists: ['Fire Safety Checklist', 'Extinguisher Pressure Log', 'Sprinkler Test Form', 'Emergency Response Checklist', 'Monthly Audit Form'],
    schedules: [
      {
        id: 's2a', calendarTrigger: 'Every 2 Weeks · On Mondays · At 11:00 AM',
        meterTrigger: 'When reading is greater than 4 units',
        assignments: [
          { id: 'b1', asset: 'Fire Extinguisher FE-12', assetType: 'Asset', location: 'Warehouse Zone B', technicians: [T.MG, T.TL], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'b2', asset: 'Fire Extinguisher FE-07', assetType: 'Asset', location: 'Main Building — Floor 1', technicians: [T.MG, T.TL], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        ],
      },
      {
        id: 's2b', calendarTrigger: 'Every 2 Weeks · On Mondays · At 11:00 AM',
        meterTrigger: 'When reading is greater than 4 units',
        assignments: [
          { id: 'b3', asset: 'Fire Extinguisher FE-03', assetType: 'Asset', location: 'R&D Lab', technicians: [T.CR, T.MG], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
          { id: 'b4', asset: 'Fire Extinguisher FE-15', assetType: 'Asset', location: 'Utility Room', technicians: [T.TL, T.CR], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        ],
      },
    ],
  },
  {
    id: 'pm-003',
    title: 'Annual electrical panel inspection',
    description: 'Full thermal imaging and breaker testing for all distribution panels',
    category: 'Electrical', priority: 'High', status: 'Active',
    schedules: [{
      id: 's3', calendarTrigger: 'Every 1 Year · At 07:00 AM',
      assignments: [
        { id: 'c1', asset: 'Panel EP-01', assetType: 'Asset', location: 'Main Building — Basement', technicians: [T.CR], woCount: 3, lastWO: '02/20', nextWO: '02/20/27', startDate: '02/20', endDate: '02/20/27' },
        { id: 'c2', asset: 'Panel EP-03', assetType: 'Asset', location: 'R&D Lab', technicians: [T.CR], woCount: 3, lastWO: '02/20', nextWO: '02/20/27', startDate: '02/20', endDate: '02/20/27' },
      ],
    }],
  },
  {
    id: 'pm-004',
    title: 'Forklift battery check',
    description: 'Battery voltage, electrolyte level, and charging station inspection',
    category: 'Fleet', priority: 'Medium', status: 'Active',
    checklist: 'Battery Inspection Checklist', checklistCount: 1,
    checklists: ['Battery Inspection Checklist', 'Electrolyte Level Log'],
    schedules: [{
      id: 's4', calendarTrigger: 'Every 2 Weeks · On Mondays',
      meterTrigger: 'When reading is above 500 hours',
      assignments: [
        { id: 'd1', asset: 'Forklift FL-204', assetType: 'Asset', location: 'Warehouse Zone A', technicians: [T.TL, T.JS], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
        { id: 'd2', asset: 'Forklift FL-205', assetType: 'Asset', location: 'Warehouse Zone A', technicians: [T.TL, T.JS], extraTechs: 4, woCount: 5, lastWO: '07/06', nextWO: '23/08/26', startDate: '07/06', endDate: '23/08/26' },
      ],
    }],
  },
  {
    id: 'pm-005',
    title: 'Conveyor belt lubrication',
    description: 'Apply food-grade lubricant to all conveyor rollers and tensioners',
    category: 'Operations', priority: 'Low', status: 'Active',
    schedules: [{
      id: 's5', calendarTrigger: 'Every 1 Week · On Fridays',
      assignments: [
        { id: 'e1', asset: 'Conveyor Belt CB-12', assetType: 'Asset', location: 'Production Floor', technicians: [T.SC], woCount: 36, lastWO: '07/19', nextWO: '07/25/26', startDate: '07/19', endDate: '07/25/26' },
        { id: 'e2', asset: 'Conveyor Belt CB-14', assetType: 'Asset', location: 'Production Floor', technicians: [T.SC, T.CR], woCount: 36, lastWO: '07/19', nextWO: '07/25/26', startDate: '07/19', endDate: '07/25/26' },
        { id: 'e3', asset: 'Conveyor Belt CB-09', assetType: 'Asset', location: 'Warehouse Zone B', technicians: [T.TL], woCount: 12, lastWO: '07/19', nextWO: '07/26/26', startDate: '07/19', endDate: '07/26/26' },
      ],
    }],
  },
  {
    id: 'pm-006',
    title: 'Emergency generator load bank test',
    description: 'Full load test at 100% rated capacity for minimum 2 hours',
    category: 'Electrical', priority: 'High', status: 'Active',
    checklist: 'Generator Test Procedure', checklistCount: 3,
    checklists: ['Generator Test Procedure', 'Load Bank Test Log', 'Fuel Level Check', 'Transfer Switch Test'],
    schedules: [{
      id: 's6', calendarTrigger: 'Every 1 Month · At 06:00 AM',
      assignments: [
        { id: 'f1', asset: 'Generator GEN-01', assetType: 'Asset', location: 'Utility Room', technicians: [T.JS, T.CR], woCount: 18, lastWO: '07/10', nextWO: '08/10/26', startDate: '07/10', endDate: '08/10/26' },
      ],
    }],
  },
  {
    id: 'pm-007',
    title: 'Compressor oil change',
    description: 'Drain, flush, and refill compressor oil with manufacturer-approved grade',
    category: 'Maintenance', priority: 'Medium', status: 'Active',
    schedules: [{
      id: 's7', calendarTrigger: 'Every 6 Months · At 07:00 AM',
      assignments: [
        { id: 'g1', asset: 'Compressor CR-01', assetType: 'Asset', location: 'Cold Room', technicians: [T.MG], woCount: 6, lastWO: '07/05', nextWO: '01/05/27', startDate: '07/05', endDate: '01/05/27' },
        { id: 'g2', asset: 'Compressor CR-02', assetType: 'Asset', location: 'Cold Room', technicians: [T.MG], woCount: 6, lastWO: '07/08', nextWO: '01/08/27', startDate: '07/08', endDate: '01/08/27' },
      ],
    }],
  },
  {
    id: 'pm-008',
    title: 'Roof drain seasonal cleaning',
    description: 'Clear debris from all roof drainage points and inspect gutters',
    category: 'Facilities', priority: 'Low', status: 'Inactive',
    schedules: [{
      id: 's8', calendarTrigger: 'Every 3 Months · At 09:00 AM',
      assignments: [
        { id: 'h1', asset: 'Roof Drain RD-N', assetType: 'Asset', location: 'Main Building — Rooftop North', technicians: [T.CR], woCount: 4, lastWO: '07/01', nextWO: '10/01/26', startDate: '07/01', endDate: '10/01/26' },
        { id: 'h2', asset: 'Roof Drain RD-S', assetType: 'Asset', location: 'Main Building — Rooftop South', technicians: [T.CR], woCount: 4, lastWO: '07/01', nextWO: '10/01/26', startDate: '07/01', endDate: '10/01/26' },
      ],
    }],
  },
]
