'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const NAV_ITEMS = ['Product', 'Solutions', 'Resources', 'Pricing']

const LOGOS = [
  { src: '/images/companies/unilever.svg', alt: 'Unilever' },
  { src: '/images/companies/aramark.svg', alt: 'Aramark' },
  { src: '/images/companies/mcdonalds.svg', alt: "McDonald's" },
  { src: '/images/companies/yamaha.svg', alt: 'Yamaha' },
  { src: '/images/companies/shell.svg', alt: 'Shell' },
  { src: '/images/companies/marriott.svg', alt: 'Marriott' },
  { src: '/images/companies/subway.svg', alt: 'Subway' },
]

const FEATURES = [
  { icon: '⚡', title: 'Unified Operations', desc: 'Maintenance management, safety, reliability, and operations in a single system' },
  { icon: '🤖', title: 'AI Automation', desc: 'AI generates work orders, optimizes schedules, and triggers actions automatically' },
  { icon: '🏢', title: 'Enterprise Grade', desc: 'Enterprise security, compliance, and governance from day one' },
  { icon: '🔌', title: 'Integrations', desc: 'Plug into your ERP, sensors, and other systems without disruption' },
  { icon: '🛠️', title: 'Service Providers', desc: 'Send work orders to verified service providers without leaving UpKeep' },
]

const PRODUCTS = [
  { name: 'CMMS', color: '#4B7BF5', icon: '📋', desc: 'Mobile-first maintenance management that turns reactive firefighting into proactive operations. Create work orders in seconds, automate PMs, and give your team real-time visibility from any device.' },
  { name: 'Intelligence', color: '#7C5CFC', icon: '🧠', desc: 'Embedded AI tools that eliminate busywork and surface insights your team would never find manually. From smart scheduling to predictive recommendations.' },
  { name: 'Studio', color: '#00B37E', icon: '🧩', desc: 'Custom app platform that lets anyone on your team build exactly the tools they need — or install from 30+ ready-made apps — all running on your existing UpKeep data.' },
  { name: 'Safety', color: '#F76707', icon: '🦺', desc: 'Capture safety events in seconds with voice-to-text reporting that works in any language. Automated OSHA logs, AI-powered CAPAs, and instant audit trails.' },
  { name: 'Edge', color: '#0EA5E9', icon: '📡', desc: 'Wireless IoT sensors that monitor your assets 24/7 and automatically create work orders when conditions change. Install in hours, not months.' },
  { name: 'Fleet', color: '#E11D48', icon: '🚗', desc: 'Vehicle maintenance management that connects telematics data to work orders through real-time integrations and automated PM scheduling.' },
]

const STATS = [
  { value: '4,000+', label: 'Companies trust UpKeep' },
  { value: '68%', label: 'Reduction in downtime' },
  { value: '2.5×', label: 'Faster work order completion' },
  { value: '30%', label: 'Lower maintenance costs' },
]

const CASE_STUDIES = [
  { company: "McDonald's", category: 'Food & Beverage', result: 'Urgent equipment issues resolved in under an hour. Repair time dropped from 3–4 days to just one.', logo: '/images/companies/mcdonalds.svg' },
  { company: 'Aramark', category: 'Facilities', result: 'Centralized work orders across hundreds of locations, reducing manual coordination by 40%.', logo: '/images/companies/aramark.svg' },
  { company: 'Shell', category: 'Energy', result: 'Preventive maintenance compliance improved from 62% to 94% within the first year.', logo: '/images/companies/shell.svg' },
  { company: 'Yamaha', category: 'Manufacturing', result: 'Asset downtime reduced by 35% after switching from paper-based maintenance tracking.', logo: '/images/companies/yamaha.svg' },
]

const PLANS = [
  { name: 'Essential', price: '$24', per: 'user/mo', cta: 'Start Free Trial', primary: false, features: ['Unlimited work orders', 'Unlimited locations', 'Nova AI assistant', 'Mobile app', 'Asset tracking'] },
  { name: 'Premium', price: '$55', per: 'user/mo', cta: 'Start Free Trial', primary: true, features: ['Everything in Essential', 'Studio app builder', 'PM scheduling', 'Custom checklists', 'Parts management', 'Time tracking', '30-day analytics'] },
  { name: 'Professional', price: 'Custom', per: '', cta: 'Request a Demo', primary: false, features: ['Everything in Premium', 'Mobile offline mode', 'External portal', 'Full analytics suite', 'Asset lifecycle tracking', 'Signature capture'] },
  { name: 'Enterprise', price: 'Custom', per: '', cta: 'Contact Sales', primary: false, features: ['Everything in Professional', 'Multi-site support', 'Workflow automation', 'Reliability tracking', 'PO management', 'API access', 'SSO'] },
]

