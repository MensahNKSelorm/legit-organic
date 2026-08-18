'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { DeliveryZone, Product, SubscriptionPlan } from '@/types'

function StartSubscriptionContent() {
  const { user, isLoading, isB2B } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const requestedPlan = params.get('plan') || 'custom'
  const audience = params.get('audience') === 'business' ? 'business' : 'household'
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [planSlug, setPlanSlug] = useState(requestedPlan)
  const [zoneId, setZoneId] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payment] = useState<'mobile_money'>('mobile_money')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.subscriptions.plans(audience),
      api.subscriptions.zones(),
      api.products.list('is_available=true'),
    ]).then(([planRows, zoneRows, productRows]) => {
      setPlans(planRows); setZones(zoneRows); setProducts(productRows)
      if (zoneRows[0]) setZoneId(String(zoneRows[0].id))
    }).catch(() => setError('The weekly shop is still being prepared.'))
  }, [audience])

  useEffect(() => {
    if (user) {
      setPhone(user.phone_number || '')
      setAddress([user.house_number, user.street_address, user.city, user.delivery_region].filter(Boolean).join(', '))
    }
  }, [user])

  const selectedPlan = plans.find((plan) => plan.slug === planSlug)
  const isCustom = planSlug === 'custom' || !selectedPlan || selectedPlan.plan_type === 'custom'
  const chosenItems = useMemo(() => Object.entries(quantities).filter(([, qty]) => qty > 0), [quantities])
  const customTotal = chosenItems.reduce((total, [id, qty]) => total + Number(products.find((product) => product.id === Number(id))?.price || 0) * qty, 0)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/subscriptions/start?plan=${planSlug}`)}`); return }
    if (!zoneId || !address.trim() || !phone.trim()) { setError('Add your delivery details.'); return }
    if (isCustom && !chosenItems.length) { setError('Choose at least one item.'); return }
    setSaving(true); setError('')
    try {
      const subscription = await api.subscriptions.create({
        audience, plan: isCustom ? null : selectedPlan?.id,
        delivery_zone: Number(zoneId), delivery_address: address,
        contact_phone: phone, payment_method: payment,
        items: isCustom ? chosenItems.map(([id, quantity]) => ({ product_id: Number(id), quantity })) : undefined,
      })
      const checkout = await api.subscriptions.initializePayment(subscription.id)
      window.location.assign(checkout.checkout_url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your weekly delivery.')
    } finally { setSaving(false) }
  }

  if (isLoading) return <main className="min-h-screen bg-[#F4EFE4] pt-36 dark:bg-[#171B18]" />

  return (
    <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36">
      <form onSubmit={submit} className="page-container grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <Link href={audience === 'business' ? '/b2b/dashboard' : '/subscriptions'} className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">← {audience === 'business' ? 'Business portal' : 'Weekly delivery'}</Link>
          <h1 className="display-organic mt-8 text-5xl leading-[.9] md:text-7xl">Build<br /><em className="font-normal">{audience === 'business' ? 'your supply.' : 'your week.'}</em></h1>
          <div className="mt-10 border-t border-[#C9BEAA] pt-5 dark:border-white/20">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#756D61] dark:text-[#9EABA0]">Weekly total</p>
            <p className="mt-2 text-3xl font-semibold">GH₵{isCustom ? customTotal.toFixed(2) : Number(selectedPlan?.weekly_price || 0).toFixed(2)}</p>
            <p className="mt-1 text-xs text-[#756D61] dark:text-[#9EABA0]">Delivery added after zone selection.</p>
          </div>
        </aside>

        <div className="space-y-12">
          <section>
            <label className="text-xs font-bold uppercase tracking-[.16em] text-[#756D61] dark:text-[#9EABA0]">Basket</label>
            <div className="mt-4 grid gap-px border border-[#C9BEAA] bg-[#C9BEAA] sm:grid-cols-2 dark:border-white/15 dark:bg-white/15">
              {[...plans, { id: 0, slug: 'custom', name: 'Build your week', weekly_price: '0' } as SubscriptionPlan].map((plan) => (
                <button type="button" key={plan.slug} onClick={() => setPlanSlug(plan.slug)} className={`p-5 text-left transition-colors ${planSlug === plan.slug ? 'bg-[#173C2A] text-white' : 'bg-[#FFFDF8] hover:bg-[#F0E8D8] dark:bg-[#202620] dark:hover:bg-[#293129]'}`}>
                  <span className="font-semibold">{plan.name}</span>
                  {Number(plan.weekly_price) > 0 && <span className="float-right text-sm">GH₵{Number(plan.weekly_price).toFixed(0)}</span>}
                </button>
              ))}
            </div>
          </section>

          {isCustom && <section>
            <label className="text-xs font-bold uppercase tracking-[.16em] text-[#756D61] dark:text-[#9EABA0]">Your items</label>
            <div className="mt-4 divide-y divide-[#D8CEBC] border-y border-[#D8CEBC] dark:divide-white/15 dark:border-white/15">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 py-4">
                  <div><p className="font-semibold">{product.name}</p><p className="text-xs text-[#756D61] dark:text-[#9EABA0]">GH₵{Number(product.price).toFixed(2)} · {product.unit}</p></div>
                  <div className="flex items-center border border-[#B9AE9A] dark:border-white/20">
                    <button type="button" aria-label={`Remove ${product.name}`} onClick={() => setQuantities((old) => ({ ...old, [product.id]: Math.max(0, (old[product.id] || 0) - 1) }))} className="px-3 py-2">−</button>
                    <span className="w-8 text-center text-sm font-bold">{quantities[product.id] || 0}</span>
                    <button type="button" aria-label={`Add ${product.name}`} onClick={() => setQuantities((old) => ({ ...old, [product.id]: (old[product.id] || 0) + 1 }))} className="px-3 py-2">+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>}

          <section className="grid gap-6 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[.14em]">Delivery area</span><select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="mt-2 w-full border-0 border-b border-[#A89C87] bg-transparent py-3 outline-none dark:text-white"><option value="">Choose area</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {zone.delivery_day}</option>)}</select></label>
            <label><span className="text-xs font-bold uppercase tracking-[.14em]">Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full border-0 border-b border-[#A89C87] bg-transparent py-3 outline-none" /></label>
            <div><span className="text-xs font-bold uppercase tracking-[.14em]">Payment</span><p className="mt-2 border-b border-[#A89C87] py-3">SeevCash · pay each delivery</p></div>
            <label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[.14em]">Address</span><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="mt-2 w-full resize-none border-0 border-b border-[#A89C87] bg-transparent py-3 outline-none" /></label>
          </section>
          {error && <p className="border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
          {audience === 'business' && !isB2B && <p className="border-l-2 border-[#F4C430] pl-4 text-sm">Approved business access is required.</p>}
          <button disabled={saving || (audience === 'business' && !isB2B)} className="w-full bg-[#173C2A] px-6 py-4 font-bold text-white disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]">{user ? (saving ? 'Saving…' : 'Continue to payment') : 'Log in to continue'}</button>
        </div>
      </form>
    </main>
  )
}

export default function StartSubscriptionPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#F4EFE4] pt-36 dark:bg-[#171B18]" />}><StartSubscriptionContent /></Suspense>
}
