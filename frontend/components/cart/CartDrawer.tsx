'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { getMediaUrl } from '@/lib/media'
import { api } from '@/lib/api'
import type { PromoCode } from '@/types'
import CheckoutButton from './CheckoutButton'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

const PLACEHOLDERS = [
  '/images/products/p1.webp',
  '/images/products/p2.webp',
  '/images/products/p3.webp',
  '/images/products/p4.webp',
]

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, total, itemCount, updateQuantity, removeItem } = useCart()
  const drawerRef = useRef<HTMLDivElement>(null)

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const result = await api.orders.validatePromo(promoCode.trim(), total)
      setAppliedPromo(result)
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : 'Invalid promo code.')
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoError('')
  }

  return (
    <>
      {/* Backdrop — full screen, z-40 */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel — fixed, full viewport height, flex column */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={[
          'fixed top-0 right-0 z-50',
          'h-[100dvh] w-full max-w-md',
          'flex flex-col overflow-hidden',
          'bg-[#FAF7F0] dark:bg-[#111827] shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* 1. Header — flex-shrink-0 */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-[#E6D8BD] dark:border-[#374151]">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-[#0D3B2A] dark:text-[#faf7f0]">
              Your Cart
            </h2>
            {itemCount > 0 && (
              <span className="text-sm font-semibold text-[#5B3E31] dark:text-[#9ca3af]">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors text-[#0D3B2A] dark:text-[#faf7f0] text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 2. Items list — flex-1, scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#C3B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="text-[#5B3E31] dark:text-[#9ca3af] font-medium">Your cart is empty</p>
              <Link
                href="/products"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#F4C430] text-[#0D3B2A] text-sm font-semibold rounded-xl hover:bg-[#C59F2C] transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => {
                const imageSrc = getMediaUrl(
                  item.product.image,
                  PLACEHOLDERS[item.product.id % PLACEHOLDERS.length]
                )
                const subtotal = (parseFloat(item.product.price) * item.quantity).toFixed(2)
                return (
                  <li key={item.product.id} className="flex gap-4 py-4 border-b border-[#E6D8BD] dark:border-[#374151] last:border-0">
                    {/* Product image */}
                    <div className="relative w-[60px] h-[60px] rounded-xl overflow-hidden bg-[#F5F0E6] dark:bg-[#374151] shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0D3B2A] dark:text-[#faf7f0] leading-snug line-clamp-2">
                          {item.product.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          aria-label={`Remove ${item.product.name}`}
                          className="shrink-0 w-11 h-11 flex items-center justify-center text-[#9ca3af] hover:text-red-500 transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-[#5B3E31] dark:text-[#9ca3af] mt-0.5">
                        GH₵ {parseFloat(item.product.price).toFixed(2)} · {item.product.unit}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 border border-[#E6D8BD] dark:border-[#374151] rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-9 h-9 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-9 h-9 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-bold text-[#2E7D32] dark:text-[#81C784]">
                          GH₵ {subtotal}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* 3. Promo code section — shrink-0, above footer */}
        {items.length > 0 && (
          <div className="shrink-0 px-6 py-4 border-t border-[#E6D8BD] dark:border-[#374151]">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase())
                  setPromoError('')
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo() }}
                placeholder="Promo code"
                disabled={!!appliedPromo}
                className="flex-1 px-3 py-2 rounded-lg border border-[#E6D8BD] bg-[#FAF7F0] text-[#0D3B2A] text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] dark:bg-[#1f2937] dark:border-[#374151] dark:text-[#faf7f0] disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoLoading || !!appliedPromo || !promoCode.trim()}
                className="px-4 py-2 rounded-lg bg-[#0D3B2A] text-[#F4C430] text-sm font-semibold hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <p className="mt-2 text-xs text-red-500">{promoError}</p>
            )}
            {appliedPromo && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#2E7D32] dark:text-[#81C784] font-medium">
                  {appliedPromo.code} — {appliedPromo.message}
                </span>
                <button
                  onClick={handleRemovePromo}
                  className="text-xs text-[#9ca3af] hover:text-red-500 transition-colors ml-2 shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Footer — flex-shrink-0, always at bottom */}
        <div className="shrink-0 min-h-fit px-6 pt-5 pb-6 border-t border-[#E6D8BD] dark:border-[#374151] bg-[#FAF7F0] dark:bg-[#111827]">
          {appliedPromo ? (
            <div className="mb-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5B3E31] dark:text-[#9ca3af]">Subtotal</span>
                <span className="text-sm text-[#0D3B2A] dark:text-[#faf7f0]">GH₵ {total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2E7D32] dark:text-[#81C784]">Discount ({appliedPromo.code})</span>
                <span className="text-sm text-[#2E7D32] dark:text-[#81C784]">−GH₵ {appliedPromo.discount_amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-[#E6D8BD] dark:border-[#374151]">
                <span className="text-base font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">Total</span>
                <span className="text-xl font-bold text-[#2E7D32] dark:text-[#81C784]">
                  GH₵ {appliedPromo.final_amount.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">Total</span>
              <span className="text-xl font-bold text-[#2E7D32] dark:text-[#81C784]">
                GH₵ {total.toFixed(2)}
              </span>
            </div>
          )}
          <CheckoutButton onClose={onClose} promoCode={appliedPromo?.code} appliedPromo={appliedPromo} />
          <Link
            href="/products"
            onClick={onClose}
            className="block text-center mt-3 text-sm text-[#5B3E31] dark:text-[#9ca3af] hover:text-[#0D3B2A] dark:hover:text-[#faf7f0] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </>
  )
}
