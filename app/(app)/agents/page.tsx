'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Plus, Settings, Send, Mic, ChevronRight,
  PanelLeft, Users, Sparkles, ArrowRight,
  MoreHorizontal, Star, Pencil, Archive, Copy, Square,
  Clock, BookOpen,
} from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/DropdownMenu'
import {
  TEAMMATES, EXISTING_AGENTS, AVAILABLE_AGENTS, DEFAULT_CHIPS, BUILDER_CHIPS,
  suggestTeammate, getTeammateGreeting, getTeammateWelcomeActions,
} from '@/app/lib/agents-data'
import type {
  Teammate, ChatMessage, ActionOption, SuggestedChip,
} from '@/app/lib/agents-data'

/* ── Availability badge ── */

const availabilityConfig = {
  available: { color: 'bg-[var(--color-success)]', label: 'Available' },
  busy: { color: 'bg-amber-400', label: 'Busy' },
  offline: { color: 'bg-[var(--color-neutral-5)]', label: 'Offline' },
}

/* ── Onboarding steps ── */

type OnboardingStep =
  | 'idle'
  | 'suggesting'
  | 'meet'
  | 'skills'
  | 'permissions'
  | 'access'
  | 'complete'

/* ── Team chat entry ── */

const TEAM_CHAT = {
  id: 'team',
  name: 'New Chat',
  subtitle: 'All your Agents',
}

const CHAT_CHIPS = [
  { label: 'Analyze my reactive work', icon: undefined, prompt: 'I need help analyzing my reactive maintenance patterns and identifying trends' },
  { label: 'Increase my PM coverage', icon: undefined, prompt: 'Help me increase preventive maintenance coverage and reduce reactive work' },
  { label: 'Triage my requests', icon: undefined, prompt: 'I need help classifying and prioritizing incoming work orders automatically' },
  { label: 'Clean up work order data', icon: undefined, prompt: 'Help me find and fix duplicates, missing fields, and inconsistencies in my work order data' },
]

const CONNECT_TOOLS = [
  { name: 'Gmail', logo: '/images/integrations/gmail.svg' },
  { name: 'Outlook', logo: '/images/integrations/outlook.svg' },
  { name: 'Google Sheets', logo: '/images/integrations/google-sheets.svg' },
  { name: 'Slack', logo: '/images/integrations/slack.svg' },
  { name: 'Teams', logo: '/images/integrations/teams.svg' },
]

/* ── Main page ── */

