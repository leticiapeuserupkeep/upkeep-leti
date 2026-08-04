'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Activity, BookOpen, Star } from 'lucide-react'

const tabs: { href: string; label: string; icon: typeof Sparkles; badge?: 'upgrade' }[] = [
  { href: '/intelligence/nova', label: 'Nova', icon: Sparkles },
  { href: '/intelligence/pulse', label: 'Pulse', icon: Activity },
  { href: '/intelligence/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/intelligence/supernova', label: 'Supernova', icon: Star, badge: 'upgrade' },
]

export function IntelligenceTabNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-center gap-1 px-[var(--space-md)] border-b border-[var(--border-default)] bg-[var(--surface-primary)] shrink-0"
      aria-label="Intelligence sections"
    >
      {tabs.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || (href === '/intelligence/nova' && pathname === '/intelligence')
        return (
          <Link
            key={href}
            href={href}
            className={`
              relative inline-flex items-center gap-2 px-3 h-12 text-[length:var(--font-size-sm)] font-medium transition-colors duration-[var(--duration-fast)]
              border-b-2 -mb-px
              ${active
                ? 'text-[var(--color-accent-9)] border-[var(--color-accent-9)]'
                : 'text-[var(--color-neutral-8)] border-transparent hover:text-[var(--color-neutral-11)]'
              }
            `}
          >
            <Icon size={16} className="shrink-0 opacity-90" aria-hidden />
            <span>{label}</span>
            {badge === 'upgrade' && (
              <span className="ml-0.5 inline-flex items-center rounded-[var(--radius-full)] bg-[var(--color-accent-1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent-9)] border border-[var(--color-accent-4)]">
                Upgrade
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
