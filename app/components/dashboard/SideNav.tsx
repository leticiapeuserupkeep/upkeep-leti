'use client'

import { useState, type MouseEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import * as Avatar from '@radix-ui/react-avatar'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Separator from '@radix-ui/react-separator'
import { Tooltip, TooltipProvider } from '@/app/components/ui'
import { ProgressRing } from '@/app/components/ui/ProgressRing'
import { useSetupState, setupProgress } from '@/app/lib/onboarding/setup-store'
import { MobileAppModal } from '@/app/components/onboarding/nova/MobileAppCard'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  MessageCircle, Workflow, AppWindow,
  Clipboard, Warehouse, CalendarClock, Inbox,
  Box, MapPin, Users, ListChecks, Files, FileDown,
  BarChart3, Gauge,
  Car, ClipboardCheck, FileClock, AlertTriangle,
  Package, ScrollText, Building2,
  ChevronDown,
  Bell, Check, ChevronUp, Smartphone, LayoutGrid, CircleHelp, MessagesSquare, CreditCard, Settings, Sparkles,
} from 'lucide-react'
import { planById, type PlanId } from '@/app/lib/billing/plans'
import { openPlans } from '@/app/lib/billing/trial-usage'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
  dot?: boolean
  /** Paid feature, open during the trial — shown with a PRO badge. */
  plan?: PlanId
  onClick?: () => void
}

interface SideNavProps {
  collapsed: boolean
}

interface NavSection {
  title: string
  defaultClosed?: boolean
  /** Kept in the list but not rendered. */
  hidden?: boolean
  /** The whole section is part of a paid plan. */
  plan?: PlanId
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: 'NOVA',
    hidden: true, // hidden for now: remove to show it again
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
      { label: 'Preventive Maintenance', icon: Warehouse, href: '/predictive-maintenance', plan: 'premium' },
      { label: 'Scheduler', icon: CalendarClock, href: '/scheduler' },
      { label: 'Requests', icon: Inbox, plan: 'professional' },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      { label: 'Assets', icon: Box, href: '/assets' },
      { label: 'Locations', icon: MapPin, href: '/locations' },
      { label: 'People & Teams', icon: Users },
      { label: 'Checklists', icon: ListChecks, plan: 'premium' },
      { label: 'Files', icon: Files, href: '/exports' },
      { label: 'Import & Export', icon: FileDown },
    ],
  },
  {
    title: 'DATA & ANALYTICS',
    plan: 'premium',
    defaultClosed: true,
    items: [
      { label: 'Analytics', icon: BarChart3 },
      { label: 'Meters', icon: Gauge },
    ],
  },
  {
    title: 'FLEET MAINTENANCE',
    plan: 'professional',
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
    plan: 'premium',
    defaultClosed: true,
    items: [
      { label: 'Parts & Inventory', icon: Package, href: '/parts' },
      { label: 'Purchase Orders', icon: ScrollText },
      { label: 'Vendors & Customers', icon: Building2 },
    ],
  },
  {
    // Prototype entry to the first-run experience. Hidden for now: remove `hidden` to show it again.
    title: 'ONBOARDING',
    hidden: true,
    items: [
      { label: 'Onboarding', icon: Sparkles, href: '/onboarding-v2' },
    ],
  },
]

/** Ultranova entry: a small card (name + star) that expands to a short pitch and a "Start now!" CTA into the onboarding (static page in /public, so a plain anchor). */
const ULTRANOVA_HREF = '/ultranova/onboarding.html'

/** Ultranova's four-point star mark (same glyph as the onboarding). */
function UltranovaMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="2.5 2 27 27" aria-hidden="true" className="shrink-0">
      <path d="M16 2l3.2 9.6L29 14.8l-9.8 3.2L16 29l-3.2-11L3 14.8l9.8-3.2z" fill="#dd00ff" />
    </svg>
  )
}

/** Leaving the CMS: the screen softly dims to Ultranova's dark before the page changes, so the onboarding fades in instead of cutting. */
function enterUltranova(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  const href = e.currentTarget.href
  const veil = document.createElement('div')
  veil.setAttribute('aria-hidden', 'true')
  veil.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0a0214;opacity:0;pointer-events:all;transition:opacity 600ms cubic-bezier(0.22,1,0.36,1)'
  document.body.appendChild(veil)
  requestAnimationFrame(() => { veil.style.opacity = '1' })
  window.setTimeout(() => { window.location.href = href }, 620)
}

