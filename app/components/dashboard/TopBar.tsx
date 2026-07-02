'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, PanelLeft, ChevronLeft } from 'lucide-react'
import type { Role } from '@/app/lib/models'

interface TopBarProps {
  title: string
  role: Role
  site: string
  timeRange: string
  onRoleChange: (role: Role) => void
  onSiteChange: (site: string) => void
  onTimeRangeChange: (range: string) => void
  onToggleSidebar: () => void
  sites: string[]
  actions?: ReactNode
  afterTitle?: ReactNode
  minimal?: boolean
  backHref?: string
}

const roles: Role[] = ['technician', 'supervisor', 'manager']
const timeRanges = ['Today', '7d', '30d']

const roleLabels: Record<Role, string> = {
  technician: 'Technician',
  supervisor: 'Supervisor',
  manager: 'Manager',
}

export function TopBar({
  title, role, site, timeRange,
  onRoleChange, onSiteChange, onTimeRangeChange, onToggleSidebar,
  sites, actions, afterTitle, minimal = false, backHref,
}: TopBarProps) {
  return (
      <header className="sticky top-0 z-[var(--z-sticky)] flex items-center gap-[var(--space-sm)] h-[60px] bg-[var(--surface-primary)] border-b border-[rgba(33,37,41,0.15)]">
        <div className="flex items-center justify-center w-[60px] h-full border-r border-[#E0E1E6] shrink-0">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={20} className="text-[color:var(--color-neutral-7)]" />
          </button>
        </div>

        <div className="flex flex-1 items-center gap-[var(--space-sm)] pr-[var(--space-md)] min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-3)] transition-colors duration-[var(--duration-fast)]"
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-[var(--color-neutral-7)]" />
          </Link>
        )}

        <h1 className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)] whitespace-nowrap">
          {title}
        </h1>

        {afterTitle}

        {!minimal && (
          <div className="flex items-center rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden ml-[var(--space-sm)]">
            {timeRanges.map((tr) => (
              <button
                key={tr}
                onClick={() => onTimeRangeChange(tr)}
                className={`px-2.5 py-1 text-[length:var(--font-size-sm)] font-medium transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                  timeRange === tr
                    ? 'bg-[var(--color-accent-9)] text-white'
                    : 'text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)]'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        )}

        {!minimal && (
          <div className="flex items-center gap-[var(--space-xs)] flex-1 max-w-[260px] ml-[var(--space-md)] px-2.5 py-1.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-secondary)]">
            <Search size={14} className="text-[var(--color-neutral-7)] shrink-0" />
            <input
              type="text"
              placeholder="Search WOs, assets, parts..."
              className="flex-1 text-[length:var(--font-size-sm)] bg-transparent outline-none text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-7)]"
              aria-label="Global search"
            />
          </div>
        )}

        <div className="flex-1" />

        {!minimal && (
          <div className="flex items-center gap-[var(--space-sm)]">
            <SelectDropdown
              label={roleLabels[role]}
              options={roles.map((r) => ({ value: r, label: roleLabels[r] }))}
              value={role}
              onChange={(v) => onRoleChange(v as Role)}
            />

            {role !== 'technician' && (
              <SelectDropdown
                label={site}
                options={sites.map((s) => ({ value: s, label: s }))}
                value={site}
                onChange={onSiteChange}
              />
            )}
          </div>
        )}

        </div>

        {actions && <div className="flex items-center gap-[var(--space-sm)] pr-[var(--space-md)]">{actions}</div>}
      </header>
  )
}

function SelectDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-7 py-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-11)] cursor-pointer outline-none"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-7)] pointer-events-none"
      />
    </div>
  )
}
