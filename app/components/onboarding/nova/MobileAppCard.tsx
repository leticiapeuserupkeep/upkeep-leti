'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'

const QR_SIZE = 21

/** A stand-in QR code for the prototype: the three corner finders plus a
 * fixed pseudo-random pattern, so it reads as a QR without a library. */
function QrCode() {
  const finder = (x: number, y: number) => x < 7 && y < 7
  const inFinder = (x: number, y: number) =>
    finder(x, y) || finder(QR_SIZE - 1 - x, y) || finder(x, QR_SIZE - 1 - y)
  const modules: [number, number][] = []
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      if (inFinder(x, y)) continue
      if (((x * 7 + y * 13 + x * y * 3) % 5) < 2) modules.push([x, y])
    }
  }
  const finderAt = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  )
  return (
    <svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} className="h-full w-full text-[var(--color-neutral-12)]" aria-hidden>
      <rect x={-1} y={-1} width={QR_SIZE + 2} height={QR_SIZE + 2} fill="white" />
      {finderAt(0, 0)}
      {finderAt(QR_SIZE - 7, 0)}
      {finderAt(0, QR_SIZE - 7)}
      {modules.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />)}
    </svg>
  )
}

/** The UpKeep mobile app, with a QR code to download it. Same shape as Nova's
 * suggestion cards (title and line, action on the right). Black under the
 * setup steps; `compact` and dark blue inside the chat. */
export function MobileAppCard({
  title = 'Get the UpKeep mobile app',
  description = 'Get help with your maintenance work, wherever you are.',
  compact = false,
  className = '',
}: {
  title?: string
  description?: string
  compact?: boolean
  className?: string
}) {
  return (
    <div className={`flex w-full items-center gap-4 rounded-[20px] ${compact ? 'max-w-[560px] bg-[var(--color-accent-12)] py-3 pl-4 pr-3 nova-enter' : 'bg-[var(--color-neutral-12)] py-4 pl-6 pr-4'} shadow-[-10px_10px_30px_rgba(31,45,92,0.06)] ${className}`}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[length:var(--font-size-base)] font-semibold text-white">{title}</span>
        <span className={`${compact ? 'text-[length:var(--font-size-sm)]' : 'text-[length:var(--font-size-base)]'} leading-5 text-white/70`}>{description}</span>
        <span className="mt-1 text-[12px] font-medium leading-4 text-white/50">Scan to download the UpKeep app</span>
      </span>
      <div className={`${compact ? 'h-16 w-16' : 'h-20 w-20'} shrink-0 overflow-hidden rounded-[12px] bg-white p-1.5`} role="img" aria-label="QR code to download the UpKeep app">
        <QrCode />
      </div>
    </div>
  )
}

/** The app's QR code, big, with what it's for on the left — from the nav's
 * "Download UpKeep app" or the promo above Nova's message box. */
export function MobileAppModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth="560px" srTitle="Get the UpKeep App">
      <div className="flex items-center gap-6 p-[var(--space-xl)]">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-[length:var(--font-size-xl)] font-semibold text-[var(--color-neutral-12)]">Get the UpKeep App</span>
          <span className="text-[length:var(--font-size-md)] text-[var(--color-neutral-11)]">Your maintenance assistant, on the go.</span>
          <span className="text-[length:var(--font-size-base)] text-[var(--color-neutral-9)]">Talk to Nova and get help with maintenance, wherever you are.</span>
          <span className="mt-2 text-[length:var(--font-size-sm)] font-medium text-[var(--color-accent-9)]">Scan with your phone’s camera to download</span>
        </div>
        <div className="h-44 w-44 shrink-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white p-3" role="img" aria-label="QR code to download the UpKeep app">
          <QrCode />
        </div>
      </div>
    </Modal>
  )
}

/** A compact promo above Nova's message box: opens the QR code, and can be
 * dismissed. */
export function MobileAppPromo() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <>
      <div className="flex w-full items-center gap-2 rounded-[var(--radius-xl)] bg-[var(--color-accent-12)] py-2.5 pl-4 pr-2 shadow-[var(--shadow-sm)] nova-panel-up">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 flex-col text-left transition-opacity duration-[var(--duration-fast)] hover:opacity-90 cursor-pointer"
        >
          <span className="truncate text-[length:var(--font-size-base)] font-semibold text-white">Get the UpKeep App</span>
          <span className="truncate text-[length:var(--font-size-sm)] text-white/70">Your maintenance assistant, on the go.</span>
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors duration-[var(--duration-fast)] hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
      <MobileAppModal open={open} onOpenChange={setOpen} />
    </>
  )
}
