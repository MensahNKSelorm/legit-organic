'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { api } from '@/lib/api'
import type { PromoCode } from '@/types'
import AddressModal, { type AddressData } from './AddressModal'
import GuestOrderModal, { type GuestData } from './GuestOrderModal'

interface CheckoutButtonProps {
  onClose: () => void
  promoCode?: string
  appliedPromo?: PromoCode | null
}

function buildDeliveryAddress(data: {
  house_number?: string
  street_address?: string
  city?: string
  delivery_region?: string
}): string {
  return [data.house_number, data.street_address, data.city, data.delivery_region]
    .filter(Boolean)
    .join(', ')
}

function buildWhatsAppUrl(
  customerLine: string,
  itemsList: string,
  discountLine: string,
  finalTotal: number,
  deliveryAddress: string,
  reference?: string
): string {
  const referenceLine = reference ? `\n*Order Reference:* ${reference}` : ''

  const message = `Hello Legit Organic! 🌿

I'd like to place an order:

${customerLine}${referenceLine}

*Order Details:*
${itemsList}${discountLine}

*Total:* GH₵${finalTotal.toFixed(2)}

*Delivery Address:* ${deliveryAddress || 'To be confirmed'}

Please send me the MoMo payment details. Thank you!`

  return `https://wa.me/233539569260?text=${encodeURIComponent(message)}`
}

export default function CheckoutButton({ onClose: _onClose, promoCode, appliedPromo }: CheckoutButtonProps) {
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const buildOrderLines = () => {
    const itemsList = items
      .map(
        (item) =>
          `• ${item.product.name} x${item.quantity} — GH₵${(parseFloat(item.product.price) * item.quantity).toFixed(2)}`
      )
      .join('\n')

    const discountLine =
      promoCode && appliedPromo
        ? `\nDiscount (${promoCode}): -GH₵${appliedPromo.discount_amount.toFixed(2)}`
        : ''

    const finalTotal = appliedPromo ? appliedPromo.final_amount : total

    return { itemsList, discountLine, finalTotal }
  }

  const openWhatsApp = async (deliveryAddress: string) => {
    const { itemsList, discountLine, finalTotal } = buildOrderLines()
    const customerLine = `*Customer:* ${user!.first_name} ${user!.last_name}\n*Email:* ${user!.email}`

    let reference: string | undefined
    try {
      const order = await api.orders.create({
        items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        delivery_address: deliveryAddress,
        promo_code: promoCode || undefined,
        order_source: 'whatsapp',
      })
      reference = order.reference
    } catch {
      // Don't block the WhatsApp order if DB recording fails
    } finally {
      setIsLoading(false)
    }

    const waUrl = buildWhatsAppUrl(customerLine, itemsList, discountLine, finalTotal, deliveryAddress, reference)
    const link = document.createElement('a')
    link.href = waUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    clearCart()
  }

  const handleWhatsAppOrder = async () => {
    if (!user) {
      setShowGuestModal(true)
      return
    }

    const hasAddress = user.street_address && user.city && user.delivery_region
    if (!hasAddress) {
      setShowAddressModal(true)
      return
    }

    setIsLoading(true)
    await openWhatsApp(buildDeliveryAddress(user))
  }

  const handleAddressSaved = async (addressData: AddressData) => {
    setShowAddressModal(false)
    setIsLoading(true)
    await openWhatsApp(buildDeliveryAddress(addressData))
  }

  const handleGuestSubmit = async (guestData: GuestData) => {
    setShowGuestModal(false)
    setIsLoading(true)

    const deliveryAddress = buildDeliveryAddress(guestData)
    const { itemsList, discountLine, finalTotal } = buildOrderLines()
    const customerLine = `*Customer:* ${guestData.first_name} ${guestData.last_name}\n*Phone:* ${guestData.phone_number}`

    let reference: string | undefined
    try {
      const order = await api.orders.createGuest({
        items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        delivery_address: deliveryAddress,
        guest_name: `${guestData.first_name} ${guestData.last_name}`,
        guest_phone: guestData.phone_number,
        guest_email: '',
        order_source: 'whatsapp',
        promo_code: promoCode || undefined,
      })
      reference = order.reference
    } catch {
      // Don't block the WhatsApp order if DB recording fails
    } finally {
      setIsLoading(false)
    }

    const waUrl = buildWhatsAppUrl(customerLine, itemsList, discountLine, finalTotal, deliveryAddress, reference)
    const link = document.createElement('a')
    link.href = waUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    clearCart()
  }

  return (
    <>
      <button
        onClick={handleWhatsAppOrder}
        disabled={items.length === 0 || isLoading}
        className="w-full bg-[#25D366] text-white font-semibold py-3 rounded-xl hover:bg-[#1ebe5d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          'Processing…'
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Order via WhatsApp
          </>
        )}
      </button>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleAddressSaved}
      />

      <GuestOrderModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        onSubmit={handleGuestSubmit}
      />
    </>
  )
}
