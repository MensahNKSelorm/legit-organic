'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Order } from '@/types'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) {
      setError('No order reference found.')
      setLoading(false)
      return
    }
    api.orders.detail(ref)
      .then((o) => setOrder(o as Order))
      .catch(() => setError('Could not load order details.'))
      .finally(() => setLoading(false))
  }, [ref])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827]">
        <div className="w-8 h-8 border-4 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAF7F0] dark:bg-[#111827] px-4">
        <p className="text-red-600 font-medium">{error || 'Order not found.'}</p>
        <Link href="/products" className="px-5 py-2.5 bg-[#F4C430] text-[#0D3B2A] font-semibold rounded-xl hover:bg-[#C59F2C] transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#111827] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-sm border border-[#E6D8BD] dark:border-[#374151] p-8 text-center">
          {/* Checkmark */}
          <div className="w-20 h-20 rounded-full bg-[#F0F7F0] dark:bg-[#1a2e1a] flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-bold text-[#0D3B2A] dark:text-[#faf7f0] mb-2">
            Order Confirmed!
          </h1>
          <p className="text-[#5B3E31] dark:text-[#9ca3af] mb-1">
            Thank you for your order.
          </p>
          <p className="text-xs text-[#9ca3af] dark:text-[#6b7280] mb-6 font-mono">
            Ref: {order.reference}
          </p>

          {/* Items */}
          <div className="text-left border border-[#E6D8BD] dark:border-[#374151] rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 bg-[#F5F0E6] dark:bg-[#374151]">
              <p className="text-xs font-semibold text-[#0D3B2A] dark:text-[#faf7f0] uppercase tracking-wide">
                Order Items
              </p>
            </div>
            <ul className="divide-y divide-[#E6D8BD] dark:divide-[#374151]">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0D3B2A] dark:text-[#faf7f0]">
                      {item.product?.name ?? 'Product'}
                    </p>
                    <p className="text-xs text-[#5B3E31] dark:text-[#9ca3af]">
                      {item.quantity} × GH₵{parseFloat(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#2E7D32] dark:text-[#81C784]">
                    GH₵{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-4 py-3 bg-[#F5F0E6] dark:bg-[#374151]">
              <span className="text-sm font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">Total Paid</span>
              <span className="text-base font-bold text-[#2E7D32] dark:text-[#81C784]">
                GH₵{parseFloat(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery note */}
          <div className="flex items-center gap-3 p-4 bg-[#F0F7F0] dark:bg-[#1a2e1a] border border-[#C3E6CB] dark:border-[#2d4a2d] rounded-xl mb-6 text-left">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <path d="m16 8 5 5-5 5" />
              <path d="M21 13H9" />
            </svg>
            <p className="text-sm text-[#2E7D32] dark:text-[#81C784] font-medium">
              Estimated delivery: 1–3 business days
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/products"
              className="flex-1 text-center px-5 py-3 bg-[#F4C430] text-[#0D3B2A] font-semibold rounded-xl hover:bg-[#C59F2C] transition-colors text-sm"
            >
              Continue Shopping
            </Link>
            <Link
              href="/profile"
              className="flex-1 text-center px-5 py-3 border-2 border-[#0D3B2A] dark:border-[#81C784] text-[#0D3B2A] dark:text-[#81C784] font-semibold rounded-xl hover:bg-[#F5F0E6] dark:hover:bg-[#1a2e1a] transition-colors text-sm"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827]">
        <div className="w-8 h-8 border-4 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
