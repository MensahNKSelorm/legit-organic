'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { FoodSubscription } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Awaiting first payment', active: 'Active', paused: 'Paused', cancelled: 'Cancelled',
}

export default function ManageSubscriptionsPage() {
  const { user, isLoading } = useAuth()
  const [rows, setRows] = useState<FoodSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    api.subscriptions.list().then(setRows).catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load deliveries.')).finally(() => setLoading(false))
  }, [user])

  useEffect(load, [load])

  async function act(row: FoodSubscription, action: 'pause' | 'resume' | 'cancel' | 'skip') {
    if (action === 'cancel' && !window.confirm('Cancel this weekly delivery?')) return
    setBusy(row.id); setError('')
    try { const updated = await api.subscriptions.action(row.id, action); setRows((old) => old.map((item) => item.id === row.id ? updated : item)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'That change could not be saved.') }
    finally { setBusy(null) }
  }

  async function pay(row: FoodSubscription) {
    setBusy(row.id); setError('')
    try {
      const checkout = await api.subscriptions.initializePayment(row.id)
      window.location.assign(checkout.checkout_url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open SeevCash checkout.')
      setBusy(null)
    }
  }

  if (isLoading) return <main className="min-h-screen bg-[#F4EFE4] pt-32 dark:bg-[#171B18]" />
  if (!user) return <main className="min-h-screen bg-[#F4EFE4] px-6 pt-40 text-center dark:bg-[#171B18]"><h1 className="display-organic text-5xl dark:text-white">Your weekly deliveries</h1><Link href="/login?next=/subscriptions/manage" className="mt-8 inline-block bg-[#173C2A] px-7 py-3 font-bold text-white">Log in</Link></main>

  return (
    <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36">
      <div className="page-container">
        <div className="flex flex-col justify-between gap-7 border-b border-[#C9BEAA] pb-10 md:flex-row md:items-end dark:border-white/15">
          <div><p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Weekly delivery</p><h1 className="display-organic mt-3 text-5xl md:text-7xl">Your deliveries.</h1></div>
          <Link href="/subscriptions/start?plan=custom" className="bg-[#173C2A] px-6 py-3 text-center text-sm font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]">Start another</Link>
        </div>

        {error && <p className="mt-8 border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {loading ? <p className="py-16 text-sm text-[#756D61]">Loading…</p> : rows.length === 0 ? (
          <div className="grid min-h-[22rem] place-items-center border-b border-[#C9BEAA] text-center dark:border-white/15"><div><p className="text-2xl font-semibold">No weekly delivery yet.</p><Link href="/subscriptions" className="mt-4 inline-block border-b border-current pb-1 text-sm font-bold">Choose a basket</Link></div></div>
        ) : <div className="divide-y divide-[#C9BEAA] dark:divide-white/15">
          {rows.map((row) => (
            <article key={row.id} className="grid gap-8 py-10 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
              <div><div className="flex items-center gap-3"><h2 className="text-2xl font-semibold tracking-[-.03em]">{row.name || row.plan_detail?.name || 'Custom basket'}</h2><span className="text-xs font-bold uppercase tracking-[.12em] text-[#53705A] dark:text-[#A8C4AE]">{STATUS_LABELS[row.status] || row.status}</span></div><p className="mt-2 text-sm text-[#675E52] dark:text-[#AFC0B2]">{row.items.length} items · GH₵{Number(row.weekly_total).toFixed(2)} weekly</p></div>
              <div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs uppercase tracking-[.12em] text-[#756D61] dark:text-[#98A59B]">Next delivery</p><p className="mt-1 font-semibold">{row.next_delivery_date ? new Date(`${row.next_delivery_date}T12:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }) : '—'}</p></div><div><p className="text-xs uppercase tracking-[.12em] text-[#756D61] dark:text-[#98A59B]">Payment</p><p className="mt-1 font-semibold">SeevCash · customer approved</p></div></div>
              <div className="flex flex-wrap gap-4 text-sm font-bold">
                {row.weeks.some((week) => ['renewal_order', 'payment_due'].includes(week.status)) && <button disabled={busy === row.id} onClick={() => pay(row)} className="bg-[#0D3B2A] px-4 py-2 text-white dark:bg-[#F4C430] dark:text-[#173C2A]">Pay renewal</button>}
                {row.status === 'active' && <><button disabled={busy === row.id} onClick={() => act(row, 'skip')} className="border-b border-current">Skip week</button><button disabled={busy === row.id} onClick={() => act(row, 'pause')} className="border-b border-current">Pause</button></>}
                {row.status === 'paused' && <button disabled={busy === row.id} onClick={() => act(row, 'resume')} className="border-b border-current">Resume</button>}
                {!['cancelled'].includes(row.status) && <button disabled={busy === row.id} onClick={() => act(row, 'cancel')} className="text-[#9B342E]">Cancel</button>}
              </div>
            </article>
          ))}
        </div>}
      </div>
    </main>
  )
}
