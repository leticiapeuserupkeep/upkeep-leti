'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Info } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect width="20" height="20" rx="2" fill="#B22234" />
      <rect y="1.54" width="20" height="1.54" fill="white" />
      <rect y="4.62" width="20" height="1.54" fill="white" />
      <rect y="7.69" width="20" height="1.54" fill="white" />
      <rect y="10.77" width="20" height="1.54" fill="white" />
      <rect y="13.85" width="20" height="1.54" fill="white" />
      <rect y="16.92" width="20" height="1.54" fill="white" />
      <rect width="8" height="10.77" fill="#3C3B6E" />
    </svg>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 w-full py-5">
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
    <div className="flex items-center bg-[#E6EDFE] px-[10px] py-[8px] rounded-[36px] shrink-0">
      <button
        onClick={() => setTab('signup')}
        className={`px-10 py-2 rounded-full text-[14px] transition-colors cursor-pointer ${
          tab === 'signup' ? 'bg-white font-semibold text-black' : 'font-normal text-black'
        }`}
      >
        Sign Up
      </button>
      <button
        onClick={() => setTab('signin')}
        className={`px-10 py-2 rounded-full text-[14px] transition-colors cursor-pointer ${
          tab === 'signin' ? 'bg-white font-semibold text-black' : 'font-normal text-black'
        }`}
      >
        Sign In
      </button>
    </div>
  )
}

