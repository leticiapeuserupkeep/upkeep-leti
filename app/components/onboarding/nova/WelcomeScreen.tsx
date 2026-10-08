'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { IconButton } from '@/app/components/ui/IconButton'
import { OPEN_NOVA_PANEL_EVENT } from '@/app/components/onboarding/NovaSidePanel'
import { ThumbsDown, ThumbsUp, Download, GraduationCap, Users, Check, X, Sparkles, ShieldCheck, Briefcase, Wrench, Inbox, Factory, Building2, Truck, UtensilsCrossed, Ellipsis, type LucideIcon } from 'lucide-react'
import { NovaText, NovaThinking, NovaThought, UserBubble } from '@/app/components/onboarding/nova/NovaPrimitives'
import { CompanyContextCard } from '@/app/components/onboarding/nova/CompanyContextCard'
import { ConnectSourcesCard } from '@/app/components/onboarding/nova/ConnectSourcesCard'
import { AnalysisSequence } from '@/app/components/onboarding/nova/AnalysisSequence'
import { NovaResearch } from '@/app/components/onboarding/nova/NovaResearch'
import { CompanyReportCard, ActionPlanCard } from '@/app/components/onboarding/nova/CompanyReportCard'
import { MaintenanceOverviewCard, MaintenancePlanCard } from '@/app/components/onboarding/nova/MaintenanceOverview'
import { TeamSuggestionsCard } from '@/app/components/onboarding/nova/TeamSuggestionsCard'
import { ReportActions, DocLinkCard, PlantHealthCard, ProductOfferCard, FocusCard, PmPlanCard, AssetsFoundCard, AppOfferCard, NextStepsCard, type NextStep } from '@/app/components/onboarding/nova/NovaInsightCards'
import { GoogleConsentPrompt } from '@/app/components/onboarding/nova/GoogleConsentPrompt'
import { NovaReportModal } from '@/app/components/onboarding/nova/NovaReportModal'
import { NovaAppPaywallModal } from '@/app/components/onboarding/nova/NovaAppPaywallModal'
import { NovaRecommendations } from '@/app/components/onboarding/nova/NovaRecommendations'
import { recommend, offerFor, SAFETY_OFFER, SEATS_OFFER, type Recommendation } from '@/app/lib/onboarding/upkeep-recommendations'
import { CreatedForYou } from '@/app/components/onboarding/nova/CreatedForYou'
import { NovaArtifactCard, NovaArtifactPanel } from '@/app/components/onboarding/nova/NovaArtifact'
import { CHOICE, PRIMARY_CHOICE } from '@/app/components/onboarding/nova/choiceStyles'
import { ProductFamilyCard, SetupCompleteCard, type SetupStep } from '@/app/components/onboarding/nova/NovaRecommendationCards'
import { NovaIdeas } from '@/app/components/onboarding/nova/NovaIdeas'
import { SetupChecklistPanel } from '@/app/components/onboarding/nova/SetupChecklistPanel'
import { NovaComposer, type NovaComposerHandle } from '@/app/components/onboarding/nova/NovaComposer'
import { useNovaOnboarding, PROFILE_OPTIONS, type NovaMessage } from '@/app/components/onboarding/nova/useNovaOnboarding'
import { setupStore, useSetupState } from '@/app/lib/onboarding/setup-store'
import { buildReport, plantHealth, affectedAssets, sourceName, suggestedPeople, ACTION_PLAN, MAINTENANCE_PLAN, NOVA_IDEAS, REPORT_DOC, TRIAL_SEATS, SUGGESTED_PEOPLE, onboardingLocationNames, starterAssetRows } from '@/app/lib/onboarding/nova-onboarding-data'

// Confirm-company choice buttons, sized to the Figma spec.
/** Primary choice button next to CHOICE — the action Nova recommends. */

/** Plain-text version of the report, for the Copy action. */
const REPORT_SUMMARY = [
  'Deere & Company — Setup report (public sources: 10-K FY25, deere.com, press)',
  '73,100 employees (32,500 in production) · 32 plants (15 US, 17 abroad, 2 coming) · 77% of US production & maintenance in UAW',
  'Maintenance technicians (estimate): 900–1,400 in the US',
  'Suggested hierarchy: Deere → Division → Plant → Operation → Line / area → Asset',
].join('\n')


/** First-run experience: Nova does the setup work in conversation — finds the
 * company, optionally reads connected tools, and delivers a first report —
 * instead of a step-by-step wizard. */
/** The Welcome conversation. The app layout keeps it mounted once opened, so
 * leaving for Work Orders, Assets… and coming back finds the chat exactly as
 * it was — mid-flow, or finished with its success card in context. */