export default function AgentsPage() {
  const [rosterSearch, setRosterSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('team')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('idle')
  const [pendingTeammate, setPendingTeammate] = useState<Teammate | null>(null)
  const [addedTeammates, setAddedTeammates] = useState<Set<string>>(new Set([...EXISTING_AGENTS.map(t => t.id), 'elena']))
  const [isThinking, setIsThinking] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [unreadIds] = useState<Set<string>>(() => new Set([EXISTING_AGENTS[0]?.id].filter(Boolean)))

  const [lastSentPrompt, setLastSentPrompt] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedTeammate = TEAMMATES.find(t => t.id === selectedId)
  const isNewAgent = selectedId === 'new'
  const isTeamChat = selectedId === 'team'

  const playDoneSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } catch { /* audio not available */ }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const filteredTeammates = TEAMMATES.filter(t => {
    if (!addedTeammates.has(t.id)) return false
    if (!rosterSearch) return true
    const full = `${t.firstName} ${t.lastName} ${t.jobTitle}`.toLowerCase()
    return full.includes(rosterSearch.toLowerCase())
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const resetToWelcome = useCallback(() => {
    setMessages([])
    setOnboardingStep('idle')
    setPendingTeammate(null)
    setIsThinking(false)
  }, [])

  useEffect(() => {
    if (selectedId === 'new') {
      resetToWelcome()
    } else if (selectedTeammate) {
      const greeting = getTeammateGreeting(selectedTeammate)
      const actions = getTeammateWelcomeActions(selectedTeammate)
      setMessages([{
        id: 'welcome',
        role: 'teammate',
        content: greeting,
        teammate: selectedTeammate,
        timestamp: new Date(),
        options: actions,
      }])
      setOnboardingStep('idle')
      setPendingTeammate(null)
      setIsThinking(false)
    } else if (isTeamChat) {
      setMessages([{
        id: 'team-welcome',
        role: 'assistant',
        content: 'Ask a question and the right teammate will respond based on their expertise.',
        timestamp: new Date(),
      }])
      setOnboardingStep('idle')
      setPendingTeammate(null)
      setIsThinking(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const addAssistantMessage = useCallback((msg: Partial<ChatMessage>) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      ...msg,
    }])
  }, [])

  const simulateThinking = useCallback((callback: () => void, delay = 1200) => {
    setIsThinking(true)
    thinkingTimerRef.current = setTimeout(() => {
      thinkingTimerRef.current = null
      setIsThinking(false)
      callback()
      playDoneSound()
    }, delay)
  }, [playDoneSound])

  /* ── Onboarding: handle New Agent flow ── */

  const startOnboarding = useCallback((input: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }])

    simulateThinking(() => {
      const notYetAdded = AVAILABLE_AGENTS.filter(t => !addedTeammates.has(t.id))
      const pool = notYetAdded.length > 0 ? notYetAdded : AVAILABLE_AGENTS
      const teammate = suggestTeammate(input, pool)
      setPendingTeammate(teammate)
      setOnboardingStep('meet')

      addAssistantMessage({
        content: `Based on what you need, I'd like you to meet **${teammate.firstName} ${teammate.lastName}**.`,
        profileCard: teammate,
        options: [
          { id: 'add', label: `Yes, add ${teammate.firstName} to my team`, action: 'add_teammate' },
          { id: 'skills', label: 'Tell me more about their skills', action: 'show_skills' },
          { id: 'other', label: 'Show me other agents', action: 'show_other' },
        ],
      })
    })
  }, [simulateThinking, addAssistantMessage, addedTeammates])

  const handleOnboardingOption = useCallback((option: ActionOption) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: option.label,
      timestamp: new Date(),
    }])

    if (!pendingTeammate) return

    simulateThinking(() => {
      switch (option.action) {
        case 'show_skills': {
          setOnboardingStep('skills')
          const skillsText = pendingTeammate.skills.map(s => {
            const stars = s.proficiency === 'expert' ? '⭐⭐⭐' : s.proficiency === 'competent' ? '⭐⭐' : '⭐'
            return `${stars} ${s.name} (${s.proficiency.charAt(0).toUpperCase() + s.proficiency.slice(1)})`
          }).join('\n')
          const capsText = pendingTeammate.capabilities.map(c => {
            return c.requiresApproval ? `⚠️ ${c.name} (requires your approval)` : `✓ ${c.name}`
          }).join('\n')

          addAssistantMessage({
            content: `Here's what ${pendingTeammate.firstName} can do:\n\n**Skills:**\n${skillsText}\n\n**Capabilities:**\n${capsText}`,
            options: [
              { id: 'add', label: `Looks good, add ${pendingTeammate.firstName}`, action: 'add_teammate' },
              { id: 'other', label: 'Show me other teammates', action: 'show_other' },
            ],
          })
          break
        }

        case 'add_teammate': {
          setOnboardingStep('permissions')
          const viewList = pendingTeammate.permissions.canView.map(p => p.replace(/_/g, ' ')).join(', ')
          const editList = pendingTeammate.permissions.canEdit.map(p => p.replace(/_/g, ' ')).join(', ')

          addAssistantMessage({
            content: `Great choice! ${pendingTeammate.firstName} can currently:\n\n👁 **View:** ${viewList}\n✏️ **Edit:** ${editList}\n\nThese are the default permissions. Is this okay?`,
            options: [
              { id: 'ok', label: 'These permissions are fine', action: 'permissions_ok' },
              { id: 'more', label: 'Give them more access', action: 'more_access' },
              { id: 'less', label: 'Restrict their access', action: 'less_access' },
            ],
          })
          break
        }

        case 'permissions_ok':
        case 'more_access':
        case 'less_access': {
          setOnboardingStep('access')
          addAssistantMessage({
            content: `Last question — who should be able to work with ${pendingTeammate.firstName}?`,
            options: [
              { id: 'private', label: 'Just me (private)', action: 'access_private' },
              { id: 'team', label: 'My team (Maintenance Team)', action: 'access_team' },
              { id: 'company', label: 'Everyone in the company', action: 'access_company' },
            ],
          })
          break
        }

        case 'access_private':
        case 'access_team':
        case 'access_company': {
          setOnboardingStep('complete')
          setAddedTeammates(prev => new Set([...prev, pendingTeammate.id]))
          setSelectedId(pendingTeammate.id)

          addAssistantMessage({
            content: `🎉 **${pendingTeammate.firstName} ${pendingTeammate.lastName}** has joined your team!\n\nThey're ready to help. You can adjust settings anytime.`,
            profileCard: pendingTeammate,
            options: [
              { id: 'chat', label: `Start working with ${pendingTeammate.firstName}`, action: 'start_chat' },
              { id: 'another', label: 'Create another agent', action: 'add_another' },
            ],
          })
          break
        }

        case 'start_chat': {
          setSelectedId(pendingTeammate.id)
          break
        }

        case 'add_another': {
          resetToWelcome()
          break
        }

        case 'show_other': {
          const otherTeammates = AVAILABLE_AGENTS.filter(t => t.id !== pendingTeammate.id)
          addAssistantMessage({
            content: `Here are some other agents you could create:\n\n${otherTeammates.map(t => `• **${t.firstName} ${t.lastName}** — ${t.jobTitle}`).join('\n')}`,
            options: otherTeammates.slice(0, 3).map(t => ({
              id: t.id,
              label: `Meet ${t.firstName} ${t.lastName}`,
              action: `meet_${t.id}`,
            })),
          })
          break
        }

        default: {
          if (option.action.startsWith('meet_')) {
            const meetId = option.action.replace('meet_', '')
            const newTeammate = AVAILABLE_AGENTS.find(t => t.id === meetId)
            if (newTeammate) {
              setPendingTeammate(newTeammate)
              setOnboardingStep('meet')
              addAssistantMessage({
                content: `Let me introduce **${newTeammate.firstName} ${newTeammate.lastName}**.`,
                profileCard: newTeammate,
                options: [
                  { id: 'add', label: `Yes, add ${newTeammate.firstName} to my team`, action: 'add_teammate' },
                  { id: 'skills', label: 'Tell me more about their skills', action: 'show_skills' },
                  { id: 'other', label: 'Show me other teammates', action: 'show_other' },
                ],
              })
            }
          }
          break
        }
      }
    })
  }, [pendingTeammate, simulateThinking, addAssistantMessage, resetToWelcome])

  /* ── Chat: handle teammate conversation ── */

  const handleTeammateChat = useCallback((input: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }])

    if (isTeamChat) {
      const matched = suggestTeammate(input)
      simulateThinking(() => {
        setMessages(prev => [...prev, {
          id: `resp-${Date.now()}`,
          role: 'teammate',
          content: getSimulatedResponse(matched, input),
          teammate: matched,
          timestamp: new Date(),
          options: [
            { id: '1', label: 'Can you go into more detail?', action: 'more' },
            { id: '2', label: 'Put together a report for me', action: 'report' },
            { id: '3', label: 'I have a different question', action: 'help' },
          ],
        }])
      })
    } else if (selectedTeammate) {
      simulateThinking(() => {
        setMessages(prev => [...prev, {
          id: `resp-${Date.now()}`,
          role: 'teammate',
          content: getSimulatedResponse(selectedTeammate, input),
          teammate: selectedTeammate,
          timestamp: new Date(),
          options: [
            { id: '1', label: 'Can you go into more detail?', action: 'more' },
            { id: '2', label: 'Put together a report for me', action: 'report' },
            { id: '3', label: 'What else can you help me with?', action: 'help' },
          ],
        }])
      })
    }
  }, [selectedTeammate, isTeamChat, simulateThinking])

  const handleSend = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    setLastSentPrompt(text)
    setChatInput('')

    if (isNewAgent) {
      startOnboarding(text)
    } else {
      handleTeammateChat(text)
    }
  }, [chatInput, isNewAgent, startOnboarding, handleTeammateChat])

  const handleStop = useCallback(() => {
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current)
      thinkingTimerRef.current = null
    }
    setIsThinking(false)
    setChatInput(lastSentPrompt)
    setMessages(prev => prev.filter(m => m.role !== 'user' || m.content !== lastSentPrompt))
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [lastSentPrompt])

  const handleChipClick = useCallback((chip: SuggestedChip) => {
    setChatInput(chip.prompt)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleOptionClick = useCallback((option: ActionOption) => {
    if (isNewAgent || onboardingStep !== 'idle') {
      handleOnboardingOption(option)
    } else {
      handleTeammateChat(option.label)
    }
  }, [isNewAgent, onboardingStep, handleOnboardingOption, handleTeammateChat])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  /* ── Render ── */

  const chatHeaderName = isNewAgent
    ? 'New Agent'
    : isTeamChat
      ? TEAM_CHAT.name
      : selectedTeammate
        ? `${selectedTeammate.firstName} ${selectedTeammate.lastName}`
        : ''

  const chatHeaderSub = isNewAgent
    ? 'Skills'
    : isTeamChat
      ? TEAM_CHAT.subtitle
      : selectedTeammate?.jobTitle || ''

  const showWelcomeScreen = isNewAgent && messages.length === 0

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-canvas)]">
      {/* ── Roster Panel (collapsed) ── */}
      <div className="hidden">
          {/* Roster list */}
          <div className="flex-1 overflow-y-auto px-2 hidden">
            {/* Favorites */}
            {filteredTeammates.filter(t => favorites.has(t.id)).length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-neutral-7)]">Favorites</p>
                {filteredTeammates.filter(t => favorites.has(t.id)).map((teammate) => (
                  <TeammateRosterCard
                    key={teammate.id}
                    teammate={teammate}
                    isSelected={selectedId === teammate.id}
                    isFavorite={true}
                    menuOpen={menuOpenId === teammate.id}
                    hasUnread={unreadIds.has(teammate.id)}
                    onSelect={() => setSelectedId(teammate.id)}
                    onToggleFavorite={() => toggleFavorite(teammate.id)}
                    onMenuToggle={() => setMenuOpenId(menuOpenId === teammate.id ? null : teammate.id)}
                    onMenuClose={() => setMenuOpenId(null)}
                  />
                ))}
              </>
            )}

            {/* All Agents */}
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-neutral-7)]">All Agents</p>

            {/* Multi Agent */}
            <button
              onClick={() => setSelectedId('team')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-xl)] mb-1 cursor-pointer transition-all duration-[var(--duration-fast)] ${
                isTeamChat
                  ? 'bg-[var(--color-accent-1)] border border-[var(--color-accent-7)] shadow-[0_0_0_1px_var(--color-accent-3)]'
                  : 'border border-transparent hover:bg-[var(--color-neutral-2)]'
              }`}
            >
              <div className="flex items-center shrink-0 -space-x-2">
                {EXISTING_AGENTS.map((t) => (
                  <img
                    key={t.id}
                    src={t.photo}
                    alt={t.firstName}
                    className="w-8 h-8 rounded-full object-cover border-2 border-[var(--surface-primary)]"
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-12)] truncate">{TEAM_CHAT.name}</p>
                <p className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-7)] truncate">{TEAM_CHAT.subtitle}</p>
              </div>
              {isTeamChat && <ChevronRight size={14} className="text-[var(--color-accent-9)] shrink-0" />}
            </button>

            {/* New Agent — only visible when actively creating */}
            {isNewAgent && (
              <button
                onClick={() => { setSelectedId('new'); resetToWelcome() }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-xl)] mb-1 cursor-pointer transition-all duration-[var(--duration-fast)] bg-[var(--color-accent-1)] border border-[var(--color-accent-7)] shadow-[0_0_0_1px_var(--color-accent-3)]"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent-9)] shrink-0">
                  <span className="text-[length:var(--font-size-md)] font-bold text-white">A</span>
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-12)] truncate">New Agent</p>
                  <p className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-7)] truncate">Skills</p>
                </div>
                <ChevronRight size={14} className="text-[var(--color-neutral-5)] shrink-0" />
              </button>
            )}
            {filteredTeammates.filter(t => !favorites.has(t.id)).map((teammate) => (
              <TeammateRosterCard
                key={teammate.id}
                teammate={teammate}
                isSelected={selectedId === teammate.id}
                isFavorite={false}
                menuOpen={menuOpenId === teammate.id}
                hasUnread={unreadIds.has(teammate.id)}
                onSelect={() => setSelectedId(teammate.id)}
                onToggleFavorite={() => toggleFavorite(teammate.id)}
                onMenuToggle={() => setMenuOpenId(menuOpenId === teammate.id ? null : teammate.id)}
                onMenuClose={() => setMenuOpenId(null)}
              />
            ))}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: 'linear-gradient(357.14deg, #F0F4FF 4.64%, #FFFFFF 97.57%)' }}>
          {/* Chat panel header */}
          <div className="flex items-center h-[60px] border-b border-[#E0E1E6] bg-white shrink-0">
            {/* Leading: sidebar toggle */}
            <div className="flex items-center justify-center w-[60px] h-[60px] border-r border-[#E0E1E6] shrink-0">
              <button
                onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                className="flex items-center justify-center w-8 h-8 rounded-[12px] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors duration-[var(--duration-fast)]"
                aria-label="Toggle sidebar"
              >
                <PanelLeft size={20} className="text-[#8B8D98]" />
              </button>
            </div>
            {/* Title */}
            <div className="flex items-center px-4 gap-4 flex-1 h-full">
              <h1 className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)] whitespace-nowrap">Chat</h1>
            </div>
            {/* Trailing actions */}
            <div className="flex items-center gap-4 px-4 shrink-0">
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[14px] font-medium text-white cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: '#1F2D5C' }}
              >
                <Sparkles size={16} className="shrink-0" aria-hidden />
                Try Supernova
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 rounded-[8px] border border-[#E0E1E6] hover:bg-[var(--color-neutral-2)] cursor-pointer transition-colors">
                    <MoreHorizontal size={16} className="text-[#1C2024]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} minWidth="180px">
                  <DropdownMenuItem textValue="Knowledge Base">
                    <BookOpen size={14} className="shrink-0 text-[var(--color-neutral-8)]" aria-hidden />
                    <span className="min-w-0 flex-1 text-left">Knowledge Base</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem textValue="Settings">
                    <Settings size={14} className="shrink-0 text-[var(--color-neutral-8)]" aria-hidden />
                    <span className="min-w-0 flex-1 text-left">Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Welcome screen */}
          {showWelcomeScreen || (isTeamChat && messages.length <= 1) ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
              {isNewAgent ? (
                <>
                  {/* New Assistant: blue "+" icon */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-accent-9)]">
                    <Plus size={28} className="text-white" />
                  </div>

                  <div className="flex flex-col items-center gap-2 text-center">
                    <h2 className="text-[length:var(--font-size-2xl)] font-bold text-[var(--color-neutral-12)]">
                      Let&apos;s build your new agent
                    </h2>
                    <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-8)] max-w-[420px] leading-relaxed">
                      Start by telling us what you need help with.
                      <br />
                      We&apos;ll suggest the right skills and set everything up.
                    </p>
                  </div>
                </>
              ) : (
                <h2 className="text-[length:var(--font-size-2xl)] font-bold text-[var(--color-neutral-12)]">
                  Hi Leti. How can I help?
                </h2>
              )}

              {/* Chat input */}
              <div className="w-full max-w-[660px]">
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-sm)] focus-within:border-[var(--color-accent-8)] focus-within:shadow-[0_0_0_3px_rgba(59,91,219,0.12)] transition-all duration-[var(--duration-normal)] cursor-text overflow-hidden"
                >
                  <textarea
                    ref={inputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    placeholder={isNewAgent ? 'What should this agent help you with?' : 'Ask anything'}
                    className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[length:var(--font-size-base)] text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-7)] outline-none! ring-0! shadow-none! leading-relaxed"
                  />
                  <div className="flex items-center px-3 pb-3 pt-1 gap-1.5">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--border-default)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors"
                    >
                      <Plus size={14} className="text-[var(--color-neutral-7)]" />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--border-default)] hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors"
                    >
                      <Clock size={14} className="text-[var(--color-neutral-7)]" />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors"
                    >
                      <Mic size={16} className="text-[var(--color-neutral-7)]" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSend() }}
                      disabled={!chatInput.trim()}
                      className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors ${
                        chatInput.trim()
                          ? 'bg-[var(--color-accent-9)] text-white hover:bg-[var(--color-accent-10)]'
                          : 'bg-[var(--color-accent-9)] text-white opacity-60'
                      }`}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  {isTeamChat && (
                    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--border-default)] bg-[var(--color-neutral-1)]">
                      <span className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-7)] shrink-0">Connect your tools to Nova</span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        {CONNECT_TOOLS.map((tool) => (
                          <img key={tool.name} src={tool.logo} alt={tool.name} title={tool.name} className="w-4 h-4 rounded-[2px] object-contain" />
                        ))}
                      </div>
                      <ChevronRight size={14} className="text-[var(--color-neutral-6)] shrink-0" />
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested chips */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {(isNewAgent ? BUILDER_CHIPS : CHAT_CHIPS).map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chip)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)] font-medium hover:bg-[var(--color-neutral-2)] hover:border-[var(--color-neutral-5)] cursor-pointer transition-all duration-[var(--duration-fast)]"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onOptionClick={handleOptionClick}
                  />
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 text-[length:var(--font-size-sm)] text-[var(--color-neutral-7)]">
                    <Sparkles size={14} className="text-[var(--color-accent-9)] animate-pulse" />
                    <span>Thinking</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat input bar */}
              <div className="px-6 pb-6">
                <div className="relative rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-sm)] focus-within:border-[var(--color-accent-8)] focus-within:shadow-[0_0_0_3px_rgba(59,91,219,0.12)] transition-all duration-[var(--duration-normal)]">
                  <div className="flex items-center px-4 py-3 gap-2">
                    <button className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors shrink-0">
                      <Plus size={16} className="text-[var(--color-neutral-7)]" />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-[length:var(--font-size-sm)] text-[var(--color-neutral-12)] placeholder:text-[var(--color-neutral-6)] outline-none! ring-0! shadow-none!"
                      placeholder={
                        isNewAgent
                          ? 'Describe what you need...'
                          : isTeamChat
                            ? 'Ask the team something...'
                            : `Ask ${selectedTeammate?.firstName || 'them'} something...`
                      }
                    />
                    <button className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[var(--color-neutral-3)] cursor-pointer transition-colors shrink-0">
                      <Mic size={16} className="text-[var(--color-neutral-7)]" />
                    </button>
                    {isThinking ? (
                      <button
                        onClick={handleStop}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-red-9,#e5484d)] text-white hover:opacity-90 cursor-pointer transition-colors shrink-0"
                        aria-label="Stop and edit"
                      >
                        <Square size={12} fill="currentColor" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!chatInput.trim()}
                        className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors shrink-0 ${
                          chatInput.trim()
                            ? 'bg-[var(--color-accent-9)] text-white hover:bg-[var(--color-accent-10)]'
                            : 'bg-[var(--color-neutral-3)] text-[var(--color-neutral-7)] opacity-40'
                        }`}
                      >
                        <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  )
}

/* ── Teammate Roster Card ── */

function TeammateRosterCard({
  teammate, isSelected, isFavorite, menuOpen, hasUnread,
  onSelect, onToggleFavorite, onMenuToggle, onMenuClose,
}: {
  teammate: Teammate
  isSelected: boolean
  isFavorite: boolean
  menuOpen: boolean
  hasUnread: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  onMenuToggle: () => void
  onMenuClose: () => void
}) {
  const avail = availabilityConfig[teammate.availability]

  return (
    <div
      className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-xl)] mb-1 cursor-pointer transition-colors duration-[var(--duration-fast)] ${
        isSelected ? 'bg-[var(--color-accent-1)] border border-[var(--color-accent-7)] shadow-[0_0_0_1px_var(--color-accent-3)]' : 'border border-transparent hover:bg-[var(--color-neutral-2)]'
      }`}
      onClick={onSelect}
    >
      <div className="relative shrink-0">
        <img
          src={teammate.photo}
          alt={`${teammate.firstName} ${teammate.lastName}`}
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--surface-primary)] ${avail.color}`} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <p className="text-[length:var(--font-size-sm)] font-semibold text-[var(--color-neutral-12)] truncate">
            {teammate.firstName}
          </p>
          {hasUnread && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-9)] shrink-0" />
          )}
        </div>
        <p className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-7)] truncate">{teammate.jobTitle.split(' ')[0]} Skill</p>
      </div>

      {/* Hover actions: star + 3-dot menu */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          className={`flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] transition-all duration-[var(--duration-fast)] ${
            isFavorite
              ? 'text-[var(--color-accent-9)] hover:bg-[var(--color-neutral-4)]'
              : 'text-[var(--color-neutral-8)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-accent-9)]'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); onMenuToggle() }}
            className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] text-[var(--color-neutral-8)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-neutral-4)] hover:text-[var(--color-neutral-11)] transition-all duration-[var(--duration-fast)]"
            aria-label="More actions"
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); onMenuClose() }} />
              <div className="absolute right-0 top-full mt-1 z-[9999] w-[160px] rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] py-1 overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); onMenuClose() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] transition-colors"
                >
                  <Pencil size={14} className="text-[var(--color-neutral-7)]" />
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMenuClose() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] transition-colors"
                >
                  <Copy size={14} className="text-[var(--color-neutral-7)]" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMenuClose() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[length:var(--font-size-sm)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-2)] transition-colors"
                >
                  <Archive size={14} className="text-[var(--color-neutral-7)]" />
                  Archive
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Message Bubble component ── */