function InputField({
  label,
  id,
  type = 'text',
  placeholder,
  required,
  suffix,
  value,
  onChange,
}: {
  label?: string
  id: string
  type?: string
  placeholder?: string
  required?: boolean
  suffix?: React.ReactNode
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-[14px] font-semibold text-[#1D222B]">
          {label}{required && <span className="text-[#CC4E00] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex items-center border border-[#E0E1E6] rounded-[12px] bg-white overflow-hidden focus-within:border-[#4B7BF5] transition-colors">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="flex-1 px-4 py-4 text-[16px] text-[#1D222B] placeholder:text-[#8B8D98] outline-none bg-transparent"
        />
        {suffix}
      </div>
    </div>
  )
}

function SignInForm({ tab, setTab }: TabsProps) {
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <>
      <TabSwitcher tab={tab} setTab={setTab} />

      <div className="flex flex-col gap-1 text-center w-full py-5">
        <h1 className="text-[32px] font-bold leading-[36px] text-[#1D222B]">Welcome back to UpKeep</h1>
        <p className="text-[16px] text-[#60646C]">Sign in to keep work moving.</p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <InputField
          id="password"
          label="Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          suffix={
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="px-4 text-[#8B8D98] hover:text-[#1D222B] transition-colors cursor-pointer"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Button
          variant="primary"
          className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold mt-1"
        >
          Sign In
        </Button>
      </div>

      <Divider />

      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          className="flex items-center justify-center gap-2 w-full bg-[#F9F9FB] border border-[#8B8D98] rounded-[12px] py-4 text-[16px] font-medium text-[#1C2024] hover:bg-[#F0F0F3] transition-colors cursor-pointer"
        >
          Send me a Magic Link
          <Info size={16} className="text-[#8B8D98]" />
        </button>

        <button
          type="button"
          className="flex items-center justify-center w-full border border-[#E0E1E6] rounded-[12px] py-4 text-[16px] font-medium text-[#1C2024] hover:bg-[#F9F9FB] transition-colors cursor-pointer"
        >
          Continue with SSO
        </button>
      </div>
    </>
  )
}

function SignUpForm({ tab, setTab }: TabsProps) {
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')

  return (
    <>
      <TabSwitcher tab={tab} setTab={setTab} />

      <div className="flex flex-col gap-1 text-center w-full py-5">
        <h1 className="text-[32px] font-bold leading-[36px] text-[#1D222B]">Create your account</h1>
        <p className="text-[16px] text-[#60646C]">Sign up to get started with UpKeep. No credit card required.</p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <InputField
          id="signup-email"
          label="Email"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <InputField
          id="signup-password"
          label="Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          suffix={
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="px-4 text-[#8B8D98] hover:text-[#1D222B] transition-colors cursor-pointer"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="flex items-center border border-[#E0E1E6] rounded-[12px] bg-white overflow-hidden focus-within:border-[#4B7BF5] transition-colors">
          <div className="flex items-center pl-3 gap-2 shrink-0">
            <FlagIcon />
          </div>
          <input
            id="phone"
            type="tel"
            placeholder="Mobile Number *"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="flex-1 px-3 py-4 text-[16px] text-[#1D222B] placeholder:text-[#8B8D98] outline-none bg-transparent"
          />
        </div>

        <InputField
          id="company"
          type="text"
          placeholder="Company Name"
          value={company}
          onChange={e => setCompany(e.target.value)}
        />

        <Button
          variant="primary"
          className="w-full h-[56px] rounded-[12px] text-[16px] font-semibold mt-1"
        >
          Create Account
        </Button>
      </div>

      <Divider />

      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          className="flex items-center justify-center gap-2 w-full bg-[#F9F9FB] border border-[#8B8D98] rounded-[12px] py-4 text-[16px] font-medium text-[#1C2024] hover:bg-[#F0F0F3] transition-colors cursor-pointer"
        >
          Send me a Magic Link
          <Info size={16} className="text-[#8B8D98]" />
        </button>
      </div>

      <p className="text-[13px] text-[#8B8D98] text-center mt-2">
        By continuing, you agree to our{' '}
        <a href="#" className="underline hover:text-[#1D222B] transition-colors">Terms of Service</a>
      </p>
    </>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const isSignIn = tab === 'signin'

  return (
    <div
      className="min-h-screen flex items-center p-20 relative overflow-hidden"
      style={{
        background: isSignIn
          ? 'linear-gradient(160deg, #050D1F 0%, #0A1830 45%, #071223 100%)'
          : 'linear-gradient(160deg, #1A0340 0%, #5B0EA6 45%, #9333EA 100%)',
      }}
    >
      {/* Abstract mesh overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isSignIn
            ? 'radial-gradient(ellipse 80% 60% at 15% 85%, rgba(30,80,160,0.4) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 15%, rgba(20,50,120,0.3) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 80% 60% at 85% 15%, rgba(192,64,255,0.5) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 15% 85%, rgba(130,0,200,0.3) 0%, transparent 60%)',
        }}
      />

      {/* Wave lines decoration */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 1311 852"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d={`M${-200 + i * 40},${200 + i * 50} Q${400 + i * 30},${100 + i * 40} ${800 + i * 20},${300 + i * 60} T${1600},${200 + i * 50}`}
            stroke={isSignIn ? '#3B82F6' : '#A855F7'}
            strokeWidth="1"
            fill="none"
          />
        ))}
      </svg>

      {/* Left panel */}
      <div className="flex flex-1 flex-col gap-10 items-start min-w-0 px-6 relative z-10">
        <div className="relative h-[39px] w-[156px] shrink-0">
          <Image
            src="/images/logo-upkeep.svg"
            alt="UpKeep"
            fill
            className="object-contain object-left brightness-0 invert"
            priority
          />
        </div>
        <p className="text-white font-extrabold text-[48px] leading-[52px] max-w-[400px]">
          {isSignIn
            ? 'Trusted by thousands of maintenance teams.'
            : 'Trusted by thousands of maintenance professionals.'}
        </p>
      </div>

      {/* Right card */}
      <div className="bg-white flex flex-col items-center gap-4 px-[54px] py-[60px] rounded-[32px] w-[626px] shrink-0 relative z-10 shadow-2xl">
        {isSignIn
          ? <SignInForm tab={tab} setTab={setTab} />
          : <SignUpForm tab={tab} setTab={setTab} />
        }
      </div>
    </div>
  )
}