const FAQS = [
  { q: 'What is a CMMS?', a: 'A CMMS, or computerized maintenance management system, is software that centralizes work orders, preventive maintenance schedules, asset records, parts inventory, and technician activity in one system.' },
  { q: "What's the difference between a CMMS and an EAM?", a: 'A CMMS focuses on day-to-day maintenance operations: work orders, preventive maintenance, technician scheduling, and parts inventory. An EAM covers the full asset lifecycle including procurement, depreciation, and disposal.' },
  { q: 'How does AI improve a CMMS?', a: "AI in a modern CMMS automates work that used to require manual effort. UpKeep's AI, called Nova, generates work orders from real-time data, surfaces patterns across thousands of assets, and predicts failures before they happen." },
  { q: 'How much does UpKeep cost?', a: 'UpKeep pricing starts at $24 per user per month for the core Maintenance product, which includes work order management, preventive maintenance, asset tracking, mobile access, and Nova AI.' },
]

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-[64px] bg-white border-b border-[#E8E8EC]">
      <div className="flex items-center gap-8">
        <div className="relative h-[28px] w-[124px] shrink-0">
          <Image src="/images/logo-upkeep.svg" alt="UpKeep" fill className="object-contain object-left" priority />
        </div>
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
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
        <Link href="/login" className="text-[14px] font-medium text-[#1D222B] hover:text-[#4B7BF5] transition-colors cursor-pointer px-3 py-2 rounded-[6px] hover:bg-[#F5F7FF]">Sign in</Link>
        <Link href="/login?tab=signup" className="text-[14px] font-semibold text-white bg-[#4B7BF5] hover:bg-[#3B6BE5] transition-colors px-4 py-2 rounded-[8px] cursor-pointer">Start a Free Trial</Link>
        <button className="p-2 text-[#60646C] hover:text-[#1D222B] transition-colors cursor-pointer rounded-[6px] hover:bg-[#F5F7FF]" aria-label="Language">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </button>
      </div>
    </header>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#E8E8EC]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 cursor-pointer"
      >
        <span className="text-[16px] font-semibold text-[#1D222B]">{q}</span>
        {open ? <ChevronUp size={18} className="shrink-0 text-[#60646C]" /> : <ChevronDown size={18} className="shrink-0 text-[#60646C]" />}
      </button>
      {open && <p className="pb-5 text-[15px] text-[#60646C] leading-[24px]">{a}</p>}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0D1117] pt-[64px]">
        <div className="absolute inset-0">
          <Image src="/images/login/bg1.png" alt="" fill className="object-cover opacity-40" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/60 via-transparent to-[#0D1117]/80" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-24 text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-[13px] text-white/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#4B7BF5] animate-pulse" />
            Trusted by 4,000+ companies worldwide
          </div>
          <h1 className="text-white font-extrabold text-[56px] leading-[62px] max-w-[800px] max-md:text-[38px] max-md:leading-[44px]">
            CMMS &amp; Maintenance Management Software
          </h1>
          <p className="text-white/70 text-[18px] leading-[28px] max-w-[620px]">
            One platform for CMMS, Safety, and Asset Operations. Reduce downtime, extend asset life, and keep your teams working smarter with embedded AI.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/login?tab=signup" className="h-[52px] px-8 bg-[#4B7BF5] hover:bg-[#3B6BE5] text-white font-semibold text-[16px] rounded-[12px] flex items-center transition-colors">
              Start a Free Trial
            </Link>
            <button className="h-[52px] px-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[16px] rounded-[12px] flex items-center gap-2 transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Request a Demo
            </button>
          </div>
          <p className="text-white/40 text-[13px]">No credit card required · Free 14-day trial · Cancel anytime</p>
        </div>
      </section>

      {/* Social proof logos */}
      <section className="bg-white border-b border-[#E8E8EC] py-10 px-6">
        <p className="text-center text-[12px] font-semibold text-[#8B8D98] tracking-[0.1em] uppercase mb-8">Join 4,000+ companies already growing</p>
        <div className="flex items-center justify-center gap-10 flex-wrap max-w-[1000px] mx-auto">
          {LOGOS.map(logo => (
            <div key={logo.alt} className="relative h-[28px] w-[90px] grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all">
              <Image src={logo.src} alt={logo.alt} fill className="object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* Platform overview */}
      <section className="py-24 px-6 bg-[#F8F9FF]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[38px] font-extrabold text-[#1D222B] leading-[46px] mb-4">
              Maintenance Management Software That Keeps<br className="hidden lg:block" /> Every Team on the Same Page
            </h2>
            <p className="text-[17px] text-[#60646C] leading-[26px] max-w-[620px] mx-auto">
              UpKeep connects work orders, preventive maintenance, safety, and asset data in a single system. Your teams see what matters. AI helps them act on it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-[20px] p-6 border border-[#E8E8EC] hover:border-[#4B7BF5] hover:shadow-md transition-all">
                <div className="text-[32px] mb-4">{f.icon}</div>
                <h3 className="text-[17px] font-bold text-[#1D222B] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#60646C] leading-[22px]">{f.desc}</p>
              </div>
            ))}
            {/* Request demo card */}
            <div className="bg-[#4B7BF5] rounded-[20px] p-6 flex flex-col justify-between">
              <div>
                <p className="text-white/80 text-[13px] font-medium mb-2 uppercase tracking-wide">See it in action</p>
                <h3 className="text-[20px] font-bold text-white leading-[26px] mb-3">Ready to modernize your maintenance operations?</h3>
              </div>
              <button className="self-start mt-4 h-[44px] px-6 bg-white text-[#4B7BF5] font-semibold text-[14px] rounded-[10px] hover:bg-[#F0F4FF] transition-colors cursor-pointer">
                Request a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0D1117] py-20 px-6">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[48px] font-extrabold text-[#4B7BF5] leading-none mb-3">{s.value}</p>
              <p className="text-[15px] text-white/60 leading-[22px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[38px] font-extrabold text-[#1D222B] leading-[46px] mb-4">Built for the People Doing the Work</h2>
            <p className="text-[17px] text-[#60646C] leading-[26px] max-w-[560px] mx-auto">
              Give your team AI that does real work. Nova handles routine tasks and surfaces insights that used to take hours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map(p => (
              <div key={p.name} className="group rounded-[20px] border border-[#E8E8EC] p-6 hover:shadow-lg hover:border-transparent transition-all cursor-pointer" style={{ '--hover-color': p.color } as React.CSSProperties}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[20px]" style={{ background: p.color + '18' }}>
                    {p.icon}
                  </div>
                  <span className="text-[16px] font-bold text-[#1D222B]">{p.name}</span>
                </div>
                <p className="text-[14px] text-[#60646C] leading-[22px]">{p.desc}</p>
                <button className="mt-4 text-[13px] font-semibold flex items-center gap-1 transition-colors" style={{ color: p.color }}>
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section className="py-24 px-6 bg-[#F8F9FF]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[38px] font-extrabold text-[#1D222B] leading-[46px] mb-4">Trusted by Industry Leaders</h2>
            <p className="text-[17px] text-[#60646C] leading-[26px] max-w-[500px] mx-auto">See how companies like yours are transforming maintenance operations with UpKeep.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CASE_STUDIES.map(cs => (
              <div key={cs.company} className="bg-white rounded-[20px] p-8 border border-[#E8E8EC] hover:shadow-md transition-all flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="relative h-[32px] w-[100px]">
                    <Image src={cs.logo} alt={cs.company} fill className="object-contain object-left" />
                  </div>
                  <span className="text-[12px] font-medium text-[#8B8D98] bg-[#F5F7FF] px-3 py-1 rounded-full">{cs.category}</span>
                </div>
                <p className="text-[15px] text-[#1D222B] leading-[24px] font-medium">"{cs.result}"</p>
                <button className="text-[13px] font-semibold text-[#4B7BF5] flex items-center gap-1 self-start hover:gap-2 transition-all cursor-pointer">
                  Read case study
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[38px] font-extrabold text-[#1D222B] leading-[46px] mb-4">Plans for Every Team</h2>
            <p className="text-[17px] text-[#60646C] leading-[26px]">Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-[20px] p-6 flex flex-col gap-5 border transition-all ${plan.primary ? 'bg-[#4B7BF5] border-[#4B7BF5] shadow-xl scale-[1.02]' : 'border-[#E8E8EC] hover:border-[#4B7BF5] hover:shadow-md'}`}
              >
                <div>
                  <p className={`text-[13px] font-semibold mb-1 ${plan.primary ? 'text-white/70' : 'text-[#8B8D98]'}`}>{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-[36px] font-extrabold leading-none ${plan.primary ? 'text-white' : 'text-[#1D222B]'}`}>{plan.price}</span>
                    {plan.per && <span className={`text-[13px] mb-1 ${plan.primary ? 'text-white/60' : 'text-[#8B8D98]'}`}>{plan.per}</span>}
                  </div>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-[13px] ${plan.primary ? 'text-white/90' : 'text-[#60646C]'}`}>
                      <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.primary ? 'rgba(255,255,255,0.8)' : '#4B7BF5'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?tab=signup"
                  className={`h-[44px] rounded-[10px] text-[14px] font-semibold flex items-center justify-center transition-colors ${plan.primary ? 'bg-white text-[#4B7BF5] hover:bg-[#F0F4FF]' : 'bg-[#F5F7FF] text-[#4B7BF5] hover:bg-[#E6EDFE]'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-[#F8F9FF]">
        <div className="max-w-[760px] mx-auto">
          <h2 className="text-[38px] font-extrabold text-[#1D222B] leading-[46px] mb-12 text-center">Frequently Asked Questions</h2>
          {FAQS.map(faq => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative bg-[#0D1117] py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/login/bg3.png" alt="" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] to-transparent" />
        </div>
        <div className="relative z-10 max-w-[680px] mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-[42px] font-extrabold text-white leading-[50px]">Leading the Way to a Better Future for Maintenance and Reliability</h2>
          <p className="text-[17px] text-white/60 leading-[26px]">Your asset and equipment data doesn't belong in a silo. UpKeep makes it simple to see where everything stands, all in one place.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/login?tab=signup" className="h-[52px] px-8 bg-[#4B7BF5] hover:bg-[#3B6BE5] text-white font-semibold text-[16px] rounded-[12px] flex items-center transition-colors">
              Start a Free Trial
            </Link>
            <button className="h-[52px] px-8 border border-white/20 text-white font-semibold text-[16px] rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer">
              Request a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080C12] px-8 py-16">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 mb-12">
            <div className="flex flex-col gap-4 max-w-[260px]">
              <div className="relative h-[28px] w-[124px]">
                <Image src="/images/logo-upkeep.svg" alt="UpKeep" fill className="object-contain object-left brightness-0 invert" />
              </div>
              <p className="text-[14px] text-white/50 leading-[22px]">The AI-native CMMS and asset operations platform trusted by maintenance teams worldwide.</p>
              <div className="flex items-center gap-3 mt-2">
                {['YouTube','Twitter','LinkedIn','Instagram','Facebook'].map(s => (
                  <button key={s} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors" aria-label={s}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { heading: 'Products', links: ['CMMS', 'Intelligence', 'Studio', 'Safety', 'Edge', 'Fleet', 'Learn'] },
                { heading: 'Solutions', links: ['Manufacturing', 'Healthcare', 'Hospitality', 'Food & Beverage', 'Energy', 'Government'] },
                { heading: 'Resources', links: ['Blog', 'Learning Center', 'Customer Stories', 'Checklist Generator', 'Documentation', 'Support'] },
                { heading: 'Company', links: ['About Us', 'Pricing', 'Reviews', 'Careers', 'Privacy Policy', 'Terms of Use'] },
              ].map(col => (
                <div key={col.heading} className="flex flex-col gap-3">
                  <p className="text-[12px] font-semibold text-white/40 uppercase tracking-[0.08em]">{col.heading}</p>
                  {col.links.map(l => (
                    <button key={l} className="text-[14px] text-white/60 hover:text-white transition-colors text-left cursor-pointer">{l}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-white/30">© 2025 UpKeep Technologies, Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Sitemap'].map(l => (
                <button key={l} className="text-[13px] text-white/30 hover:text-white/60 transition-colors cursor-pointer">{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
