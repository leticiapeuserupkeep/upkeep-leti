'use client'

import { useState, useEffect, useRef, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Info, Check, X, ChevronDown } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

/* ── Helpers ── */

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
]

function isValidPassword(password: string) {
  return PW_RULES.every(r => r.test(password))
}

/* ── Country selector ── */

const COUNTRIES = [
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
]

interface Country { code: string; name: string; dial: string; flag: string }

function CountrySelector({ selected, onSelect }: { selected: Country; onSelect: (c: Country) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      const el = document.getElementById('country-dropdown-root')
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div id="country-dropdown-root" className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 border-r border-[#E0E1E6] cursor-pointer hover:bg-[#F9F9FB] transition-colors h-full outline-none"
      >
        <span className="text-[18px] leading-none">{selected.flag}</span>
        <span className="text-[13px] font-medium text-[#60646C]">{selected.dial}</span>
        <ChevronDown size={13} className={`text-[#8B8D98] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-[#E0E1E6] rounded-[12px] shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-[#F0F0F3]">
            <input
              autoFocus
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-[14px] bg-[#F9F9FB] rounded-[8px] outline-none placeholder:text-[#8B8D98] text-[#1D222B]"
            />
          </div>
          <ul className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-[13px] text-[#8B8D98]">No results</li>
            )}
            {filtered.map(c => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[#F5F5FF] transition-colors ${c.code === selected.code ? 'bg-[#F0F0FF]' : ''}`}
                >
                  <span className="text-[18px] leading-none w-6 shrink-0">{c.flag}</span>
                  <span className="flex-1 text-[14px] text-[#1D222B] truncate">{c.name}</span>
                  <span className="text-[13px] text-[#8B8D98] shrink-0">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── Shared UI pieces ── */

function Divider() {
  return (
    <div className="flex items-center gap-3 w-full py-4">
      <div className="flex-1 h-px bg-[#E0E1E6]" />
      <span className="text-[14px] font-medium text-[#1D222B] whitespace-nowrap">Or</span>
      <div className="flex-1 h-px bg-[#E0E1E6]" />
    </div>
  )
}

interface TabsProps {
  tab: 'signin' | 'signup'
  setTab: (t: 'signin' | 'signup') => void
}

function TabSwitcher({ tab, setTab }: TabsProps) {
  return (
    <div className="flex items-center bg-[#E6EDFE] px-[4px] py-[4px] rounded-[36px] shrink-0">
      <button
        onClick={() => setTab('signup')}
        className={`px-10 py-2 rounded-full text-[14px] transition-all cursor-pointer [font-family:'Poppins',sans-serif] ${
          tab === 'signup' ? 'bg-white font-semibold text-black' : 'font-normal text-[#4B7BF5]/70'
        }`}
      >
        FREE Trial
      </button>
      <button
        onClick={() => setTab('signin')}
        className={`px-10 py-2 rounded-full text-[14px] transition-all cursor-pointer [font-family:'Poppins',sans-serif] ${
          tab === 'signin' ? 'bg-white font-semibold text-black' : 'font-normal text-[#4B7BF5]/70'
        }`}
      >
        Sign In
      </button>
    </div>
  )
}

/* ── Validated input field ── */

interface FieldProps {
  label?: string
  labelSuffix?: React.ReactNode
  id: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  required?: boolean
  suffix?: React.ReactNode
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: () => void
  onFocus?: () => void
  error?: string
  hasError?: boolean
}

function InputField({ label, labelSuffix, id, type = 'text', inputMode, placeholder, required, suffix, value, onChange, onBlur, onFocus, error, hasError }: FieldProps) {
  const [focused, setFocused] = useState(false)

  const borderClass = focused
    ? 'border border-[#4B7BF5]'
    : hasError
    ? 'border border-[#E5484D]'
    : 'border border-[#E0E1E6]'

  const handleFocus = () => { setFocused(true); onFocus?.() }
  const handleBlur = () => { setFocused(false); onBlur?.() }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="text-[14px] font-semibold text-[#1D222B]">
            {label}
            {required && <span className="text-[#CC4E00] ml-0.5">*</span>}
          </label>
          {labelSuffix}
        </div>
      )}
      <div className={`flex items-center h-[48px] rounded-[12px] bg-white overflow-hidden transition-all ${borderClass}`}>
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-invalid={hasError && !focused}
          aria-describedby={error && !focused ? `${id}-error` : undefined}
          className="flex-1 px-4 py-2 text-[16px] text-[#1D222B] placeholder:text-[#8B8D98] outline-none border-0 bg-transparent"
        />
        {suffix}
      </div>
      {error && !focused && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-[13px] text-[#E5484D] font-medium animate-[fadeIn_0.15s_ease]">
          <X size={13} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/* ── Password requirements checklist (floating, animated) ── */

function PasswordRequirements({ password, visible }: { password: string; visible: boolean }) {
  // phase 1 = flash green, phase 2 = collapse+fade out
  const [phases, setPhases] = useState<Record<string, 1 | 2>>({})
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const prevPw = useRef('')

  useEffect(() => {
    const prev = prevPw.current
    prevPw.current = password

    if (!password) { setPhases({}); setHidden(new Set()); return }

    const justMet = PW_RULES.filter(r => r.test(password) && !r.test(prev)).map(r => r.label)
    if (!justMet.length) return

    setPhases(p => { const n = { ...p }; justMet.forEach(l => { n[l] = 1 }); return n })
    const t1 = setTimeout(() =>
      setPhases(p => { const n = { ...p }; justMet.forEach(l => { n[l] = 2 }); return n }), 450)
    const t2 = setTimeout(() =>
      setHidden(h => new Set([...h, ...justMet])), 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [password])

  const visibleRules = PW_RULES.filter(r => !hidden.has(r.label))
  if (!visible || !visibleRules.length) return null

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#E0E1E6] shadow-lg rounded-[12px] px-3 py-3 text-[13px] animate-[fadeIn_0.15s_ease]">
      <p className="font-semibold text-[#1D222B] mb-1.5">Password requirements:</p>
      <div className="flex flex-col gap-1.5">
        {visibleRules.map(rule => {
          const phase = phases[rule.label]
          const isGreen = phase === 1 || phase === 2
          const isCollapsing = phase === 2
          return (
            <div
              key={rule.label}
              className="flex items-center gap-2 overflow-hidden"
              style={{
                maxHeight: isCollapsing ? '0px' : '32px',
                opacity: isCollapsing ? 0 : 1,
                marginBottom: isCollapsing ? '-6px' : undefined,
                transition: isCollapsing ? 'max-height 0.35s ease, opacity 0.3s ease, margin 0.35s ease' : undefined,
              }}
            >
              <span
                className="flex items-center justify-center w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: isGreen ? '#30A46C' : '#E0E1E6', transition: 'background-color 0.3s ease' }}
              >
                <Check size={10} className="text-white" />
              </span>
              <span style={{ color: isGreen ? '#30A46C' : '#8B8D98', fontWeight: isGreen ? 500 : 400, transition: 'color 0.3s ease' }}>
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Secondary action button with hover info tooltip ── */

function SecondaryActionButton({ label, tooltip }: { label: string; tooltip: string }) {
  const [hovered, setHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative w-full">
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowTooltip(false) }}
        className="flex items-center justify-center gap-2 w-full h-[48px] border rounded-[12px] text-[16px] font-medium text-[#1C2024] transition-all duration-200 cursor-pointer"
        style={{
          background: hovered ? '#F9F9FB' : '#ffffff',
          borderColor: hovered ? '#C1C2CC' : '#E0E1E6',
        }}
      >
        {label}
        <span
          className="flex items-center shrink-0"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={16} className="text-[#8B8D98] hover:text-[#4B7BF5] transition-colors" />
        </span>
      </button>

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 w-[260px] bg-[#1D222B] text-white text-[13px] leading-[1.5] font-medium px-3 py-2.5 rounded-[8px] shadow-lg pointer-events-none"
        >
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1D222B]" />
        </div>
      )}
    </div>
  )
}

function MagicLinkButton() {
  return (
    <SecondaryActionButton
      label="Send me a Magic Link"
      tooltip="We'll send a secure link to your inbox so you can sign in without a password."
    />
  )
}

/* ── Sign In form ── */

function SignInForm({ tab, setTab }: TabsProps) {
  const [showPw, setShowPw] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [ssoView, setSsoView] = useState<null | 'email' | 'companyId'>(null)
  const [ssoInput, setSsoInput] = useState('')
  const [ssoSuccess, setSsoSuccess] = useState(false)
  const [forgotView, setForgotView] = useState<null | 'form' | 'sent'>(null)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotEmailTouched, setForgotEmailTouched] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const emailValid = isValidEmail(email)
  const passwordValid = isValidPassword(password)
  const canSubmit = emailValid && passwordValid

  function handleEmailBlur() {
    setEmailTouched(true)
    if (!email) {
      setEmailError('Email is required.')
    } else if (!emailValid) {
      setEmailError('Please enter a valid email address.')
    } else {
      setEmailError('')
    }
  }

  function handlePasswordBlur() {
    setPwFocused(false)
    setPasswordTouched(true)
    if (!password) {
      setPasswordError('Password is required.')
    } else if (!passwordValid) {
      setPasswordError('Password must meet all requirements.')
    } else {
      setPasswordError('')
    }
  }

  if (signedIn) {
    return (
      <>
        <TabSwitcher tab={tab} setTab={setTab} />
        <div className="flex flex-col items-center justify-center gap-4 w-full flex-1 text-center py-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EEF3FF]">
            <Check size={32} className="text-[#4B7BF5]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold leading-[34px] text-[#1D222B]">Congrats!</h1>
            <p className="text-[16px] text-[#60646C]">You've successfully signed in.</p>
          </div>
        </div>
      </>
    )
  }

  if (forgotView) {
    return (
      <>
        <TabSwitcher tab={tab} setTab={setTab} />
        <div className="flex flex-col gap-3 w-full flex-1 justify-center">
          <div className="flex flex-col gap-1 pt-[12px]">
            <h1 className="text-[28px] font-bold leading-[34px] text-[#1D222B]">Forgot Password</h1>
            <p className="text-[15px] text-[#60646C] leading-[22px] pt-[20px]">
              {forgotView === 'form'
                ? "Enter the email address you registered with and we'll send you instructions to reset your password."
                : "If an account exists for that email, you'll receive a link to reset your password."}
            </p>
          </div>
          {forgotView === 'form' && (
            <div className="flex flex-col gap-[20px] w-full">
              <div className="py-[20px]">
              <InputField
                id="forgot-email"
                label="Email"
                type="email"
                inputMode="email"
                required
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value.replace(/[^a-zA-Z0-9._+\-@]/g, ''))}
                onBlur={() => { if (forgotEmail.length > 0) setForgotEmailTouched(true) }}
                hasError={forgotEmailTouched && forgotEmail.length > 0 && !isValidEmail(forgotEmail)}
                error={forgotEmailTouched && forgotEmail.length > 0 && !isValidEmail(forgotEmail) ? 'Please enter a valid email address.' : ''}
              />
              </div>
              <Button
                variant="primary"
                disabled={!isValidEmail(forgotEmail)}
                className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold transition-all"
                onClick={() => setForgotView('sent')}
              >
                Continue
              </Button>
            </div>
          )}
        </div>
        <button type="button" onClick={() => { setForgotView(null); setForgotEmail(''); setForgotEmailTouched(false) }} className="text-[13px] font-medium text-[#9CA3AF] underline underline-offset-2 hover:text-[#6B7280] transition-colors cursor-pointer self-start">
          Back to Sign In
        </button>
      </>
    )
  }

  if (ssoView) {
    if (ssoSuccess) {
      return (
        <>
          <TabSwitcher tab={tab} setTab={setTab} />
          <div className="flex flex-col items-center justify-center gap-4 w-full flex-1 text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EEF3FF]">
              <Check size={32} className="text-[#4B7BF5]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] font-bold leading-[34px] text-[#1D222B]">Congrats!</h1>
              <p className="text-[16px] text-[#60646C]">You've successfully signed in.</p>
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        <TabSwitcher tab={tab} setTab={setTab} />
        <div className="flex flex-col gap-3 w-full flex-1 justify-center py-[20px]">
          <div className="flex flex-col gap-1 pt-[12px]">
            <h1 className="text-[28px] font-bold leading-[34px] text-[#1D222B]">Single Sign-On</h1>
            <p className="text-[15px] text-[#60646C] leading-[22px]">Enter your {ssoView === 'email' ? 'email' : 'company ID'} and we'll redirect you to your company's SSO provider.</p>
          </div>
          <div className="flex flex-col gap-[20px] w-full">
            <div className="py-[20px]">
            <InputField
              id="sso-input"
              label={ssoView === 'email' ? 'Email' : 'Company ID'}
              labelSuffix={ssoView === 'companyId' ? (
                <span className="relative group">
                  <Info size={14} className="text-[#8B8D98] cursor-pointer" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[240px] rounded-[8px] bg-[#1D222B] px-3 py-2 text-[12px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    Your company ID is provided by your IT admin or found in your SSO provider's dashboard under your organization settings.
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D222B]" />
                  </span>
                </span>
              ) : undefined}
              type={ssoView === 'email' ? 'email' : 'text'}
              inputMode={ssoView === 'email' ? 'email' : 'text'}
              required
              value={ssoInput}
              onChange={e => setSsoInput(e.target.value)}
              error=""
            />
            </div>
            <Button
              variant="primary"
              disabled={!ssoInput}
              className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold transition-all"
              onClick={() => setSsoSuccess(true)}
            >
              Continue
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between w-full">
          <button type="button" onClick={() => { setSsoView(null); setSsoInput('') }} className="text-[13px] font-medium text-[#9CA3AF] underline underline-offset-2 hover:text-[#6B7280] transition-colors cursor-pointer">
            Back to Sign In
          </button>
          <button type="button" onClick={() => { setSsoInput(''); setSsoView(ssoView === 'email' ? 'companyId' : 'email') }} className="text-[13px] font-medium text-[#4B7BF5] underline underline-offset-2 hover:text-[#3B6AE0] transition-colors cursor-pointer">
            {ssoView === 'email' ? 'Use company ID instead' : 'Use email instead'}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <TabSwitcher tab={tab} setTab={setTab} />

      <div className="flex flex-col gap-1 text-center w-full pt-[12px]">
        <h1 className="text-[28px] font-bold leading-[34px] text-[#1D222B]">Welcome back to UpKeep</h1>
        <p className="text-[16px] text-[#60646C]">Sign in to keep work moving.</p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-[16px] w-full">
          <InputField
            id="email"
            label="Email"
            type="email"
            inputMode="email"
            required
            value={email}
            onChange={e => { const v = e.target.value.replace(/[^a-zA-Z0-9._+\-@]/g, ''); setEmail(v); if (emailTouched && isValidEmail(v)) setEmailError('') }}
            onBlur={handleEmailBlur}
            hasError={!!emailError}
            error={emailError}
          />

          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <InputField
                id="password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => { setPassword(e.target.value); if (passwordTouched && isValidPassword(e.target.value)) setPasswordError('') }}
                onFocus={() => setPwFocused(true)}
                onBlur={handlePasswordBlur}
                hasError={!!passwordError}
                error={passwordError}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="px-4 text-[#8B8D98] hover:text-[#1D222B] transition-colors cursor-pointer border-0 outline-none bg-transparent"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <PasswordRequirements password={password} visible={pwFocused} />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setForgotView('form')} className="text-[12px] text-[#9CA3AF] underline underline-offset-2 hover:text-[#6B7280] transition-colors cursor-pointer">Forgot password?</button>
            </div>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-3 w-full flex-1 justify-end">
        <Button
          variant="primary"
          disabled={!canSubmit}
          className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold transition-all"
          onClick={() => setSignedIn(true)}
        >
          Sign In
        </Button>

        <div className="flex items-center gap-3 w-full flex-1 py-6">
          <div className="flex-1 h-px bg-[#E0E1E6]" />
          <span className="text-[13px] text-[#8B8D98]">or</span>
          <div className="flex-1 h-px bg-[#E0E1E6]" />
        </div>

        <button
          type="button"
          onClick={() => setSsoView('email')}
          className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold border border-[#E0E1E6] text-[#1D222B] hover:bg-[#F5F7FF] hover:border-[#4B7BF5] transition-all cursor-pointer flex items-center justify-center"
        >
          Continue with SSO
          <span className="relative ml-2 group">
            <Info size={16} className="text-[#8B8D98]" />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] rounded-[8px] bg-[#1D222B] px-3 py-2 text-[12px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Single Sign-On — log in with your company's identity provider
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D222B]" />
            </span>
          </span>
        </button>
      </div>

      <p className="text-[13px] text-[#8B8D98] text-center">
        By continuing, you agree to our{' '}
        <a href="#" className="underline hover:text-[#1D222B] transition-colors">Terms of Service</a>
      </p>

    </>
  )
}

/* ── Sign Up form ── */

function SignUpForm({ tab, setTab }: TabsProps) {
  const [showPw, setShowPw] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState<Country>(COUNTRIES[0])
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)

  const emailValid = isValidEmail(email)
  const passwordValid = isValidPassword(password)
  const canSubmit = emailValid && passwordValid && !!phone

  function handleEmailBlur() {
    setEmailTouched(true)
    if (!email) setEmailError('Email is required.')
    else if (!emailValid) setEmailError('Please enter a valid email address.')
    else setEmailError('')
  }

  function handlePasswordBlur() {
    setPwFocused(false)
    setPasswordTouched(true)
    if (!password) setPasswordError('Password is required.')
    else if (!passwordValid) setPasswordError('Password must meet all requirements.')
    else setPasswordError('')
  }

  if (creatingAccount) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 gap-8 px-4 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full border-4 border-[#E6EDFE] border-t-[#4B7BF5] animate-spin" />
          <div className="flex flex-col gap-3">
            <h2 className="text-[22px] font-bold leading-[28px] text-[#1D222B]">Welcome to UpKeep!</h2>
            <p className="text-[15px] text-[#60646C] leading-[22px] max-w-[320px]">
              We're setting up your account so you can start working in UpKeep right away.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <TabSwitcher tab={tab} setTab={setTab} />

      <div className="flex flex-col gap-1 text-center w-full pt-[12px]">
        <h1 className="text-[28px] font-bold leading-[34px] text-[#1D222B]">Start a <span className="text-[#4B7BF5]">FREE</span> trial</h1>
        <p className="text-[16px] text-[#60646C]">Sign up to get started with UpKeep. No credit card required.</p>
      </div>

      <div className="flex flex-col gap-3 w-full flex-1">
        <div className="flex flex-col gap-[16px] w-full flex-1 justify-center">
        <div className="flex gap-[24px] w-full">
          <div className="flex-1 min-w-0">
            <InputField
              id="signup-firstname"
              label="First Name"
              type="text"
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              error=""
            />
          </div>
          <div className="flex-1 min-w-0">
            <InputField
              id="signup-lastname"
              label="Last Name"
              type="text"
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              error=""
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="phone" className="text-[14px] font-semibold text-[#1D222B]">
            Mobile Number <span className="text-[#CC4E00]">*</span>
          </label>
          <div className={`flex items-center h-[48px] rounded-[12px] bg-white transition-all ${!phone && passwordTouched ? 'border border-[#E5484D] has-[input:focus]:border-[#4B7BF5]' : 'border border-[#E0E1E6] has-[input:focus]:border-[#4B7BF5]'}`}>
            <CountrySelector selected={country} onSelect={setCountry} />
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="flex-1 px-3 py-2 text-[16px] text-[#1D222B] placeholder:text-[#8B8D98] outline-none bg-transparent"
            />
          </div>
        </div>
        <div className="flex gap-[24px] w-full">
          <div className="flex-1 min-w-0">
            <InputField
              id="signup-email"
              label="Email"
              type="email"
              inputMode="email"
              required
              value={email}
              onChange={e => { const v = e.target.value.replace(/[^a-zA-Z0-9._+\-@]/g, ''); setEmail(v); if (emailTouched && isValidEmail(v)) setEmailError('') }}
              onBlur={handleEmailBlur}
              hasError={!!emailError}
              error={emailError}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="relative">
              <InputField
                id="signup-password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => { setPassword(e.target.value); if (passwordTouched && isValidPassword(e.target.value)) setPasswordError('') }}
                onFocus={() => setPwFocused(true)}
                onBlur={handlePasswordBlur}
                hasError={!!passwordError}
                error={passwordError}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="px-4 text-[#8B8D98] hover:text-[#1D222B] transition-colors cursor-pointer border-0 outline-none bg-transparent"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <PasswordRequirements password={password} visible={pwFocused} />
            </div>
          </div>
        </div>
        </div>

        <Button
          variant="primary"
          disabled={!canSubmit}
          className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold mt-1 transition-all"
          onClick={() => setCreatingAccount(true)}
        >
          Create Account
        </Button>
      </div>

      <p className="text-[13px] text-[#8B8D98] text-center">
        By continuing, you agree to our{' '}
        <a href="#" className="underline hover:text-[#1D222B] transition-colors">Terms of Service</a>
      </p>
    </>
  )
}

/* ── Rotating background slides ── */

const BG_IMAGES = [
  '/images/login/bg1.png',
  '/images/login/bg2.png',
  '/images/login/bg3.png',
  '/images/login/bg4.png',
  '/images/login/bg5.png',
]

const SIGNIN_SLIDES = [
  { phrase: 'Keep maintenance running without the chaos', sub: 'Sign in to manage work orders, assets, inspections, and operations in one place.' },
  { phrase: 'The platform built for modern maintenance teams', sub: 'Log in to stay on top of work, reduce downtime, and keep operations moving.' },
  { phrase: 'One place for work orders, assets, and uptime', sub: 'Sign in to keep your team aligned and your maintenance work on track.' },
  { phrase: 'Maintenance management, built to keep work moving', sub: 'Log in to access your team, tasks, assets, and daily operations.' },
  { phrase: 'Trusted by thousands of maintenance teams', sub: 'Sign in to simplify work orders, inspections, and asset management.' },
]

const SIGNUP_SLIDES = [
  { phrase: 'Start managing maintenance with confidence', sub: 'Create your account to organize work orders, assets, inspections, and teams in one place.' },
  { phrase: 'The smarter way to run maintenance', sub: 'Sign up to bring work orders, asset data, and team operations together.' },
  { phrase: 'Built for teams that keep operations running', sub: 'Create your account to manage maintenance, safety, and daily work more efficiently.' },
  { phrase: 'Keep work orders, assets, and teams in sync', sub: 'Sign up to simplify maintenance management from day one.' },
  { phrase: 'CMMS, maintenance, and work order management in one place', sub: 'Create your account and start streamlining maintenance operations.' },
]

/* ── Page ── */

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % BG_IMAGES.length), 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Background image layers — crossfade independently of tab */}
      <div className="absolute inset-0 pointer-events-none">
        {BG_IMAGES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${s}')`,
              opacity: i === slide ? 1 : 0,
              transition: 'opacity 1.5s ease',
            }}
          />
        ))}
      </div>

      {/* Top header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-8 h-[64px] bg-white border-b border-[#E8E8EC]">
        <div className="flex items-center gap-8">
          <Link href="/" className="relative h-[28px] w-[124px] shrink-0 block">
            <Image src="/images/logo-upkeep.svg" alt="UpKeep" fill className="object-contain object-left" />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {['Product','Solutions','Resources','Pricing'].map(item => (
              <button key={item} className="flex items-center gap-1 text-[14px] font-medium text-[#1D222B] hover:text-[#4B7BF5] transition-colors cursor-pointer px-3 py-2 rounded-[6px] hover:bg-[#F5F7FF]">
                {item}
                {item !== 'Pricing' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#60646C] hover:text-[#1D222B] transition-colors cursor-pointer rounded-[6px] hover:bg-[#F5F7FF]" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button onClick={() => setTab('signin')} className="text-[14px] font-medium text-[#1D222B] hover:text-[#4B7BF5] transition-colors cursor-pointer px-3 py-2 rounded-[6px] hover:bg-[#F5F7FF]">Sign in</button>
          <button onClick={() => setTab('signup')} className="text-[14px] font-semibold text-white bg-[#4B7BF5] hover:bg-[#3B6BE5] transition-colors px-4 py-2 rounded-[8px] cursor-pointer">Start a Free Trial</button>
          <button className="p-2 text-[#60646C] hover:text-[#1D222B] transition-colors cursor-pointer rounded-[6px] hover:bg-[#F5F7FF]" aria-label="Language">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </button>
        </div>
      </div>

      {/* Main content — flex-col fills viewport, social proof sits below card row */}
      <div className="flex flex-col h-screen pt-[64px] relative z-10 overflow-y-auto">
      {/* Centered container */}
      <div className="flex items-start w-full max-w-[1300px] mx-auto p-[40px] max-lg:p-6 h-auto">
        {/* Left panel — hidden on small screens */}
        <div className="hidden lg:flex flex-1 flex-col items-start justify-center min-w-0 px-6 self-center">
          <div className="flex flex-col gap-10 items-start">
            <div className="relative h-[34px] w-[151px] shrink-0">
              <Image src="/images/logo-upkeep.svg" alt="UpKeep" fill className="object-contain object-left brightness-0 invert" priority />
            </div>
            <div className="flex flex-col gap-3">
              <p
                key={`${tab}-${slide}`}
                className="text-white font-extrabold text-[42px] leading-[48px] max-w-[400px]"
                style={{ animation: 'phraseIn 0.7s ease forwards' }}
              >
                {(tab === 'signin' ? SIGNIN_SLIDES : SIGNUP_SLIDES)[slide].phrase}
              </p>
              <p
                key={`sub-${tab}-${slide}`}
                className="text-white/70 text-[16px] leading-[24px] max-w-[380px]"
                style={{ animation: 'phraseIn 0.7s ease forwards' }}
              >
                {(tab === 'signin' ? SIGNIN_SLIDES : SIGNUP_SLIDES)[slide].sub}
              </p>
            </div>
          </div>
        </div>

        {/* Card + below-card text — always fills height, card scrolls when needed */}
        <div className="flex flex-col gap-4 shrink-0 w-full max-w-[626px] max-lg:self-stretch">
          <div className="bg-white flex flex-col rounded-[32px] w-full shadow-2xl overflow-hidden max-lg:flex-1 max-lg:overflow-y-auto">
            <div
              key={tab}
              className={`flex flex-col items-center gap-4 w-full px-[32px] py-[32px] max-lg:px-6 min-h-[647px] h-auto ${tab === 'signin' ? 'pb-[37px]' : ''}`}
              style={{ animation: 'cardIn 0.5s ease forwards' }}
            >
              {tab === 'signin'
                ? <SignInForm tab={tab} setTab={setTab} />
                : <SignUpForm tab={tab} setTab={setTab} />
              }
            </div>
          </div>
          {tab === 'signup' && (
            <p className="text-white/80 text-[14px] text-center shrink-0 relative z-10">
              Not Ready Yet?{' '}
              <a href="#" className="font-semibold text-white underline underline-offset-2 hover:text-white/90 transition-colors">
                Schedule a tour
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Social proof — below centered row */}
      <div className="hidden lg:flex flex-col items-center gap-3 pb-6 pt-[28px]">
        <p className="text-white/50 text-[14px] font-semibold tracking-[0.12em] uppercase">Join 4,000+ companies already growing</p>
        <div className="flex items-center justify-center gap-[32px] opacity-40 pt-[12px]">
          <img src="/images/login/unilever.svg" alt="Unilever" className="h-[28px]" />
          <img src="/images/login/aramark.svg" alt="Aramark" className="h-[26px]" />
          <img src="/images/login/mcdonalds.svg" alt="McDonald's" className="h-[30px]" />
          <img src="/images/login/yamaha.svg" alt="Yamaha" className="h-[30px]" />
          <img src="/images/login/shell.svg" alt="Shell" className="h-[30px]" />
          <img src="/images/login/marriott.svg" alt="Marriott" className="h-[26px]" />
          <img src="/images/login/subway.svg" alt="Subway" className="h-[26px]" />
        </div>
      </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes phraseIn {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
