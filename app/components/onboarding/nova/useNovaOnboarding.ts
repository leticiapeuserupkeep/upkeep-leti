'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readingPause, introDuration } from './NovaPrimitives'
import { ANALYSIS_STEP_MS } from './AnalysisSequence'
import type { FocusAction, ReportDestination } from './NovaInsightCards'
import { setupStore } from '@/app/lib/onboarding/setup-store'
import { SUGGESTED_TECH } from '@/app/lib/onboarding/discovery'
import {
  MOCK_COMPANY, COMPANY_REPORT, analysisSteps, sourceName, affectedAssets,
  MAINTENANCE_PLAN, suggestedPeople, REPORT_DOC, TRIAL_SEATS, ACTION_PLAN,
  INTEGRATION_CATALOG, EMAIL_SOURCES, hasEmail, isSourceId,
  type CompanyProfile, type SourceId, type PlanItem, type PlanStepId, type ResearchStep, type SuggestedPerson, type UpkeepRole, type MaintenancePlanItem,
} from '@/app/lib/onboarding/nova-onboarding-data'

/** One entry in the conversation. Nova's rich replies (cards) are messages
 * too, so the whole experience reads top-to-bottom like a chat. */
/** Profile questions Nova asks before looking up the company. */
export type ProfileQuestion = 'role' | 'industry'
export const PROFILE_OPTIONS: Record<ProfileQuestion, string[]> = {
  role: ['Admin', 'Manager', 'Technician', 'Requester'],
  industry: ['Manufacturing', 'Facilities', 'Fleet', 'Food & Beverage', 'Other'],
}

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
  /** One step of the setup plan, shown on its own (locations, assets, team). */
  | { id: number; kind: 'plan-step'; stepId: PlanStepId }
  /** "Want me to build your plan?" — Build / Not now. */
  | { id: number; kind: 'build-plan-choice' }
  | { id: number; kind: 'team-sources' }
  | { id: number; kind: 'team-suggestions' }
  | { id: number; kind: 'doc-link' }
  | { id: number; kind: 'integrations'; offered: SourceId[] }
  | { id: number; kind: 'product-family' }
  | { id: number; kind: 'choice'; key: ProfileQuestion; options: string[] }
  | { id: number; kind: 'setup-complete' }
  | { id: number; kind: 'maintenance-overview' }
  /** A few numbers from the analysis, with View report. */
  | { id: number; kind: 'overview-teaser' }
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
  /** Closing tags: what to do next in UpKeep. */
  | { id: number; kind: 'next-ideas' }
  /** Quick replies under Nova's question; typing an answer works too. */
  | { id: number; kind: 'replies'; options: string[] }

type NewMessage = NovaMessage extends infer M ? (M extends NovaMessage ? Omit<M, 'id'> : never) : never

class Cancelled extends Error {}

/** Tools Nova suggests connecting to find maintenance signals. */
const INTEGRATIONS: SourceId[] = ['teams', 'slack', 'gmail']


export const INTRO_GREETING = 'I’m Nova'
export const INTRO_LINE = 'I’ll help you get your account set up.'

/** Emulated pause between Nova's lines, so replies land like a person's. */
const BEAT_MS = 450

/** Quick replies for "what needs fixing?" in the work-order flow. */
const WO_EXAMPLES = ['AC not cooling in the main office', 'Leaking pipe in the warehouse', 'Conveyor belt making noise']

/** What the user asked about, in a few words for Nova's reply
 * ("I'll help you get started with …"). */
function topicOf(ask: string): string {
  const t = ask.toLowerCase()
  if (/location|site|plant/.test(t)) return 'organizing maintenance'
  if (/equipment|asset|breakdown/.test(t)) return 'tracking equipment'
  if (/team|people|together/.test(t)) return 'connecting your team'
  if (/report|summar|dashboard/.test(t)) return 'maintenance reports'
  return 'your maintenance work'
}

/** Onboarding V2: the workspace is already set up, so Nova answers the
 * request itself — first steps for each of the suggested prompts. */
function readyReply(ask: string): string {
  const t = ask.toLowerCase()
  // The team isn't invited during onboarding: the first work order is where
  // Nova suggests someone, and asks for email to find the rest.
  if (/gmail|outlook|connect/.test(t)) return 'Great — once your email is connected, I’ll look at who you work with most and suggest the right people for each job. You’ll choose who gets invited.'
  if (/preventive|breakdown|pm plan/.test(t)) return 'Let’s build your preventive maintenance plan. I’ll start with the equipment you confirmed and suggest weekly and monthly checks for each — the ones that tend to fail first go at the top. Want me to draft it?'
  if (/safety|inspection/.test(t)) return 'Here’s a daily safety inspection to start from: machine guards and e-stops, lockout points, fire extinguishers, walkways and PPE. I’ll turn it into a checklist your technicians can fill in from their phones. Should I create it?'
  if (/downtime/.test(t)) return 'I’ll build an app to log downtime: the asset, when it stopped and restarted, the reason and who fixed it — with a weekly view of the worst offenders. Want to see a preview first?'
  if (/request|prioriti/.test(t)) return 'Let’s set up your request queue: anyone can send a request, and I’ll suggest a priority from how critical the asset is and the safety risk. Want me to set up the priority rules?'
  return 'On it. I’ll use what we set up in your workspace to get started — tell me a little more about what you need, or pick one of the suggestions.'
}

