'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import type { BusinessSupplyAgreement } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', under_review: 'Under review', approved: 'Approved', active: 'Active',
  paused: 'Paused', cancelled: 'Cancelled', renewal_order: 'Order ready',
  payment_due: 'Payment due', paid: 'Paid', skipped: 'Skipped', payment_failed: 'Payment failed',
  expired: 'Expired', packing: 'Packing', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
}

function SupplyManager() {
  const search = useSearchParams()
  const selectedId = Number(search.get('id'))
  const [agreements, setAgreements] = useState<BusinessSupplyAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [changeOpen, setChangeOpen] = useState(false)
  const selected = useMemo(() => agreements.find((row) => row.id === selectedId) || agreements[0], [agreements, selectedId])

  const load = async () => {
    setLoading(true); setError('')
    try { setAgreements(await api.b2b.supply.list()) }
    catch { setError('Supply agreements could not be loaded.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void Promise.resolve().then(load) }, [])

  async function action(name: 'pause' | 'resume' | 'cancel' | 'skip') {
    if (!selected) return
    setBusy(name); setError('')
    try { await api.b2b.supply.action(selected.id, name); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'That change could not be completed.') }
    finally { setBusy('') }
  }
  async function pay(cycleId: number) {
    setBusy(`pay-${cycleId}`); setError('')
    try { const session = await api.b2b.supply.initializePayment(cycleId); window.location.assign(session.checkout_url) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Checkout could not be opened.') ; setBusy('') }
  }
  async function requestChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const data = new FormData(event.currentTarget)
    const proposed = {
      frequency: String(data.get('frequency')),
      delivery_address: String(data.get('delivery_address')).trim(),
      receiving_contact_name: String(data.get('receiving_contact_name')).trim(),
      receiving_contact_phone: String(data.get('receiving_contact_phone')).trim(),
      receiving_hours: String(data.get('receiving_hours')).trim(),
      delivery_instructions: String(data.get('delivery_instructions')).trim(),
    }
    setBusy('revision'); setError('')
    try {
      await api.b2b.supply.revise(selected.id, proposed, String(data.get('customer_note')).trim())
      setChangeOpen(false); await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your change request could not be sent.')
    } finally { setBusy('') }
  }

  if (loading) return <p className="py-20 text-sm">Loading supply agreements…</p>
  if (!selected) return <div className="py-20"><h1 className="display-organic text-5xl">No supply agreement yet.</h1><Link href="/b2b/supply" className="mt-6 inline-block bg-[#173C2A] px-5 py-3 font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]">Create a request</Link></div>
  const nextCycle = selected.cycles.find((cycle) => ['renewal_order', 'payment_due', 'payment_failed'].includes(cycle.status))

  return <div className="py-10">
    <header className="grid gap-8 border-b border-[#B9AD98] pb-10 lg:grid-cols-[1fr_auto] lg:items-end dark:border-white/20"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#2E7D32] dark:text-[#F4C430]">Supply agreement</p><h1 className="display-organic mt-3 text-5xl md:text-7xl">{selected.name}</h1><p className="mt-4 text-sm text-[#675E52] dark:text-[#AFC0B2]">{STATUS_LABELS[selected.status]} · {selected.frequency} · {selected.delivery_zone_detail.name}</p></div><div className="flex flex-wrap gap-3">{selected.status === 'active' && <><button onClick={() => action('skip')} disabled={!!busy} className="border border-[#9D927F] px-4 py-3 text-sm font-bold dark:border-white/25">Skip next</button><button onClick={() => action('pause')} disabled={!!busy} className="border border-[#9D927F] px-4 py-3 text-sm font-bold dark:border-white/25">Pause</button></>}{selected.status === 'paused' && <button onClick={() => action('resume')} disabled={!!busy} className="bg-[#173C2A] px-5 py-3 text-sm font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]">Resume</button>}{selected.status !== 'cancelled' && <button onClick={() => action('cancel')} disabled={!!busy} className="px-4 py-3 text-sm font-bold text-red-700 dark:text-red-300">Cancel</button>}</div></header>
    {error && <p role="alert" className="mt-6 border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
    {nextCycle && <section className="mt-10 grid gap-6 bg-[#173C2A] p-7 text-white sm:grid-cols-[1fr_auto] sm:items-center dark:bg-[#202A23]"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#F4C430]">{STATUS_LABELS[nextCycle.status]}</p><h2 className="mt-2 text-2xl font-semibold">Delivery {new Date(nextCycle.delivery_date).toLocaleDateString('en-GH', { dateStyle: 'long' })}</h2><p className="mt-2 text-sm text-white/70">GH₵{Number(nextCycle.total).toFixed(2)} · payment closes {new Date(nextCycle.payment_due_at).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><button onClick={() => pay(nextCycle.id)} disabled={!!busy} className="bg-[#F4C430] px-6 py-4 font-bold text-[#173C2A]">{busy === `pay-${nextCycle.id}` ? 'Opening…' : 'Review and pay'}</button></section>}
    <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_.9fr]"><section><h2 className="border-b border-[#B9AD98] pb-4 text-2xl font-semibold dark:border-white/20">Agreed supply</h2><div className="divide-y divide-[#D8CEBC] dark:divide-white/15">{selected.items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-5 py-4"><div><p className="font-semibold">{item.product.name}</p><p className="text-xs text-[#756D61] dark:text-[#98A59B]">{item.quantity} × {item.product.unit}</p></div><p className="font-semibold">GH₵{Number(item.subtotal).toFixed(2)}</p></div>)}</div><div className="mt-5 flex justify-between border-t border-[#173C2A] pt-4 text-lg font-semibold dark:border-white"><span>Agreement total</span><span>GH₵{Number(selected.total).toFixed(2)}</span></div></section><section><h2 className="border-b border-[#B9AD98] pb-4 text-2xl font-semibold dark:border-white/20">Receiving</h2><dl className="grid gap-5 py-5 text-sm"><div><dt className="text-[#756D61] dark:text-[#98A59B]">Address</dt><dd className="mt-1 font-semibold">{selected.delivery_address}</dd></div><div><dt className="text-[#756D61] dark:text-[#98A59B]">Contact</dt><dd className="mt-1 font-semibold">{selected.receiving_contact_name} · {selected.receiving_contact_phone}</dd></div>{selected.receiving_hours && <div><dt className="text-[#756D61] dark:text-[#98A59B]">Receiving hours</dt><dd className="mt-1 font-semibold">{selected.receiving_hours}</dd></div>}</dl><button onClick={() => setChangeOpen((open) => !open)} className="border-b border-[#2E7D32] pb-1 text-sm font-bold text-[#2E7D32] dark:border-[#F4C430] dark:text-[#F4C430]">{changeOpen ? 'Close request' : 'Request a change'}</button><p className="mt-4 border-t border-[#B9AD98] pt-5 text-sm text-[#675E52] dark:border-white/20 dark:text-[#AFC0B2]">We review delivery changes before they affect a future order.</p></section></div>
    {changeOpen && <section className="mt-10 border border-[#B9AD98] bg-white/45 p-6 dark:border-white/20 dark:bg-white/[.04]"><h2 className="text-2xl font-semibold">Change delivery terms</h2><form onSubmit={requestChange} className="mt-6 grid gap-5 md:grid-cols-2"><label className="text-sm font-semibold">Frequency<select name="frequency" defaultValue={selected.frequency} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25"><option value="weekly">Weekly</option><option value="fortnightly">Every two weeks</option><option value="monthly">Monthly</option></select></label><label className="text-sm font-semibold">Receiving contact<input name="receiving_contact_name" required defaultValue={selected.receiving_contact_name} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25" /></label><label className="text-sm font-semibold md:col-span-2">Delivery address<textarea name="delivery_address" required defaultValue={selected.delivery_address} rows={2} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25" /></label><label className="text-sm font-semibold">Receiving phone<input name="receiving_contact_phone" required defaultValue={selected.receiving_contact_phone} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25" /></label><label className="text-sm font-semibold">Receiving hours<input name="receiving_hours" defaultValue={selected.receiving_hours} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25" /></label><label className="text-sm font-semibold md:col-span-2">Delivery instructions<textarea name="delivery_instructions" defaultValue={selected.delivery_instructions} rows={2} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25" /></label><label className="text-sm font-semibold md:col-span-2">Reason for the change<textarea name="customer_note" required rows={3} className="mt-2 w-full border border-[#9D927F] bg-transparent px-4 py-3 dark:border-white/25" /></label><button disabled={!!busy} className="w-fit bg-[#173C2A] px-6 py-3 font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]">{busy === 'revision' ? 'Sending…' : 'Send for review'}</button></form></section>}
    <section className="mt-14"><h2 className="border-b border-[#B9AD98] pb-4 text-2xl font-semibold dark:border-white/20">Delivery record</h2>{selected.cycles.length ? <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">{[...selected.cycles].reverse().map((cycle) => <div key={cycle.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_.7fr_.7fr]"><p className="font-semibold">{new Date(cycle.delivery_date).toLocaleDateString('en-GH', { dateStyle: 'medium' })}</p><p className="text-sm">{STATUS_LABELS[cycle.status]}</p><p className="text-sm font-semibold sm:text-right">GH₵{Number(cycle.total).toFixed(2)}</p></div>)}</div> : <p className="py-8 text-sm text-[#675E52] dark:text-[#AFC0B2]">The first delivery cycle appears after approval.</p>}</section>
  </div>
}

export default function BusinessSupplyManagePage() {
  return <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36"><div className="page-container"><Link href="/b2b/dashboard" className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">← Business account</Link><Suspense fallback={<p className="py-20 text-sm">Loading…</p>}><SupplyManager /></Suspense></div></main>
}
