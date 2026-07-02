'use client'

import React, { useState, useEffect } from 'react'
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
  ClipboardCheck, FileClock, Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function CustomAppsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <mask id="custom-apps-mask" fill="white">
        <path fillRule="evenodd" clipRule="evenodd" d="M1.33325 3.83317C1.33325 3.18884 1.85559 2.6665 2.49992 2.6665H13.4999C14.1443 2.6665 14.6666 3.18884 14.6666 3.83317V5.49984C14.6666 5.77598 14.4427 5.99984 14.1666 5.99984C13.8904 5.99984 13.6666 5.77598 13.6666 5.49984V3.83317C13.6666 3.74112 13.592 3.6665 13.4999 3.6665H2.49992C2.40787 3.6665 2.33325 3.74112 2.33325 3.83317V12.1665C2.33325 12.2586 2.40787 12.3332 2.49992 12.3332H6.83325C7.10939 12.3332 7.33325 12.557 7.33325 12.8332C7.33325 13.1093 7.10939 13.3332 6.83325 13.3332H2.49992C1.85559 13.3332 1.33325 12.8108 1.33325 12.1665V3.83317ZM11.9999 7.33317C12.2761 7.33317 12.4999 7.55703 12.4999 7.83317C12.4999 8.75593 12.7044 9.30624 13.0323 9.63413C13.3602 9.96202 13.9105 10.1665 14.8333 10.1665C15.1094 10.1665 15.3333 10.3904 15.3333 10.6665C15.3333 10.9426 15.1094 11.1665 14.8333 11.1665C13.9105 11.1665 13.3602 11.371 13.0323 11.6989C12.7044 12.0268 12.4999 12.5771 12.4999 13.4998C12.4999 13.776 12.2761 13.9998 11.9999 13.9998C11.7238 13.9998 11.4999 13.776 11.4999 13.4998C11.4999 12.5771 11.2954 12.0268 10.9675 11.6989C10.6397 11.371 10.0893 11.1665 9.16659 11.1665C8.89044 11.1665 8.66659 10.9426 8.66659 10.6665C8.66659 10.3904 8.89044 10.1665 9.16659 10.1665C10.0893 10.1665 10.6397 9.96202 10.9675 9.63413C11.2954 9.30624 11.4999 8.75593 11.4999 7.83317C11.4999 7.55703 11.7238 7.33317 11.9999 7.33317ZM11.9999 9.9356C11.9065 10.0819 11.7985 10.2174 11.6747 10.3412C11.5508 10.4651 11.4153 10.5731 11.269 10.6665C11.4153 10.7599 11.5508 10.8679 11.6747 10.9918C11.7985 11.1156 11.9065 11.2511 11.9999 11.3974C12.0933 11.2511 12.2013 11.1156 12.3252 10.9918C12.4491 10.8679 12.5845 10.7599 12.7308 10.6665C12.5845 10.5731 12.4491 10.4651 12.3252 10.3412C12.2013 10.2174 12.0933 10.0819 11.9999 9.9356Z"/>
        <path d="M4.66659 5.33317C4.66659 5.70136 4.36811 5.99984 3.99992 5.99984C3.63173 5.99984 3.33325 5.70136 3.33325 5.33317C3.33325 4.96498 3.63173 4.6665 3.99992 4.6665C4.36811 4.6665 4.66659 4.96498 4.66659 5.33317Z"/>
        <path d="M6.66659 5.33317C6.66659 5.70136 6.36811 5.99984 5.99992 5.99984C5.63173 5.99984 5.33325 5.70136 5.33325 5.33317C5.33325 4.96498 5.63173 4.6665 5.99992 4.6665C6.36811 4.6665 6.66659 4.96498 6.66659 5.33317Z"/>
        <path d="M7.99992 5.99984C8.36811 5.99984 8.66659 5.70136 8.66659 5.33317C8.66659 4.96498 8.36811 4.6665 7.99992 4.6665C7.63173 4.6665 7.33325 4.96498 7.33325 5.33317C7.33325 5.70136 7.63173 5.99984 7.99992 5.99984Z"/>
      </mask>
      <path fillRule="evenodd" clipRule="evenodd" d="M1.33325 3.83317C1.33325 3.18884 1.85559 2.6665 2.49992 2.6665H13.4999C14.1443 2.6665 14.6666 3.18884 14.6666 3.83317V5.49984C14.6666 5.77598 14.4427 5.99984 14.1666 5.99984C13.8904 5.99984 13.6666 5.77598 13.6666 5.49984V3.83317C13.6666 3.74112 13.592 3.6665 13.4999 3.6665H2.49992C2.40787 3.6665 2.33325 3.74112 2.33325 3.83317V12.1665C2.33325 12.2586 2.40787 12.3332 2.49992 12.3332H6.83325C7.10939 12.3332 7.33325 12.557 7.33325 12.8332C7.33325 13.1093 7.10939 13.3332 6.83325 13.3332H2.49992C1.85559 13.3332 1.33325 12.8108 1.33325 12.1665V3.83317ZM11.9999 7.33317C12.2761 7.33317 12.4999 7.55703 12.4999 7.83317C12.4999 8.75593 12.7044 9.30624 13.0323 9.63413C13.3602 9.96202 13.9105 10.1665 14.8333 10.1665C15.1094 10.1665 15.3333 10.3904 15.3333 10.6665C15.3333 10.9426 15.1094 11.1665 14.8333 11.1665C13.9105 11.1665 13.3602 11.371 13.0323 11.6989C12.7044 12.0268 12.4999 12.5771 12.4999 13.4998C12.4999 13.776 12.2761 13.9998 11.9999 13.9998C11.7238 13.9998 11.4999 13.776 11.4999 13.4998C11.4999 12.5771 11.2954 12.0268 10.9675 11.6989C10.6397 11.371 10.0893 11.1665 9.16659 11.1665C8.89044 11.1665 8.66659 10.9426 8.66659 10.6665C8.66659 10.3904 8.89044 10.1665 9.16659 10.1665C10.0893 10.1665 10.6397 9.96202 10.9675 9.63413C11.2954 9.30624 11.4999 8.75593 11.4999 7.83317C11.4999 7.55703 11.7238 7.33317 11.9999 7.33317ZM11.9999 9.9356C11.9065 10.0819 11.7985 10.2174 11.6747 10.3412C11.5508 10.4651 11.4153 10.5731 11.269 10.6665C11.4153 10.7599 11.5508 10.8679 11.6747 10.9918C11.7985 11.1156 11.9065 11.2511 11.9999 11.3974C12.0933 11.2511 12.2013 11.1156 12.3252 10.9918C12.4491 10.8679 12.5845 10.7599 12.7308 10.6665C12.5845 10.5731 12.4491 10.4651 12.3252 10.3412C12.2013 10.2174 12.0933 10.0819 11.9999 9.9356Z" fill="currentColor"/>
      <path d="M4.66659 5.33317C4.66659 5.70136 4.36811 5.99984 3.99992 5.99984C3.63173 5.99984 3.33325 5.70136 3.33325 5.33317C3.33325 4.96498 3.63173 4.6665 3.99992 4.6665C4.36811 4.6665 4.66659 4.96498 4.66659 5.33317Z" fill="currentColor"/>
      <path d="M6.66659 5.33317C6.66659 5.70136 6.36811 5.99984 5.99992 5.99984C5.63173 5.99984 5.33325 5.70136 5.33325 5.33317C5.33325 4.96498 5.63173 4.6665 5.99992 4.6665C6.36811 4.6665 6.66659 4.96498 6.66659 5.33317Z" fill="currentColor"/>
      <path d="M7.99992 5.99984C8.36811 5.99984 8.66659 5.70136 8.66659 5.33317C8.66659 4.96498 8.36811 4.6665 7.99992 4.6665C7.63173 4.6665 7.33325 4.96498 7.33325 5.33317C7.33325 5.70136 7.63173 5.99984 7.99992 5.99984Z" fill="currentColor"/>
    </svg>
  )
}

function AutomationsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 8.66683V10.6668M8 8.66683C8 8.29864 7.70152 8.00016 7.33333 8.00016H5C4.63181 8.00016 4.33333 7.70169 4.33333 7.3335V5.3335M8 8.66683C8 8.29864 8.29848 8.00016 8.66667 8.00016H11C11.3682 8.00016 11.6667 7.70169 11.6667 7.3335V5.3335M6.16667 3.66683C6.16667 4.67935 5.34586 5.50016 4.33333 5.50016C3.32081 5.50016 2.5 4.67935 2.5 3.66683C2.5 2.65431 3.32081 1.8335 4.33333 1.8335C5.34586 1.8335 6.16667 2.65431 6.16667 3.66683ZM13.5 3.66683C13.5 4.67935 12.6792 5.50016 11.6667 5.50016C10.6541 5.50016 9.83333 4.67935 9.83333 3.66683C9.83333 2.65431 10.6541 1.8335 11.6667 1.8335C12.6792 1.8335 13.5 2.65431 13.5 3.66683ZM9.83333 12.3335C9.83333 13.346 9.01252 14.1668 8 14.1668C6.98748 14.1668 6.16667 13.346 6.16667 12.3335C6.16667 11.321 6.98748 10.5002 8 10.5002C9.01252 10.5002 9.83333 11.321 9.83333 12.3335Z" stroke="currentColor" strokeWidth="0.96" strokeLinejoin="round"/>
    </svg>
  )
}

interface NavItem {
  label: string
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>
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
      { label: 'Preventive Maintenance', icon: CalendarClock },
      { label: 'Scheduler', icon: CalendarClock, href: '/scheduler' },
      { label: 'Requests', icon: Inbox },
    ],
  },
  {
    title: 'Intelligence',
    badge: 'NEW',
    items: [
      { label: 'Nova', icon: MessageCircle, href: '/agents' },
      { label: 'Scheduled Tasks', icon: AutomationsIcon, href: '/workflows' },
      { label: 'Apps', icon: CustomAppsIcon, href: '/studio', dot: true },
      { label: 'Create New App', icon: Wand2, href: '/studio/create' },
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
  if (href === '/intelligence') return pathname === '/intelligence' || pathname.startsWith('/intelligence/')
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