/** V2 with an empty account: Nova starts from what the user wants to get
 * done and asks for what it needs on the way — one question at a time, each
 * answer landing in the account right away. */
export const READY_GOALS = [
  { id: 'workload', label: 'Reduce my workload', intro: 'Let’s start by organizing incoming requests and recurring maintenance so you have less to coordinate manually.' },
  { id: 'breakdowns', label: 'Prevent equipment breakdowns', intro: 'Let’s set up preventive maintenance so your equipment gets serviced before it fails, not after.' },
  { id: 'team', label: 'Organize my team’s work', intro: 'Let’s set up where your team works and what they maintain, so every job has a clear place and owner.' },
  { id: 'explore', label: 'Explore what UpKeep can do', intro: 'Happy to show you around! Let’s set up a small piece of your workspace so you can see UpKeep with your own data.' },
] as const
type GoalId = (typeof READY_GOALS)[number]['id']
type GuideStep = 'site' | 'site-other' | 'industry' | 'industry-other' | 'equipment' | 'equipment-other' | 'asset-source' | 'asset-name' | 'location' | 'frequency' | 'tools'
type Guide = { goal: GoalId; step: GuideStep; industry?: string; equipment?: string; asset?: string; location?: string }
/** The company's sites found on public sources — picking one adds it as the first location. */
const GUIDE_SITES = [MOCK_COMPANY.location, ...COMPANY_REPORT.usPlants.slice(0, 2).map(p => p.name), 'Other']
const GUIDE_INDUSTRIES = ['Manufacturing', 'Facilities', 'Hospitality', 'Other']
const GUIDE_EQUIPMENT: Record<string, string[]> = {
  Manufacturing: ['Production equipment', 'Conveyors', 'Air compressors', 'Other'],
  Facilities: ['HVAC units', 'Elevators', 'Generators', 'Other'],
  Hospitality: ['HVAC units', 'Kitchen equipment', 'Pools & spas', 'Other'],
}
const GUIDE_EQUIPMENT_DEFAULT = ['HVAC units', 'Generators', 'Pumps', 'Other']
export const GUIDE_IMPORT = 'Import a list'
const GUIDE_ADD_ASSET = 'Add an asset'
const PM_FREQUENCIES = ['Weekly', 'Monthly', 'Every 3 months', 'Every 6 months']
/** "Air compressors" → "Air Compressor #1", the example name for a first asset. */
function exampleAsset(equipment: string) {
  const singular = equipment.replace(/ & .*$/, '').replace(/ies$/, 'y').replace(/s$/, '')
  return `${singular.replace(/\b\w/g, c => c.toUpperCase())} #1`
}

