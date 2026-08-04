export interface PMAsset {
  id: string
  name: string
  location?: string
  meter?: string
  team?: string
  assignee?: string
}

export interface PMLocation {
  id: string
  name: string
  assets?: string[]
  meters?: string[]
  team?: string
  assignees?: string[]
}

export interface PMMeter {
  id: string
  name: string
  unit: string
  assetName?: string
  locationName?: string
}

export const PM_PEOPLE = [
  'Alex Morgan', 'Jamie Chen', 'Sam Rivera', 'Taylor Brooks',
  'Jordan Lee', 'Casey Kim', 'Riley Patel', 'Drew Santos',
]

export const PM_TEAMS = [
  'Maintenance', 'Electrical', 'Safety', 'Operations', 'HVAC', 'Facilities',
]

export const PM_METERS: PMMeter[] = [
  { id: 'm1',  name: 'Cooling Pump Pressure',    unit: 'PSI',    assetName: 'Cooling Pump',           locationName: 'Plant B – Boiler Room' },
  { id: 'm2',  name: 'Vibration Sensor A',        unit: 'mm/s',   assetName: 'Binding Machine',        locationName: 'Warehouse Zone B' },
  { id: 'm3',  name: 'Temperature Gauge',         unit: '°F',     assetName: 'Compressor CR-01',       locationName: 'R&D Lab' },
  { id: 'm4',  name: 'Flow Rate Monitor',         unit: 'GPM',    assetName: 'HVAC Unit AHU-03',       locationName: 'Chicago Office' },
  { id: 'm5',  name: 'Vibration Sensor B',        unit: 'mm/s',   assetName: 'Forklift FL-204',        locationName: 'Warehouse Zone B' },
  { id: 'm6',  name: 'Oil Pressure Gauge',        unit: 'PSI',    assetName: 'Generator Set GS-2',     locationName: 'Plant B – Boiler Room' },
  { id: 'm7',  name: 'Air Filter DP Sensor',      unit: 'inH2O',  assetName: 'Air Handler AH-12' },
  { id: 'm8',  name: 'Pump Runtime Hour Meter',   unit: 'hrs',    locationName: 'Warehouse Zone A' },
  { id: 'm9',  name: 'Chiller Outlet Temp',       unit: '°F',     assetName: 'Chiller Unit CU-7',      locationName: 'Plant B – Boiler Room' },
  { id: 'm10', name: 'Battery Charge Level',      unit: '%',      assetName: 'UPS Battery Bank',       locationName: 'Server Room 4B' },
  { id: 'm11', name: 'Fan RPM Monitor',           unit: 'RPM',    assetName: 'Roof Exhaust Fan REF-3', locationName: 'Parking Structure – Level 2' },
  { id: 'm12', name: 'Belt Tension Sensor',       unit: 'N',      assetName: 'Conveyor Belt CB-02',    locationName: 'Warehouse Zone A' },
  { id: 'm13', name: 'Tank Pressure Gauge',       unit: 'PSI',    assetName: 'Air Compressor AC-5' },
  { id: 'm14', name: 'Hydraulic Pressure Sensor', unit: 'PSI',    assetName: 'Hydraulic Press HP-01',  locationName: 'Warehouse Zone B' },
  { id: 'm15', name: 'CO2 Level Sensor',          unit: 'ppm',    assetName: 'Clean Air Handler CAH-2', locationName: 'Chicago Office' },
]

export const PM_LOCATIONS: PMLocation[] = [
  {
    id: 'l1',
    name: 'Plant B – Boiler Room',
    assets: ['Cooling Pump', 'Generator Set GS-2', 'Compressor CR-01', 'Chiller Unit CU-7', 'Emergency Generator EG-1'],
    meters: ['Cooling Pump Pressure', 'Oil Pressure Gauge', 'Chiller Outlet Temp'],
    team: 'Maintenance',
    assignees: ['Alex Morgan', 'Sam Rivera'],
  },
  {
    id: 'l2',
    name: 'Warehouse Zone A',
    assets: ['Pallet Jack PJ-07', 'Conveyor Belt CB-02'],
    meters: ['Pump Runtime Hour Meter', 'Belt Tension Sensor'],
    team: 'Operations',
  },
  {
    id: 'l3',
    name: 'Warehouse Zone B',
    assets: ['Binding Machine', 'Forklift FL-204', 'Hydraulic Press HP-01'],
    meters: ['Vibration Sensor A', 'Vibration Sensor B', 'Hydraulic Pressure Sensor'],
    assignees: ['Jordan Lee'],
  },
  {
    id: 'l4',
    name: 'Chicago Office',
    assets: ['HVAC Unit AHU-03', 'AHU Rooftop RT-1', 'Clean Air Handler CAH-2'],
    meters: ['Flow Rate Monitor', 'CO2 Level Sensor'],
    team: 'HVAC',
    assignees: ['Casey Kim', 'Riley Patel'],
  },
  {
    id: 'l5',
    name: 'R&D Lab',
    assets: ['Compressor CR-01', 'Clean Room AHU', 'Fire Suppression System'],
    meters: ['Temperature Gauge'],
    team: 'Safety',
    assignees: ['Taylor Brooks'],
  },
  {
    id: 'l6',
    name: 'Parking Structure – Level 2',
    assets: ['Roof Exhaust Fan REF-3'],
    meters: ['Fan RPM Monitor'],
    team: 'Facilities',
    assignees: ['Drew Santos'],
  },
  {
    id: 'l7',
    name: 'Server Room 4B',
    assets: ['UPS Battery Bank'],
    meters: ['Battery Charge Level'],
    team: 'Electrical',
    assignees: ['Jamie Chen'],
  },
  {
    id: 'l8',
    name: 'Manufacturing Floor A',
    assets: ['Robotic Arm RA-3'],
    team: 'Operations',
    assignees: ['Jordan Lee', 'Sam Rivera'],
  },
  {
    id: 'l9',
    name: 'Rooftop Plant',
    assets: ['Cooling Tower CT-1'],
    team: 'HVAC',
    assignees: ['Riley Patel'],
  },
]

