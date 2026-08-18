'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Turnstile, { TURNSTILE_ENABLED } from '@/components/Turnstile'

const EMPTY = {
  company_name: '', business_type: 'restaurant', contact_person: '',
  business_phone: '', business_email: '', business_address: '',
  business_registration: '', estimated_monthly_order: '',
}

export default function B2BApplyPage() {
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState<'idle' | 'saving' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [turnstileError, setTurnstileError] = useState(false)
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((old) => ({ ...old, [key]: event.target.value }))

  const retryTurnstile = () => {
    setTurnstileError(false)
    setTurnstileToken(null)
    setTurnstileKey((key) => key + 1)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Please complete the verification challenge.')
      return
    }
    setState('saving')
    try {
      await api.b2b.apply({
        ...form,
        estimated_monthly_order: form.estimated_monthly_order || undefined,
        business_registration: form.business_registration || undefined,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      setState('sent')
    }
    catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Application could not be sent.')
      setState('idle')
      if (TURNSTILE_ENABLED) {
        setTurnstileToken(null)
        setTurnstileKey((key) => key + 1)
      }
    }
  }

  if (state === 'sent') return <main className="grid min-h-screen place-items-center bg-[#F4EFE4] px-6 text-center text-[#173C2A] dark:bg-[#171B18] dark:text-white"><div><p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Application received</p><h1 className="display-organic mt-5 text-5xl md:text-7xl">We’ll be in touch.</h1><Link href="/b2b" className="mt-8 inline-block border-b border-current pb-1 text-sm font-bold">Back to business</Link></div></main>

  const input = 'mt-2 w-full border-0 border-b border-[#A89C87] bg-transparent py-3 text-sm outline-none focus:border-[#2E7D32] dark:text-white dark:focus:border-[#F4C430]'
  const label = 'text-xs font-bold uppercase tracking-[.13em] text-[#675E52] dark:text-[#AFC0B2]'

  return <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36"><form onSubmit={submit} className="page-container grid gap-14 lg:grid-cols-[.7fr_1.3fr]"><aside className="lg:sticky lg:top-32 lg:h-fit"><Link href="/b2b" className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">← Business</Link><h1 className="display-organic mt-8 text-5xl leading-[.9] md:text-7xl">Trade<br /><em className="font-normal">access.</em></h1><p className="mt-7 max-w-xs text-sm leading-6 text-[#675E52] dark:text-[#AFC0B2]">Tell us where you work and what you need.</p></aside><div className="space-y-12"><section className="grid gap-x-7 gap-y-8 sm:grid-cols-2"><label className="sm:col-span-2"><span className={label}>Business name</span><input required value={form.company_name} onChange={set('company_name')} className={input} /></label><label><span className={label}>Business type</span><select value={form.business_type} onChange={set('business_type')} className={input}>{[['restaurant','Restaurant'],['school','School / University'],['hotel','Hotel / Hospitality'],['catering','Catering'],['supermarket','Retail'],['other','Other']].map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><label><span className={label}>Registration number <small className="normal-case tracking-normal">(optional)</small></span><input value={form.business_registration} onChange={set('business_registration')} className={input} /></label><label><span className={label}>Contact person</span><input required value={form.contact_person} onChange={set('contact_person')} className={input} /></label><label><span className={label}>Phone</span><input required value={form.business_phone} onChange={set('business_phone')} className={input} /></label><label><span className={label}>Work email</span><input required type="email" value={form.business_email} onChange={set('business_email')} className={input} /></label><label><span className={label}>Monthly spend <small className="normal-case tracking-normal">(GH₵)</small></span><input type="number" min="0" value={form.estimated_monthly_order} onChange={set('estimated_monthly_order')} className={input} /></label><label className="sm:col-span-2"><span className={label}>Delivery address</span><textarea required rows={2} value={form.business_address} onChange={set('business_address')} className={`${input} resize-none`} /></label></section><div className="border-t border-[#C9BEAA] pt-8 dark:border-white/15">{turnstileError ? <div className="flex items-center justify-between gap-4 border-l-2 border-[#F4C430] pl-4 text-sm"><span>Verification could not load.</span><button type="button" onClick={retryTurnstile} className="border-b border-current font-bold">Retry</button></div> : <Turnstile key={turnstileKey} onToken={(token) => { setTurnstileToken(token); if (token) setTurnstileError(false) }} onError={() => setTurnstileError(true)} />}</div>{error && <p className="border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300">{error}</p>}<button disabled={state === 'saving' || (TURNSTILE_ENABLED && !turnstileToken)} className="w-full bg-[#173C2A] px-6 py-4 font-bold text-white disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]">{state === 'saving' ? 'Sending…' : 'Send application'}</button></div></form></main>
}
