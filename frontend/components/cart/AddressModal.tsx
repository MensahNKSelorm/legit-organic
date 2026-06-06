'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

export interface AddressData {
  house_number: string
  street_address: string
  city: string
  delivery_region: string
  phone_number: string
}

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (address: AddressData) => void
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

export default function AddressModal({ isOpen, onClose, onSave }: AddressModalProps) {
  const { user, updateUser } = useAuth()

  const [houseNumber, setHouseNumber] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [deliveryRegion, setDeliveryRegion] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [errors, setErrors] = useState<Partial<AddressData>>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  // Pre-fill from existing user data
  useEffect(() => {
    if (user && isOpen) {
      setHouseNumber(user.house_number ?? '')
      setStreetAddress(user.street_address ?? '')
      setCity(user.city ?? '')
      setDeliveryRegion(user.delivery_region ?? '')
      setPhoneNumber(user.phone_number ?? '')
      setErrors({})
      setApiError('')
    }
  }, [user, isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const validate = (): boolean => {
    const next: Partial<AddressData> = {}

    if (!streetAddress.trim()) next.street_address = 'Street address is required.'
    if (!city.trim()) next.city = 'City is required.'
    if (!deliveryRegion) next.delivery_region = 'Please select a region.'

    if (!phoneNumber.trim()) {
      next.phone_number = 'Phone number is required.'
    } else if (!PHONE_RE.test(phoneNumber.replace(/\s/g, ''))) {
      next.phone_number = 'Enter a valid Ghana number e.g. +233244123456 or 0244123456'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setApiError('')

    const formData: AddressData = {
      house_number: houseNumber.trim(),
      street_address: streetAddress.trim(),
      city: city.trim(),
      delivery_region: deliveryRegion,
      phone_number: phoneNumber.replace(/\s/g, ''),
    }

    try {
      await api.users.updateProfile({ ...formData, email: user?.email })
      updateUser({
        street_address: formData.street_address,
        house_number: formData.house_number,
        city: formData.city,
        delivery_region: formData.delivery_region,
        phone_number: formData.phone_number,
      })
      onSave(formData)
      onClose()
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to save address.')
    } finally {
      setSaving(false)
    }
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
        aria-label="Delivery address"
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-md bg-[#FAF7F0] rounded-2xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6D8BD]">
            <h2 className="font-display text-lg font-bold text-[#0D3B2A]">Delivery Address</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F0E6] transition-colors text-[#0D3B2A] text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSave} noValidate>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-[#5B3E31]">
                We need your delivery address before placing an order.
              </p>

              {apiError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {apiError}
                </div>
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
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-[#E6D8BD] text-[#0D3B2A] font-semibold text-sm hover:bg-[#F5F0E6] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#0D3B2A] text-[#F4C430] font-semibold text-sm hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
