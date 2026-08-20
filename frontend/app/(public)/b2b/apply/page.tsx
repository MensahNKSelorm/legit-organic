'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Turnstile, { TURNSTILE_ENABLED } from '@/components/Turnstile'

const REGIONS = ['Ahafo','Ashanti','Bono','Bono East','Central','Eastern','Greater Accra','North East','Northern','Oti','Savannah','Upper East','Upper West','Volta','Western','Western North']
const CATEGORIES = ['Fresh vegetables','Fresh fruit','Herbs and aromatics','Roots and tubers','Grains and legumes','Seasonal produce']
const REGISTERED = new Set(['business_name','partnership','limited_shares','limited_guarantee'])
const EMPTY = {
  company_name:'', trading_name:'', legal_structure:'business_name', business_type:'restaurant', sector:'', year_started:'', website:'', organization_tin:'', business_registration:'', verification_document_type:'orc_certificate', registration_exemption_reason:'', contact_person:'', contact_job_title:'', business_phone:'', alternative_phone:'', business_email:'', delivery_region:'', delivery_city:'', delivery_district:'', delivery_locality:'', delivery_street:'', ghana_post_gps:'', delivery_landmark:'', delivery_directions:'', receiving_contact_name:'', receiving_contact_phone:'', receiving_hours:'', access_restrictions:'', order_frequency:'weekly', estimated_monthly_order:'', preferred_start_date:'', invoice_requirements:'', procurement_notes:'', purchase_order_required:false, applicant_authorized:false, information_confirmed:false, privacy_acknowledged:false,
}
type FormState = typeof EMPTY