/** Icons for Nova's quick-reply options (role, industry). */
const CHOICE_ICONS: Record<string, LucideIcon> = {
  Admin: ShieldCheck,
  Manager: Briefcase,
  Technician: Wrench,
  Requester: Inbox,
  Manufacturing: Factory,
  Facilities: Building2,
  Fleet: Truck,
  'Food & Beverage': UtensilsCrossed,
  Other: Ellipsis,
}

export function WelcomeScreen() {
  const router = useRouter()
  const setup = useSetupState()
  const nova = useNovaOnboarding()
  const composer = useRef<NovaComposerHandle>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [upgradeFor, setUpgradeFor] = useState<Recommendation | null>(null)

  // An offer made in the chat and still waiting for an answer.
  const isChatOffer = (id: string) =>
    nova.messages.some(m => m.kind === 'offer' && m.offerId === id) && !nova.answeredOffers.includes(id)

  // Seats: the trial's, or more once the user has upgraded for them.
  const seatLimit = setup.installedApps.includes('seats') ? 50 : TRIAL_SEATS
  const teamPeople = suggestedPeople(nova.connected.filter(id => id === 'teams' || id === 'gmail'))
  // The user's latest message, and a spacer after the last message that gives
  // it a full screen of room so it can sit at the top while Nova answers.
  const turnRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<HTMLDivElement>(null)
  const [tailHeight, setTailHeight] = useState(0)
  const conversation = nova.messages
  // The Nova drawer on the right; closable, reopened from "Ask Nova".
  const [chatOpen, setChatOpen] = useState(false)
  // The welcome prompt box: sending it starts Nova and opens the drawer.
  const welcomeComposer = useRef<NovaComposerHandle>(null)
  // Coming back to Welcome before starting puts the cursor back in the box.
  const welcomePath = usePathname()
  useEffect(() => {
    if (!welcomePath.startsWith('/onboarding') || nova.started) return
    const id = window.setTimeout(() => welcomeComposer.current?.focus(), 400)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomePath])
  const startWithNova = (text: string, opts?: { idea?: boolean }) => {
    setChatOpen(true)
    nova.start(text, opts)
  }
  // Split at the user's latest message: everything from there on is "the turn".
  const lastUserIndex = conversation.map(m => m.kind).lastIndexOf('user')
  const turnKey = lastUserIndex === -1 ? null : conversation[lastUserIndex].id
  const findingShown = nova.messages.some(m => m.kind === 'company-report')
  // Reports open beside the chat (like a document in Claude) the first time
  // each appears; after that the user opens and hides them from their card.
  type OpenReport = 'setup' | 'overview'
  const [openReport, setOpenReport] = useState<OpenReport | null>(null)
  const autoOpened = useRef<Set<OpenReport>>(new Set())
  const overviewShown = nova.messages.some(m => m.kind === 'maintenance-overview')
  useEffect(() => {
    const shown: Record<OpenReport, boolean> = { setup: findingShown, overview: overviewShown }
    for (const key of ['setup', 'overview'] as const) {
      if (shown[key] && !autoOpened.current.has(key)) {
        autoOpened.current.add(key)
        setOpenReport(key)
      } else if (!shown[key] && autoOpened.current.has(key)) {
        // The conversation restarted.
        autoOpened.current.delete(key)
        setOpenReport(cur => (cur === key ? null : cur))
      }
    }
  }, [findingShown, overviewShown])
  // The open report takes the setup panel's place; closing slides it out and
  // the steps back in. Moving on with the plan closes it the same way.
  const [reportLeaving, setReportLeaving] = useState(false)
  const [stepsReturning, setStepsReturning] = useState(false)
  const closeReport = () => {
    if (!openReport || reportLeaving) return
    setReportLeaving(true)
    window.setTimeout(() => {
      setOpenReport(null)
      setReportLeaving(false)
      setStepsReturning(true)
    }, 280)
  }
  const toggleReport = (key: OpenReport) => (openReport === key ? closeReport() : setOpenReport(key))
  // Any reply from the user moves the conversation on — the report steps aside.
  const lastTurn = useRef(turnKey)
  useEffect(() => {
    if (lastTurn.current === turnKey) return
    lastTurn.current = turnKey
    closeReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey])
  const overviewSources = nova.connected.filter(id => id === 'teams' || id === 'slack' || id === 'gmail')
  const REPORT_TITLES: Record<OpenReport, string> = {
    setup: `${nova.company.name} — Setup report`,
    overview: 'This week’s maintenance overview',
  }
  const signals = {
    companyConfirmed: nova.companyConfirmed,
    industry: nova.company.industry,
    employees: nova.company.size,
    findingShown,
    connected: nova.sourcesLocked ? nova.connected : [],
    assets: setup.counts.assets,
    installed: setup.installedApps,
    declined: setup.declinedOffers,
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recommendations = useMemo(() => recommend(signals), [setup.declinedOffers, nova.companyConfirmed, setup.counts.assets, setup.installedApps, nova.company, nova.connected, nova.sourcesLocked, findingShown])

  const connectedApps = setup.connectedApps.length > 0 ? setup.connectedApps : nova.connected
  const insightsReady = overviewShown || (setup.setupComplete && connectedApps.length > 0)
  // The end-of-conversation card words it as what just happened.
  const finishedSteps: SetupStep[] = [
    { label: 'Locations added', done: setup.counts.locations > 0 },
    { label: 'Assets added', done: setup.counts.assets > 0 },
    { label: 'Team added', done: setup.counts.team > 0 },
    { label: 'Tools connected', done: connectedApps.length > 0 },
    { label: 'First maintenance plan created', done: nova.mplanAdded.length > 0 },
  ]
  // "Review setup": everything Nova configured, with where to find it.
  const reviewSteps: SetupStep[] = [
    { label: 'Company confirmed', done: setup.companyConfirmed, detail: nova.company.name },
    { label: 'Locations added', done: setup.counts.locations > 0, detail: `${setup.counts.locations} locations`, href: '/locations' },
    { label: 'Assets added', done: setup.counts.assets > 0, detail: `${setup.counts.assets} assets`, href: '/assets' },
    { label: 'Team added', done: setup.counts.team > 0, detail: `${setup.counts.team} people` },
    { label: 'Integrations connected', done: connectedApps.length > 0, detail: connectedApps.map(id => sourceName(id as Parameters<typeof sourceName>[0])).join(', ') },
    { label: 'First maintenance insights generated', done: insightsReady, detail: 'This week’s overview' },
  ]

  // Coming back through "Setup complete" lands on the completion card.
  const pathname = usePathname()
  const completeCardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pathname.startsWith('/onboarding') || !setup.setupComplete) return
    const id = window.setTimeout(() => completeCardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 120)
    return () => window.clearTimeout(id)
  }, [pathname, setup.setupComplete])

  const prefill = (text: string) => composer.current?.prefill(text)
  const nextSteps: NextStep[] = [
    {
      id: 'work-order', label: 'Create your first work order',
      description: 'Nova can draft it from a sentence.',
      done: setup.counts.workOrders > 0,
      onClick: () => openChecklistItem('workOrders'),
    },
    {
      id: 'assets', label: 'Add the affected assets',
      description: 'The 3 critical assets Nova found.',
      done: setup.counts.assets > 0,
      onClick: () => nova.runAction('assets', prefill),
    },
    {
      id: 'pm', label: 'Schedule the pilot PM plan',
      description: 'Furnace, robot cell and paint oven checks.',
      done: nova.pmScheduled,
      onClick: () => nova.runAction('pm', prefill),
    },
    {
      id: 'team', label: 'Invite your team',
      description: 'Get technicians working from the same list.',
      done: setup.counts.team > 0,
      onClick: nova.inviteTeam,
    },
  ]

  function installRecommendation(r: Recommendation) {
    setupStore.install(r.id)
    nova.announce(`Installed ${r.name} — you’ll find it in Studio. I’ll keep suggesting apps as I learn more about ${nova.company.name}.`)
  }

  // Keep the newest line in view while Nova types and cards animate in.
  useEffect(() => {
    const scroller = scrollRef.current
    const content = contentRef.current
    if (!scroller || !content) return
    // The welcome and earlier messages sit between flexible spacers, so each
    // new message shifts them. Instead of snapping, glide them from where they
    // were (FLIP): measure, invert with a transform, then animate it away.
    const lastTops = new WeakMap<Element, number>()
    const glide = () => {
      content.querySelectorAll<HTMLElement>('[data-glide]').forEach(el => {
        const top = el.offsetTop
        const prev = lastTops.get(el)
        lastTops.set(el, top)
        if (prev === undefined || prev === top) return
        el.style.transition = 'none'
        el.style.translate = `0 ${prev - top}px`
        requestAnimationFrame(() => {
          el.style.transition = 'translate 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
          el.style.translate = '0 0'
        })
      })
    }
    const observer = new ResizeObserver(() => {
      glide()
      const turn = turnRef.current
      const tail = tailRef.current
      // Once the user has said something, their message stays pinned at the
      // top with room below — only follow along if the answer outgrows it.
      if (turn && tail) {
        const answer = tail.offsetTop - turn.offsetTop
        setTailHeight(Math.max(0, scroller.clientHeight - answer - 24))
        if (answer > scroller.clientHeight - 24) {
          scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
        }
        return
      }
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
    })
    observer.observe(content)
    observer.observe(scroller)
    // While everything still fits, the content box doesn't resize — new
    // messages only squeeze the spacers — so also glide on DOM changes.
    const mutations = new MutationObserver(glide)
    mutations.observe(content, { childList: true, subtree: true, characterData: true })
    return () => { observer.disconnect(); mutations.disconnect() }
  }, [])

  // When the user speaks, bring their message to the top of the chat.
  useEffect(() => {
    if (turnKey === null) return
    const scroller = scrollRef.current
    const turnEl = turnRef.current
    if (!scroller || !turnEl) return
    // Make room first, then glide the conversation up so the message visibly
    // travels to the top — it's the same chat, not a new one.
    const tail = tailRef.current
    if (tail) setTailHeight(Math.max(0, scroller.clientHeight - (tail.offsetTop - turnEl.offsetTop) - 24))
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scroller.scrollTo({ top: turnEl.offsetTop - 8, behavior: 'smooth' })
    }))
  }, [turnKey])

  // What each setup row lists when opened.
  const checklistItems = {
    locations: onboardingLocationNames(setup.counts.locations),
    assets: starterAssetRows(setup.counts.assets).map(a => a.name),
    team: SUGGESTED_PEOPLE.slice(0, setup.counts.team).map(p => `${p.name} · ${p.role}`),
    workOrders: setup.created.filter(c => c.kind === 'work-order').map(c => c.title),
  }
  const CHECKLIST_PATHS = { locations: '/locations', assets: '/assets', workOrders: '/work-orders' } as const

  function viewChecklistItem(key: keyof typeof setup.counts) {
    if (key === 'team') composer.current?.prefill('Show me my team')
    else router.push(CHECKLIST_PATHS[key])
  }

  // Add: go to the page with Nova's panel open, ready to create one.
  function addChecklistItem(key: keyof typeof setup.counts) {
    if (key === 'team') {
      composer.current?.prefill('Help me invite my team')
      return
    }
    router.push(CHECKLIST_PATHS[key])
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_NOVA_PANEL_EVENT)), 700)
  }

  function openChecklistItem(key: keyof typeof setup.counts) {
    if (key === 'workOrders') {
      setupStore.update({ workOrderLanding: true })
      router.push('/work-orders')
    } else if (key === 'assets') {
      router.push('/assets')
    } else if (key === 'team') {
      composer.current?.prefill('Help me invite my team')
    } else {
      router.push('/locations')
    }
  }

  function renderMessage(m: NovaMessage) {
    switch (m.kind) {
      case 'nova':
        return m.check ? (
          <div className="flex max-w-[680px] items-center gap-2 nova-enter">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-9)] text-white" style={{ animation: 'checkPop 0.45s var(--ease-default)' }}>
              <Check size={11} strokeWidth={3} />
            </span>
            <NovaText text={m.text} variant={m.heading ? 'heading' : 'body'} />
          </div>
        ) : <div className="max-w-[680px] nova-enter"><NovaText text={m.text} variant={m.heading ? 'heading' : 'body'} /></div>
      case 'user':
        return <UserBubble>{m.text}</UserBubble>
      case 'thinking':
        return <NovaThinking labels={m.labels} />
      case 'thought':
        return <NovaThought labels={m.labels} seconds={m.seconds} />
      case 'company':
        return (
          <CompanyContextCard
            company={nova.company}
            editing={nova.editingCompany}
            onSave={nova.saveCompany}
            onCancel={nova.cancelEditingCompany}
          />
        )
      case 'choice':
        // Quick-reply chips; once answered, the reply bubble says it all.
        return nova.profile[m.key] ? null : (
          <div className="flex flex-col gap-2 nova-enter">
            {m.options.map((option, i) => {
              const Icon = CHOICE_ICONS[option] ?? Ellipsis
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => nova.answerChoice(m.key, option)}
                  className="flex h-10 w-full items-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-left text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-6)] hover:bg-[var(--color-accent-1)] cursor-pointer nova-enter"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Icon size={16} className="shrink-0 text-[var(--color-neutral-9)]" />
                  {option}
                </button>
              )
            })}
          </div>
        )
      case 'confirm-company':
        return (
          <div className="inline-grid min-w-[314px] w-fit grid-cols-2 gap-6">
            <button type="button" className={CHOICE} onClick={nova.startEditingCompany}>
              <ThumbsDown size={16} strokeWidth={1.5} className="shrink-0 text-[#1C2024]" /> I need to make changes
            </button>
            <button type="button" className={CHOICE} onClick={() => nova.confirmCompany('Yes, looks right')}>
              <ThumbsUp size={16} strokeWidth={1.5} className="shrink-0 text-[#1C2024]" /> Yes, looks right
            </button>
          </div>
        )
      case 'sources':
        return (
          <ConnectSourcesCard
            connected={nova.connected}
            onConnect={nova.connectSource}
            onContinue={nova.continueFromSources}
            locked={nova.sourcesLocked}
          />
        )
      case 'analysis':
        return <AnalysisSequence steps={m.steps} />
      case 'research':
        return <NovaResearch steps={m.steps} stepMs={m.stepMs} label={m.label} />
      case 'company-report':
        return (
          <div className="flex flex-col gap-2">
            <NovaArtifactCard
              title={REPORT_TITLES.setup}
              subtitle="UpKeep report · From public sources"
              open={openReport === 'setup'}
              onToggle={() => toggleReport('setup')}
            />
            <ReportActions copyText={REPORT_SUMMARY} onAction={nova.reportAction} />
          </div>
        )
      case 'build-plan-choice':
        return nova.buildPlanAnswered() ? null : (
          <div className="flex items-center gap-2 nova-enter">
            <button type="button" className={CHOICE.replace('flex-1 ', '')} onClick={() => nova.answerBuildPlan('skip')}>Not now</button>
            <button type="button" className={PRIMARY_CHOICE} onClick={() => nova.answerBuildPlan('build')}>
              Build my setup plan
            </button>
          </div>
        )
      case 'action-plan':
        return (
          <ActionPlanCard
            plan={ACTION_PLAN}
            generated={nova.generated}
            generating={nova.generating}
            skipped={nova.planSkipped}
            onSkip={nova.skipPlan}
            gmailConnected={nova.connected.includes('gmail')}
            onConnectGmail={nova.connectGmail}
            seatLimit={Infinity}
            onUpgradeSeats={() => setUpgradeFor(SEATS_OFFER)}
            onGenerate={(item, count) => nova.generatePlan([item], { [item.id]: count })}
            onGenerateAll={counts => nova.generatePlan(ACTION_PLAN, counts)}
          />
        )
      case 'team-sources':
        return (
          <ConnectSourcesCard
            only={['teams', 'gmail']}
            reasons={{ teams: 'to find people in your maintenance channels', gmail: 'to find who emails about maintenance and repairs' }}
            connected={nova.connected}
            onConnect={nova.connectSource}
            onContinue={() => nova.findTeam(false)}
            onSkip={() => nova.findTeam(true)}
            continueLabel={() => 'Find my team'}
            skipLabel="Skip for now"
            locked={nova.teamLocked}
          />
        )
      case 'team-suggestions':
        return (
          <TeamSuggestionsCard
            people={teamPeople}
            added={nova.addedPeople}
            adding={nova.addingPeople}
            roles={nova.roles}
            seatLimit={seatLimit}
            seatsUsed={setup.counts.team}
            onRoleChange={nova.setRole}
            onAdd={p => nova.addPeople([p], seatLimit)}
            onAddAll={() => nova.addPeople(teamPeople, seatLimit)}
            onUpgrade={() => setUpgradeFor(SEATS_OFFER)}
          />
        )
      case 'offer': {
        // Seats: a plain question with two buttons, not a product card.
        if (m.offerId === 'seats') {
          if (nova.answeredOffers.includes('seats')) return null
          return (
            <div className="flex items-center gap-2 nova-enter">
              <button type="button" className={PRIMARY_CHOICE} onClick={() => setUpgradeFor(SEATS_OFFER)}>
                Upgrade to add {m.count} more {m.count === 1 ? 'seat' : 'seats'}
              </button>
              <button type="button" className={CHOICE.replace('flex-1 ', '')} onClick={() => nova.answerOffer('seats', SEATS_OFFER.name, 'declined')}>Not now</button>
            </div>
          )
        }
        const offer = m.offerId === 'seats' ? SEATS_OFFER : offerFor(m.offerId, signals)
        if (!offer) return null
        return (
          <ProductOfferCard
            name={offer.name}
            pitch={offer.reason}
            icon={offer.action === 'install' ? Download : offer.id === 'seats' ? Users : GraduationCap}
            actionLabel={offer.action === 'install' ? 'Install · Free' : 'Upgrade'}
            answered={nova.answeredOffers.includes(offer.id)}
            onUpgrade={() => (offer.action === 'install' ? nova.answerOffer(offer.id, offer.name, 'accepted') : setUpgradeFor(offer))}
            onDecline={() => nova.answerOffer(offer.id, offer.name, 'declined')}
          />
        )
      }
      case 'integrations':
        return (
          <ConnectSourcesCard
            only={m.offered}
            hideReasons
            connected={nova.connected}
            onConnect={nova.connectSource}
            onContinue={nova.continueIntegrations}
            continueLabel={n => `Continue with ${n} ${n === 1 ? 'app' : 'apps'}`}
            onSkip={nova.skipIntegrations}
            skipLabel="Skip for now"
            hideSkipWhenConnected
            locked={nova.integrationsLocked}
          />
        )
      case 'maintenance-overview':
        return (
          <NovaArtifactCard
            title={REPORT_TITLES.overview}
            subtitle={`UpKeep report · From ${overviewSources.map(sourceName).join(', ')}`}
            open={openReport === 'overview'}
            onToggle={() => toggleReport('overview')}
          />
        )
      case 'mplan-choice':
        return nova.maintenancePlanAnswered() ? null : (
          <div className="flex items-center gap-2 nova-enter">
            <button type="button" className={CHOICE.replace('flex-1 ', '')} onClick={() => nova.answerMaintenancePlan('skip')}>Not now</button>
            <button type="button" className={PRIMARY_CHOICE} onClick={() => nova.answerMaintenancePlan('build')}>Build my maintenance plan</button>
          </div>
        )
      case 'maintenance-plan':
        return (
          <MaintenancePlanCard
            items={MAINTENANCE_PLAN}
            added={nova.mplanAdded}
            adding={nova.mplanAdding}
            skipped={nova.mplanSkipped}
            onAdd={item => { closeReport(); nova.addMaintenanceItems([item]) }}
            onAddAll={() => { closeReport(); nova.addMaintenanceItems(MAINTENANCE_PLAN) }}
            onSkip={() => { closeReport(); nova.skipMaintenancePlan() }}
          />
        )
      case 'product-family':
        return (
          <ProductFamilyCard
            answered={nova.safetyAnswered}
            onAddSafety={() => setUpgradeFor(SAFETY_OFFER)}
            onSkip={() => nova.answerSafety('declined')}
          />
        )
      case 'setup-complete':
        return <SetupCompleteCard ref={completeCardRef} steps={finishedSteps} reviewSteps={reviewSteps} onGo={() => router.push('/work-orders')} />
      case 'doc-link':
        return <DocLinkCard title={REPORT_DOC.title} url={REPORT_DOC.url} />
      case 'health':
        return (
          <PlantHealthCard
            health={plantHealth(nova.connected)}
            validatedWith={nova.connected.map(sourceName)}
            onViewReport={nova.openReport}
            onEmail={nova.emailReport}
            emailed={nova.emailed}
          />
        )
      case 'safety-offer':
        return (
          <ProductOfferCard
            name="UpKeep Safety"
            pitch="LOTO procedures and work permits for your UAW maintenance teams, incident reports from any phone, and an audit trail tied to each asset."
            answered={nova.safetyAnswered}
            onUpgrade={() => setUpgradeFor(SAFETY_OFFER)}
            onDecline={() => nova.answerSafety('declined')}
          />
        )
      case 'focus':
        return <FocusCard used={nova.usedActions} onAction={a => nova.runAction(a, t => composer.current?.prefill(t))} />
      case 'pm-plan':
        return <PmPlanCard onAdd={nova.addPmPlan} />
      case 'assets':
        return <AssetsFoundCard assets={affectedAssets(nova.connected)} onAdd={nova.addAssets} />
      case 'app-offer':
        return <AppOfferCard onCreate={nova.openPaywall} />
      case 'next-steps':
        return <NextStepsCard steps={nextSteps} />
    }
  }

  return (
    <div className="relative isolate flex h-[calc(100vh-60px)] overflow-clip bg-[var(--surface-primary)]">
      {/* Left: the setup steps — the page itself, like other sections. An open
          report takes their place; the steps slide back in when it closes.
          The glow sits outside the scroller, so the steps scroll over it. */}
      <div className="relative isolate flex min-w-0 flex-1">
        {/* Soft blue → pink oval glow behind the steps (Figma "Ellipse 3"). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
          <div
            className="absolute h-[1002.64px] w-[695.32px] rotate-[-7.42deg] blur-[115px]"
            style={{
              left: 'calc(300 / 1160 * 100%)',
              top: 41,
              background: 'linear-gradient(180deg, rgba(165, 201, 255, 0.13) 0%, rgba(250, 148, 255, 0.13) 100%)',
            }}
          />
        </div>

        <section className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
          {openReport ? (
            <div className="flex min-h-0 flex-1 p-[var(--space-lg)]">
              <NovaArtifactPanel
                key={openReport}
                fill
                title={REPORT_TITLES[openReport]}
                onClose={closeReport}
                className={reportLeaving ? 'nova-panel-out' : undefined}
              >
                {openReport === 'setup' ? <CompanyReportCard bare /> : <MaintenanceOverviewCard sources={overviewSources} bare />}
              </NovaArtifactPanel>
            </div>
          ) : (
            <div className={`flex w-full flex-col gap-[var(--space-lg)] p-10 ${stepsReturning ? 'nova-panel-in' : ''}`}>
              {/* Welcome, and the quickest way in: ask Nova to set things up. */}
              <div className={`mx-auto flex w-full max-w-[840px] flex-col nova-enter transition-[gap,padding] duration-500 ${nova.started ? 'gap-0 pt-0 pb-0' : 'gap-[var(--space-md)] pt-[60px] pb-[60px]'}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-[length:var(--font-size-3xl)] font-bold leading-tight tracking-[-0.02em] text-[var(--color-neutral-12)]">Welcome {setup.userName} 👋</h1>
                    {/* Brings Nova back once its drawer has been closed. */}
                    {nova.started && !chatOpen && (
                      <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        className="group shrink-0 rounded-[var(--radius-lg)] p-px cursor-pointer nova-label-in"
                        style={{ background: 'linear-gradient(45deg, #E93D82, #8E4EC6 45%, var(--color-accent-9))' }}
                      >
                        <span className="inline-flex h-[30px] items-center gap-1.5 rounded-[calc(var(--radius-lg)-1px)] bg-[var(--surface-primary)] px-3 text-[length:var(--font-size-base)] font-medium text-[var(--color-neutral-12)] transition-colors group-hover:bg-[var(--color-accent-1)]">
                          <Sparkles size={14} className="text-[var(--color-accent-9)]" /> Set Up with Nova
                        </span>
                      </button>
                    )}
                  </div>
                  {/* The intro only makes sense next to the prompt box — both fold away once Nova starts. */}
                  <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${nova.started ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
                    <p className="min-h-0 overflow-hidden text-[length:var(--font-size-md)] text-[var(--color-neutral-10)]">
                      Let Nova help you set up your UpKeep account.
                      <br />
                      Answer a few questions and Nova will guide you through the rest.
                    </p>
                  </div>
                </div>
                {/* Once started, the box folds away as Nova's drawer slides in —
                    the conversation visibly moves over there. */}
                <div
                  inert={nova.started}
                  className={`grid transition-[grid-template-rows,opacity,translate] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    nova.started ? 'grid-rows-[0fr] -translate-y-2 opacity-0' : 'grid-rows-[1fr] opacity-100'
                  }`}
                >
                  {/* Extra breathing room (inside the fold, so it collapses with it). */}
                  <div className={`-mx-3 min-h-0 overflow-hidden px-3 transition-[padding] duration-500 ${nova.started ? 'pb-0 pt-0' : 'pb-6 pt-[60px]'}`}>
                    <NovaComposer ref={welcomeComposer} initialValue="Hey Nova, help me set up my UpKeep account" onSend={startWithNova} placeholder="Ask Nova to set up your account" sendLabel="Start setup" gradientBorder />
                  </div>
                </div>
              </div>
              <SetupChecklistPanel
                title="Setup progress"
                subtitle=""
                className="mx-auto flex w-full max-w-[840px] flex-col gap-[var(--space-md)]"
                accountDone={setup.companyConfirmed}
                accountRows={[
                  ...(nova.profile.role ? [{ label: 'Role', value: nova.profile.role }] : []),
                  ...(nova.profile.industry ? [{ label: 'Industry', value: nova.profile.industry }] : []),
                  ...(setup.companyConfirmed ? [
                    { label: 'Company', value: nova.company.name },
                    { label: 'Company size', value: nova.company.size },
                    { label: 'Main location', value: nova.company.location },
                  ] : []),
                ]}
                accountLoading={Boolean(nova.profile.role) && !setup.companyConfirmed}
                accountDetails={{
                  role: nova.profile.role ?? '',
                  industry: nova.profile.industry ?? '',
                  companyName: nova.company.name,
                  companySize: nova.company.size,
                }}
                roleOptions={PROFILE_OPTIONS.role}
                industryOptions={PROFILE_OPTIONS.industry}
                onSaveAccount={nova.saveAccount}
                gmailConnected={nova.connected.includes('gmail')}
                onConnectGmail={() => { setChatOpen(true); nova.connectGmail() }}
                counts={setup.counts}
                items={checklistItems}
                pending={setup.pending}
                onAdd={addChecklistItem}
                onView={viewChecklistItem}
              >
                <CreatedForYou
                  // Reports and docs Nova made — work orders and PMs live in their own lists.
                  items={[
                    ...(overviewShown ? [{ id: 'overview', title: REPORT_TITLES.overview, kind: 'report' as const, detail: overviewSources.map(sourceName).join(', ') }] : []),
                    ...setup.created.filter(item => item.kind === 'google-doc' || item.kind === 'report'),
                  ]}
                  creating={setup.creating && !nova.mplanAdding.length}
                  onOpenReport={() => setOpenReport('overview')}
                />
                <NovaRecommendations items={recommendations} onInstall={installRecommendation} onUpgrade={setUpgradeFor} />
              </SetupChecklistPanel>
              {/* Ideas only before setup starts — after that the chat is the place to ask. */}
              {!nova.started && (
                <div className="mt-[var(--space-xl)]">
                  <NovaIdeas
                    ideas={NOVA_IDEAS}
                    // Straight to Nova: the drawer opens with the idea already sent.
                    onPick={idea => startWithNova(idea.prompt, { idea: true })}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Right: Nova, in a drawer like the rest of the product. */}
      {/* Closing slides the drawer away but keeps it mounted, so the
          conversation carries on and comes back as it was. */}
      <aside
        aria-label="Nova"
        inert={!chatOpen}
        className={`flex shrink-0 flex-col overflow-hidden bg-[var(--surface-primary)] transition-[width,max-width,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          chatOpen ? 'w-[460px] max-w-[45vw] border-l border-[var(--border-default)]' : 'w-0 max-w-0 border-l border-transparent'
        }`}
      >
        <div className="flex h-12 w-[460px] max-w-[45vw] shrink-0 items-center justify-end border-b border-[var(--border-subtle)] px-[var(--space-sm)]">
          <IconButton label="Close" variant="ghost" size="md" className="text-[var(--color-neutral-9)] hover:bg-[var(--color-neutral-3)] hover:text-[var(--color-neutral-12)]" onClick={() => setChatOpen(false)}>
            <X size={16} />
          </IconButton>
        </div>

        <div ref={scrollRef} className="relative min-h-0 w-[460px] max-w-[45vw] flex-1 overflow-y-auto px-[var(--space-lg)] [scrollbar-gutter:stable]">
          <div ref={contentRef} className="flex min-h-full flex-col gap-[var(--space-md)] py-[var(--space-lg)]">
            {/* Messages settle at the bottom while the chat is short. */}
            <div className="flex-1" aria-hidden />
            {/* One flat list, so earlier messages never remount (and replay their
                entrance) when the user sends a new one. */}
            {conversation.map((m, i) => (
              <div key={m.id} ref={i === lastUserIndex ? turnRef : undefined} data-glide={i < lastUserIndex || lastUserIndex === -1 ? '' : undefined} className="flex flex-col nova-enter">
                {renderMessage(m)}
              </div>
            ))}
            {lastUserIndex !== -1 && <div ref={tailRef} aria-hidden className="shrink-0" style={{ height: tailHeight }} />}
          </div>
        </div>

        <div className="relative w-[460px] max-w-[45vw] px-[var(--space-md)] pb-[var(--space-md)]">
          {/* Approvals float just above the input, over the end of the chat. */}
          <div className="absolute inset-x-[var(--space-md)] bottom-full z-10 mb-2">
            <GoogleConsentPrompt open={nova.googleConsentOpen} scope={nova.consentScope} onAnswer={nova.answerGoogleConsent} />
          </div>
          <NovaComposer ref={composer} onSend={nova.ask} disabled={nova.busy} working={nova.working} onStop={nova.stop} />
        </div>
      </aside>


      <NovaReportModal
        open={nova.reportOpen}
        onOpenChange={nova.closeReport}
        companyName={nova.company.name}
        sections={buildReport(nova.company, nova.sourcesLocked ? nova.connected : [])}
        emailed={nova.emailed}
        onEmail={nova.emailReport}
      />
      <NovaAppPaywallModal
        open={upgradeFor !== null}
        onOpenChange={open => {
          if (open) return
          // Closing the chat's Safety offer without upgrading counts as "not now".
          if (upgradeFor?.id === 'safety' && !nova.safetyAnswered) nova.answerSafety('declined')
          else if (upgradeFor && isChatOffer(upgradeFor.id)) nova.answerOffer(upgradeFor.id, upgradeFor.name, 'declined')
          setUpgradeFor(null)
        }}
        pitch={upgradeFor?.pitch}
        onUpgrade={() => {
          if (!upgradeFor) return
          setupStore.install(upgradeFor.id)
          if (upgradeFor.id === 'safety' && !nova.safetyAnswered) nova.answerSafety('upgraded')
          else if (isChatOffer(upgradeFor.id)) nova.answerOffer(upgradeFor.id, upgradeFor.name, 'accepted')
          else if (upgradeFor.id === 'seats') nova.announce('Done — your plan now has room for your whole team. Add the rest whenever you’re ready.')
          else nova.announce(`Great — I’ll turn on ${upgradeFor.name} as soon as your upgrade is active.`)
          setUpgradeFor(null)
        }}
      />
      <NovaAppPaywallModal
        open={nova.paywallOpen}
        onOpenChange={open => nova.closePaywall(open)}
        onUpgrade={() => nova.closePaywall(false, true)}
      />
    </div>
  )
}