export const PM_ASSETS: PMAsset[] = [
  // Location + meter + team
  { id: 'a1',  name: 'Cooling Pump',             location: 'Plant B – Boiler Room',      meter: 'Cooling Pump Pressure',      team: 'Maintenance' },
  { id: 'a2',  name: 'Binding Machine',           location: 'Warehouse Zone B',            meter: 'Vibration Sensor A',         team: 'Operations' },
  { id: 'a3',  name: 'Compressor CR-01',          location: 'R&D Lab',                     meter: 'Temperature Gauge',          team: 'Safety' },
  { id: 'a4',  name: 'HVAC Unit AHU-03',          location: 'Chicago Office',              meter: 'Flow Rate Monitor',          team: 'HVAC' },
  { id: 'a13', name: 'Chiller Unit CU-7',         location: 'Plant B – Boiler Room',      meter: 'Chiller Outlet Temp',        team: 'Maintenance' },
  { id: 'a14', name: 'UPS Battery Bank',          location: 'Server Room 4B',              meter: 'Battery Charge Level',       team: 'Electrical', assignee: 'Jamie Chen' },
  { id: 'a16', name: 'Roof Exhaust Fan REF-3',    location: 'Parking Structure – Level 2', meter: 'Fan RPM Monitor',            team: 'Facilities' },
  { id: 'a17', name: 'Conveyor Belt CB-02',       location: 'Warehouse Zone A',            meter: 'Belt Tension Sensor',        team: 'Operations' },
  { id: 'a20', name: 'Hydraulic Press HP-01',     location: 'Warehouse Zone B',            meter: 'Hydraulic Pressure Sensor',  team: 'Operations' },
  { id: 'a22', name: 'Clean Air Handler CAH-2',   location: 'Chicago Office',              meter: 'CO2 Level Sensor',           team: 'HVAC' },

  // Location + meter, no team/assignee
  { id: 'a5',  name: 'Forklift FL-204',           location: 'Warehouse Zone B',            meter: 'Vibration Sensor B' },
  { id: 'a6',  name: 'Generator Set GS-2',        location: 'Plant B – Boiler Room',      meter: 'Oil Pressure Gauge' },

  // Location + team/assignee, no meter
  { id: 'a7',  name: 'AHU Rooftop RT-1',         location: 'Chicago Office',              team: 'HVAC',        assignee: 'Casey Kim' },
  { id: 'a8',  name: 'Clean Room AHU',            location: 'R&D Lab',                     assignee: 'Taylor Brooks' },
  { id: 'a15', name: 'Fire Suppression System',   location: 'R&D Lab',                     team: 'Safety',      assignee: 'Taylor Brooks' },
  { id: 'a19', name: 'Emergency Generator EG-1',  location: 'Plant B – Boiler Room',      team: 'Electrical',  assignee: 'Sam Rivera' },
  { id: 'a23', name: 'Robotic Arm RA-3',          location: 'Manufacturing Floor A',       team: 'Operations',  assignee: 'Jordan Lee' },
  { id: 'a24', name: 'Cooling Tower CT-1',        location: 'Rooftop Plant',               team: 'HVAC',        assignee: 'Riley Patel' },

  // Meter only (no location)
  { id: 'a9',  name: 'Air Handler AH-12',         meter: 'Air Filter DP Sensor',           team: 'Facilities' },
  { id: 'a18', name: 'Air Compressor AC-5',       meter: 'Tank Pressure Gauge',            team: 'Maintenance' },

  // Location + assignee (no meter)
  { id: 'a10', name: 'Pallet Jack PJ-07',         location: 'Warehouse Zone A',            assignee: 'Jordan Lee' },

  // Team/assignee only
  { id: 'a11', name: 'Mobile Welder MW-3',        team: 'Maintenance',                     assignee: 'Alex Morgan' },
  { id: 'a12', name: 'Scissor Lift SL-9',         team: 'Operations' },
  { id: 'a21', name: 'Portable Pump PP-4',        team: 'Maintenance',                     assignee: 'Alex Morgan' },
]

// Derived flat lists for dropdowns
export const ASSET_NAMES = PM_ASSETS.map(a => a.name)
export const LOCATION_NAMES = PM_LOCATIONS.map(l => l.name)
export const METER_NAMES = PM_METERS.map(m => m.name)

// Lookup helpers
export function getAssetData(name: string): PMAsset | undefined {
  return PM_ASSETS.find(a => a.name === name)
}

export function getLocationData(name: string): PMLocation | undefined {
  return PM_LOCATIONS.find(l => l.name === name)
}

export function getMeterData(name: string): PMMeter | undefined {
  return PM_METERS.find(m => m.name === name)
}