export default function B2BApplyPage() {
  const [form,setForm] = useState<FormState>(EMPTY)
  const [categories,setCategories] = useState<string[]>([])
  const [document,setDocument] = useState<File|null>(null)
  const [state,setState] = useState<'idle'|'saving'|'sent'>('idle')
  const [error,setError] = useState('')
  const [reference,setReference] = useState<number|null>(null)
  const [turnstileToken,setTurnstileToken] = useState<string|null>(null)
  const [turnstileKey,setTurnstileKey] = useState(0)
  const [turnstileError,setTurnstileError] = useState(false)
  const isRegistered = useMemo(() => REGISTERED.has(form.legal_structure),[form.legal_structure])
  const set = (key:keyof FormState) => (event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm(old => ({...old,[key]:value}))
  }
  const toggleCategory = (category:string) => setCategories(old => old.includes(category) ? old.filter(item => item !== category) : [...old,category])

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (!document) return setError('Upload your supporting document.')
    if (!categories.length) return setError('Select at least one produce category.')
    if (TURNSTILE_ENABLED && !turnstileToken) return setError('Complete the verification challenge.')
    setState('saving')
    const data = new FormData()
    const optionalTypedFields = new Set(['year_started','estimated_monthly_order','preferred_start_date'])
    Object.entries(form).forEach(([key,value]) => {
      if (value === '' && optionalTypedFields.has(key)) return
      data.append(key,String(value))
    })
    data.append('produce_categories',JSON.stringify(categories))
    data.append('verification_document',document)
    if (turnstileToken) data.append('turnstile_token',turnstileToken)
    try { const result = await api.b2b.apply(data); setReference(result.id); setState('sent') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not submit the application.'); setState('idle'); setTurnstileToken(null); setTurnstileKey(key => key + 1) }
  }

  if (state === 'sent') return <main className="grid min-h-screen place-items-center bg-[#F4EFE4] px-6 text-center text-[#173C2A] dark:bg-[#171B18] dark:text-white"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2E7D32] dark:text-[#F4C430]">Application received · LO-B2B-{reference}</p><h1 className="display-organic mt-5 text-5xl md:text-7xl">Now we review.</h1><p className="mt-6 leading-7 text-[#675E52] dark:text-[#AFC0B2]">We’ll verify the organisation and contact you by email.</p><Link href="/b2b" className="mt-8 inline-block border-b border-current pb-1 text-sm font-bold">Return to business</Link></div></main>

  const input = 'mt-2 min-h-12 w-full border border-[#B8AC97] bg-[#FBF8F1] px-4 py-3 text-sm text-[#173C2A] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15 dark:border-white/20 dark:bg-white/[.04] dark:text-white dark:focus:border-[#F4C430]'
  return <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36"><form onSubmit={submit} className="page-container grid gap-12 xl:grid-cols-[20rem_minmax(0,1fr)]">
    <aside className="xl:sticky xl:top-32 xl:h-fit"><Link href="/b2b" className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">← Business</Link><p className="mt-10 text-xs font-bold uppercase tracking-[.16em] text-[#2E7D32] dark:text-[#F4C430]">Trade application</p><h1 className="display-organic mt-4 text-5xl leading-[.9] md:text-7xl">Tell us who we’re supplying.</h1><p className="mt-7 max-w-sm text-sm leading-6 text-[#675E52] dark:text-[#AFC0B2]">Have your registration document and delivery details ready.</p><div className="mt-8 border-l-2 border-[#F4C430] pl-4 text-xs leading-5 text-[#675E52] dark:text-[#AFC0B2]">Documents are private and available only to authorised reviewers.</div></aside>
    <div className="space-y-14">
      <FormSection eyebrow="Organisation" title="The registered entity">
        <Field label="Registered name" wide><input required maxLength={200} value={form.company_name} onChange={set('company_name')} className={input}/></Field>
        <Field label="Trading name" optional><input maxLength={200} value={form.trading_name} onChange={set('trading_name')} className={input}/></Field>
        <Field label="Legal structure"><select required value={form.legal_structure} onChange={e => { set('legal_structure')(e); setForm(old => ({...old,verification_document_type:REGISTERED.has(e.target.value)?'orc_certificate':'introductory_letter'})) }} className={input}><option value="business_name">Business name / sole proprietor</option><option value="partnership">Partnership</option><option value="limited_shares">Company limited by shares</option><option value="limited_guarantee">Company limited by guarantee / NGO</option><option value="public_institution">Public institution / MDA / MMDA</option><option value="cooperative">Cooperative</option><option value="foreign_mission">Foreign mission / external organisation</option><option value="other">Other</option></select></Field>
        <Field label="Business use"><select required value={form.business_type} onChange={set('business_type')} className={input}><option value="restaurant">Restaurant</option><option value="school">School / University</option><option value="hotel">Hotel / Hospitality</option><option value="catering">Catering</option><option value="supermarket">Retail</option><option value="other">Other</option></select></Field>
        <Field label="Sector"><input required maxLength={120} value={form.sector} onChange={set('sector')} className={input} placeholder="e.g. Education, hospitality"/></Field>
        <Field label="Year operations began" optional><input type="number" min="1900" max={new Date().getFullYear()} value={form.year_started} onChange={set('year_started')} className={input}/></Field>
        <Field label="Website or public profile" optional wide><input type="url" value={form.website} onChange={set('website')} className={input} placeholder="https://"/></Field>
      </FormSection>
      <FormSection eyebrow="Verification" title="Proof of registration">
        <Field label="Organisation TIN"><input required maxLength={50} value={form.organization_tin} onChange={set('organization_tin')} className={input}/></Field>
        {isRegistered ? <Field label="ORC registration number"><input required maxLength={100} value={form.business_registration} onChange={set('business_registration')} className={input}/></Field> : <Field label="Registration basis" wide><textarea required rows={3} value={form.registration_exemption_reason} onChange={set('registration_exemption_reason')} className={input} placeholder="Explain why ORC registration does not apply."/></Field>}
        <Field label="Supporting document" wide><div className="mt-2 border border-dashed border-[#9E927E] bg-[#FBF8F1] p-5 dark:border-white/25 dark:bg-white/[.04]"><input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e => setDocument(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-4 file:border-0 file:bg-[#173C2A] file:px-4 file:py-2 file:font-bold file:text-white dark:file:bg-[#F4C430] dark:file:text-[#173C2A]"/><p className="mt-3 text-xs text-[#675E52] dark:text-[#AFC0B2]">{isRegistered?'ORC certificate':'Official introductory or authorisation letter'} · PDF, JPG or PNG · 5 MB maximum</p></div></Field>
      </FormSection>
      <FormSection eyebrow="Contact" title="An authorised contact">
        <Field label="Full name"><input required maxLength={150} value={form.contact_person} onChange={set('contact_person')} className={input}/></Field><Field label="Position"><input required maxLength={120} value={form.contact_job_title} onChange={set('contact_job_title')} className={input}/></Field><Field label="Work email"><input required type="email" value={form.business_email} onChange={set('business_email')} className={input}/></Field><Field label="Primary phone"><input required type="tel" value={form.business_phone} onChange={set('business_phone')} className={input} placeholder="+233 or 0…"/></Field><Field label="Alternative phone" optional><input type="tel" value={form.alternative_phone} onChange={set('alternative_phone')} className={input}/></Field>
      </FormSection>
      <FormSection eyebrow="Delivery" title="Where goods are received">
        <Field label="Region"><select required value={form.delivery_region} onChange={set('delivery_region')} className={input}><option value="">Select region</option>{REGIONS.map(region=><option key={region}>{region}</option>)}</select></Field><Field label="City or town"><input required value={form.delivery_city} onChange={set('delivery_city')} className={input}/></Field><Field label="District / municipality" optional><input value={form.delivery_district} onChange={set('delivery_district')} className={input}/></Field><Field label="Locality / neighbourhood"><input required value={form.delivery_locality} onChange={set('delivery_locality')} className={input}/></Field><Field label="Street and building" optional wide><input value={form.delivery_street} onChange={set('delivery_street')} className={input}/></Field><Field label="GhanaPost GPS" hint="Use a landmark and directions if unavailable."><input value={form.ghana_post_gps} onChange={set('ghana_post_gps')} className={input} placeholder="GA-123-4567" pattern="[A-Za-z]{2}-[0-9]{3,4}-[0-9]{4}"/></Field><Field label="Nearest landmark" optional><input value={form.delivery_landmark} onChange={set('delivery_landmark')} className={input}/></Field><Field label="Directions" optional wide><textarea rows={3} value={form.delivery_directions} onChange={set('delivery_directions')} className={input}/></Field><Field label="Receiving contact"><input required value={form.receiving_contact_name} onChange={set('receiving_contact_name')} className={input}/></Field><Field label="Receiving phone"><input required type="tel" value={form.receiving_contact_phone} onChange={set('receiving_contact_phone')} className={input}/></Field><Field label="Receiving hours"><input required value={form.receiving_hours} onChange={set('receiving_hours')} className={input} placeholder="Mon–Fri, 8:00–16:00"/></Field><Field label="Access or unloading notes" optional><textarea rows={2} value={form.access_restrictions} onChange={set('access_restrictions')} className={input}/></Field>
      </FormSection>
      <FormSection eyebrow="Supply" title="What the operation needs">
        <Field label="Produce categories" wide><div className="mt-3 grid gap-2 sm:grid-cols-2">{CATEGORIES.map(category=><label key={category} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 text-sm transition ${categories.includes(category)?'border-[#2E7D32] bg-[#E5EBD9] dark:border-[#F4C430] dark:bg-[#F4C430]/10':'border-[#B8AC97] dark:border-white/20'}`}><input type="checkbox" checked={categories.includes(category)} onChange={()=>toggleCategory(category)} className="accent-[#2E7D32]"/>{category}</label>)}</div></Field><Field label="Order frequency"><select required value={form.order_frequency} onChange={set('order_frequency')} className={input}><option value="weekly">Weekly</option><option value="fortnightly">Every two weeks</option><option value="monthly">Monthly</option><option value="ad_hoc">As needed</option></select></Field><Field label="Estimated monthly spend" optional><input type="number" min="0" step="0.01" value={form.estimated_monthly_order} onChange={set('estimated_monthly_order')} className={input} placeholder="GH₵"/></Field><Field label="Preferred start date" optional><input type="date" value={form.preferred_start_date} onChange={set('preferred_start_date')} className={input}/></Field><Field label="Invoice requirements" optional><input value={form.invoice_requirements} onChange={set('invoice_requirements')} className={input}/></Field><Field label="Procurement notes" optional wide><textarea rows={3} value={form.procurement_notes} onChange={set('procurement_notes')} className={input}/></Field><label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={form.purchase_order_required} onChange={set('purchase_order_required')} className="mt-1 accent-[#2E7D32]"/><span>Our organisation requires a purchase order before supply.</span></label>
      </FormSection>
      <section className="border-t-2 border-[#173C2A] pt-8 dark:border-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2E7D32] dark:text-[#F4C430]">Declaration</p><div className="mt-6 space-y-4">{[['applicant_authorized','I am authorised to apply for this organisation.'],['information_confirmed','The information and document are accurate.'],['privacy_acknowledged',<>I understand how this information will be reviewed. See the <Link href="/privacy-policy" className="border-b border-current">privacy policy</Link>.</>]].map(([key,text])=><label key={String(key)} className="flex items-start gap-3 text-sm leading-6"><input required type="checkbox" checked={Boolean(form[key as keyof FormState])} onChange={set(key as keyof FormState)} className="mt-1 accent-[#2E7D32]"/><span>{text}</span></label>)}</div></section>
      <div className="border-t border-[#C9BEAA] pt-8 dark:border-white/15">{turnstileError?<div className="flex items-center justify-between gap-4 border-l-2 border-[#F4C430] pl-4 text-sm"><span>Verification could not load.</span><button type="button" onClick={()=>{setTurnstileError(false);setTurnstileToken(null);setTurnstileKey(key=>key+1)}} className="border-b border-current font-bold">Retry</button></div>:<Turnstile key={turnstileKey} onToken={token=>{setTurnstileToken(token);if(token)setTurnstileError(false)}} onError={()=>setTurnstileError(true)}/>}</div>
      {error&&<p role="alert" className="border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300">{error}</p>}<button disabled={state==='saving'||(TURNSTILE_ENABLED&&!turnstileToken)} className="w-full bg-[#173C2A] px-6 py-4 font-bold text-white transition hover:bg-[#24543D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]">{state==='saving'?'Submitting…':'Submit trade application'}</button>
    </div>
  </form></main>
}

function FormSection({eyebrow,title,children}:{eyebrow:string,title:string,children:React.ReactNode}) { return <section className="border-t-2 border-[#173C2A] pt-8 dark:border-white"><div className="mb-8 grid gap-2 sm:grid-cols-[9rem_1fr]"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2E7D32] dark:text-[#F4C430]">{eyebrow}</p><h2 className="display-organic text-3xl leading-none md:text-4xl">{title}</h2></div><div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">{children}</div></section> }
function Field({label,optional,hint,wide,children}:{label:string,optional?:boolean,hint?:string,wide?:boolean,children:React.ReactNode}) { return <label className={wide?'sm:col-span-2':''}><span className="text-[.7rem] font-bold uppercase tracking-[.12em] text-[#675E52] dark:text-[#B7C4B9]">{label}{optional&&<span className="ml-2 normal-case tracking-normal opacity-70">Optional</span>}</span>{children}{hint&&<span className="mt-2 block text-xs leading-5 text-[#675E52] dark:text-[#AFC0B2]">{hint}</span>}</label> }
