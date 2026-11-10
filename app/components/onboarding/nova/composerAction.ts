'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

/** What sending an empty chat box does while Nova waits on a card,
 * e.g. "Continue with 2 apps" — shown as the box's placeholder. */
export interface ComposerAction {
  label: string
  run: () => void
}

export const ComposerActionContext = createContext<((action: ComposerAction | null) => void) | null>(null)

/** A card waiting on the user offers its main action to the chat box.
 * Pass null once it's answered. */
export function useComposerAction(action: ComposerAction | null) {
  const set = useContext(ComposerActionContext)
  const run = useRef(action?.run)
  useEffect(() => { run.current = action?.run })
  const label = action?.label
  useEffect(() => {
    if (!set || !label) return
    set({ label, run: () => run.current?.() })
    return () => set(null)
  }, [set, label])
}
