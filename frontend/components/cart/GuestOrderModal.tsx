'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LocationPicker from '@/components/ui/LocationPicker'

export interface GuestData {
  first_name: string
  last_name: string
  phone_number: string
  house_number: string
  street_address: string
  city: string
  delivery_region: string
}

interface GuestOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (guestData: GuestData) => void
}

const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
  'International',
]

const PHONE_RE = /^(\+233|0)[0-9]{9}$/

type FormErrors = Partial<Record<keyof GuestData, string>>

export default function GuestOrderModal({ isOpen, onClose, onSubmit }: GuestOrderModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [deliveryRegion, setDeliveryRegion] = useState('')

  const [showMap, setShowMap] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName('')
      setLastName('')
      setPhoneNumber('')
      setHouseNumber('')
      setStreetAddress('')
      setCity('')
      setDeliveryRegion('')
      setErrors({})
    }
  }, [isOpen])

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!firstName.trim()) next.first_name = 'First name is required.'
    if (!lastName.trim()) next.last_name = 'Last name is required.'
    if (!phoneNumber.trim()) {
      next.phone_number = 'Phone number is required.'
    } else if (!PHONE_RE.test(phoneNumber.replace(/\s/g, ''))) {
      next.phone_number = 'Enter a valid Ghana number e.g. +233244123456 or 0244123456'
    }
    if (!streetAddress.trim()) next.street_address = 'Street address is required.'
    if (!city.trim()) next.city = 'City is required.'
    if (!deliveryRegion) next.delivery_region = 'Please select a region.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.replace(/\s/g, ''),
      house_number: houseNumber.trim(),
      street_address: streetAddress.trim(),
      city: city.trim(),
      delivery_region: deliveryRegion,
    })
  }

  if (!isOpen) return null

  const inputBase =
    'w-full px-4 py-2.5 rounded-xl border bg-[#FAF7F0] text-[#0D3B2A] text-sm focus:outline-none focus:ring-1 transition-colors'
  const inputOk = `${inputBase} border-[#E6D8BD] focus:border-[#2E7D32] focus:ring-[#2E7D32]`
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-400`

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick order details"
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-md bg-[#FAF7F0] rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-[#E6D8BD]">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0D3B2A]">Quick Order Details</h2>
              <p className="text-xs text-[#5B3E31] mt-0.5">
                No account needed — just fill in your details and we&apos;ll connect you via WhatsApp
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F0E6] transition-colors text-[#0D3B2A] text-xl leading-none shrink-0 ml-3"
            >
              ×
            </button>
          </div>

          {/* Body — scrollable */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* First / Last name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, first_name: undefined })) }}
                    placeholder="Kofi"
                    className={errors.first_name ? inputErr : inputOk}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, last_name: undefined })) }}
                    placeholder="Mensah"
                    className={errors.last_name ? inputErr : inputOk}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value); setErrors((p) => ({ ...p, phone_number: undefined })) }}
                  placeholder="+233244123456 or 0244123456"
                  className={errors.phone_number ? inputErr : inputOk}
                />
                {errors.phone_number ? (
                  <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>
                ) : (
                  <p className="mt-1 text-xs text-[#9ca3af]">Format: +233244123456 or 0244123456</p>
                )}
              </div>

              {/* Map toggle */}
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="w-full flex items-center justify-center gap-2 py-2.5
                           rounded-xl border-2 border-dashed border-[#2E7D32]
                           text-[#2E7D32] font-semibold text-sm
                           hover:bg-[#2E7D32]/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                     className="w-4 h-4">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {showMap ? 'Hide Map' : 'Pick Location on Map'}
              </button>

              {showMap && (
                <LocationPicker
                  onLocationSelect={(data) => {
                    if (data.street_address) setStreetAddress(data.street_address)
                    if (data.house_number) setHouseNumber(data.house_number)
                    if (data.city) setCity(data.city)
                    if (data.delivery_region) setDeliveryRegion(data.delivery_region)
                  }}
                />
              )}

              {/* House number */}
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                  House / Apartment Number
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. A14, Flat 3"
                  className={inputOk}
                />
              </div>

              {/* Street address */}
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => { setStreetAddress(e.target.value); setErrors((p) => ({ ...p, street_address: undefined })) }}
                  placeholder="e.g. 12 Independence Ave"
                  className={errors.street_address ? inputErr : inputOk}
                />
                {errors.street_address && (
                  <p className="mt-1 text-xs text-red-500">{errors.street_address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setErrors((p) => ({ ...p, city: undefined })) }}
                  placeholder="e.g. Accra"
                  className={errors.city ? inputErr : inputOk}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                )}
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] mb-1.5">
                  Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={deliveryRegion}
                  onChange={(e) => { setDeliveryRegion(e.target.value); setErrors((p) => ({ ...p, delivery_region: undefined })) }}
                  className={errors.delivery_region ? inputErr : inputOk}
                >
                  <option value="">Select region…</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.delivery_region && (
                  <p className="mt-1 text-xs text-red-500">{errors.delivery_region}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 pb-6 pt-4 space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-[#E6D8BD] text-[#0D3B2A] font-semibold text-sm hover:bg-[#F5F0E6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5d] transition-colors flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Continue to WhatsApp
                </button>
              </div>

              <p className="text-center text-xs text-[#9ca3af]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  onClick={onClose}
                  className="text-[#2E7D32] font-semibold hover:underline"
                >
                  Sign in / Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
