import Link from 'next/link'
import { api } from '@/lib/api'
import type { B2BDiscountTier } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIER_STYLE: Record<string, { icon: string; accent: string; bg: string; ring: string; featured: boolean }> = {
  Silver: {
    icon: '🥈',
    accent: 'text-gray-600 dark:text-gray-300',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
    featured: false,
  },
  Gold: {
    icon: '🥇',
    accent: 'text-[#C59F2C]',
    bg: 'bg-[#FFFBEB] dark:bg-[#1a1500]',
    ring: 'ring-2 ring-[#F4C430]',
    featured: true,
  },
  Platinum: {
    icon: '💎',
    accent: 'text-[#0D3B2A] dark:text-[#81C784]',
    bg: 'bg-[#F0FFF4] dark:bg-[#0a1f14]',
    ring: 'ring-1 ring-[#2E7D32]/30 dark:ring-[#2E7D32]/50',
    featured: false,
  },
}

const BUSINESS_TYPES = [
  { icon: '🍽️', label: 'Restaurants' },
  { icon: '🏫', label: 'Schools' },
  { icon: '🏨', label: 'Hotels' },
  { icon: '🛒', label: 'Retail Outlets' },
  { icon: '🍱', label: 'Catering Services' },
  { icon: '🏥', label: 'Hospitals' },
  { icon: '🤝', label: 'NGOs' },
]

const FAQ = [
  {
    q: 'How long does approval take?',
    a: 'We aim to review all B2B applications within 24–48 business hours. You\'ll receive an email with the outcome as soon as your application is reviewed.',
  },
  {
    q: 'What documents do I need?',
    a: 'None at all — simply fill in the application form with your business details. We may reach out for additional information if needed.',
  },
  {
    q: 'Can I order without an account?',
    a: 'B2B accounts require a registered user account so we can apply your discount tier at checkout. Sign up is free and takes under a minute.',
  },
  {
    q: 'How are discounts applied?',
    a: 'Once your application is approved and a tier is assigned, your B2B discount is automatically applied when you check out. No code needed.',
  },
  {
    q: 'What is the minimum order?',
    a: 'The minimum for the Silver tier is GH₵200 per order. Gold starts at GH₵500 and Platinum at GH₵1,000.',
  },
]

