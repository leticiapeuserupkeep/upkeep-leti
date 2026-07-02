import {
  ClipboardList, CalendarClock, Inbox,
  Sparkles, BarChart3, Gauge,
  Box, MapPin, Users, ListChecks, FileText, FileDown,
  Car, AlertTriangle, Plug,
  Receipt, Building2,
  Gem, Download, Command, Wand2, Bot,
  LayoutGrid, CircleHelp, MessageCircle, Settings,
  Signal, Radio, Siren, Timer, Settings2, Warehouse, ScrollText,
  ClipboardCheck, FileClock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
  dot?: boolean
}

export interface NavSection {
  title: string
  badge?: string
  defaultClosed?: boolean
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: 'CORE',
    badge: 'NEW',
    items: [
      { label: 'Work Orders', icon: ClipboardList, href: '/work-orders' },
      { label: 'Preventive Maintenance', icon: CalendarClock },
      { label: 'Intelligence', icon: Sparkles, href: '/intelligence', dot: true },
      { label: 'Scheduler', icon: CalendarClock },
      { label: 'Requests', icon: Inbox },
    ],
  },
  {
    title: 'STUDIO',
    badge: 'NEW',
    items: [
      { label: 'New App', icon: Wand2, href: '/studio/create', dot: true },
      { label: 'Browse Apps', icon: Gem, href: '/studio/browse' },
      { label: 'Installed Apps', icon: Download, href: '/studio/installed' },
      { label: 'Apps I Built', icon: Command, href: '/studio/built' },
      { label: 'Billing & Usage', icon: Receipt, href: '/billing' },
    ],
  },
  {
    title: 'DATA & ANALYTICS',
    items: [
      { label: 'Analytics', icon: BarChart3 },
      { label: 'Meters', icon: Gauge },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      { label: 'Assets', icon: Box },
      { label: 'Locations', icon: MapPin },
      { label: 'People & Teams', icon: Users },
      { label: 'Checklists', icon: ListChecks },
      { label: 'Files', icon: FileText },
      { label: 'Import & Export', icon: FileDown },
      { label: 'Exports', icon: FileDown, href: '/exports' },
    ],
  },
  {
    title: 'FLEET',
    items: [
      { label: 'Vehicles', icon: Car, href: '/fleet/vehicles' },
      { label: 'Inspections', icon: ClipboardCheck },
      { label: 'Inspection History', icon: FileClock },
      { label: 'Recalls', icon: AlertTriangle },
      { label: 'Alerts', icon: AlertTriangle },
      { label: 'Integrations', icon: Plug },
    ],
  },
  {
    title: 'EDGE',
    items: [
      { label: 'Sensors', icon: Radio, href: '/edge/sensors' },
      { label: 'Gateways', icon: Timer },
      { label: 'Alerts', icon: Siren },
      { label: 'Runtime', icon: Signal, href: '/edge/runtime' },
      { label: 'Settings', icon: Settings2 },
    ],
  },
  {
    title: 'PROCUREMENT',
    items: [
      { label: 'Parts & Inventory', icon: Warehouse },
      { label: 'Purchase Orders', icon: ScrollText },
      { label: 'Vendors & Customers', icon: Building2 },
    ],
  },
]

export interface FooterIcon {
  icon: LucideIcon
  label: string
}

export const footerIcons: FooterIcon[] = [
  { icon: LayoutGrid, label: 'Apps' },
  { icon: CircleHelp, label: 'Help' },
  { icon: MessageCircle, label: 'Feedback' },
  { icon: Settings, label: 'Settings' },
]
