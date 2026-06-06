'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { api } from '@/lib/api'
import type { Order } from '@/types'
import AddressModal, { type AddressData } from './AddressModal'

interface CheckoutButtonProps {
  onClose: () => void
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

export default function CheckoutButton({ onClose }: CheckoutButtonProps) {
  const { user } = useAuth()
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)

  const initiateOrder = async (deliveryAddress: string) => {
    setIsLoading(true)
    try {
      console.log('User:', user?.email)
      console.log('Token:', localStorage.getItem('access_token')?.slice(0, 20))

      const orderData = await api.orders.create({
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        delivery_address: deliveryAddress,
      }) as Order

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user!.email,
          amount: Math.round(parseFloat(orderData.total_amount) * 100),
          currency: 'GHS',
          ref: orderData.reference,
          callback: (response: { reference: string }) => {
            api.orders.verifyPayment(response.reference)
              .then(() => {
                clearCart()
                onClose()
                router.push(`/order-confirmation?ref=${response.reference}`)
              })
              .catch(() => {
                alert('Payment verification failed. Please contact support.')
                setIsLoading(false)
              })
          },
          onClose: () => {
            setIsLoading(false)
          },
        })
        handler.openIframe()
      }
      document.body.appendChild(script)
    } catch (error: any) {
      console.error('Checkout error:', error)
      const message = error?.message || error?.detail || JSON.stringify(error)
      alert(`Failed to create order: ${message}`)
      setIsLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    const hasAddress = user.street_address && user.city && user.delivery_region
    if (!hasAddress) {
      setShowAddressModal(true)
      return
    }

    await initiateOrder(buildDeliveryAddress(user))
  }

  const handleAddressSaved = (addressData: any) => {
    const deliveryAddress = [
      addressData.house_number,
      addressData.street_address,
      addressData.city,
      addressData.delivery_region,
    ].filter(Boolean).join(', ')
    setShowAddressModal(false)
    initiateOrder(deliveryAddress)
  }

  return (
    <>
      <button
        onClick={handleCheckout}
        disabled={isLoading || items.length === 0}
        className="w-full bg-[#0D3B2A] text-[#F4C430] font-semibold py-3 rounded-xl hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing…' : 'Checkout'}
      </button>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleAddressSaved}
      />
    </>
  )
}
