'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { api } from '@/lib/api'
import type { Order } from '@/types'

interface CheckoutButtonProps {
  onClose: () => void
}

export default function CheckoutButton({ onClose }: CheckoutButtonProps) {
  const { user } = useAuth()
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(true)

    try {
      // Create pending order on backend
      const orderData = await api.orders.create({
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        delivery_address: user.delivery_address || '',
      }) as Order

      // Load Paystack inline script
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user.email,
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
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to create order. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || items.length === 0}
      className="w-full bg-[#0D3B2A] text-[#F4C430] font-semibold py-3 rounded-xl hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Processing…' : 'Checkout'}
    </button>
  )
}
