'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { typingDuration, introDuration } from './NovaPrimitives'
import { ANALYSIS_STEP_MS } from './AnalysisSequence'
import { researchDuration } from './NovaResearch'
import type { FocusAction, ReportDestination } from './NovaInsightCards'
import { setupStore } from '@/app/lib/onboarding/setup-store'
import {
  MOCK_COMPANY, analysisSteps, sourceName, affectedAssets,
  QUICK_LOOKUP, MAINTENANCE_PLAN, suggestedPeople, REPORT_DOC, TRIAL_SEATS, ACTION_PLAN,
  type CompanyProfile, type SourceId, type PlanItem, type ResearchStep, type SuggestedPerson, type UpkeepRole, type MaintenancePlanItem,
} from '@/app/lib/onboarding/nova-onboarding-data'

/** One entry in the conversation. Nova's rich replies (cards) are messages
 * too, so the whole experience reads top-to-bottom like a chat. */
export type NovaMessage =
  | { id: number; kind: 'nova'; text: string; heading?: boolean; /** Opening line, shown centered under the welcome. */ intro?: boolean; /** A done-it line, with a check. */ check?: boolean }
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'thinking'; labels: string[] }
  /** A finished 'thinking' — collapses into "Thought for Ns" above the reply. */
  | { id: number; kind: 'thought'; labels: string[]; seconds: number }
  | { id: number; kind: 'company' }
  | { id: number; kind: 'confirm-company' }
  | { id: number; kind: 'sources' }
  | { id: number; kind: 'analysis'; steps: string[] }
  | { id: number; kind: 'research'; steps: ResearchStep[]; stepMs?: number; label?: string }
  | { id: number; kind: 'company-report' }
  | { id: number; kind: 'action-plan' }
  /** "Want me to build your plan?" — Build / Not now. */
  | { id: number; kind: 'build-plan-choice' }
  | { id: number; kind: 'team-sources' }
  | { id: number; kind: 'team-suggestions' }
  | { id: number; kind: 'doc-link' }
  | { id: number; kind: 'integrations'; offered: SourceId[] }
  | { id: number; kind: 'product-family' }
  | { id: number; kind: 'setup-complete' }
  | { id: number; kind: 'maintenance-overview' }
  | { id: number; kind: 'mplan-choice' }
  | { id: number; kind: 'maintenance-plan' }
  /** Nova suggesting a product or app in the chat, before it can ever show in the panel. */
  | { id: number; kind: 'offer'; offerId: string; /** For 'seats': how many more people need a seat. */ count?: number }
  | { id: number; kind: 'health' }
  | { id: number; kind: 'safety-offer' }
  | { id: number; kind: 'focus' }
  | { id: number; kind: 'pm-plan' }
  | { id: number; kind: 'assets' }
  | { id: number; kind: 'app-offer' }
  | { id: number; kind: 'next-steps' }

type NewMessage = NovaMessage extends infer M ? (M extends NovaMessage ? Omit<M, 'id'> : never) : never

class Cancelled extends Error {}

/** Tools Nova suggests connecting to find maintenance signals. */
const INTEGRATIONS: SourceId[] = ['teams', 'slack', 'gmail']

/** The first lookup is a quick confirmation of sign-up data. */
const QUICK_STEP_MS = 450

export const INTRO_GREETING = 'I’m Nova'
export const INTRO_LINE = 'I’ll help you get your account set up.'

/** Emulated pause between Nova's lines, so replies land like a person's. */
const BEAT_MS = 450

