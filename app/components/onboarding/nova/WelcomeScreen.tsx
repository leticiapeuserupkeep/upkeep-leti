'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ThumbsDown, ThumbsUp, Download, GraduationCap, Users, Check } from 'lucide-react'
import { NovaText, NovaThinking, NovaThought, NovaIntroTyper, UserBubble } from '@/app/components/onboarding/nova/NovaPrimitives'
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
import { ConnectedApps } from '@/app/components/onboarding/nova/ConnectedApps'
import { CHOICE, PRIMARY_CHOICE } from '@/app/components/onboarding/nova/choiceStyles'
import { ProductFamilyCard, SetupCompleteCard, type SetupStep } from '@/app/components/onboarding/nova/NovaRecommendationCards'
import { SetupChecklistPanel } from '@/app/components/onboarding/nova/SetupChecklistPanel'
import { NovaComposer, type NovaComposerHandle } from '@/app/components/onboarding/nova/NovaComposer'
import { useNovaOnboarding, INTRO_GREETING, type NovaMessage } from '@/app/components/onboarding/nova/useNovaOnboarding'
import { setupStore, useSetupState } from '@/app/lib/onboarding/setup-store'
import { buildReport, plantHealth, affectedAssets, sourceName, suggestedPeople, ACTION_PLAN, MAINTENANCE_PLAN, REPORT_DOC, TRIAL_SEATS } from '@/app/lib/onboarding/nova-onboarding-data'

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
  const intro = nova.messages.find(m => m.kind === 'nova' && m.intro) as Extract<NovaMessage, { kind: 'nova' }> | undefined
  const conversation = nova.messages.filter(m => m !== intro)
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
            seatLimit={seatLimit}
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
    <div className="relative isolate flex h-[calc(100vh-60px)] gap-[var(--space-lg)] overflow-clip bg-[var(--surface-primary)] p-[var(--space-lg)] pl-[var(--space-3xl)]">
      {/* Soft blue → pink oval glow behind the conversation (Figma "Ellipse 3"). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
        <div
          className="absolute h-[1002.64px] w-[695.32px] rotate-[-7.42deg] blur-[115px]"
          style={{
            left: 'calc(524 / 1160 * 100%)',
            top: 41,
            background: 'linear-gradient(180deg, rgba(165, 201, 255, 0.13) 0%, rgba(250, 148, 255, 0.13) 100%)',
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">

        <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <div ref={contentRef} className="flex min-h-full flex-col gap-[var(--space-md)] pb-[var(--space-lg)] pr-[var(--space-sm)]">
            {/* The welcome and Nova's opening line sit centered in the empty
                chat; as the conversation grows the spacers collapse and they
                scroll away with it. */}
            <div className="flex-1" aria-hidden />
            <header data-glide className="flex flex-col items-center gap-2 text-center nova-enter">
              <h1 className="text-[length:var(--font-size-3xl)] font-bold leading-tight tracking-[-0.02em] text-[var(--color-neutral-12)]">Welcome {setup.userName} 👋</h1>
              {intro && <NovaIntroTyper first={INTRO_GREETING} second={intro.text} emphasis="Nova" />}
            </header>
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

        <div className="relative">
          {/* Approvals float just above the input, over the end of the chat. */}
          <div className="absolute inset-x-0 bottom-full z-10 mb-2">
            <GoogleConsentPrompt open={nova.googleConsentOpen} scope={nova.consentScope} onAnswer={nova.answerGoogleConsent} />
          </div>
          <NovaComposer ref={composer} onSend={nova.ask} disabled={nova.busy} working={nova.working} onStop={nova.stop} />
        </div>
      </div>

      {/* An open report takes the setup panel's place so the screen stays
          light; the steps slide back in when it closes. */}
      {openReport ? (
        <NovaArtifactPanel
          key={openReport}
          title={REPORT_TITLES[openReport]}
          onClose={closeReport}
          className={reportLeaving ? 'nova-panel-out' : undefined}
        >
          {openReport === 'setup' ? <CompanyReportCard bare /> : <MaintenanceOverviewCard sources={overviewSources} bare />}
        </NovaArtifactPanel>
      ) : (
        <div className={`flex shrink-0 ${stepsReturning ? 'nova-panel-in' : ''}`}>
          <SetupChecklistPanel accountDone={setup.companyConfirmed} counts={setup.counts} pending={setup.pending} onOpen={openChecklistItem}>
            <ConnectedApps connected={nova.connected} />
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
        </div>
      )}

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
