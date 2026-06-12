'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'school', label: 'School / University' },
  { value: 'hotel', label: 'Hotel / Hospitality' },
  { value: 'catering', label: 'Catering Company' },
  { value: 'supermarket', label: 'Supermarket / Retail' },
  { value: 'other', label: 'Other' },
]

const inputBase =
  'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#1f2937] text-[#0D3B2A] dark:text-[#faf7f0] text-sm focus:outline-none focus:ring-1 transition-colors'
const inputOk = `${inputBase} border-[#E6D8BD] dark:border-[#374151] focus:border-[#2E7D32] focus:ring-[#2E7D32]`
const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-400`

type FormErrors = Partial<Record<string, string>>

export default function B2BApplyPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [estimatedMonthlyOrder, setEstimatedMonthlyOrder] = useState('')
  const [businessRegistration, setBusinessRegistration] = useState('')
  const [notes, setNotes] = useState('')

  function validate(): boolean {
    const next: FormErrors = {}
    if (!companyName.trim()) next.company_name = 'Company name is required.'
    if (!businessType) next.business_type = 'Please select a business type.'
    if (!contactPerson.trim()) next.contact_person = 'Contact person name is required.'
    if (!businessPhone.trim()) next.business_phone = 'Phone number is required.'
    if (!businessEmail.trim()) next.business_email = 'Business email is required.'
    else if (!/\S+@\S+\.\S+/.test(businessEmail)) next.business_email = 'Enter a valid email address.'
    if (!businessAddress.trim()) next.business_address = 'Business address is required.'
    if (!estimatedMonthlyOrder.trim()) next.estimated_monthly_order = 'Please enter your estimated monthly order.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.b2b.apply({
        company_name: companyName.trim(),
        business_type: businessType,
        contact_person: contactPerson.trim(),
        business_phone: businessPhone.trim(),
        business_email: businessEmail.trim(),
        business_address: businessAddress.trim(),
        estimated_monthly_order: estimatedMonthlyOrder.trim() || undefined,
        business_registration: businessRegistration.trim() || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  const err = (field: string) => errors[field]
  const cls = (f: string) => err(f) ? inputErr : inputOk

  if (submitted) {
    return (
      <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">
        <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '2.5rem' }}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <Link href="/b2b" className="inline-flex items-center gap-1 text-[#A7C4A0] hover:text-[#F4C430] text-sm mb-4 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to B2B Portal
            </Link>
            <h1 className="font-display text-3xl font-bold text-white">Application Submitted</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
          <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-10 text-center">
            <div className="w-16 h-16 bg-[#F0FFF4] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0D3B2A] dark:text-white mb-3">
              Application Received!
            </h2>
            <p className="text-[#5B3E31] dark:text-[#9ca3af] mb-2 text-sm leading-relaxed max-w-md mx-auto">
              We&rsquo;ll review your application and respond to{' '}
              <strong>{businessEmail}</strong> within 24&ndash;48 hours.
            </p>
            <p className="text-[#5B3E31] dark:text-[#9ca3af] text-xs mb-8">
              If approved, we&rsquo;ll email you a link to set up your account password.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="bg-[#F4C430] text-[#0D3B2A] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#e6b82a] transition-colors text-sm"
              >
                Browse Products
              </Link>
              <a
                href={`https://wa.me/233539569260?text=${encodeURIComponent('Hello Legit Organic! I just applied for a B2B account and would like to follow up.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-2 border-[#0D3B2A] dark:border-[#81C784] text-[#0D3B2A] dark:text-[#81C784] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0D3B2A]/5 transition-colors text-sm"
              >
                Follow Up on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* Header */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '2.5rem' }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Link href="/b2b" className="inline-flex items-center gap-1 text-[#A7C4A0] hover:text-[#F4C430] text-sm mb-4 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to B2B Portal
          </Link>
          <p className="text-[#F4C430] text-xs font-bold uppercase tracking-widest mb-1">B2B Application</p>
          <h1 className="font-display text-3xl font-bold text-white">Apply for B2B Account</h1>
          <p className="text-[#A7C4A0] mt-1 text-sm">No account or documents required — takes under 2 minutes</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">

        {/* Info note */}
        <div className="mb-6 p-4 bg-[#F0FFF4] dark:bg-[#0a1f14] border border-[#2E7D32]/20 rounded-xl flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-[#0D3B2A] dark:text-[#81C784] leading-relaxed">
            Your login credentials will be sent to your business email upon approval.
            No account needed to apply.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] shadow-sm overflow-hidden">

          {/* Business Details */}
          <div className="px-8 py-6 border-b border-[#E6D8BD] dark:border-[#374151]">
            <h2 className="font-display text-base font-bold text-[#0D3B2A] dark:text-white mb-5">Business Details</h2>
            <div className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); setErrors(p => ({ ...p, company_name: undefined })) }}
                    placeholder="Kofi's Restaurant Ltd"
                    className={cls('company_name')}
                  />
                  {err('company_name') && <p className="mt-1 text-xs text-red-500">{err('company_name')}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => { setBusinessType(e.target.value); setErrors(p => ({ ...p, business_type: undefined })) }}
                    className={cls('business_type')}
                  >
                    <option value="">Select type…</option>
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value}>{bt.label}</option>
                    ))}
                  </select>
                  {err('business_type') && <p className="mt-1 text-xs text-red-500">{err('business_type')}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={businessAddress}
                  onChange={(e) => { setBusinessAddress(e.target.value); setErrors(p => ({ ...p, business_address: undefined })) }}
                  placeholder="12 Independence Ave, Accra, Greater Accra"
                  rows={2}
                  className={cls('business_address')}
                />
                {err('business_address') && <p className="mt-1 text-xs text-red-500">{err('business_address')}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Business Registration Number
                  <span className="text-[#9ca3af] font-normal ml-1 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={businessRegistration}
                  onChange={(e) => setBusinessRegistration(e.target.value)}
                  placeholder="e.g. CS123456789"
                  className={inputOk}
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="px-8 py-6 border-b border-[#E6D8BD] dark:border-[#374151]">
            <h2 className="font-display text-base font-bold text-[#0D3B2A] dark:text-white mb-5">Contact Details</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => { setContactPerson(e.target.value); setErrors(p => ({ ...p, contact_person: undefined })) }}
                  placeholder="Full name of primary contact"
                  className={cls('contact_person')}
                />
                {err('contact_person') && <p className="mt-1 text-xs text-red-500">{err('contact_person')}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                    Business Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => { setBusinessPhone(e.target.value); setErrors(p => ({ ...p, business_phone: undefined })) }}
                    placeholder="+233244123456"
                    className={cls('business_phone')}
                  />
                  {err('business_phone') && <p className="mt-1 text-xs text-red-500">{err('business_phone')}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                    Business Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => { setBusinessEmail(e.target.value); setErrors(p => ({ ...p, business_email: undefined })) }}
                    placeholder="orders@yourcompany.com"
                    className={cls('business_email')}
                  />
                  {err('business_email') && <p className="mt-1 text-xs text-red-500">{err('business_email')}</p>}
                  <p className="mt-1 text-xs text-[#9ca3af]">
                    Your login credentials will be sent here upon approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Volume & Notes */}
          <div className="px-8 py-6">
            <h2 className="font-display text-base font-bold text-[#0D3B2A] dark:text-white mb-5">Order Volume</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Estimated Monthly Order (GH₵) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={estimatedMonthlyOrder}
                  onChange={(e) => { setEstimatedMonthlyOrder(e.target.value); setErrors(p => ({ ...p, estimated_monthly_order: undefined })) }}
                  placeholder="e.g. 2000"
                  className={cls('estimated_monthly_order')}
                />
                {err('estimated_monthly_order') && <p className="mt-1 text-xs text-red-500">{err('estimated_monthly_order')}</p>}
                <p className="mt-1 text-xs text-[#9ca3af]">
                  Helps us assign the right discount tier. Silver from GH₵200, Gold from GH₵500, Platinum from GH₵1,000.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Additional Notes
                  <span className="text-[#9ca3af] font-normal ml-1 text-xs">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or products you're interested in…"
                  rows={3}
                  className={inputOk}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-[#FAF7F0] dark:bg-[#111827] border-t border-[#E6D8BD] dark:border-[#374151]">
            {submitError && (
              <p className="text-sm text-red-500 mb-3">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0D3B2A] text-[#F4C430] font-bold px-8 py-3 rounded-xl hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