function UltranovaCard() {
  const [open, setOpen] = useState(false)
  return (
    <div data-open={open} className="ultranova-wrap relative w-full rounded-[var(--radius-lg)]">
    <div className="ultranova-card relative w-full rounded-[var(--radius-lg)] border-2 border-transparent text-white font-[family-name:var(--font-outfit)] font-normal">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="ultranova-card-body"
        className="group flex items-center justify-between w-full h-12 px-4 rounded-[var(--radius-lg)] cursor-pointer hover:bg-white/[0.08] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <span className="text-[length:16px] font-medium leading-4 text-white">Ultranova</span>
        {/* the star gives way to a down arrow on hover (and while open) */}
        <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
          <span className={`absolute transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'opacity-0 scale-50 rotate-90' : 'group-hover:opacity-0 group-hover:scale-50 group-hover:rotate-90'}`}>
            <UltranovaMark />
          </span>
          <ChevronDown
            size={18}
            className={`absolute transition-[opacity,transform] duration-500 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? 'opacity-100 rotate-180' : 'opacity-0 -translate-y-2 scale-75 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
            }`}
          />
        </span>
      </button>
      <div
        id="ultranova-card-body"
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-default)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="px-4 pb-4">
            <p className="text-[length:var(--font-size-base)] leading-5 text-white/80">
              Meet your AI assistant that keeps working while you’re away.
            </p>
            {/* purple gradient; on hover a brighter fuchsia→violet layer fades in over it (gradients can't be transitioned directly) */}
            <a
              href={ULTRANOVA_HREF}
              onClick={enterUltranova}
              className="group/cta relative isolate mt-3 flex items-center justify-center h-10 overflow-hidden rounded-full text-white text-[length:var(--font-size-base)] font-medium bg-[linear-gradient(135deg,#8b5cf6,#c026d3_120%)] shadow-[0_12px_32px_-12px_rgba(168,85,247,0.9)] hover:shadow-[0_14px_36px_-10px_rgba(217,70,239,0.9)] transition-[color,box-shadow] duration-500 ease-[var(--ease-default)]"
            >
              <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#e879f9,#8b5cf6)] opacity-0 transition-opacity duration-500 ease-[var(--ease-default)] group-hover/cta:opacity-100" />
              {/* shine on the border only: a soft glint glides around the edge (resets instantly when the mouse leaves) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full p-[1.5px] bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.7)_50%,transparent_75%)] bg-[length:300%_100%] bg-[position:88%_0] transition-[background-position] duration-0 group-hover/cta:bg-[position:12%_0] group-hover/cta:duration-[1300ms] ease-in-out [-webkit-mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [-webkit-mask-clip:content-box,border-box] [-webkit-mask-composite:xor] [mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [mask-clip:content-box,border-box] [mask-composite:exclude]"
              />
              Start now!
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/** The floating "Get the UpKeep App" banner is hidden for now; flip to bring it back. */
const SHOW_MOBILE_APP_PROMO = false

const footerIcons: NavItem[] = [
  { label: 'Help Center', icon: CircleHelp },
  { label: 'Contact', icon: MessagesSquare },
  { label: 'Billing', icon: CreditCard, onClick: openPlans },
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

/** Marks paid features that are open during the trial; the tooltip says which
 * plan keeps them. */
function ProBadge({ plan }: { plan: PlanId }) {
  return (
    <span title={`Free during your trial — included in ${planById(plan).name}`} className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-[var(--color-purple-light)] px-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--color-purple)]">
      Pro
    </span>
  )
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
      {item.plan && <ProBadge plan={item.plan} />}
      {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-9)] shrink-0" />}
    </>
  )
  return item.href
    ? <Link href={item.href} className={classes}>{inner}</Link>
    : <button type="button" className={classes}>{inner}</button>
}

