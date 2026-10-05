'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import * as Avatar from '@radix-ui/react-avatar'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Separator from '@radix-ui/react-separator'
import { Tooltip, TooltipProvider } from '@/app/components/ui'
import { ProgressRing } from '@/app/components/ui/ProgressRing'
import { useSetupState, setupProgress } from '@/app/lib/onboarding/setup-store'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  MessageCircle, Workflow, AppWindow,
  Clipboard, Warehouse, CalendarClock, Inbox,
  Box, MapPin, Users, ListChecks, Files, FileDown,
  BarChart3, Gauge,
  Car, ClipboardCheck, FileClock, AlertTriangle,
  Package, ScrollText, Building2,
  Bell, Check, ChevronUp, LayoutGrid, CircleHelp, MessagesSquare, CreditCard, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
  dot?: boolean
}

interface SideNavProps {
  collapsed: boolean
}

interface NavSection {
  title: string
  defaultClosed?: boolean
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: 'NOVA',
    items: [
      { label: 'Chat', icon: MessageCircle, href: '/agents' },
      { label: 'Scheduled Tasks', icon: Workflow, href: '/workflows' },
      { label: 'Custom Apps', icon: AppWindow, href: '/studio/browse' },
    ],
  },
  {
    title: 'CORE',
    items: [
      { label: 'Work Orders', icon: Clipboard, href: '/work-orders' },
      { label: 'Preventive Maintenance', icon: Warehouse, href: '/predictive-maintenance' },
      { label: 'Scheduler', icon: CalendarClock, href: '/scheduler' },
      { label: 'Requests', icon: Inbox },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      { label: 'Assets', icon: Box, href: '/assets' },
      { label: 'Locations', icon: MapPin, href: '/locations' },
      { label: 'People & Teams', icon: Users },
      { label: 'Checklists', icon: ListChecks },
      { label: 'Files', icon: Files, href: '/exports' },
      { label: 'Import & Export', icon: FileDown },
    ],
  },
  {
    title: 'DATA & ANALYTICS',
    defaultClosed: true,
    items: [
      { label: 'Analytics', icon: BarChart3 },
      { label: 'Meters', icon: Gauge },
    ],
  },
  {
    title: 'FLEET MAINTENANCE',
    defaultClosed: true,
    items: [
      { label: 'Vehicles', icon: Car, href: '/fleet/vehicles' },
      { label: 'Inspections', icon: ClipboardCheck },
      { label: 'Inspection History', icon: FileClock },
      { label: 'Recalls', icon: AlertTriangle },
    ],
  },
  {
    title: 'PROCUREMENT',
    defaultClosed: true,
    items: [
      { label: 'Parts & Inventory', icon: Package, href: '/parts' },
      { label: 'Purchase Orders', icon: ScrollText },
      { label: 'Vendors & Customers', icon: Building2 },
    ],
  },
]

