'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import * as Avatar from '@radix-ui/react-avatar'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Separator from '@radix-ui/react-separator'
import { Tooltip, TooltipProvider } from '@/app/components/ui'
import {
  ClipboardList, Wrench, CalendarClock, Inbox,
  Sparkles, BarChart3, Gauge, Wifi,
  Box, MapPin, Users, ListChecks, FileText, FileDown, Files,
  Car, Map, FileSearch, Ticket, AlertTriangle, Plug,
  Rocket, Receipt, Building2,
  Gem, Download, Command, Wand2, Wallet, Bot,
  Bell, ChevronUp,
  LayoutGrid, CircleHelp, MessageCircle, Settings,
  Signal, Radar, Radio, Siren, Timer, Settings2, Warehouse, ScrollText,
  ClipboardCheck, FileClock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
  dot?: boolean
}

interface NavSection {
  title: string
  badge?: string
  defaultClosed?: boolean
  items: NavItem[]
}

interface SideNavProps {
  collapsed: boolean
}

const sections: NavSection[] = [
  {
    title: 'CORE',
    items: [
      { label: 'Work Orders', icon: ClipboardList, href: '/work-orders' },
      { label: 'Preventive Maintenance', icon: CalendarClock, href: '/predictive-maintenance' },
      { label: 'Intelligence', icon: Sparkles },
      { label: 'Scheduler', icon: CalendarClock, href: '/scheduler' },
      { label: 'Requests', icon: Inbox },
    ],
  },
  {
    title: 'SUPERNOVA',
    items: [
      { label: 'Command Center', icon: Radar, href: '/command-center' },
      { label: 'Chat', icon: MessageCircle, href: '/agents' },
      { label: 'Agents', icon: Users, href: '/aimates' },
      { label: 'Integrations', icon: Sparkles },
      { label: 'Workflows', icon: Bot, href: '/workflows' },
      { label: 'SuperNova Staging', icon: Rocket, href: '/supernova/staging' },
      { label: 'Settings', icon: Settings },
    ],
  },
  {
    title: 'STUDIO',
    items: [
      { label: 'Create New App', icon: Wand2, href: '/studio/create', dot: true },
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
      { label: 'File Management', icon: Files, href: '/exports' },
      { label: 'Import & Export', icon: FileDown, href: '/exports' },
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

const footerIcons = [
  { icon: LayoutGrid, label: 'Apps' },
  { icon: CircleHelp, label: 'Help' },
  { icon: MessageCircle, label: 'Feedback' },
  { icon: Settings, label: 'Settings' },
]

function isActive(pathname: string, href?: string, label?: string): boolean {
  if (!href) return false
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  if (href === '/studio/browse') return pathname === '/studio' || pathname.startsWith('/studio/browse')
  if (label === 'File Management') return pathname.startsWith('/exports') || pathname.startsWith('/files')
  if (label === 'Import & Export') return false
  if (href === '/supernova/staging') return pathname === '/supernova/staging' || pathname.startsWith('/supernova/staging/')
  return pathname === href || pathname.startsWith(href + '/')
}

function CollapsedIcon({ item, active, label }: { item: NavItem; active: boolean; label: string }) {
  const Icon = item.icon
  const inner = (
    <Tooltip content={label} side="right" sideOffset={8}>
      <span
        className={`relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-lg)] cursor-pointer transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)] ${
          active
            ? 'bg-[var(--color-neutral-5)] text-[var(--color-neutral-12)]'
            : 'text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-neutral-12)]'
        }`}
        aria-label={label}
      >
        <Icon size={18} />
      </span>
    </Tooltip>
  )

  if (item.href) {
    return <Link href={item.href}>{inner}</Link>
  }
  return inner
}

const ONBOARDING_KEY = 'supernova_onboarded'

export function SideNav({ collapsed }: SideNavProps) {
  const pathname = usePathname()
  const [supernovaUnlocked, setSupernovaUnlocked] = useState(false)

  useEffect(() => {
    const check = () => setSupernovaUnlocked(localStorage.getItem(ONBOARDING_KEY) === 'true')
    check()
    window.addEventListener('supernova-onboarding-complete', check)
    window.addEventListener('storage', check)
    return () => {
      window.removeEventListener('supernova-onboarding-complete', check)
      window.removeEventListener('storage', check)
    }
  }, [])

  const handleReplaySetup = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    localStorage.removeItem('upkeep-supernova-onboarding')
    setSupernovaUnlocked(false)
    window.location.href = '/command-center'
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={`flex flex-col min-h-screen h-screen sticky top-0 border-r border-[var(--border-default)] bg-[var(--surface-sidebar)] transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-default)] shrink-0 ${
          collapsed ? 'w-16' : 'w-[280px]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center h-[60px] shrink-0 border-b border-[var(--border-default)] ${
            collapsed ? 'justify-center px-0' : 'justify-between px-[var(--space-md)]'
          }`}
        >
          {!collapsed && (
            <Link href="/dashboard">
              <Image src="/images/logo-upkeep.svg" alt="UpKeep" width={96} height={24} priority />
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] bg-[var(--color-accent-9)]">
              <span className="text-white text-[length:var(--font-size-sm)] font-bold">U</span>
            </Link>
          )}
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <button
                className="relative flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-4)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
                aria-label="Notifications"
              >
                <Bell size={16} className="text-[var(--color-neutral-9)]" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
              </button>
              <Avatar.Root className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <Avatar.Fallback className="flex items-center justify-center w-full h-full bg-[var(--color-purple-light)] text-[var(--color-purple)] text-[length:var(--font-size-xs)] font-semibold">
                  AM
                </Avatar.Fallback>
              </Avatar.Root>
            </div>
          )}
        </div>

        {/* Scrollable nav */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className="h-full w-full px-[var(--space-xs)]">
            <nav
              className={`flex flex-col gap-3 py-[var(--space-xs)] ${
                collapsed ? 'items-center' : 'items-start'
              }`}
            >
              {sections.map((section) =>
                collapsed ? (
                  <div key={section.title} className="flex flex-col items-center gap-1">
                    {section.items.slice(0, 1).map((item) => (
                      <CollapsedIcon
                        key={item.label}
                        item={item}
                        active={isActive(pathname, item.href, item.label)}
                        label={item.label}
                      />
                    ))}
                  </div>
                ) : (
                  <Collapsible.Root key={section.title} defaultOpen={!section.defaultClosed} className="w-full">
                    <Collapsible.Trigger className="flex items-center gap-2 w-full px-2 pt-2 pb-1 h-7 rounded-[var(--radius-sm)] cursor-pointer group">
                      <span className="flex-1 text-left text-[length:var(--font-size-sm)] font-medium uppercase tracking-[0.02em] text-[var(--color-neutral-8)]">
                        {section.title}
                      </span>
                      {section.badge && (
                        <span className="flex items-center justify-center px-2 h-5 rounded-lg bg-[var(--color-accent-1)] border border-[var(--color-accent-4)] text-[length:10px] font-medium text-[var(--color-accent-9)]">
                          {section.badge}
                        </span>
                      )}
                      <ChevronUp
                        size={14}
                        className="text-[var(--color-neutral-8)] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-default)] group-data-[state=closed]:rotate-180"
                      />
                    </Collapsible.Trigger>
                    <Collapsible.Content className="nav-collapsible-content overflow-hidden">
                      {section.items.map((item) => {
                        const active = isActive(pathname, item.href, item.label)
                        const classes = `flex items-center gap-2 w-full px-2 h-8 rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] ${
                          active
                            ? 'bg-[var(--color-neutral-5)] font-semibold text-[var(--color-neutral-12)] cursor-pointer'
                            : 'font-medium text-[var(--color-neutral-12)] hover:bg-[var(--color-neutral-4)] cursor-pointer'
                        }`

                        const inner = (
                          <>
                            <item.icon size={16} className="shrink-0" />
                            <span className="flex-1 text-left text-[length:var(--font-size-base)] leading-5 truncate">
                              {item.label}
                            </span>
                            {item.dot && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-9)] shrink-0" />
                            )}
                          </>
                        )

                        if (item.href) {
                          return (
                            <Link key={item.label} href={item.href} className={classes}>
                              {inner}
                            </Link>
                          )
                        }

                        return (
                          <button key={item.label} className={classes}>
                            {inner}
                          </button>
                        )
                      })}
                      {section.title === 'SUPERNOVA' && supernovaUnlocked && (
                        <button
                          onClick={handleReplaySetup}
                          className="flex items-center gap-2 w-full px-2 h-7 mt-1 text-[11px] font-medium text-[var(--color-neutral-7)] hover:text-[var(--color-neutral-9)] cursor-pointer transition-colors"
                        >
                          Replay setup
                        </button>
                      )}
                    </Collapsible.Content>
                  </Collapsible.Root>
                )
              )}
            </nav>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            className="flex w-1 touch-none select-none p-0.5"
          >
            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[var(--color-neutral-5)]" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        <Separator.Root className="h-px bg-[var(--border-default)]" />

        {/* Footer */}
        <div
          className={`flex items-center h-14 shrink-0 ${
            collapsed ? 'justify-center p-3' : 'justify-between px-3 py-3'
          }`}
        >
          {collapsed ? (
            <Tooltip content="Settings" side="right" sideOffset={8}>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-lg)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-4)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-1">
              {footerIcons.map(({ icon: Icon, label }) => (
                <Tooltip key={label} content={label} side="top" sideOffset={6}>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] text-[var(--color-neutral-8)] hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-neutral-11)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
                    aria-label={label}
                  >
                    <Icon size={16} />
                  </button>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
