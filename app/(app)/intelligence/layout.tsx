import { IntelligenceTabNav } from '@/app/components/intelligence/IntelligenceTabNav'

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-primary)]">
      <IntelligenceTabNav />
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-canvas)]">{children}</div>
    </div>
  )
}