const footerIcons: NavItem[] = [
  { label: 'Help Center', icon: CircleHelp },
  { label: 'Contact', icon: MessagesSquare },
  { label: 'Billing', icon: CreditCard, href: '/billing' },
  { label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href?: string, label?: string): boolean {
  if (!href) return false
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
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

function NavRow({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  if (collapsed) return <CollapsedIcon item={item} active={active} label={item.label} />
  const classes = `flex items-center gap-2 w-full px-2 h-8 rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] cursor-pointer ${
    active
      ? 'bg-[var(--color-neutral-5)] font-semibold text-[var(--color-neutral-12)]'
      : 'font-medium text-[var(--color-neutral-12)] hover:bg-[var(--color-neutral-4)]'
  }`
  const inner = (
    <>
      <item.icon size={16} className="shrink-0" />
      <span className="flex-1 text-left text-[length:var(--font-size-base)] leading-5 truncate">{item.label}</span>
      {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-9)] shrink-0" />}
    </>
  )
  return item.href
    ? <Link href={item.href} className={classes}>{inner}</Link>
    : <button type="button" className={classes}>{inner}</button>
}

export function SideNav({ collapsed }: SideNavProps) {
  const pathname = usePathname()
  const setupPercent = setupProgress(useSetupState())

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
            <Link href="/dashboard" data-stagger style={{ '--i': 0 } as React.CSSProperties}>
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
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent-9)]" />
              </button>
              <Avatar.Root className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <Avatar.Fallback className="flex items-center justify-center w-full h-full bg-[var(--color-purple-light)] text-[var(--color-purple)] text-[length:var(--font-size-xs)] font-semibold">
                  AM
                </Avatar.Fallback>
              </Avatar.Root>
            </div>
          )}
        </div>

        {/* Always here: in progress it leads back into Nova's welcome; once
            complete it stays as the place to review what was set up. */}
        <div data-stagger style={{ '--i': 1 } as React.CSSProperties} className={`shrink-0 pt-[var(--space-sm)] ${collapsed ? 'flex justify-center' : 'px-[var(--space-xs)]'}`}>
          {setupPercent < 100 ? (
            <Link
              href="/onboarding"
              aria-label={`Setup your account, ${setupPercent}% done`}
              className={`flex items-center rounded-[var(--radius-lg)] bg-[var(--color-accent-9)] text-white shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-10)] ${
                collapsed ? 'h-9 w-9 justify-center' : 'h-11 justify-between px-3'
              }`}
            >
              {!collapsed && <span className="text-[length:var(--font-size-base)] font-medium">Setup your account</span>}
              <ProgressRing value={setupPercent} size={collapsed ? 22 : 24} strokeWidth={3} trackColor="rgba(255,255,255,0.3)" fillColor="white" showLabel={false} />
            </Link>
          ) : (
            <Link
              href="/onboarding"
              aria-label="Setup complete"
              className={`flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-12)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-2)] nova-enter ${
                collapsed ? 'h-9 w-9 justify-center' : 'h-11 px-3'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)] text-white"><Check size={12} strokeWidth={3} /></span>
              {!collapsed && <span className="text-[length:var(--font-size-base)] font-medium">Setup complete</span>}
            </Link>
          )}
        </div>

        {/* Scrollable nav */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className="h-full w-full px-[var(--space-xs)]">
            <nav className={`flex flex-col gap-3 py-[var(--space-sm)] ${collapsed ? 'items-center' : 'items-stretch'}`}>
              {sections.map((section, i) =>
                collapsed ? (
                  <div key={section.title} className="flex flex-col items-center gap-1">
                    {section.items.slice(0, 1).map(item => (
                      <NavRow key={item.label} item={item} active={isActive(pathname, item.href, item.label)} collapsed />
                    ))}
                  </div>
                ) : (
                  <Collapsible.Root
                    key={section.title}
                    defaultOpen={!section.defaultClosed}
                    className="w-full"
                    data-stagger
                    style={{ '--i': 2 + i } as React.CSSProperties}
                  >
                    <Collapsible.Trigger suppressHydrationWarning className="group flex h-7 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 pb-1 pt-2">
                      <span className="flex-1 text-left text-[length:var(--font-size-sm)] font-medium uppercase tracking-[0.02em] text-[var(--color-neutral-8)]">
                        {section.title}
                      </span>
                      <ChevronUp
                        size={14}
                        className="text-[var(--color-neutral-8)] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-default)] group-data-[state=closed]:rotate-180"
                      />
                    </Collapsible.Trigger>
                    <Collapsible.Content suppressHydrationWarning className="nav-collapsible-content overflow-hidden">
                      {section.items.map(item => (
                        <NavRow key={item.label} item={item} active={isActive(pathname, item.href, item.label)} collapsed={false} />
                      ))}
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
        <div className={`flex h-14 shrink-0 items-center ${collapsed ? 'justify-center p-3' : 'justify-between px-3 py-3'}`}>
          <Tooltip content="Apps" side="top" sideOffset={6}>
            <button
              type="button"
              aria-label="Apps"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-primary)] text-[var(--color-neutral-10)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-neutral-12)] cursor-pointer"
            >
              <LayoutGrid size={16} />
            </button>
          </Tooltip>
          {!collapsed && (
            <div className="flex items-center gap-1">
              {footerIcons.map(({ icon: Icon, label, href }) => {
                const cls = 'flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] text-[var(--color-neutral-8)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-neutral-11)] cursor-pointer'
                return (
                  <Tooltip key={label} content={label} side="top" sideOffset={6}>
                    {href
                      ? <Link href={href} aria-label={label} className={cls}><Icon size={16} /></Link>
                      : <button type="button" aria-label={label} className={cls}><Icon size={16} /></button>}
                  </Tooltip>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
