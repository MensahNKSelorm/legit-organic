'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

const TIER_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Silver:   { icon: '🥈', color: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800' },
  Gold:     { icon: '🥇', color: 'text-[#C59F2C]', bg: 'bg-[#FFFBEB] dark:bg-[#1a1500]' },
  Platinum: { icon: '💎', color: 'text-[#0D3B2A] dark:text-[#81C784]', bg: 'bg-[#F0FFF4] dark:bg-[#0a1f14]' },
}

export default function B2BDashboardPage() {
  const { isB2B, b2bProfile, isLoading } = useAuth()
  const router = useRouter()

  const [orderAmount, setOrderAmount] = useState('')
  const [calcResult, setCalcResult] = useState<{
    discount_percent: string
    discount_amount: string
    final_amount: string
    tier: { name: string; discount_percent: string } | null
  } | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isB2B) {
      router.replace('/b2b/apply')
    }
  }, [isLoading, isB2B, router])

  const calculate = useCallback(async (amount: string) => {
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) {
      setCalcResult(null)
      return
    }
    setCalcLoading(true)
    try {
      const result = await api.b2b.calculateDiscount(num)
      setCalcResult(result)
    } catch {
      setCalcResult(null)
    } finally {
      setCalcLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => calculate(orderAmount), 400)
    return () => clearTimeout(timeout)
  }, [orderAmount, calculate])

  if (isLoading || !b2bProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827]">
        <span className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tier = b2bProfile.tier
  const tierConfig = tier ? (TIER_CONFIG[tier.name] ?? TIER_CONFIG.Silver) : null

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '2.5rem' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#F4C430] text-xs font-bold uppercase tracking-widest mb-1">B2B Portal</p>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-white">
                {b2bProfile.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-[#2E7D32]/30 text-[#A7C4A0] text-xs font-semibold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                  Approved B2B Partner
                </span>
                {tier && tierConfig && (
                  <span className={['inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full', tierConfig.bg, tierConfig.color].join(' ')}>
                    {tierConfig.icon} {tier.name} Tier — {tier.discount_percent}% off
                  </span>
                )}
              </div>
            </div>
            <a
              href={`https://wa.me/233539569260?text=${encodeURIComponent(`Hello Legit Organic! I'm ${b2bProfile.contact_person} from ${b2bProfile.company_name}. I'd like to place a bulk order.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1ebe5d] transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contact Account Manager
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* ── Discount Calculator ───────────────────────────────────────────── */}
        <section className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E6D8BD] dark:border-[#374151]">
            <h2 className="font-display text-lg font-bold text-[#0D3B2A] dark:text-white">
              Calculate Your Savings
            </h2>
            <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af] mt-0.5">
              Enter an order amount to see your B2B discount live
            </p>
          </div>
          <div className="px-8 py-6">
            <div className="max-w-sm">
              <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-2">
                Order Amount (GH₵)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0D3B2A]/50 dark:text-[#9ca3af] text-sm font-medium">
                  GH₵
                </span>
                <input
                  type="number"
                  min="0"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E6D8BD] dark:border-[#374151] bg-[#FAF7F0] dark:bg-[#111827] text-[#0D3B2A] dark:text-[#faf7f0] text-lg font-bold focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
                />
              </div>
            </div>

            {calcLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#5B3E31] dark:text-[#9ca3af]">
                <span className="w-4 h-4 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
                Calculating…
              </div>
            )}

            {calcResult && !calcLoading && (
              <div className="mt-5 p-5 bg-[#F0FFF4] dark:bg-[#0a1f14] rounded-xl border border-[#2E7D32]/20">
                {calcResult.tier ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-bold text-[#2E7D32] dark:text-[#81C784]">
                        {TIER_CONFIG[calcResult.tier.name]?.icon} {calcResult.tier.name} Tier Applied
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#5B3E31] dark:text-[#9ca3af]">Order amount</span>
                        <span className="font-semibold text-[#0D3B2A] dark:text-white">GH₵ {parseFloat(orderAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#2E7D32] dark:text-[#81C784]">
                        <span>Discount ({calcResult.tier.discount_percent}% off)</span>
                        <span className="font-semibold">− GH₵ {parseFloat(calcResult.discount_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#2E7D32]/20">
                        <span className="font-bold text-[#0D3B2A] dark:text-white">You pay</span>
                        <span className="font-bold text-xl text-[#2E7D32] dark:text-[#81C784]">
                          GH₵ {parseFloat(calcResult.final_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af]">
                    No B2B discount tier has been assigned to your account yet. Contact your account manager for assistance.
                  </p>
                )}
              </div>
            )}

            {!calcResult && !calcLoading && orderAmount && (
              <div className="mt-4 p-4 bg-[#FFF8E1] dark:bg-[#1a1500] rounded-xl border border-[#F4C430]/30 text-sm text-[#5B3E31] dark:text-[#9ca3af]">
                Enter an amount of GH₵200 or more to qualify for a discount tier.
              </div>
            )}
          </div>
        </section>

        {/* ── Account Details ───────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151]">
          <div className="px-8 py-5 border-b border-[#E6D8BD] dark:border-[#374151]">
            <h2 className="font-display text-lg font-bold text-[#0D3B2A] dark:text-white">Account Details</h2>
          </div>
          <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: 'Company Name', value: b2bProfile.company_name },
              { label: 'Business Type', value: b2bProfile.business_type_display },
              { label: 'Contact Person', value: b2bProfile.contact_person },
              { label: 'Business Phone', value: b2bProfile.business_phone },
              { label: 'Business Email', value: b2bProfile.business_email },
              { label: 'Approved Since', value: b2bProfile.approved_at ? new Date(b2bProfile.approved_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-medium mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How to Order ──────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151]">
          <div className="px-8 py-5 border-b border-[#E6D8BD] dark:border-[#374151]">
            <h2 className="font-display text-lg font-bold text-[#0D3B2A] dark:text-white">How to Order</h2>
          </div>
          <div className="px-8 py-6">
            <ol className="space-y-4">
              {[
                { n: '1', text: 'Browse our full catalogue of verified organic products.' },
                { n: '2', text: 'Add your items to the cart as usual.' },
                { n: '3', text: 'Your B2B discount is automatically applied at checkout based on your tier.' },
                { n: '4', text: 'For large or custom bulk orders, contact your account manager directly on WhatsApp.' },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[#0D3B2A] text-[#F4C430] flex items-center justify-center text-xs font-bold font-display">
                    {step.n}
                  </span>
                  <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af] leading-relaxed pt-0.5">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Quick Links ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-lg font-bold text-[#0D3B2A] dark:text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: '/products',
                icon: '🛒',
                title: 'Browse Products',
                desc: 'Shop the full catalogue',
              },
              {
                href: '/profile',
                icon: '📦',
                title: 'Order History',
                desc: 'View your past orders',
              },
              {
                href: '/my-recipes',
                icon: '📋',
                title: 'My Recipes',
                desc: 'Manage your recipes',
              },
              {
                href: `https://wa.me/233539569260?text=${encodeURIComponent(`Hello Legit Organic! I'm ${b2bProfile.contact_person} from ${b2bProfile.company_name} and I'd like to discuss a bulk order.`)}`,
                icon: '💬',
                title: 'Account Manager',
                desc: 'Chat on WhatsApp',
                external: true,
              },
            ].map((link) => (
              link.external ? (
                <a
                  key={link.title}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-5 bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-[#0D3B2A] dark:text-white">{link.title}</p>
                    <p className="text-xs text-[#5B3E31] dark:text-[#9ca3af] mt-0.5">{link.desc}</p>
                  </div>
                </a>
              ) : (
                <Link
                  key={link.title}
                  href={link.href}
                  className="flex items-start gap-3 p-5 bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-[#0D3B2A] dark:text-white">{link.title}</p>
                    <p className="text-xs text-[#5B3E31] dark:text-[#9ca3af] mt-0.5">{link.desc}</p>
                  </div>
                </Link>
              )
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
