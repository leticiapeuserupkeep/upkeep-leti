'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, LayoutGrid, MoreHorizontal, ChevronDown, FileDown, FileText, Upload } from 'lucide-react'
import { SideNav } from '@/app/components/dashboard/SideNav'
import { TopBar } from '@/app/components/dashboard/TopBar'
import { Button } from '@/app/components/ui/Button'
import { IconButton } from '@/app/components/ui/IconButton'
import { MeterConfigModal } from '@/app/components/edge/MeterConfigModal'
import { DashboardProvider } from '@/app/lib/dashboard/dashboard-context'
import { runtimeSensors } from '@/app/lib/edge-data'
import { sites } from '@/app/lib/mock-data'
import type { Role } from '@/app/lib/models'

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/work-orders')) return 'Work Orders'
  if (pathname.startsWith('/files')) return 'File Management'
  if (pathname.startsWith('/exports')) return 'File Management'
  if (pathname.startsWith('/billing')) return 'Billing & Usage'
  if (pathname.startsWith('/studio/create')) return 'New App'
  if (pathname.startsWith('/studio/agents')) return 'My Agents'
  if (pathname.startsWith('/studio/browse')) return 'Studio'
  if (pathname.startsWith('/studio')) return 'Studio'
  if (pathname.startsWith('/edge/runtime')) return 'Runtime'
  if (pathname.startsWith('/edge/sensors')) return 'Sensors'
  if (pathname.startsWith('/edge/gateways')) return 'Gateways'
  if (pathname.startsWith('/edge/alerts')) return 'Alerts'
  if (pathname.startsWith('/edge/settings')) return 'Settings'
  if (pathname.startsWith('/predictive-maintenance')) return 'Preventive Maintenance'
  if (pathname.startsWith('/scheduler')) return 'Scheduler'
  if (pathname.startsWith('/command-center')) return 'Command Center'
  if (pathname.startsWith('/supernova/staging')) return 'SuperNova Staging'
  if (pathname.startsWith('/workflows')) return 'Workflows'
  if (pathname.startsWith('/aimates')) return 'Agents'
  return 'Dashboard'
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [role, setRole] = useState<Role>('supervisor')
  const [site, setSite] = useState('All Sites')
  const [timeRange, setTimeRange] = useState('Today')
  const [showAddRuntime, setShowAddRuntime] = useState(false)

  const pathname = usePathname()
  const isSupernovaStaging = pathname.startsWith('/supernova/staging')

  const handleCollapseSidebar = useCallback(() => setSidebarCollapsed(true), [])
  const handleToggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), [])

  useEffect(() => {
    window.addEventListener('collapse-sidebar', handleCollapseSidebar)
    window.addEventListener('toggle-sidebar', handleToggleSidebar)
    return () => {
      window.removeEventListener('collapse-sidebar', handleCollapseSidebar)
      window.removeEventListener('toggle-sidebar', handleToggleSidebar)
    }
  }, [handleCollapseSidebar, handleToggleSidebar])

  const title = getPageTitle(pathname)
  const isCreateApp = pathname === '/studio/create'
  const isPMCreate = pathname.startsWith('/predictive-maintenance/create')
  const isPMList = pathname === '/predictive-maintenance'
  const isAgents = pathname.startsWith('/agents')
  const isBilling = pathname.startsWith('/billing')
  const isStudioBrowse = pathname.startsWith('/studio/browse')
  const isStudioInstalled = pathname.startsWith('/studio/installed')
  const isStudioBuilt = pathname.startsWith('/studio/built')
  const isStudioAgents = pathname === '/studio/agents'
  const isStudioSection = isStudioBrowse || isStudioInstalled || isStudioBuilt || isStudioAgents
  const isEdge = pathname.startsWith('/edge/')
  const isRuntimeList = pathname === '/edge/runtime'
  const isRuntimeDetail = /^\/edge\/runtime\/[^/]+/.test(pathname)
  const isRuntimeSection = isRuntimeList || isRuntimeDetail
  const isWorkOrders = pathname.startsWith('/work-orders')
  const isFleetDetail = /^\/fleet\/vehicles\/[^/]+/.test(pathname)
  const isScheduler = pathname.startsWith('/scheduler')
  const isCommandCenter = pathname.startsWith('/command-center')
  const isEdgeSensors = pathname === '/edge/sensors'

  const exportSensorReadings = useCallback(() => {
    const blob = new Blob([JSON.stringify(runtimeSensors, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sensor-readings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  function getActions() {
    if (isEdgeSensors) {
      return (
        <Button variant="primary" size="sm" type="button" onClick={() => setShowAddRuntime(true)}>
          <Plus size={14} />
          Add Sensor
        </Button>
      )
    }
    if (isStudioAgents) {
      return (
        <Button variant="primary" size="md">+ New Agent</Button>
      )
    }
    if (isStudioSection) {
      return (
        <Button variant="primary" size="md" asChild>
          <Link href="/studio/create">New App</Link>
        </Button>
      )
    }
    if (isRuntimeList) {
      return undefined
    }
    if (isRuntimeDetail) {
      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent('open-edit-runtime'))}
        >
          <Pencil size={14} />
          Edit
        </Button>
      )
    }
    if (pathname.startsWith('/files')) {
      return (
        <Button variant="primary" size="md" className="gap-1.5">
          <Upload size={14} />
          Add Files
        </Button>
      )
    }
    if (isWorkOrders) {
      return (
        <>
          <Button variant="primary" size="md">
            <Plus size={14} />
            New Work Order
          </Button>
          <IconButton label="More actions" variant="secondary" size="md">
            <MoreHorizontal size={16} />
          </IconButton>
        </>
      )
    }
    if (isPMList) {
      return (
        <Button variant="primary" size="md" asChild>
          <Link href="/predictive-maintenance/create">
            <Plus size={14} />
            New PM
          </Link>
        </Button>
      )
    }
    return undefined
  }

  if (isSupernovaStaging) {
    return (
      <>
        {children}
        <MeterConfigModal
          open={showAddRuntime}
          onOpenChange={setShowAddRuntime}
          sensorName=""
          totalRuntime={0}
        />
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface-canvas)]">
      <SideNav collapsed={sidebarCollapsed} />

      <div
        className={`flex flex-col flex-1 min-w-0 min-h-0 ${
          isCommandCenter || isPMCreate ? 'h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        {!isCreateApp && !isAgents && !isBilling && !isFleetDetail && !isCommandCenter && !isPMCreate && (
          <TopBar
            title={title}
            role={role}
            site={site}
            timeRange={timeRange}
            onRoleChange={setRole}
            onSiteChange={setSite}
            onTimeRangeChange={setTimeRange}
            onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
            sites={sites}
            minimal={isEdge || isStudioSection || pathname.startsWith('/exports') || pathname.startsWith('/files') || isWorkOrders || pathname.startsWith('/scheduler') || isPMList}
            backHref={isRuntimeDetail ? '/edge/runtime' : undefined}
            afterTitle={isEdgeSensors ? (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="ml-3 shrink-0"
                onClick={exportSensorReadings}
              >
                <FileDown size={14} />
                Export Readings
              </Button>
            ) : isWorkOrders ? (
              <button className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-9)] cursor-pointer hover:bg-[var(--color-neutral-3)] transition-colors duration-[var(--duration-fast)]">
                <LayoutGrid size={14} className="text-[var(--color-neutral-7)]" />
                Table
                <ChevronDown size={12} className="text-[var(--color-neutral-7)]" />
              </button>
            ) : isScheduler ? (
              <div id="scheduler-after-title" className="flex items-center" />
            ) : (pathname.startsWith('/exports') || pathname.startsWith('/files')) ? (
              <div className="flex items-center gap-0 ml-4 self-stretch">
                {[
                  { label: 'Exports', href: '/exports', icon: FileDown },
                  { label: 'Files', href: '/files', icon: FileText },
                ].map((tab) => {
                  const isActive = pathname.startsWith(tab.href)
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`inline-flex items-center gap-1.5 px-3 h-full text-[length:var(--font-size-sm)] font-medium transition-colors duration-[var(--duration-fast)] border-b-2 ${
                        isActive
                          ? 'text-[var(--color-accent-9)] border-[var(--color-accent-9)]'
                          : 'text-[var(--color-neutral-8)] border-transparent hover:text-[var(--color-neutral-11)]'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            ) : undefined}
            actions={isScheduler ? (
              <div id="scheduler-header-actions" className="flex items-center gap-[var(--space-sm)]" />
            ) : getActions()}
          />
        )}
        {(isWorkOrders || isPMList || pathname.startsWith('/exports')) && <div id="table-toolbar-portal" />}

        {isRuntimeSection && <div id="runtime-sensor-bar-portal" />}
        {isRuntimeSection && <div id="runtime-kpi-portal" />}
        <div id="page-toolbar-portal" />
        {isCreateApp || isAgents ? (
          children
        ) : (
          <DashboardProvider role={role} site={site}>
            <div
              className={`flex flex-col flex-1 w-full min-h-0 ${
                isCommandCenter ? 'overflow-hidden' : ''
              }`}
            >
              {children}
            </div>
          </DashboardProvider>
        )}
      </div>

      <MeterConfigModal
        open={showAddRuntime}
        onOpenChange={setShowAddRuntime}
        sensorName=""
        totalRuntime={0}
      />
    </div>
  )
}
