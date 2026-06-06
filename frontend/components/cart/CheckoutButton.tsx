'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { api } from '@/lib/api'

interface CheckoutButtonProps {
  onClose: () => void
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => { openIframe: () => void }
    }
  }
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack'))
    document.head.appendChild(script)
  })
}

export default function CheckoutButton({ onClose }: CheckoutButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      onClose()
      router.push('/login?next=/products')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await loadPaystackScript()

      // Create pending order on backend
      const deliveryAddress = user?.delivery_address || 'To be confirmed'
      const order = await api.orders.create({
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        delivery_address: deliveryAddress,
      }) as { id: number; reference: string; total_amount: string }

      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!paystackKey) throw new Error('Paystack key not configured')

      const handler = window.PaystackPop!.setup({
        key: paystackKey,
        email: user!.email,
        amount: Math.round(parseFloat(order.total_amount) * 100),
        currency: 'GHS',
        ref: order.reference,
        metadata: {
          order_id: order.id,
          user_id: user!.id,
          custom_fields: items.map((i) => ({
            display_name: i.product.name,
            variable_name: `product_${i.product.id}`,
            value: `${i.quantity} × GH₵${i.product.price}`,
          })),
        },
        callback: async (response: { reference: string }) => {
          try {
            await api.orders.verifyPayment(response.reference)
            clearCart()
            onClose()
            router.push(`/order-confirmation?ref=${response.reference}`)
          } catch {
            setError('Payment received but verification failed. Contact support.')
          }
        },
        onClose: () => {
          setLoading(false)
        },
      })

      handler.openIframe()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-red-600 text-xs mb-2 text-center">{error}</p>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading || items.length === 0}
        className="w-full bg-[#0D3B2A] text-[#F4C430] font-semibold py-3 rounded-xl hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing…' : 'Checkout'}
      </button>
    </div>
  )
}
