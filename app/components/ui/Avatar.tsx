'use client'

import { type ReactNode } from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { User } from 'lucide-react'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AvatarVariant = 'default' | 'solid'

export interface AvatarProps {
  src?: string
  name?: string
  icon?: ReactNode
  size?: AvatarSize
  variant?: AvatarVariant
  className?: string
  title?: string
}

const SIZE: Record<AvatarSize, { container: string; text: string; iconSize: number }> = {
  xs:  { container: 'w-5 h-5',    text: 'text-[9px]',                              iconSize: 10 },
  sm:  { container: 'w-7 h-7',    text: 'text-[11px]',                             iconSize: 13 },
  md:  { container: 'w-9 h-9',    text: 'text-[length:var(--font-size-sm)]',       iconSize: 16 },
  lg:  { container: 'w-11 h-11',  text: 'text-[length:var(--font-size-base)]',     iconSize: 20 },
  xl:  { container: 'w-[52px] h-[52px]', text: 'text-[18px]',                      iconSize: 24 },
  '2xl': { container: 'w-16 h-16', text: 'text-[22px]',                            iconSize: 28 },
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Avatar({ src, name, icon, size = 'md', variant, className = '', title }: AvatarProps) {
  const { container, text, iconSize } = SIZE[size]

  const fallbackColor = variant === 'solid'
    ? 'bg-[var(--color-accent-9)] text-white'
    : 'bg-[var(--color-accent-3)] text-[var(--color-accent-9)]'

  const fallbackContent = name
    ? <span className={`${text} font-semibold leading-none`}>{getInitials(name)}</span>
    : <span className="flex items-center justify-center">{icon ?? <User size={iconSize} strokeWidth={2} />}</span>

  return (
    <AvatarPrimitive.Root
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 cursor-default ${container} ${className}`}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name ?? ''} className="w-full h-full object-cover" />}
      <AvatarPrimitive.Fallback
        className={`flex items-center justify-center w-full h-full font-semibold ${fallbackColor}`}
        delayMs={src ? 200 : 0}
      >
        {fallbackContent}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