export function useNovaOnboarding() {
  const [messages, setMessages] = useState<NovaMessage[]>([])
  const [company, setCompany] = useState<CompanyProfile>(MOCK_COMPANY)
  const [editingCompany, setEditingCompany] = useState(false)
  const [companyConfirmed, setCompanyConfirmed] = useState(false)
  const [pmScheduled, setPmScheduled] = useState(false)
  const [generated, setGenerated] = useState<PlanItem['id'][]>([])
  const [generating, setGenerating] = useState<PlanItem['id'][]>([])
  const [planSkipped, setPlanSkipped] = useState(false)
  const [integrationsLocked, setIntegrationsLocked] = useState(false)
  const [mplanAdded, setMplanAdded] = useState<string[]>([])
  const [mplanAdding, setMplanAdding] = useState<string[]>([])
  const [mplanSkipped, setMplanSkipped] = useState(false)
  const [safetyAnswered, setSafetyAnswered] = useState(false)
  const [teamLocked, setTeamLocked] = useState(false)
  const [googleConsentOpen, setGoogleConsentOpen] = useState(false)
  /** What the Google consent is for: the report doc, or just Gmail for the team. */
  const [consentScope, setConsentScope] = useState<'doc' | 'gmail'>('doc')
  const [roles, setRoles] = useState<Record<string, UpkeepRole>>({})
  const [answeredOffers, setAnsweredOffers] = useState<string[]>([])
  const [addedPeople, setAddedPeople] = useState<string[]>([])
  const [addingPeople, setAddingPeople] = useState<string[]>([])
  const [connected, setConnected] = useState<SourceId[]>([])
  const [sourcesLocked, setSourcesLocked] = useState(false)
  const [emailed, setEmailed] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [usedActions, setUsedActions] = useState<FocusAction[]>([])
  const [busy, setBusy] = useState(false)

  // Bumped on (re)start and unmount; any script from an older generation
  // stops at its next await instead of writing into the new conversation.
  const generation = useRef(0)
  const activeRuns = useRef(0)
  const nextId = useRef(0)
  const focusShown = useRef(false)
  const nextStepsShown = useRef(false)
  const connectedRef = useRef<SourceId[]>([])
  connectedRef.current = connected
  const companyRef = useRef(company)
  companyRef.current = company

  // Steps that wait for the user (the plan, an offer…) park the script here
  // until the matching action releases it — one thing asks at a time.
  const waiters = useRef(new Map<string, () => void>())
  // Stop: Nova skips ahead to the next thing that needs the user.
  const fastForward = useRef(false)
  const pendingWaits = useRef(new Set<() => void>())
  // How many steps are waiting on the user — Nova isn't "working" then.
  const [awaiting, setAwaiting] = useState(0)
  const waitForUser = useCallback((key: string) => {
    fastForward.current = false
    setAwaiting(n => n + 1)
    return new Promise<void>(resolve => {
      waiters.current.set(key, () => { setAwaiting(n => Math.max(0, n - 1)); resolve() })
    })
  }, [])
  const stop = useCallback(() => {
    fastForward.current = true
    pendingWaits.current.forEach(finish => finish())
    pendingWaits.current.clear()
  }, [])
  const release = useCallback((key: string) => {
    waiters.current.get(key)?.()
    waiters.current.delete(key)
  }, [])
  // Team members beyond the trial's seats, waiting on an upgrade.
  const seatsOverflow = useRef(0)
  // Guards against a double answer (e.g. a modal closing right after Upgrade).
  const safetyAnsweredRef = useRef(false)
  const buildPlanAnswer = useRef<'build' | 'skip' | null>(null)
  const mplanAnswer = useRef<'build' | 'skip' | null>(null)

  const push = useCallback((m: NewMessage) => {
    const id = ++nextId.current
    setMessages(prev => [...prev, { ...m, id } as NovaMessage])
    return id
  }, [])

  const remove = useCallback((kind: NovaMessage['kind']) => {
    setMessages(prev => prev.filter(m => m.kind !== kind))
  }, [])

  /** Runs one scripted stretch of the conversation. */
  const run = useCallback((script: (h: {
    wait: (ms: number) => Promise<void>
    say: (text: string, heading?: boolean) => Promise<void>
    think: (labels: string[], ms: number) => Promise<void>
  }) => Promise<void>) => {
    const gen = generation.current
    const wait = (ms: number) => new Promise<void>((resolve, reject) => {
      const finish = () => {
        window.clearTimeout(timer)
        pendingWaits.current.delete(finish)
        if (gen === generation.current) resolve()
        else reject(new Cancelled())
      }
      const timer = window.setTimeout(finish, fastForward.current ? 0 : ms)
      pendingWaits.current.add(finish)
    })
    const say = async (text: string, heading?: boolean) => {
      push({ kind: 'nova', text, heading })
      await wait(typingDuration(text) + BEAT_MS)
    }
    const think = async (labels: string[], ms: number) => {
      const id = push({ kind: 'thinking', labels })
      await wait(ms)
      const seconds = Math.max(1, Math.round(ms / 1000))
      setMessages(prev => prev.map(m => (m.id === id ? { id, kind: 'thought', labels, seconds } : m)))
    }
    activeRuns.current++
    setBusy(true)
    script({ wait, say, think })
      .catch(e => { if (!(e instanceof Cancelled)) throw e })
      .finally(() => {
        activeRuns.current--
        if (activeRuns.current === 0) setBusy(false)
      })
  }, [push])

  /* ── 1. Nova already knows the company ── */

  useEffect(() => {
    generation.current++
    setMessages([])
    setCompanyConfirmed(false)
    setEditingCompany(false)
    setPmScheduled(false)
    setGenerated([])
    setGenerating([])
    setPlanSkipped(false)
    setIntegrationsLocked(false)
    setMplanAdded([])
    setMplanAdding([])
    setMplanSkipped(false)
    setSafetyAnswered(false)
    setTeamLocked(false)
    setGoogleConsentOpen(false)
    setRoles({})
    setAnsweredOffers([])
    setAddedPeople([])
    setAddingPeople([])
    setConnected([])
    setSourcesLocked(false)
    setEmailed(false)
    setUsedActions([])
    focusShown.current = false
    safetyAnsweredRef.current = false
    waiters.current.clear()
    setAwaiting(0)
    fastForward.current = false
    seatsOverflow.current = 0
    buildPlanAnswer.current = null
    mplanAnswer.current = null
    nextStepsShown.current = false
    // The conversation always starts over, so anything it creates (location,
    // assets, installed recommendations) starts over with it — otherwise the
    // panel would show e.g. the location before the company is confirmed.
    // Work orders reset too — a new account has none until the plan adds them.
    setupStore.update(prev => ({
      companyConfirmed: false,
      installedApps: [],
      declinedOffers: [],
      created: [],
      creating: false,
      counts: { ...prev.counts, locations: 0, assets: 0, team: 0, workOrders: 0 },
      workOrderLanding: false,
      setupComplete: false,
      connectedApps: [],
    }))
    run(async ({ wait, say, think }) => {
      // Lets the shell finish assembling before Nova starts talking.
      await wait(1300)
      // Rendered by the page as NovaIntroTyper — "I'm Nova", erased,
      // then this line.
      push({ kind: 'nova', text: INTRO_LINE, intro: true })
      await wait(introDuration(INTRO_GREETING, INTRO_LINE) + BEAT_MS)
      // Public research, shown step by step so it's clear where the company
      // details come from.
      push({ kind: 'research', steps: QUICK_LOOKUP, stepMs: QUICK_STEP_MS, label: 'Collecting data' })
      await wait(researchDuration(QUICK_LOOKUP, QUICK_STEP_MS))
      await say('I found your company. Does this look right?')
      push({ kind: 'company' })
      await wait(500)
      push({ kind: 'confirm-company' })
    })
    return () => { generation.current++ }
  }, [run, push])

  const confirmCompany = useCallback((userLine: string) => {
    remove('confirm-company')
    push({ kind: 'user', text: userLine })
    run(async ({ wait, say, think }) => {
      // A beat of "setting up" that leaves no "Thought for…" behind.
      const settingUp = push({ kind: 'thinking', labels: ['Setting up your workspace…'] })
      await wait(1000)
      setMessages(prev => prev.filter(m => m.id !== settingUp))
      // One thing at a time: the Account step checks off, half a second
      // later the location lands as Nova mentions it.
      setupStore.update({ companyConfirmed: true })
      await wait(500)
      setupStore.update(prev => ({ counts: { ...prev.counts, locations: Math.max(prev.counts.locations, 1) } }))
      setCompanyConfirmed(true)
      {
        const text = `Added 1 Location: ${companyRef.current.location}`
        push({ kind: 'nova', text, check: true })
        await wait(typingDuration(text) + BEAT_MS)
      }
      await wait(300)
      // No company report here — straight to what can set up the account.
      await think(['Looking for locations…', 'Matching equipment to your main location…', 'Finding people on your maintenance team…'], 2400)
      await say('I found some information to help set up your account.')
      push({ kind: 'action-plan' })
      await continueAfterReport({ wait, say, think }, connectedRef.current.includes('gmail'))
    })
  }, [push, remove, run])

  const startEditingCompany = useCallback(() => {
    remove('confirm-company')
    push({ kind: 'user', text: 'I need to make changes' })
    setEditingCompany(true)
    run(async ({ say }) => {
      await say('No problem — fix anything that’s off and I’ll use the updated details.')
    })
  }, [push, remove, run])

  const saveCompany = useCallback((next: CompanyProfile) => {
    setCompany(next)
    setEditingCompany(false)
    confirmCompany('Updated — looks right now')
  }, [confirmCompany])

  const cancelEditingCompany = useCallback(() => {
    setEditingCompany(false)
    push({ kind: 'confirm-company' })
  }, [push])

  /* ── 2. Optional sources → analysis → first finding ── */

  const connectSource = useCallback((id: SourceId) => {
    connectedRef.current = connectedRef.current.includes(id) ? connectedRef.current : [...connectedRef.current, id]
    setConnected(prev => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const showFocus = useCallback(() => {
    if (focusShown.current) return
    focusShown.current = true
    run(async ({ say, think }) => {
      await think(['Prioritizing what matters most…'], 1300)
      await say('Here are my suggestions — this is what I’d focus on first.', true)
      push({ kind: 'focus' })
    })
  }, [push, run])

  /** Contextual upsell, right after Nova has shown why it matters. */
  const offerSafety = useCallback(async (say: (text: string, heading?: boolean) => Promise<void>) => {
    await say('77% of your US maintenance staff are UAW members, working under LOTO and permit rules.', true)
    await say('Want to add UpKeep Safety to run LOTO procedures and work permits at the pilot plants?')
    push({ kind: 'safety-offer' })
  }, [push])

  const continueFromSources = useCallback(() => {
    const sources = connectedRef.current
    const name = companyRef.current.name
    setSourcesLocked(true)
    push({
      kind: 'user',
      text: sources.length > 0 ? `Analyze with ${sources.map(sourceName).join(' and ')}` : 'Continue without connecting',
    })
    if (sources.length === 0) {
      run(async ({ say }) => {
        await say('No problem — you can connect a source any time and I’ll turn the plan into a live health report.')
        await offerSafety(say)
      })
      return
    }
    run(async ({ wait, say }) => {
      await say('Perfect — I’m taking a look.', true)
      await say(`I’m checking your plants against what I find in ${sources.map(sourceName).join(' and ')}.`)
      const steps = analysisSteps(sources)
      push({ kind: 'analysis', steps })
      await wait(steps.length * ANALYSIS_STEP_MS + 400)
      await say('Here’s the health of your plants.', true)
      await say('Two things need attention now — the rest can wait.')
      push({ kind: 'health' })
      await wait(1800)
      await offerSafety(say)
    })
  }, [push, run, offerSafety])

  /** "upgraded" or "declined" — a declined offer stays in the right panel. */
  const answerSafety = useCallback((answer: 'upgraded' | 'declined') => {
    if (safetyAnsweredRef.current) return
    safetyAnsweredRef.current = true
    setSafetyAnswered(true)
    if (answer === 'declined') setupStore.decline('safety')
    push({ kind: 'user', text: answer === 'upgraded' ? 'Add Safety' : 'Not now' })
    run(async ({ say }) => {
      // Declining needs no reply — the conversation just moves on.
      if (answer === 'upgraded') await say('Great — I’ll set up your first safety inspections as soon as Safety is active.')
      release('safety')
    })
  }, [push, run, release])


  /** What to do with the report — then on to connecting tools. */
  type Helpers = {
    wait: (ms: number) => Promise<void>
    say: (text: string, heading?: boolean) => Promise<void>
    think: (labels: string[], ms: number) => Promise<void>
  }

  const askForTools = useCallback(async ({ say, wait }: Helpers) => {
    await wait(600)
    await say('Connect your tools to help me make this report more accurate.', true)
    push({ kind: 'sources' })
  }, [push])

  const offerLearn = useCallback(async ({ say, wait }: Helpers) => {
    await wait(600)
    await say('You’re rehiring 375 technicians in the Quad Cities. Want UpKeep Learn to onboard them with courses built from your procedures?')
    push({ kind: 'offer', offerId: 'learn' })
    await wait(1600)
  }, [push])

  /** Answer to an in-chat offer. Declined ones move to "We think you'll need". */
  const answerOffer = useCallback((offerId: string, name: string, answer: 'accepted' | 'declined') => {
    if (answeredOffers.includes(offerId)) return
    setAnsweredOffers(prev => [...prev, offerId])
    if (answer === 'declined') setupStore.decline(offerId)
    else setupStore.install(offerId)
    const acceptedLine = offerId === 'sap-importer' ? `Install ${name}`
      : offerId === 'seats' ? `Upgrade to add ${seatsOverflow.current} more ${seatsOverflow.current === 1 ? 'seat' : 'seats'}`
      : 'Upgrade'
    push({ kind: 'user', text: answer === 'accepted' ? acceptedLine : 'Not now' })
    run(async ({ say, wait }) => {
      if (offerId === 'seats' && answer === 'accepted') {
        const extra = seatsOverflow.current
        seatsOverflow.current = 0
        setupStore.setPending('team', true)
        await wait(1200)
        setupStore.setPending('team', false)
        setupStore.update(prev => ({ counts: { ...prev.counts, team: prev.counts.team + extra } }))
        await say(`Done — all ${TRIAL_SEATS + extra} are on your team now.`)
      } else if (!(offerId === 'seats' && answer === 'declined')) {
        // Declining seats needs no reply — the conversation just moves on.
        await say(answer === 'accepted'
          ? `Done — ${name} is ${offerId === 'sap-importer' ? 'installed' : 'on its way as soon as your upgrade is active'}.`
          : `No problem — I’ll keep ${name} on your list on the right.`)
      }
      release(`offer:${offerId}`)
    })
  }, [answeredOffers, push, run, release])

  /** After the report is kept somewhere: where to start, then the team. With
   * Google connected Nova already sees Gmail, so it goes straight to people. */
  /** After the setup suggestions (already shown): seats, then work tools,
   * then the maintenance overview built from them. */
  const continueAfterReport = useCallback(async (h: Helpers, _hasGmail?: boolean) => {
    const { say, think, wait } = h
    await waitForUser('plan')

    // More people than the trial's seats → offer the upgrade before moving on.
    if (seatsOverflow.current > 0) {
      await wait(500)
      const more = seatsOverflow.current
      await say(`${TRIAL_SEATS} team members added. I found ${more} more, but your trial is at its seat limit.`)
      push({ kind: 'offer', offerId: 'seats', count: more })
      await waitForUser('offer:seats')
    }

    // ── Connect tools → find value → offer a plan ──
    // Only offer what isn't connected yet (e.g. Gmail from the plan).
    const offered = INTEGRATIONS.filter(id => !connectedRef.current.includes(id))
    if (offered.length > 0) {
      await wait(600)
      await say('Connect your work tools so I can give you better insights.')
      push({ kind: 'integrations', offered })
      // The user connects as many as they want, then continues (or skips).
      await waitForUser('integrations')
    }
    setIntegrationsLocked(true)

    if (!INTEGRATIONS.some(id => connectedRef.current.includes(id))) {
      await say('No problem — connect them any time and I’ll look for maintenance signals.')
    } else {
      // The analysis shows while it runs, then gives way to the one line that matters.
      const analyzing = push({ kind: 'thinking', labels: ['Scanning maintenance activity…', 'Matching issues to your assets…', 'Finding recurring problems…', 'Identifying what needs attention…'] })
      await wait(4800)
      setMessages(prev => prev.filter(m => m.id !== analyzing))
      await say('I found a few things that need your attention this week.')
      push({ kind: 'maintenance-overview' })
      // The plan follows straight from the findings — nothing is created until approved.
      await wait(1600)
      push({ kind: 'maintenance-plan' })
      await waitForUser('mplan')

      // ── What Nova learned → the one UpKeep product that fits it ──
      await wait(900)
      await say('There’s more to UpKeep than Maintenance. I think Safety could be useful for your team.')
      push({ kind: 'product-family' })
      await waitForUser('safety')
    }

    // ── Done — the recommendations never hold this back ──
    await wait(700)
    setupStore.update({ setupComplete: true, connectedApps: [...connectedRef.current] })
    await say('You’re all set 🎉', true)
    await say('Your UpKeep account is 100% set up and ready to go.')
    push({ kind: 'setup-complete' })
    await wait(900)
    await say('I’ll be here whenever you need me.')
  }, [push, waitForUser, release])

  /** Secondary report actions (the "…" menu). They run alongside the
   * conversation — keeping the report is optional, so nothing waits on it. */
  const reportAction = useCallback((d: ReportDestination) => {
    const line: Record<ReportDestination, string> = {
      gdoc: 'Create a Google Doc of the report',
      email: 'Send the report by email',
      pdf: 'Download the report as PDF',
    }
    push({ kind: 'user', text: line[d] })
    if (d === 'gdoc') {
      if (connectedRef.current.includes('drive')) { answerGoogleConsentRef.current(true); return }
      // Needs the user's go-ahead first — the page shows Google's consent.
      run(async ({ say }) => {
        await say('I’ll need access to your Google account to create the doc. The same access lets me look at Gmail for your team.')
        setConsentScope('doc')
        setGoogleConsentOpen(true)
      })
      return
    }
    run(async h => {
      if (d === 'email') {
        setEmailed(true)
        await h.think(['Sending your report…'], 1100)
        await h.say('Sent — it’s in your inbox.')
      } else {
        await h.think(['Preparing the PDF…'], 1100)
        await h.say('Your PDF is downloading.')
      }
    })
  }, [push, run])

  /** Answer to Google's consent: create the doc, or keep going without it. */
  const answerGoogleConsent = useCallback((allowed: boolean) => {
    setGoogleConsentOpen(false)
    if (consentScope === 'gmail') {
      // In place, from the action plan — no chat message needed.
      if (allowed) {
        connectedRef.current = connectedRef.current.includes('gmail') ? connectedRef.current : [...connectedRef.current, 'gmail']
        setConnected(prev => (prev.includes('gmail') ? prev : [...prev, 'gmail']))
      }
      gmailAnswer.current?.(allowed)
      gmailAnswer.current = null
      return
    }
    if (!allowed) {
      run(async h => { await h.say('No problem — the report stays here in the chat.') })
      return
    }
    setConnected(prev => Array.from(new Set([...prev, 'drive', 'gmail'])) as SourceId[])
    run(async h => {
      setupStore.update({ creating: true })
      await h.think(['Creating your Google Doc…', 'Adding charts and tables…'], 2400)
      setupStore.addCreated({ id: REPORT_DOC.id, title: REPORT_DOC.title, kind: 'google-doc', url: REPORT_DOC.url })
      await h.say('Done — your report is in Google Docs. I also saved it on the right under “What we created for you”.')
      push({ kind: 'doc-link' })
    })
  }, [run, push, consentScope])
  const answerGoogleConsentRef = useRef(answerGoogleConsent)
  answerGoogleConsentRef.current = answerGoogleConsent

  const findTeam = useCallback((skip: boolean) => {
    if (teamLocked) return
    setTeamLocked(true)
    const found = connectedRef.current.filter(id => id === 'teams' || id === 'gmail')
    if (skip || found.length === 0) {
      push({ kind: 'user', text: 'Skip for now' })
      run(async ({ say, wait }) => {
        await say('No problem — you can invite people any time from the Team row on the right.')
        await askForTools({ say, wait, think: async () => {} })
      })
      return
    }
    push({ kind: 'user', text: 'Find my team' })
    run(async ({ say, think, wait }) => {
      await think([
        ...(found.includes('teams') ? ['Reading your Teams directory…'] : []),
        ...(found.includes('gmail') ? ['Scanning maintenance email threads…'] : []),
        'Matching people to the pilot plants…',
      ], 2600)
      const people = suggestedPeople(found)
      await say(`I found ${people.length} people who work on maintenance at Moline and East Moline. Add them one by one, or all at once.`)
      push({ kind: 'team-suggestions' })
      await wait(2800)
      await offerLearn({ say, wait, think })
      await askForTools({ say, wait, think })
    })
  }, [teamLocked, push, run, askForTools, offerLearn])

  /** Adds people in place: the Team row loads, then counts up. */
  const addPeople = useCallback((people: SuggestedPerson[], seatLimit: number) => {
    const seatsLeft = Math.max(0, seatLimit - setupStore.get().counts.team - addingPeople.length)
    const pending = people.filter(p => !addedPeople.includes(p.id) && !addingPeople.includes(p.id)).slice(0, seatsLeft)
    if (pending.length === 0) return
    setAddingPeople(prev => [...prev, ...pending.map(p => p.id)])
    setupStore.setPending('team', true)
    run(async ({ wait }) => {
      await wait(pending.length > 1 ? 1600 : 900)
      setupStore.setPending('team', false)
      setupStore.update(prev => ({ counts: { ...prev.counts, team: prev.counts.team + pending.length } }))
      setAddingPeople(prev => prev.filter(id => !pending.some(p => p.id === id)))
      setAddedPeople(prev => [...prev, ...pending.map(p => p.id)])
    })
  }, [addedPeople, addingPeople, run])

  /** Starting plan: generate one item, or everything left. Happens in place
   * — no chat message — with the matching checklist row showing it load and
   * then land. Items go one after another so each gets its moment. */
  // Resolves when the user answers the Gmail consent opened by the plan.
  const gmailAnswer = useRef<((allowed: boolean) => void) | null>(null)

  const generatePlan = useCallback((items: PlanItem[], counts?: Partial<Record<PlanItem['id'], number>>) => {
    const pending = items.filter(i => !generated.includes(i.id) && !generating.includes(i.id))
    if (pending.length === 0) return
    setGenerating(prev => [...prev, ...pending.map(i => i.id)])
    run(async ({ wait }) => {
      for (const item of pending) {
        const key = item.id
        let gmailCount: number | null = null
        if (key === 'team' && !connectedRef.current.includes('gmail')) {
          // Team members come from Gmail — ask for it before adding anyone.
          setConsentScope('gmail')
          setGoogleConsentOpen(true)
          const allowed = await new Promise<boolean>(resolve => { gmailAnswer.current = resolve })
          if (!allowed) {
            // Stays in the plan with its "Connect Gmail" prompt.
            setGenerating(prev => prev.filter(id => id !== key))
            continue
          }
          gmailCount = suggestedPeople(['gmail']).length
        }
        setupStore.setPending(key, true)
        await wait(1400)
        setupStore.setPending(key, false)
        const count = gmailCount ?? counts?.[key] ?? item.count
        if (key === 'team') {
          // Only as many as the plan's seats; the rest wait on an upgrade.
          const room = Math.max(0, TRIAL_SEATS - setupStore.get().counts.team)
          const added = Math.min(room, count)
          seatsOverflow.current = count - added
          setupStore.update(prev => ({ counts: { ...prev.counts, team: prev.counts.team + added } }))
        } else {
          setupStore.update(prev => ({ counts: { ...prev.counts, [key]: Math.max(prev.counts[key], count) } }))
        }
        setGenerating(prev => prev.filter(id => id !== key))
        setGenerated(prev => {
          const next = [...prev, key]
          if (ACTION_PLAN.every(p => next.includes(p.id))) window.setTimeout(() => release('plan'), 600)
          return next
        })
        await wait(400)
      }
    })
  }, [generated, generating, run, release])

  /** Answer to "Want me to build your plan?". */
  const answerBuildPlan = useCallback((answer: 'build' | 'skip') => {
    if (buildPlanAnswer.current) return
    buildPlanAnswer.current = answer
    push({ kind: 'user', text: answer === 'build' ? 'Build my setup plan' : 'Not now' })
    if (answer === 'skip') {
      run(async ({ say }) => {
        await say('No problem — just ask me any time and I’ll build it.')
        release('build-plan')
      })
      return
    }
    release('build-plan')
  }, [push, run, release])

  const continueIntegrations = useCallback(() => {
    push({ kind: 'user', text: 'Continue' })
    release('integrations')
  }, [push, release])

  const skipIntegrations = useCallback(() => {
    push({ kind: 'user', text: 'Skip for now' })
    release('integrations')
  }, [push, release])

  const answerMaintenancePlan = useCallback((answer: 'build' | 'skip') => {
    if (mplanAnswer.current) return
    mplanAnswer.current = answer
    push({ kind: 'user', text: answer === 'build' ? 'Build my maintenance plan' : 'Not now' })
    release('mplan-choice')
  }, [push, release])

  /** Creates plan items in place; they land in "What we created for you". */
  const addMaintenanceItems = useCallback((items: MaintenancePlanItem[]) => {
    const pending = items.filter(i => !mplanAdded.includes(i.id) && !mplanAdding.includes(i.id))
    if (pending.length === 0) return
    setMplanAdding(prev => [...prev, ...pending.map(i => i.id)])
    run(async ({ wait }) => {
      for (const item of pending) {
        if (item.kind === 'work-order') setupStore.setPending('workOrders', true)
        setupStore.update({ creating: true })
        await wait(1200)
        setupStore.addCreated({ id: item.id, title: item.title, kind: item.kind, detail: item.meta })
        if (item.kind === 'work-order') {
          setupStore.setPending('workOrders', false)
          setupStore.update(prev => ({ counts: { ...prev.counts, workOrders: prev.counts.workOrders + 1 } }))
        }
        setMplanAdding(prev => prev.filter(id => id !== item.id))
        setMplanAdded(prev => {
          const next = [...prev, item.id]
          if (MAINTENANCE_PLAN.every(p => next.includes(p.id))) window.setTimeout(() => release('mplan'), 700)
          return next
        })
        await wait(300)
      }
    })
  }, [mplanAdded, mplanAdding, run, release])

  const skipMaintenancePlan = useCallback(() => {
    if (mplanSkipped) return
    setMplanSkipped(true)
    push({ kind: 'user', text: 'Skip for now' })
    release('mplan')
  }, [mplanSkipped, push, release])

  const skipPlan = useCallback(() => {
    if (planSkipped) return
    setPlanSkipped(true)
    push({ kind: 'user', text: 'Skip for now' })
    release('plan')
  }, [planSkipped, push, release])

  /* ── 3. Report → what to do next ── */

  const openReport = useCallback(() => setReportOpen(true), [])

  const closeReport = useCallback((open: boolean) => {
    setReportOpen(open)
  }, [])

  const emailReport = useCallback(() => {
    if (emailed) return
    setEmailed(true)
    push({ kind: 'user', text: 'Email me the report' })
    run(async ({ say, think }) => {
      await think(['Sending your report…'], 1100)
      await say('Sent — it’s in your inbox.')
    })
  }, [emailed, push, run])

  const runAction = useCallback((action: FocusAction, prefill: (text: string) => void) => {
    if (action === 'ask') {
      prefill('Which Moline assets should we track first?')
      return
    }
    setUsedActions(prev => [...prev, action])
    const sources = connectedRef.current
    if (action === 'pm') {
      push({ kind: 'user', text: 'Create a preventive maintenance plan' })
      run(async ({ say, think }) => {
        await think(sources.includes('drive')
          ? ['Reading your PM procedures…', 'Drafting tasks and frequencies…']
          : ['Applying heavy-manufacturing best practices…', 'Drafting tasks and frequencies…'], 2400)
        await say(sources.includes('drive')
          ? 'Here’s a draft based on your PM procedures in Drive. Review it and I’ll schedule it.'
          : 'Here’s a draft based on best practices for this kind of equipment. Review it and I’ll schedule it.')
        push({ kind: 'pm-plan' })
      })
    } else if (action === 'assets') {
      push({ kind: 'user', text: 'Identify the affected assets' })
      run(async ({ say, think }) => {
        await think(['Matching equipment references…', 'Grouping by unit…'], 2000)
        await say('These units keep coming up. Want me to add them to UpKeep?')
        push({ kind: 'assets' })
      })
    } else if (action === 'app') {
      push({ kind: 'user', text: 'Create a monthly monitoring app' })
      run(async ({ say, think }) => {
        await think(['Designing your app…'], 1500)
        await say('I can turn this analysis into a Nova App that automatically reviews your connected sources every month and alerts your team when new patterns appear.')
        push({ kind: 'app-offer' })
      })
    }
  }, [push, run])

  const addPmPlan = useCallback(() => {
    setPmScheduled(true)
    run(async ({ say }) => {
      await say('Scheduled — 3 recurring PMs are now live in Preventive Maintenance.')
    })
  }, [run])

  const addAssets = useCallback(() => {
    setupStore.setCount('assets', affectedAssets(connectedRef.current).length)
    run(async ({ say }) => {
      await say(`Added — they’re under Assets, linked to ${companyRef.current.location}.`)
    })
  }, [run])

  const closePaywall = useCallback((open: boolean, upgraded = false) => {
    setPaywallOpen(open)
    if (open) return
    run(async ({ say, think }) => {
      await say(upgraded
        ? 'Nice — I’ll set up Plant Reliability Monitor as soon as your upgrade is active. Your report and plan are already saved.'
        : 'No problem — your report is saved. You can turn it into an app any time.')
      if (nextStepsShown.current) return
      nextStepsShown.current = true
      await think(['Checking what’s left to set up…'], 1300)
      await say('Let’s go over your next steps.', true)
      await say(`Here’s what’s left to get ${companyRef.current.name} fully running on UpKeep. I’ll check things off as you go.`)
      push({ kind: 'next-steps' })
    })
  }, [push, run])

  const inviteTeam = useCallback(() => {
    push({ kind: 'user', text: 'Invite my team' })
    run(async ({ say, think }) => {
      await think(['Creating your invite link…'], 1200)
      await say(`Here’s your invite link — anyone who joins lands straight in ${companyRef.current.name}: app.upkeep.com/join/deere`)
    })
  }, [push, run])

  /** Nova acknowledging something the user did outside the chat. */
  const announce = useCallback((text: string) => {
    run(async ({ say }) => { await say(text) })
  }, [run])

  /* ── Free-form questions, at any point ── */

  const ask = useCallback((text: string) => {
    push({ kind: 'user', text })
    const sources = connectedRef.current
    run(async ({ say, think }) => {
      await think(['Thinking…'], 1600)
      await say(sources.length > 0
        ? `Good question. From ${sources.map(sourceName).join(' and ')}, the same few assets keep coming up — Induction Furnace #2 and Robot Cell 4 first. I’d start the Moline pilot by tracking those.`
        : 'Good question. For a pilot at Moline + East Moline I’d start with the critical line equipment — robots, CNCs and paint systems. Connect a source and I can tell you which ones are actually failing.')
    })
  }, [push, run])

  return {
    messages, busy, working: busy && awaiting === 0, stop, company, companyConfirmed, pmScheduled, generated, generating, planSkipped, integrationsLocked, mplanAdded, mplanAdding, mplanSkipped, safetyAnswered, teamLocked, addedPeople, addingPeople, googleConsentOpen, consentScope, roles, answeredOffers, editingCompany, connected, sourcesLocked,
    emailed, reportOpen, paywallOpen, usedActions,
    confirmCompany, startEditingCompany, saveCompany, cancelEditingCompany,
    connectSource, continueFromSources,
    openReport, closeReport, emailReport,
    runAction, addPmPlan, addAssets,
    openPaywall: () => setPaywallOpen(true), closePaywall,
    ask, announce, inviteTeam, generatePlan, skipPlan, answerBuildPlan, skipIntegrations, continueIntegrations, answerMaintenancePlan, addMaintenanceItems, skipMaintenancePlan,
    maintenancePlanAnswered: () => mplanAnswer.current !== null, answerSafety,
    buildPlanAnswered: () => buildPlanAnswer.current !== null, reportAction, answerGoogleConsent,
    connectGmail: () => { setConsentScope('gmail'); setGoogleConsentOpen(true) }, findTeam, addPeople, answerOffer,
    setRole: (id: string, role: UpkeepRole) => setRoles(prev => ({ ...prev, [id]: role })),
  }
}