function MessageBubble({
  message,
  onOptionClick,
}: {
  message: ChatMessage
  onOptionClick: (option: ActionOption) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[var(--color-neutral-3)] text-[var(--color-neutral-12)] px-4 py-3 rounded-2xl rounded-br-md text-[length:var(--font-size-sm)] leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  const isTeammateMsg = message.role === 'teammate' && message.teammate
  const photo = isTeammateMsg ? message.teammate!.photo : null
  const name = isTeammateMsg ? message.teammate!.firstName : null

  return (
    <div className="flex flex-col gap-3 max-w-[85%]">
      {/* Message content */}
      {message.content && (
        <div className="flex items-center gap-3">
          {photo ? (
            <img src={photo} alt={name || ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="flex items-center shrink-0 -space-x-1.5">
              {EXISTING_AGENTS.map((t) => (
                <img
                  key={t.id}
                  src={t.photo}
                  alt={t.firstName}
                  className="w-6 h-6 rounded-full object-cover border-[1.5px] border-[var(--surface-primary)]"
                />
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-12)] leading-relaxed whitespace-pre-line">
              <FormattedText text={message.content} />
            </div>
          </div>
        </div>
      )}

      {/* Profile card */}
      {message.profileCard && (
        <div className="ml-11 border border-[var(--border-default)] rounded-2xl p-5 bg-[var(--surface-primary)]">
          <div className="flex items-center gap-4 mb-3">
            <img
              src={message.profileCard.photo}
              alt={`${message.profileCard.firstName} ${message.profileCard.lastName}`}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <p className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-12)]">
                {message.profileCard.firstName} {message.profileCard.lastName}
              </p>
              <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-8)]">
                {message.profileCard.jobTitle}
              </p>
            </div>
          </div>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)] leading-relaxed mb-3 italic">
            &ldquo;{getTeammateGreeting(message.profileCard)}&rdquo;
          </p>
          <div className="flex flex-wrap gap-1.5">
            {message.profileCard.skills.map((s) => {
              const stars = s.proficiency === 'expert' ? '⭐⭐⭐' : s.proficiency === 'competent' ? '⭐⭐' : '⭐'
              return (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--color-neutral-2)] text-[length:var(--font-size-xs)] text-[var(--color-neutral-9)] font-medium"
                >
                  {s.name} {stars}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommended steps / options */}
      {message.options && message.options.length > 0 && (
        <div className="ml-11 border border-[var(--border-default)] rounded-2xl p-5 bg-[var(--surface-primary)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-neutral-7)] mb-2">Recommended Steps</p>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-9)] mb-3">what would you like to….</p>
          <div className="flex flex-col gap-2">
            {message.options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => onOptionClick(opt)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] text-left text-[length:var(--font-size-sm)] text-[var(--color-neutral-12)] font-medium hover:bg-[var(--color-neutral-2)] hover:border-[var(--color-neutral-5)] cursor-pointer transition-all duration-[var(--duration-fast)]"
              >
                <span>{i + 1}. {opt.label}</span>
                <ArrowRight size={14} className="text-[var(--color-neutral-5)] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Formatted text (bold markdown) ── */

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

/* ── Simulated teammate response ── */

function getSimulatedResponse(teammate: Teammate, input: string): string {
  switch (teammate.id) {
    case 'sofia':
      return `I took a look at your request about "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}". I found some interesting patterns in your work order data.\n\nYour team has 12 open work orders — 3 are critical and overdue. I'd suggest prioritizing the HVAC issues in Building A first.\n\nWant me to create a detailed breakdown?`
    case 'marcus':
      return `Analyzing your request: "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}"\n\nYour PM schedule has 3 conflicts this week. I've identified the most efficient resolution path that minimizes technician downtime.\n\nShould I walk you through the optimized schedule?`
    case 'elena':
      return `I've processed your request about "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}". You have 15 new requests since yesterday.\n\nI've already sorted them by urgency — 4 are critical, 6 are medium priority, and 5 are low. Let me walk you through the critical ones first.`
    case 'david':
      return `Looking into "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}"\n\nQuick inventory update: 4 items are below reorder threshold. I've prepared the PO details — they just need your approval to send.\n\nWant me to show the full inventory status?`
    case 'amanda':
      return `I've reviewed your request regarding "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}"\n\nI completed the compliance review for Q3 inspections. 94% compliance rate overall. Two items require attention before the audit deadline on March 30.\n\nShall I prepare the detailed audit report?`
    default:
      return `I'm working on "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}". Let me get back to you with my analysis.`
  }
}