export function SideNav({ collapsed }: SideNavProps) {
  const pathname = usePathname()
  const setup = useSetupState()
  const setupPercent = setupProgress(setup)
  /** Blue while the setup screen is open; light gray anywhere else. */
  const setupPath = setup.welcomeHref.split('?')[0]
  const setupActive = pathname === setupPath || pathname.startsWith(setupPath + '/')
  const [appOpen, setAppOpen] = useState(false)

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
              href={setup.welcomeHref}
              aria-label={`Setup your account, ${setupPercent}% done`}
              className={`flex items-center rounded-[var(--radius-lg)] transition-colors duration-[var(--duration-fast)] ${
                setupActive
                  ? 'bg-[var(--color-accent-9)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-10)]'
                  : 'border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--color-neutral-12)] hover:bg-[var(--color-neutral-2)]'
              } ${collapsed ? 'h-9 w-9 justify-center' : 'h-11 justify-between px-3'}`}
            >
              {!collapsed && <span className="text-[length:var(--font-size-base)] font-medium">Setup your account</span>}
              <ProgressRing value={setupPercent} size={collapsed ? 22 : 24} strokeWidth={3} trackColor={setupActive ? 'rgba(255,255,255,0.3)' : 'var(--color-neutral-6)'} fillColor={setupActive ? 'white' : 'var(--color-accent-9)'} showLabel={false} />
            </Link>
          ) : (
            <Link
              href={setup.welcomeHref}
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
            <nav className={`flex flex-col gap-3 pt-2 ${collapsed ? 'pb-4' : 'pb-4'} ${collapsed ? 'items-center' : 'items-stretch'}`}>
              {sections.filter((section) => !section.hidden).map((section, i) =>
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
                      <span className="flex flex-1 items-center gap-1.5 text-left text-[length:var(--font-size-sm)] font-medium uppercase tracking-[0.02em] text-[var(--color-neutral-8)]">
                        {section.title}
                      </span>
                      {/* Right-aligned, next to the chevron — same column as item badges. */}
                      {section.plan && <ProBadge plan={section.plan} />}
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

        {/* Nova on the phone, always there: floating over the bottom of the
            nav, just above the footer. */}
        {SHOW_MOBILE_APP_PROMO && (
        <div className="relative h-0">
          <div className={`absolute bottom-full z-10 mb-[var(--space-sm)] ${collapsed ? 'left-1/2 -translate-x-1/2' : 'inset-x-[var(--space-sm)]'}`}>
            <button
              type="button"
              onClick={() => setAppOpen(true)}
              aria-label="Get the UpKeep App"
              className={`flex items-center gap-3 rounded-[var(--radius-xl)] bg-[var(--color-accent-12)] text-left text-white shadow-[var(--shadow-lg)] transition-[filter] duration-[var(--duration-fast)] hover:brightness-110 cursor-pointer nova-panel-up ${
                collapsed ? 'h-9 w-9 justify-center' : 'w-full px-3 py-2.5'
              }`}
            >
              <Smartphone size={18} className="shrink-0 text-white/80" />
              {!collapsed && (
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[length:var(--font-size-base)] font-semibold">Get the UpKeep App</span>
                  <span className="text-[length:var(--font-size-sm)] leading-4 text-white/70">Your maintenance assistant, on the go.</span>
                </span>
              )}
            </button>
          </div>
        </div>
        )}
        <MobileAppModal open={appOpen} onOpenChange={setAppOpen} />

        {/* Ultranova: fixed at the bottom of the sidebar, above the footer, so it never scrolls away with the menu */}
        <div className={`shrink-0 pb-[var(--space-xs)] ${collapsed ? 'flex justify-center' : 'px-[var(--space-xs)]'}`}>
          {collapsed ? (
            <Tooltip content="Ultranova" side="right" sideOffset={8}>
              <a
                href={ULTRANOVA_HREF}
                aria-label="Ultranova"
                className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-lg)] bg-[linear-gradient(135deg,#570a9e,#000)]"
              >
                <UltranovaMark size={18} />
              </a>
            </Tooltip>
          ) : (
            <UltranovaCard />
          )}
        </div>

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
              {footerIcons.map(({ icon: Icon, label, href, onClick }) => {
                const cls = 'flex h-8 w-8 items-center justify-center rounded-[var(--radius-lg)] text-[var(--color-neutral-8)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-neutral-11)] cursor-pointer'
                return (
                  <Tooltip key={label} content={label} side="top" sideOffset={6}>
                    {href
                      ? <Link href={href} aria-label={label} className={cls}><Icon size={16} /></Link>
                      : <button type="button" aria-label={label} onClick={onClick} className={cls}><Icon size={16} /></button>}
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
