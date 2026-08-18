'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { Product } from '@/types'

export default function QuoteRequestPage() {
  const { isB2B, isLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (!isLoading && !isB2B) router.replace('/b2b/apply') }, [isB2B, isLoading, router])
  useEffect(() => { api.products.list('is_available=true').then(setProducts).catch(() => setError('Products could not be loaded.')) }, [])
  const chosen = useMemo(() => Object.entries(quantities).filter(([, qty]) => qty > 0), [quantities])

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!chosen.length) { setError('Choose at least one product.'); return }
    setSaving(true); setError('')
    try { await api.subscriptions.quotes.create({ requested_delivery_date: date || undefined, is_recurring: recurring, customer_note: note, items: chosen.map(([id, quantity]) => ({ product_id: Number(id), quantity })) }); router.push('/b2b/dashboard') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Quote could not be sent.') }
    finally { setSaving(false) }
  }

  return <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36"><form onSubmit={submit} className="page-container grid gap-12 lg:grid-cols-[.65fr_1.35fr]"><aside><Link href="/b2b/dashboard" className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">← Business portal</Link><h1 className="display-organic mt-8 text-5xl leading-[.9] md:text-7xl">Request<br /><em className="font-normal">a quote.</em></h1></aside><div className="space-y-10"><section><p className="text-xs font-bold uppercase tracking-[.15em]">Products</p><div className="mt-4 divide-y divide-[#D8CEBC] border-y border-[#D8CEBC] dark:divide-white/15 dark:border-white/15">{products.map((product) => <label key={product.id} className="flex items-center justify-between gap-4 py-4"><span><strong className="block">{product.name}</strong><small className="text-[#756D61] dark:text-[#98A59B]">{product.unit}</small></span><input type="number" min="0" value={quantities[product.id] || ''} onChange={(e) => setQuantities((old) => ({ ...old, [product.id]: Number(e.target.value) }))} placeholder="Qty" className="w-20 border-0 border-b border-[#A89C87] bg-transparent py-2 text-right outline-none" /></label>)}</div></section><section className="grid gap-6 sm:grid-cols-2"><label><span className="text-xs font-bold uppercase tracking-[.14em]">Needed by</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full border-0 border-b border-[#A89C87] bg-transparent py-3 outline-none" /></label><label className="flex items-end gap-3 border-b border-[#A89C87] py-3"><input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} /> Repeat this order</label><label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[.14em]">Note</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-2 w-full resize-none border-0 border-b border-[#A89C87] bg-transparent py-3 outline-none" /></label></section>{error && <p className="border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300">{error}</p>}<button disabled={saving} className="w-full bg-[#173C2A] px-6 py-4 font-bold text-white disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]">{saving ? 'Sending…' : 'Send request'}</button></div></form></main>
}
