'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { BusinessPriceList, WholesaleQuote } from '@/types'

export default function B2BDashboardPage() {
  const { isB2B, b2bProfile, isLoading } = useAuth()
  const router = useRouter()
  const [prices, setPrices] = useState<BusinessPriceList | null>(null)
  const [quotes, setQuotes] = useState<WholesaleQuote[]>([])

  useEffect(() => { if (!isLoading && !isB2B) router.replace('/b2b/apply') }, [isLoading, isB2B, router])
  useEffect(() => {
    if (!isB2B) return
    api.b2b.prices().then((data) => setPrices(data.price_list)).catch(() => undefined)
    api.subscriptions.quotes.list().then(setQuotes).catch(() => undefined)
  }, [isB2B])

  if (isLoading || !b2bProfile) return <main className="min-h-screen bg-[#F4EFE4] pt-32 dark:bg-[#171B18]" />

  return (
    <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36">
      <div className="page-container">
        <header className="grid gap-10 border-b border-[#C9BEAA] pb-10 lg:grid-cols-[1fr_auto] lg:items-end dark:border-white/15">
          <div><p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Business portal</p><h1 className="display-organic mt-3 text-5xl leading-[.9] md:text-7xl">{b2bProfile.company_name}</h1><p className="mt-4 text-sm text-[#675E52] dark:text-[#AFC0B2]">Approved · {b2bProfile.business_type_display}</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/products" className="bg-[#173C2A] px-5 py-3 text-sm font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]">Place an order</Link><Link href="/b2b/quote" className="border border-[#9D927F] px-5 py-3 text-sm font-bold dark:border-white/25">Request a quote</Link></div>
        </header>

        <section className="grid gap-px border-b border-[#C9BEAA] bg-[#C9BEAA] py-px sm:grid-cols-3 dark:border-white/15 dark:bg-white/15">
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]"><p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">Price list</p><p className="mt-2 text-xl font-semibold">{prices?.name || 'Standard business prices'}</p></div>
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]"><p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">Open quotes</p><p className="mt-2 text-xl font-semibold">{quotes.filter((quote) => !['declined', 'expired', 'converted'].includes(quote.status)).length}</p></div>
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]"><p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">Recurring supply</p><Link href="/subscriptions/start?audience=business" className="mt-2 inline-block text-xl font-semibold">Set up →</Link></div>
        </section>

        <div className="grid gap-14 pt-14 lg:grid-cols-[1.2fr_.8fr]">
          <section><div className="flex items-end justify-between border-b border-[#C9BEAA] pb-4 dark:border-white/15"><h2 className="text-2xl font-semibold tracking-[-.03em]">Your prices</h2><Link href="/products" className="text-sm font-bold">Shop all →</Link></div>{prices?.prices.length ? <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">{prices.prices.slice(0, 8).map((price) => <div key={price.id} className="grid grid-cols-[1fr_auto] gap-4 py-4"><div><p className="font-semibold">{price.product.name}</p><p className="text-xs text-[#756D61] dark:text-[#98A59B]">Minimum {price.minimum_quantity} · {price.product.unit}</p></div><p className="font-semibold">GH₵{Number(price.unit_price).toFixed(2)}</p></div>)}</div> : <p className="py-10 text-sm text-[#675E52] dark:text-[#AFC0B2]">Your price list will appear here.</p>}</section>

          <section><h2 className="border-b border-[#C9BEAA] pb-4 text-2xl font-semibold tracking-[-.03em] dark:border-white/15">Quotes</h2>{quotes.length ? <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">{quotes.slice(0, 5).map((quote) => <div key={quote.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">Quote #{quote.id}</p><p className="text-xs text-[#756D61] dark:text-[#98A59B]">{quote.items.length} items</p></div><span className="text-xs font-bold uppercase tracking-[.12em]">{quote.status}</span></div>)}</div> : <div className="py-10"><p className="text-sm text-[#675E52] dark:text-[#AFC0B2]">No quote requests.</p><Link href="/b2b/quote" className="mt-4 inline-block border-b border-current text-sm font-bold">Start one</Link></div>}</section>
        </div>
      </div>
    </main>
  )
}
