import { Fragment } from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FAQ = [
  {
    q: 'How long does approval take?',
    a: "We aim to review all B2B applications within 24–48 business hours. You'll receive an email with the outcome as soon as your application is reviewed.",
  },
  {
    q: 'What documents do I need?',
    a: 'None at all — simply fill in the application form with your business details. We may reach out for additional information if needed.',
  },
  {
    q: 'Can I order without an account?',
    a: 'B2B accounts require a registered user account so we can apply your discount at checkout. Sign up is free and takes under a minute.',
  },
  {
    q: 'How are discounts applied?',
    a: 'Once your application is approved, your B2B discount is automatically applied when you check out. No code needed.',
  },
  {
    q: 'What is the minimum order?',
    a: 'Discounts start from GH₵200 per order. The more you order, the larger your discount.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Register Your Business',
    body: 'Fill in your business details in our quick application form. Under 2 minutes — no documents required.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Get Approved',
    body: 'Our team reviews your application within 24–48 hours and assigns your discount level based on order volume.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Order at Bulk Prices',
    body: 'Shop as usual and your B2B discount is applied automatically at checkout — no codes, no friction.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
]

const BUSINESS_TYPES = [
  {
    label: 'Restaurants',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <path d="M4.93 4.93 8 8M15.07 15.07 18 18M2 12h4m12 0h4M4.93 19.07 8 16M15.07 8.93 18 6" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    label: 'Schools',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: 'Hotels',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="3" y="2" width="18" height="20" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="9" x2="9" y2="22" />
        <rect x="12" y="13" width="4" height="9" />
      </svg>
    ),
  },
  {
    label: 'Retail Outlets',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: 'Catering',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
    ),
  },
  {
    label: 'Hospitals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'NGOs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
]

export default async function B2BLandingPage() {
  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827]">

      {/* Carousel animation */}
      <style>{`
        @keyframes b2b-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .b2b-carousel { animation: b2b-scroll 28s linear infinite; }
        .b2b-carousel:hover { animation-play-state: paused; }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0D3B2A', paddingTop: '6rem', paddingBottom: '5rem' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block text-[#F4C430] text-xs font-bold uppercase tracking-widest mb-4">
            Legit Organic B2B Program
          </span>
          <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Partner With<br />Legit Organic
          </h1>
          <p className="text-[#A7C4A0] text-lg lg:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Bulk organic produce for restaurants, schools, hotels, and institutions —
            with guaranteed quality and competitive pricing.
          </p>
          <p className="text-[#6fa87a] text-sm max-w-xl mx-auto mb-10 italic">
            Automatic discounts applied based on your order volume — the more you order, the more you save.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/b2b/apply"
              className="inline-flex items-center justify-center gap-2 bg-[#F4C430] text-[#0D3B2A] font-bold px-8 py-3.5 rounded-xl hover:bg-[#e6b82a] transition-colors text-base"
            >
              Apply Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto">
            {[
              { value: '24h',  label: 'Fast Approval' },
              { value: '100%', label: 'Verified Organic' },
              { value: '0',    label: 'Documents Needed' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-[#F4C430] font-display">{s.value}</div>
                <div className="text-xs text-[#A7C4A0] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-[#1f2937]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#2E7D32] dark:text-[#81C784] text-xs font-bold uppercase tracking-widest">How It Works</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0D3B2A] dark:text-white mt-2">
              Three Simple Steps
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {STEPS.map((step, i) => (
              <Fragment key={step.n}>
                {/* Step card */}
                <div className="flex-1 flex flex-col items-start p-8 rounded-2xl bg-[#FAF7F0] dark:bg-[#111827] border border-[#E6D8BD] dark:border-[#374151]">
                  {/* Number badge */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-8 h-8 rounded-full bg-[#0D3B2A] dark:bg-[#F4C430] text-[#F4C430] dark:text-[#0D3B2A] flex items-center justify-center text-xs font-bold font-display shrink-0">
                      {step.n}
                    </span>
                  </div>
                  {/* Icon */}
                  <div className="text-[#2E7D32] dark:text-[#81C784] mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0D3B2A] dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[#5B3E31] dark:text-[#9ca3af] text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>

                {/* Arrow connector between steps */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-3 shrink-0 text-[#F4C430]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                {/* Mobile vertical connector */}
                {i < STEPS.length - 1 && (
                  <div className="md:hidden flex justify-center py-2 text-[#F4C430]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built for Institutions (carousel) ───────────────────────────── */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 mb-12 text-center">
          <span className="text-[#2E7D32] dark:text-[#81C784] text-xs font-bold uppercase tracking-widest">Who Benefits</span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0D3B2A] dark:text-white mt-2">
            Built for Institutions
          </h2>
          <p className="text-[#5B3E31] dark:text-[#9ca3af] mt-3 text-sm">
            Serving businesses across Ghana with certified organic produce.
          </p>
        </div>

        {/* Carousel track */}
        <div className="overflow-hidden">
          <div className="b2b-carousel flex gap-5 w-max">
            {/* Original + duplicate for seamless loop */}
            {[...BUSINESS_TYPES, ...BUSINESS_TYPES].map((bt, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-3 w-36 shrink-0 p-5 rounded-2xl bg-white dark:bg-[#1f2937] border border-[#E6D8BD] dark:border-[#374151] shadow-sm"
              >
                <div className="text-[#2E7D32] dark:text-[#81C784]">{bt.icon}</div>
                <span className="text-xs font-semibold text-[#0D3B2A] dark:text-[#d1d5db] leading-tight text-center">{bt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-[#1f2937]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#2E7D32] dark:text-[#81C784] text-xs font-bold uppercase tracking-widest">FAQ</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0D3B2A] dark:text-white mt-2">
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group border border-[#E6D8BD] dark:border-[#374151] rounded-xl bg-[#FAF7F0] dark:bg-[#111827]"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none select-none">
                  <span className="font-semibold text-[#0D3B2A] dark:text-white text-sm">{item.q}</span>
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" width="16" height="16"
                    className="text-[#2E7D32] dark:text-[#81C784] shrink-0 transition-transform group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="px-6 pb-4 text-sm text-[#5B3E31] dark:text-[#9ca3af] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[#0D3B2A] to-[#2E7D32] dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Apply today and start saving on every bulk order.
          </p>
          <Link
            href="/b2b/apply"
            className="inline-flex items-center gap-2 bg-[#F4C430] text-[#0D3B2A] font-bold px-8 py-3.5 rounded-xl hover:bg-[#e6b82a] transition-colors text-base"
          >
            Apply for B2B Account
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-white/60 text-sm mt-6">
            Already applied?{' '}
            <Link href="/b2b/apply" className="text-[#F4C430] hover:underline font-semibold">
              Check your status
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