/** Adds one location or asset to the account, as if added from the panel. */
function addToAccount(key: 'locations' | 'assets', name: string) {
  setupStore.update(prev => ({
    counts: { ...prev.counts, [key]: prev.counts[key] + 1 },
    addedNames: { ...prev.addedNames, [key]: [...prev.addedNames[key], name] },
  }))
}

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
  // The mobile app promo above the message box.
  const [appPromo, setAppPromo] = useState(false)
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
  // Apps connected from the full list (SAP, Dropbox…) — context for Nova too.
  const otherConnectedRef = useRef<string[]>([])
  const [otherConnected, setOtherConnected] = useState<string[]>([])
  // Other screens (the empty modules) show where Nova's findings come from.
  useEffect(() => { setupStore.update({ connectedApps: [...connected, ...otherConnected] }) }, [connected, otherConnected])
  connectedRef.current = connected
  const companyRef = useRef(company)
  companyRef.current = company

  // Steps that wait for the user (the plan, an offer…) park the script here
  // until the matching action releases it — one thing asks at a time.
  const waiters = useRef(new Map<string, () => void>())
  // Stop: Nova skips ahead to the next thing that needs the user.
  const fastForward = useRef(false)
  const pendingWaits = useRef(new Set<() => void>())
  // The user's answers to the profile questions.
  const [profile, setProfile] = useState<Partial<Record<ProfileQuestion, string>>>({})
  const profileRef = useRef(profile)
  profileRef.current = profile
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
      await wait(readingPause(text) + BEAT_MS)
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
        // Runs from before a reset no longer count (one may never finish,
        // e.g. still waiting on the first prompt).
        if (gen !== generation.current) return
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
    setAppPromo(false)
    setSafetyAnswered(false)
    setTeamLocked(false)
    setGoogleConsentOpen(false)
    setRoles({})
    setAnsweredOffers([])
    setAddedPeople([])
    setAddingPeople([])
    setConnected([])
    setPlanStepsDone([])
    planAddedRef.current = {}
    otherConnectedRef.current = []
    setOtherConnected([])
    setSourcesLocked(false)
    setEmailed(false)
    setUsedActions([])
    focusShown.current = false
    safetyAnsweredRef.current = false
    waiters.current.clear()
    setAwaiting(0)
    activeRuns.current = 0
    setBusy(false)
    setProfile({})
    setStarted(false)
    guide.current = null
    setChatToolsOpen(false)
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
      addedNames: { locations: [], assets: [] },
      workOrderLanding: false,
      setupComplete: false,
      connectedApps: [],
    }))
    run(async ({ wait, say, think }) => {
      // Nova waits for the user's first prompt (from the welcome box).
      await waitForUser('start')
      await wait(900)
      // Whatever they asked, Nova takes it on — then needs the basics first.
      // Echo what they asked for, so the answer clearly follows the question.
      await say(`Absolutely! I’ll help you get started with ${topicOf(firstAsk.current)}! First, let’s learn a little about your business so I can make the right recommendations.`)
      await say('What industry is your company in?')
      push({ kind: 'choice', key: 'industry', options: PROFILE_OPTIONS.industry })
      await waitForUser('choice:industry')
      // That's all the account needs: it's done, and Nova moves straight on
      // to the plan (locations first) — no company card to confirm.
      confirmCompany()
    })
    return () => { generation.current++ }
  }, [run, push, waitForUser])

  const confirmCompany = useCallback((userLine?: string) => {
    remove('confirm-company')
    if (userLine) push({ kind: 'user', text: userLine })
    run(async ({ wait, say, think }) => {
      // A beat of "setting up" that leaves no "Thought for…" behind.
      const settingUp = push({ kind: 'thinking', labels: ['Setting up your workspace…'] })
      await wait(1000)
      setMessages(prev => prev.filter(m => m.id !== settingUp))
      // The Account step checks off; locations come from the action plan.
      setupStore.update({ companyConfirmed: true })
      setCompanyConfirmed(true)
      await wait(500)
      // No company report here — straight to what can set up the account.
      await think(['Looking for locations…', 'Matching equipment to your main location…', 'Finding people on your maintenance team…'], 2400)
      // One step at a time, each its own message. Nova only knows the
      // industry, so it suggests typical kinds of locations and assets —
      // never presented as the company's real sites or equipment.
      const industry = profileRef.current.industry
      const who = industry && industry !== 'Other' ? `${industry} teams` : 'Teams'
      await say(`${who} often organize maintenance around locations like these. Would you like to start with any of them?`)
      push({ kind: 'plan-step', stepId: 'locations' })
      await waitForUser('plan-step:locations')
      await wait(400)
      if (planAddedRef.current.locations) {
        await say('Great! Now let’s add the equipment your team maintains. Based on your industry, here are a few common assets to get you started.')
      } else {
        // Skipped locations: move on without dwelling on it.
        await say('Let’s move on to your equipment!')
        await say('Based on your industry, I’ve suggested a few common assets to help you get started. You can always add more later.')
      }
      push({ kind: 'plan-step', stepId: 'assets' })
      await waitForUser('plan-step:assets')
      await wait(400)
      await say('Last, let’s bring in your team. Connect Gmail or Outlook and I’ll find the people you work with on maintenance.')
      // Gmail's consent card (why, what's safe, Connect / Not now) floats by
      // the message box; the people only show once it's connected.
      if (!hasEmail(connectedRef.current)) {
        setConsentScope('gmail')
        setGoogleConsentOpen(true)
        const allowed = await new Promise<boolean>(resolve => { gmailAnswer.current = resolve })
        if (!allowed) {
          push({ kind: 'user', text: 'Not now' })
          setPlanStepsDone(prev => [...prev, 'team'])
        }
      }
      if (hasEmail(connectedRef.current)) {
        push({ kind: 'plan-step', stepId: 'team' })
        await waitForUser('plan-step:team')
      }
      await continueAfterReport({ wait, say, think }, hasEmail(connectedRef.current), true)
    })
  }, [push, remove, run])

  /** Account details filled in by hand from the setup guide. */
  const saveAccount = useCallback((d: { role: string; industry: string; companyName: string; companySize: string }) => {
    setProfile({ role: d.role, industry: d.industry })
    setCompany(prev => ({ ...prev, name: d.companyName, size: d.companySize }))
    setupStore.update({ companyConfirmed: true })
  }, [])

  /** The user's first prompt — starts the conversation. */
  const [started, setStarted] = useState(false)
  const fromIdea = useRef(false)
  /** The user's first message — Nova's reply picks up its topic. */
  const firstAsk = useRef('')
  const start = useCallback((text: string, opts?: { idea?: boolean }) => {
    if (!waiters.current.has('start')) return
    fromIdea.current = Boolean(opts?.idea)
    firstAsk.current = text
    setStarted(true)
    push({ kind: 'user', text })
    release('start')
  }, [push, release])

  /** Onboarding V2: setup already happened from what Nova found, so the
   * first prompt gets an answer — no setup questions. */
  const readyMode = useRef(false)
  const guide = useRef<Guide | null>(null)
  // The Slack / Teams card above the message box, during the guided setup.
  const [chatToolsOpen, setChatToolsOpen] = useState(false)
  /** Nova's next question, with its quick replies. */
  const askNext = useCallback(async (say: (text: string) => Promise<void>, text: string, options?: string[]) => {
    await say(text)
    if (options) push({ kind: 'replies', options })
  }, [push])
  /** Starts the guided setup for one of the goals. */
  const startGoal = useCallback((goal: GoalId) => {
    guide.current = { goal, step: 'site' }
    const intro = READY_GOALS.find(g => g.id === goal)!.intro
    run(async ({ say, think }) => {
      await think(['Planning your first steps…'], 1200)
      await say(intro)
      await askNext(say, `I found these sites for ${companyRef.current.name}. Which one should we start with? I’ll add it as your first location.`, GUIDE_SITES)
    })
  }, [run, askNext])
  /** V2: answers the guided setup's current question — or starts it from a
   * goal (or a preventive-maintenance ask) while the account is empty. False
   * when the message isn't part of it. */
  const guideReply = useCallback((text: string): boolean => {
    const g = guide.current
    const answer = text.trim()
    if (!g) {
      const goal = READY_GOALS.find(x => x.label === answer)
      const { counts } = setupStore.get()
      const empty = counts.locations === 0 && counts.assets === 0
      if (goal) { startGoal(goal.id); return true }
      if (empty && /preventive|pm plan|\bpm\b/i.test(text)) { startGoal('breakdowns'); return true }
      return false
    }
    if (!answer) return true
    // The answer's chips have done their job.
    setMessages(prev => prev.filter(m => m.kind !== 'replies'))
    const next = (patch: Partial<Guide>, script: Parameters<typeof run>[0]) => {
      guide.current = { ...g, ...patch }
      run(script)
    }
    switch (g.step) {
      case 'site':
      case 'site-other':
        if (answer === 'Other' && g.step === 'site') {
          next({ step: 'site-other' }, async ({ say }) => { await say('What’s the site called, or its address? Type it in.') })
          return true
        }
        addToAccount('locations', answer)
        next({ step: 'industry', location: answer }, async ({ say, think }) => {
          await think(['Adding the location…'], 900)
          push({ kind: 'nova', text: `${answer} added to your locations`, check: true })
          await askNext(say, 'What industry are you in?', GUIDE_INDUSTRIES)
        })
        return true
      case 'industry':
      case 'industry-other': {
        if (answer === 'Other' && g.step === 'industry') {
          next({ step: 'industry-other' }, async ({ say }) => { await say('Which industry? Type it in.') })
          return true
        }
        // The industry completes the company details in the panel.
        setProfile(prev => ({ ...prev, industry: answer }))
        setCompanyConfirmed(true)
        setupStore.update({ companyConfirmed: true })
        next({ step: 'equipment', industry: answer }, async ({ say, think }) => {
          await think(['Updating your company details…'], 900)
          push({ kind: 'nova', text: 'Company details completed', check: true })
          await askNext(say, `For ${answer.toLowerCase()}, let’s start with equipment that needs regular maintenance. Which of these do you use?`, GUIDE_EQUIPMENT[answer] ?? GUIDE_EQUIPMENT_DEFAULT)
        })
        return true
      }
      case 'equipment':
      case 'equipment-other':
        if (answer === 'Other' && g.step === 'equipment') {
          next({ step: 'equipment-other' }, async ({ say }) => { await say('What kind of equipment? Type it in.') })
          return true
        }
        // Picking the equipment adds it as the first asset, at the site picked
        // before (or asks where it is).
        if (g.location) {
          guide.current = { ...g, step: 'location', equipment: answer, asset: exampleAsset(answer) }
          return guideReply(g.location)
        }
        next({ step: 'location', equipment: answer, asset: exampleAsset(answer) }, async ({ say, wait }) => {
          await wait(500)
          await say(`Where is your ${answer.toLowerCase()} equipment located? Type the site or building — for example, Main Plant.`)
        })
        return true
      case 'asset-source':
        if (answer === GUIDE_ADD_ASSET) {
          next({ step: 'asset-name' }, async ({ say }) => {
            await say(`What’s the asset called? For example, ${exampleAsset(g.equipment ?? 'Air compressors')}.`)
          })
          return true
        }
        // Anything else typed here is taken as the asset's name.
        guide.current = { ...g, step: 'asset-name' }
        return guideReply(answer)
      case 'asset-name':
        // The site picked first is where it goes.
        if (g.location) {
          guide.current = { ...g, step: 'location', asset: answer }
          return guideReply(g.location)
        }
        next({ step: 'location', asset: answer }, async ({ say, wait }) => {
          await wait(500)
          await say(`Where is ${answer} located? Type the site or building — for example, Main Plant.`)
        })
        return true
      case 'location': {
        const known = g.location === answer
        if (!known) addToAccount('locations', answer)
        addToAccount('assets', g.asset ?? answer)
        next({ step: 'frequency', location: answer }, async ({ say, think }) => {
          await think(['Adding it to your workspace…'], 1000)
          if (!known) push({ kind: 'nova', text: `${answer} added to your locations`, check: true })
          push({ kind: 'nova', text: `${g.asset} added to your assets, at ${answer}`, check: true })
          await say('Next, let’s set up a recurring maintenance task for this asset.')
          await askNext(say, `How often should ${g.asset} be serviced?`, PM_FREQUENCIES)
        })
        return true
      }
      case 'frequency': {
        const frequency = answer.charAt(0).toUpperCase() + answer.slice(1)
        setupStore.update(prev => ({
          counts: { ...prev.counts, workOrders: prev.counts.workOrders + 1 },
          created: [...prev.created, { id: `pm-${Date.now()}`, title: `${g.asset} preventive maintenance`, kind: 'pm', detail: frequency }],
        }))
        setPmScheduled(true)
        next({ step: 'tools' }, async ({ say, think }) => {
          await think(['Scheduling the maintenance…'], 1400)
          push({ kind: 'nova', text: `${frequency} maintenance scheduled for ${g.asset}`, check: true })
          push({ kind: 'nova', text: 'First work order created', check: true })
          await say('Does your team use Slack or Microsoft Teams? Connecting it lets your team send maintenance requests straight from a channel.')
          // Answered from the card above the message box (or by typing).
          setChatToolsOpen(true)
        })
        return true
      }
      case 'tools':
        guide.current = null
        setChatToolsOpen(false)
        run(async ({ say, think }) => {
          if (/slack|teams/i.test(answer)) {
            const id: SourceId = /teams/i.test(answer) ? 'teams' : 'slack'
            connectedRef.current = connectedRef.current.includes(id) ? connectedRef.current : [...connectedRef.current, id]
            setConnected(prev => (prev.includes(id) ? prev : [...prev, id]))
            await think([`Connecting ${answer}…`], 1200)
            push({ kind: 'nova', text: `${answer} connected — requests from your channels will show up in UpKeep`, check: true })
          }
          await say('You’re off to a great start! Your workspace now has a location, an asset and its maintenance schedule.')
          await askNext(say, 'Have the rest of your equipment in a spreadsheet? Import it and I’ll add it all — or create a work order for something that needs fixing now.', [GUIDE_IMPORT, 'Create a work order'])
        })
        return true
    }
  }, [push, run, askNext, startGoal])
  /** The guided setup's asset list came from a spreadsheet. */
  const importGuideList = useCallback((fileName: string, data: { locations: string[]; assets: string[] }) => {
    const g = guide.current
    setMessages(prev => prev.filter(m => m.kind !== 'replies'))
    push({ kind: 'user', text: `Imported ${fileName}` })
    setupStore.update(prev => ({
      counts: { ...prev.counts, locations: prev.counts.locations + data.locations.length, assets: prev.counts.assets + data.assets.length },
      addedNames: { locations: [...prev.addedNames.locations, ...data.locations], assets: [...prev.addedNames.assets, ...data.assets] },
    }))
    const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
    const added = async (think: (labels: string[], ms: number) => Promise<void>) => {
      await think(['Reading your list…'], 1600)
      push({ kind: 'nova', text: `${plural(data.locations.length, 'location')} added`, check: true })
      push({ kind: 'nova', text: `${plural(data.assets.length, 'asset')} added`, check: true })
    }
    // After the guided setup: just bring it in.
    if (!g) {
      run(async ({ say, think }) => {
        await added(think)
        await say('All in — you’ll find them in Locations and Assets. Want me to suggest maintenance schedules for the new equipment?')
      })
      return
    }
    const asset = data.assets[0] ?? exampleAsset(g.equipment ?? 'Air compressors')
    guide.current = { ...g, step: 'frequency', asset, location: data.locations[0] }
    run(async ({ say, think }) => {
      await added(think)
      await say(`Next, let’s set up a recurring maintenance task, starting with ${asset}.`)
      await askNext(say, `How often should ${asset} be serviced?`, PM_FREQUENCIES)
    })
  }, [push, run, askNext])
  /** V2: "Create a work order" — Nova asks what needs fixing, then who should
   * do it, and creates it (it lands in Work Orders and checks off the setup
   * step). False when the message isn't part of it. */
  const workOrder = useRef<{ step: 'what' | 'assign'; title?: string } | null>(null)
  const woReply = useCallback((text: string): boolean => {
    const answer = text.trim()
    const w = workOrder.current
    if (!w) {
      if (!/work order|\bwo\b/i.test(answer)) return false
      workOrder.current = { step: 'what' }
      run(async ({ say, think }) => {
        await think(['Looking at your workspace…'], 1000)
        await askNext(say, 'Sure — what needs fixing, and where? A short description is enough, like “AC not cooling in the main office”.', WO_EXAMPLES)
      })
      return true
    }
    if (!answer) return true
    setMessages(prev => prev.filter(m => m.kind !== 'replies'))
    if (w.step === 'what') {
      const title = answer.charAt(0).toUpperCase() + answer.slice(1)
      workOrder.current = { step: 'assign', title }
      run(async ({ say }) => {
        await askNext(
          say,
          `Who should I assign it to? I found ${SUGGESTED_TECH.name} on your company’s site — a ${SUGGESTED_TECH.role.toLowerCase()} who looks like a good fit.`,
          [SUGGESTED_TECH.name, 'Assign it to me', 'Leave unassigned'],
        )
      })
      return true
    }
    const title = w.title ?? 'New work order'
    const assignee = /unassigned/i.test(answer) ? null : /\bme\b/i.test(answer) ? 'you' : answer
    workOrder.current = null
    setupStore.update(prev => ({
      counts: { ...prev.counts, workOrders: prev.counts.workOrders + 1 },
      created: [...prev.created, { id: `wo-nova-${Date.now()}`, title, kind: 'work-order', detail: assignee ? `Assigned to ${assignee}` : 'Unassigned' }],
    }))
    run(async ({ say, think }) => {
      await think(['Creating the work order…'], 1200)
      push({ kind: 'nova', text: assignee ? `Work order created: ${title} · assigned to ${assignee}` : `Work order created: ${title}`, check: true })
      await say('Done — you’ll find it in Work Orders. Need anything else?')
    })
    return true
  }, [run, askNext, push])

  /** V2: the conversation opens with Nova's note on what it set up
   * (`opening.lines`, then `done` as checked lines, then `next`), then the user's message. */
  const startReady = useCallback((text: string, opening?: { lines: string[]; done: string[]; next?: string[] }) => {
    if (!waiters.current.has('start')) return
    // Drop the scripted intro.
    generation.current++
    activeRuns.current = 0
    readyMode.current = true
    setStarted(true)
    release('start')
    if (opening) {
      opening.lines.forEach(line => push({ kind: 'nova', text: line }))
      opening.done.forEach(line => push({ kind: 'nova', text: line, check: true }))
      opening.next?.forEach(line => push({ kind: 'nova', text: line }))
    }
    push({ kind: 'user', text })
    if (guideReply(text) || woReply(text)) return
    run(async ({ say, think }) => {
      await think(['Looking at your workspace…'], 1400)
      await say(readyReply(text))
    })
  }, [push, release, run, guideReply, woReply])

  /** Started from the filled-in Account step: Nova already has the answers,
   * so it skips the questions and goes straight to setting up the account. */
  const startFromAccount = useCallback((d: { role: string; industry: string; companyName: string; companySize: string }) => {
    if (!waiters.current.has('start')) return
    // Drop the scripted intro (role and industry questions).
    generation.current++
    activeRuns.current = 0
    setStarted(true)
    setProfile({ role: d.role, industry: d.industry })
    setCompany(prev => ({ ...prev, name: d.companyName, size: d.companySize }))
    release('start')
    confirmCompany('Confirm & continue')
  }, [release, confirmCompany])

  /** "Confirm & continue" with the industry still empty: Nova opens and asks
   * for it first, then carries on with the setup. */
  const askMissingIndustry = useCallback((d: { companyName: string; companySize: string }) => {
    if (!waiters.current.has('start')) return
    generation.current++
    activeRuns.current = 0
    setStarted(true)
    setCompany(prev => ({ ...prev, name: d.companyName || prev.name, size: d.companySize || prev.size }))
    push({ kind: 'user', text: 'Confirm & continue' })
    release('start')
    run(async ({ wait, say }) => {
      await wait(700)
      // Nova introduces itself, then asks for the one thing still missing.
      await say(`Hey ${setupStore.get().userName}! I’m Nova!`)
      await say('I’ll help you get everything set up and make your day-to-day work in UpKeep easier.')
      await say(`First, let’s get to know ${d.companyName || companyRef.current.name} a little better.`)
      await say('What industry is your company in?')
      push({ kind: 'choice', key: 'industry', options: PROFILE_OPTIONS.industry })
      await waitForUser('choice:industry')
      confirmCompany()
    })
  }, [push, release, run, waitForUser, confirmCompany])

  /** Answer to a profile question — shown as the user's reply. */
  const answerChoice = useCallback((key: ProfileQuestion, value: string) => {
    if (!waiters.current.has(`choice:${key}`)) return
    setProfile(prev => ({ ...prev, [key]: value }))
    push({ kind: 'user', text: value })
    release(`choice:${key}`)
  }, [push, release])

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

  /** Connects any app from the connections list — the core ones feed Nova's
   * conversation, the rest are context. */
  const connectApp = useCallback((id: string) => {
    if (isSourceId(id)) { connectSource(id); return }
    if (!otherConnectedRef.current.includes(id)) otherConnectedRef.current = [...otherConnectedRef.current, id]
    setOtherConnected(prev => (prev.includes(id) ? prev : [...prev, id]))
  }, [connectSource])

  const disconnectApp = useCallback((id: string) => {
    if (isSourceId(id)) {
      connectedRef.current = connectedRef.current.filter(x => x !== id)
      setConnected(prev => prev.filter(x => x !== id))
    } else {
      otherConnectedRef.current = otherConnectedRef.current.filter(x => x !== id)
      setOtherConnected(prev => prev.filter(x => x !== id))
    }
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

  /** The closing lines match what the user actually did with the steps Nova
   * walked through: locations, assets, team, and the last one (tools or a
   * first work order) — all of them, some, or none. */
  const finish = useCallback(async ({ say, wait }: Helpers, lastStepDone: boolean) => {
    const { counts } = setupStore.get()
    const done = [counts.locations > 0, counts.assets > 0, counts.team > 0, lastStepDone].filter(Boolean).length
    await wait(700)
    setupStore.update({ setupComplete: true, connectedApps: [...connectedRef.current] })
    if (done === 4) {
      await say('You’re all set! 🎉', true)
      await say('Your workspace is ready. Let’s get started!')
    } else if (done > 0) {
      await say('You’re off to a great start!', true)
      await say('You can finish setting things up anytime.')
    } else {
      await say('Let’s see what we can do together! ✨', true)
      await say('I can help you automate maintenance, create apps for your team, and make everyday work easier.')
    }
    await wait(900)
    await say(done === 0 ? 'Here are a few things we can start with:' : 'What would you like to do next?')
    push({ kind: 'next-ideas' })
  }, [push])

  /** After the report is kept somewhere: where to start, then the team. With
   * Google connected Nova already sees Gmail, so it goes straight to people. */
  /** After the setup suggestions (already shown): seats, then work tools,
   * then the maintenance overview built from them. */
  const continueAfterReport = useCallback(async (h: Helpers, _hasGmail?: boolean, planDone = false) => {
    const { say, think, wait } = h
    if (!planDone) await waitForUser('plan')

    // More people than the trial's seats → offer the upgrade before moving on.
    if (seatsOverflow.current > 0) {
      await wait(500)
      const more = seatsOverflow.current
      await say(`${TRIAL_SEATS} team members added. I found ${more} more, but your trial is at its seat limit.`)
      push({ kind: 'offer', offerId: 'seats', count: more })
      await waitForUser('offer:seats')
    }

    // Said "Not now" to Gmail: respect it — no more connecting, straight to
    // a first work order, then done.
    if (planDone && !hasEmail(connectedRef.current)) {
      await wait(600)
      await say('Sounds good! You can connect your apps and invite your team anytime.')
      await say('Now, let’s create your first work order so you can start tracking maintenance in UpKeep.')
      push({ kind: 'plan-step', stepId: 'workOrders' })
      await waitForUser('plan-step:workOrders')
      setIntegrationsLocked(true)
      await finish(h, setupStore.get().counts.workOrders > 0)
      return
    }

    // ── Connect tools → find value → offer a plan ──
    // Only offer what isn't connected yet (e.g. Gmail from the plan).
    const offered = INTEGRATIONS.filter(id => !connectedRef.current.includes(id))
    if (offered.length > 0) {
      await wait(600)
      await say('Great! Now let’s connect the other tools your team uses so I can provide more relevant assistance.')
      push({ kind: 'integrations', offered })
      // The user connects as many as they want, then continues (or skips).
      await waitForUser('integrations')
    }
    setIntegrationsLocked(true)

    if (!INTEGRATIONS.some(id => connectedRef.current.includes(id)) && otherConnectedRef.current.length === 0) {
      await say('No problem — connect them any time and I’ll look for maintenance signals.')
    } else {
      // 1 · Nova says what it will look at — only the apps it was given.
      const sources = [
        ...connectedRef.current.filter(id => INTEGRATIONS.includes(id)).map(sourceName),
        ...INTEGRATION_CATALOG.filter(a => otherConnectedRef.current.includes(a.id)).map(a => a.name),
      ]
      const sourceList = sources.length > 1 ? `${sources.slice(0, -1).join(', ')} and ${sources[sources.length - 1]}` : sources[0]
      await say('Great! Your work apps are connected.')
      await say('I’ll take a look at recent conversations to see if there’s anything maintenance-related that needs your attention.')
      const analyzing = push({ kind: 'thinking', labels: [`Reviewing recent activity in ${sourceList}…`, 'Finding maintenance-related conversations…', 'Identifying recurring issues…', 'Preparing your maintenance overview…'] })
      await wait(3600)
      setMessages(prev => prev.filter(m => m.id !== analyzing))

      // 2 · What it found, before any report — the user decides to open it.
      await say('I found something worth looking at! ✨', true)
      await say('After reviewing recent activity from your connected apps, I identified 12 maintenance-related issues, including 3 that may need your attention.')
      await say('I’ve put together a quick overview so you can see what’s happening.')
      // The card opens the full report; Nova doesn't wait on it.
      push({ kind: 'overview-teaser' })

      // 3 · Straight to what the user can do with the findings.
      await wait(800)
      await say('Want to take action on these findings?', true)
      await say('I can help you create work orders for the urgent issues and set up preventive maintenance for recurring problems.')
      push({ kind: 'maintenance-plan' })
      await waitForUser('mplan')

      // ── Then the mobile app, as a promo above the message box ──
      setAppPromo(true)
    }

    // ── Done — the recommendations never hold this back ──
    // The last step counts if they connected more tools or acted on the findings.
    await finish(h, connectedRef.current.some(id => !EMAIL_SOURCES.includes(id)) || otherConnectedRef.current.length > 0 || setupStore.get().counts.workOrders > 0)
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
  const answerGoogleConsent = useCallback((allowed: boolean, provider: 'gmail' | 'outlook' = 'gmail') => {
    setGoogleConsentOpen(false)
    if (consentScope === 'gmail') {
      // In place, from the action plan — no chat message needed.
      if (allowed) {
        connectedRef.current = connectedRef.current.includes(provider) ? connectedRef.current : [...connectedRef.current, provider]
        setConnected(prev => (prev.includes(provider) ? prev : [...prev, provider]))
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
        if (key === 'team' && !hasEmail(connectedRef.current)) {
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
        await wait(700)
        const count = gmailCount ?? counts?.[key] ?? item.count
        const current = setupStore.get().counts[key]
        let target: number
        if (key === 'team') {
          // Everyone found is added — the trial doesn't cap the team.
          seatsOverflow.current = 0
          target = current + count
        } else {
          target = Math.max(current, count)
        }
        // One at a time, so it reads as work being done rather than a dump.
        for (let n = current + 1; n <= target; n++) {
          setupStore.update(prev => ({ counts: { ...prev.counts, [key]: n } }))
          await wait(260)
        }
        setupStore.setPending(key, false)
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

  const connectOther = useCallback((id: string) => {
    if (!otherConnectedRef.current.includes(id)) otherConnectedRef.current = [...otherConnectedRef.current, id]
    setOtherConnected(prev => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

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
        setMplanAdded(prev => [...prev, item.id])
        await wait(300)
      }
      // Everything picked is created: the conversation moves on.
      await wait(400)
      release('mplan')
    })
  }, [mplanAdded, mplanAdding, run, release])

  const skipMaintenancePlan = useCallback(() => {
    if (mplanSkipped) return
    setMplanSkipped(true)
    push({ kind: 'user', text: 'Not now' })
    release('mplan')
  }, [mplanSkipped, push, release])

  /** Plan steps answered (added or skipped) — their cards lock. */
  const [planStepsDone, setPlanStepsDone] = useState<PlanStepId[]>([])
  const planAddedRef = useRef<Partial<Record<PlanStepId, number>>>({})
  const LABEL: Record<PlanStepId, [string, string]> = { locations: ['location', 'locations'], assets: ['asset', 'assets'], team: ['team member', 'team members'], workOrders: ['work order', 'work orders'] }

  const skipPlanStep = useCallback((step: PlanStepId) => {
    setPlanStepsDone(prev => [...prev, step])
    push({ kind: 'user', text: 'Skip for now' })
    release(`plan-step:${step}`)
  }, [push, release])

  /** Add what was checked in a plan step, one at a time, then confirm briefly. */
  const addPlanStep = useCallback((step: PlanStepId, names: string[]) => {
    const [one, many] = LABEL[step]
    setPlanStepsDone(prev => [...prev, step])
    push({ kind: 'user', text: `Add ${names.length} ${names.length === 1 ? one : many}` })
    run(async ({ wait }) => {
      setupStore.setPending(step, true)
      await wait(600)
      const start = setupStore.get().counts[step]
      for (let k = 0; k < names.length; k++) {
        setupStore.update(prev => ({
          counts: { ...prev.counts, [step]: start + k + 1 },
          ...(step === 'locations' || step === 'assets' ? { addedNames: { ...prev.addedNames, [step]: [...prev.addedNames[step], names[k]] } } : {}),
        }))
        await wait(260)
      }
      setupStore.setPending(step, false)
      planAddedRef.current[step] = names.length
      const text = step === 'team'
        ? 'Your team invitations are on their way!'
        : step === 'workOrders' ? `${names.length === 1 ? 'Your first work order is' : `${names.length} work orders are`} ready!`
        : `${names.length} ${names.length === 1 ? one : many} added`
      push({ kind: 'nova', text, check: true })
      await wait(readingPause(text) + BEAT_MS)
      release(`plan-step:${step}`)
    })
  }, [push, run, release])

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
    if (readyMode.current && (guideReply(text) || woReply(text))) return
    const sources = connectedRef.current
    run(async ({ say, think }) => {
      await think(['Thinking…'], 1600)
      if (readyMode.current) {
        await say(readyReply(text))
        return
      }
      await say(sources.length > 0
        ? `Good question. From ${sources.map(sourceName).join(' and ')}, the same few assets keep coming up — Induction Furnace #2 and Robot Cell 4 first. I’d start the Moline pilot by tracking those.`
        : 'Good question. For a pilot at Moline + East Moline I’d start with the critical line equipment — robots, CNCs and paint systems. Connect a source and I can tell you which ones are actually failing.')
    })
  }, [push, run, guideReply, woReply])

  /** The Slack / Teams card's answer, said as the user's reply. */
  const answerChatTools = useCallback((allowed: boolean, provider?: string) => {
    ask(!allowed ? 'Not now' : provider === 'teams' ? 'Microsoft Teams' : 'Slack')
  }, [ask])

  return {
    connectOther, connectApp, disconnectApp, allConnected: [...connected, ...otherConnected], chatToolsOpen, answerChatTools,
    messages, profile, answerChoice, saveAccount, started, start, busy, working: busy && awaiting === 0, stop, company, companyConfirmed, pmScheduled, generated, generating, planSkipped, integrationsLocked, mplanAdded, mplanAdding, mplanSkipped, appPromo, safetyAnswered, teamLocked, addedPeople, addingPeople, googleConsentOpen, consentScope, roles, answeredOffers, editingCompany, connected, sourcesLocked,
    emailed, reportOpen, paywallOpen, usedActions,
    planStepsDone, addPlanStep, skipPlanStep,
    confirmCompany, startFromAccount, startReady, importGuideList, askMissingIndustry, startEditingCompany, saveCompany, cancelEditingCompany,
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