export default async function B2BLandingPage() {
  let tiers: B2BDiscountTier[] = []
  try {
    tiers = await api.b2b.tiers()
  } catch {
    // backend unavailable — use empty, page still renders
  }

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827]">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0D3B2A', paddingTop: '6rem', paddingBottom: '5rem' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block text-[#F4C430] text-xs font-bold uppercase tracking-widest mb-4">
            Legit Organic B2B Program
          </span>
          <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Partner With<br />Legit Organic
          </h1>
          <p className="text-[#A7C4A0] text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Bulk organic produce for restaurants, schools, hotels, and institutions —
            with guaranteed quality and competitive pricing.
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
              { value: '3', label: 'Pricing Tiers' },
              { value: '24h', label: 'Fast Processing' },
              { value: '100%', label: 'Verified Organic' },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Register Your Business',
                body: 'Fill in your business details in our quick application form. Takes under 2 minutes — no documents required.',
                icon: '📋',
              },
              {
                step: '02',
                title: 'Get Approved',
                body: 'Our team reviews your application within 24–48 hours and assigns you a discount tier based on your order volume.',
                icon: '✅',
              },
              {
                step: '03',
                title: 'Order at Bulk Prices',
                body: 'Shop as usual and your B2B discount is applied automatically at checkout — no codes, no friction.',
                icon: '🛒',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="absolute top-0 right-0 text-6xl font-bold text-[#0D3B2A]/5 dark:text-white/5 font-display leading-none select-none">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-2">{item.title}</h3>
                <p className="text-[#5B3E31] dark:text-[#9ca3af] text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Discount Tiers ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#2E7D32] dark:text-[#81C784] text-xs font-bold uppercase tracking-widest">Pricing</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0D3B2A] dark:text-white mt-2">
              Discount Tiers
            </h2>
            <p className="text-[#5B3E31] dark:text-[#9ca3af] mt-3 max-w-lg mx-auto text-sm">
              Your discount is automatically assigned based on your order volume. Move up tiers as your business grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.length > 0 ? tiers.map((tier) => {
              const style = TIER_STYLE[tier.name] ?? TIER_STYLE.Silver
              return (
                <div
                  key={tier.id}
                  className={[
                    'relative rounded-2xl p-8 flex flex-col',
                    style.bg, style.ring,
                    style.featured ? 'shadow-xl scale-[1.03]' : 'shadow-sm',
                  ].join(' ')}
                >
                  {style.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F4C430] text-[#0D3B2A] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}
                  <div className="text-4xl mb-3">{style.icon}</div>
                  <h3 className={['font-display text-2xl font-bold mb-1', style.accent].join(' ')}>
                    {tier.name}
                  </h3>
                  <div className="flex items-end gap-1 mb-3">
                    <span className="text-5xl font-bold text-[#0D3B2A] dark:text-white font-display">
                      {tier.discount_percent}%
                    </span>
                    <span className="text-[#5B3E31] dark:text-[#9ca3af] text-sm mb-2">off</span>
                  </div>
                  <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af] mb-2">{tier.description}</p>
                  <p className="text-xs text-[#0D3B2A]/60 dark:text-[#9ca3af] mb-6">
                    Min. order: GH₵{parseFloat(tier.min_order_amount).toLocaleString()}
                    {tier.max_order_amount ? ` – GH₵${parseFloat(tier.max_order_amount).toLocaleString()}` : '+'}
                  </p>
                  <Link
                    href="/b2b/apply"
                    className={[
                      'mt-auto text-center font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors',
                      style.featured
                        ? 'bg-[#F4C430] text-[#0D3B2A] hover:bg-[#e6b82a]'
                        : 'bg-[#0D3B2A] text-[#F4C430] hover:bg-[#0a2e20] dark:bg-[#F4C430] dark:text-[#0D3B2A] dark:hover:bg-[#e6b82a]',
                    ].join(' ')}
                  >
                    Apply Now
                  </Link>
                </div>
              )
            }) : (
              /* Fallback if API unavailable */
              [
                { name: 'Silver', icon: '🥈', pct: '5%', range: 'GH₵200 – GH₵499' },
                { name: 'Gold',   icon: '🥇', pct: '10%', range: 'GH₵500 – GH₵999', featured: true },
                { name: 'Platinum', icon: '💎', pct: '15%', range: 'GH₵1,000+' },
              ].map((t) => {
                const style = TIER_STYLE[t.name]
                return (
                  <div key={t.name} className={['relative rounded-2xl p-8 flex flex-col', style.bg, style.ring, (t as {featured?: boolean}).featured ? 'shadow-xl scale-[1.03]' : 'shadow-sm'].join(' ')}>
                    {(t as {featured?: boolean}).featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F4C430] text-[#0D3B2A] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">Most Popular</div>
                    )}
                    <div className="text-4xl mb-3">{t.icon}</div>
                    <h3 className={['font-display text-2xl font-bold mb-1', style.accent].join(' ')}>{t.name}</h3>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-5xl font-bold text-[#0D3B2A] dark:text-white font-display">{t.pct}</span>
                      <span className="text-[#5B3E31] dark:text-[#9ca3af] text-sm mb-2">off</span>
                    </div>
                    <p className="text-xs text-[#0D3B2A]/60 dark:text-[#9ca3af] mb-6">{t.range}</p>
                    <Link href="/b2b/apply" className={['mt-auto text-center font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors', (t as {featured?: boolean}).featured ? 'bg-[#F4C430] text-[#0D3B2A] hover:bg-[#e6b82a]' : 'bg-[#0D3B2A] text-[#F4C430] hover:bg-[#0a2e20]'].join(' ')}>Apply Now</Link>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* ── Who Is It For ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-[#1f2937]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#2E7D32] dark:text-[#81C784] text-xs font-bold uppercase tracking-widest">Who Benefits</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0D3B2A] dark:text-white mt-2">
              Built for Institutions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {BUSINESS_TYPES.map((bt) => (
              <div
                key={bt.label}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#FAF7F0] dark:bg-[#111827] border border-[#E6D8BD] dark:border-[#374151] text-center"
              >
                <span className="text-3xl">{bt.icon}</span>
                <span className="text-xs font-semibold text-[#0D3B2A] dark:text-[#d1d5db] leading-tight">{bt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20">
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
                className="group border border-[#E6D8BD] dark:border-[#374151] rounded-xl bg-white dark:bg-[#1f2937]"
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
      <section style={{ backgroundColor: '#0D3B2A' }} className="py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-[#A7C4A0] mb-8 text-lg">
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
          <p className="text-[#A7C4A0] text-sm mt-6">
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
