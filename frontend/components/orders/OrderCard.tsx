'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Order } from '@/types'
import { getMediaUrl } from '@/lib/media'

const PLACEHOLDERS = [
  '/images/products/p1.webp',
  '/images/products/p2.webp',
  '/images/products/p3.webp',
  '/images/products/p4.webp',
]

const STEPS = [
  { key: 'whatsapp_pending', label: 'Order Placed',       icon: '📋' },
  { key: 'paid',             label: 'Payment Confirmed',  icon: '✅' },
  { key: 'processing',       label: 'Being Prepared',     icon: '🌿' },
  { key: 'shipped',          label: 'On the Way',         icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',          icon: '🎉' },
]

const STEP_ORDER = ['whatsapp_pending', 'paid', 'processing', 'shipped', 'delivered']

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:          { label: 'Awaiting Payment',  cls: 'bg-yellow-100 text-yellow-800' },
  whatsapp_pending: { label: 'Awaiting Payment',  cls: 'bg-yellow-100 text-yellow-800' },
  paid:             { label: 'Payment Confirmed', cls: 'bg-blue-100 text-blue-800'   },
  processing:       { label: 'Being Prepared',    cls: 'bg-orange-100 text-orange-800' },
  shipped:          { label: 'On the Way',        cls: 'bg-purple-100 text-purple-800' },
  delivered:        { label: 'Delivered',         cls: 'bg-green-100 text-green-800' },
  cancelled:        { label: 'Cancelled',         cls: 'bg-red-100 text-red-700'     },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0 mt-0.5 text-[#2E7D32]">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export default function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)

  const currentStep = STEP_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const badge = STATUS_BADGE[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-700' }

  const stepCompleted = (idx: number) => {
    if (order.status === 'delivered') return true
    if (order.status === 'cancelled') return false
    return idx < currentStep
  }
  const stepCurrent = (idx: number) => {
    if (order.status === 'delivered') return false
    if (order.status === 'cancelled') return false
    return idx === currentStep
  }

  return (
    <div className={[
      'rounded-2xl border bg-white transition-all duration-300',
      expanded
        ? 'border-[#2E7D32] shadow-md'
        : 'border-[#E6D8BD] shadow-sm hover:shadow-md',
    ].join(' ')}>

      {/* ── Header (always visible, click to toggle) ── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono font-bold text-[#0D3B2A] text-sm tracking-tight">
              {order.reference}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs text-[#5B3E31]">
            <span>{formatDate(order.created_at)}</span>
            <span className="font-semibold text-[#2E7D32]">
              GH₵ {parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg
          viewBox="0 0 24 24" width="15" height="15"
          stroke="currentColor" strokeWidth="2.5"
          fill="none" strokeLinecap="round" strokeLinejoin="round"
          className={[
            'text-[#0D3B2A] shrink-0 transition-transform duration-300',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Expandable body ── */}
      <div className={[
        'overflow-hidden transition-all duration-500 ease-in-out',
        expanded ? 'max-h-[1800px] opacity-100' : 'max-h-0 opacity-0',
      ].join(' ')}>
        <div className="px-5 pb-6 space-y-6 border-t border-[#E6D8BD]">

          {/* ── Progress tracker ── */}
          {!isCancelled && (
            <div className="pt-5">

              {/* Delivered celebration banner */}
              {order.status === 'delivered' && (
                <div className="mb-6 p-4 bg-[#F0FFF4] border border-[#2E7D32] rounded-xl flex items-center gap-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <p className="font-semibold text-[#0D3B2A]">Order Delivered!</p>
                    <p className="text-sm text-[#2E7D32]">
                      Thank you for choosing Legit Organic. We hope you enjoy your fresh organic produce!
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop: horizontal stepper */}
              <div className="hidden sm:flex items-start">
                {STEPS.map((step, idx) => {
                  const isCompleted = stepCompleted(idx)
                  const isCurrent = stepCurrent(idx)
                  const isLast = idx === STEPS.length - 1

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {/* Connecting line — spans from center of this circle to center of next */}
                      {!isLast && (
                        <div className="absolute top-[18px] left-1/2 right-[-50%] h-[2px] z-0 bg-[#E6D8BD] overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-[#2E7D32] transition-all duration-700"
                            style={{
                              width: expanded && isCompleted ? '100%' : '0%',
                              transitionDelay: expanded ? `${idx * 180}ms` : '0ms',
                            }}
                          />
                        </div>
                      )}

                      {/* Circle */}
                      <div className={[
                        'relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300',
                        isCompleted
                          ? 'bg-[#2E7D32] text-white'
                          : isCurrent
                          ? 'bg-[#F4C430] text-[#0D3B2A] animate-pulse ring-4 ring-[#F4C430]/30'
                          : 'bg-[#F5F0E6] text-[#9CA3AF]',
                      ].join(' ')}>
                        {isCompleted ? <CheckIcon /> : step.icon}
                      </div>

                      {/* Label */}
                      <span className={[
                        'mt-2 text-xs text-center leading-snug px-1',
                        isCompleted || isCurrent
                          ? 'text-[#0D3B2A] font-semibold'
                          : 'text-[#9CA3AF]',
                      ].join(' ')}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Mobile: vertical stepper */}
              <div className="sm:hidden">
                {STEPS.map((step, idx) => {
                  const isCompleted = stepCompleted(idx)
                  const isCurrent = stepCurrent(idx)
                  const isLast = idx === STEPS.length - 1

                  return (
                    <div key={step.key} className="flex gap-3">
                      {/* Track column */}
                      <div className="flex flex-col items-center">
                        <div className={[
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-300',
                          isCompleted
                            ? 'bg-[#2E7D32] text-white'
                            : isCurrent
                            ? 'bg-[#F4C430] text-[#0D3B2A] animate-pulse ring-4 ring-[#F4C430]/30'
                            : 'bg-[#F5F0E6] text-[#9CA3AF]',
                        ].join(' ')}>
                          {isCompleted ? <CheckIcon /> : step.icon}
                        </div>
                        {!isLast && (
                          <div className="w-[2px] flex-1 my-1 min-h-[20px] overflow-hidden bg-[#E6D8BD]">
                            <div
                              className="w-full bg-[#2E7D32] transition-all duration-700"
                              style={{
                                height: expanded && isCompleted ? '100%' : '0%',
                                transitionDelay: expanded ? `${idx * 180}ms` : '0ms',
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Step label */}
                      <p className={[
                        'text-sm font-medium leading-snug mt-1 pb-5',
                        isCompleted || isCurrent
                          ? 'text-[#0D3B2A] font-semibold'
                          : 'text-[#9CA3AF]',
                      ].join(' ')}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="pt-5 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-xl">❌</span>
              <span className="text-sm text-red-700 font-medium">This order was cancelled.</span>
            </div>
          )}

          {/* ── Order items ── */}
          <div>
            <p className="text-xs font-semibold text-[#5B3E31] uppercase tracking-wider mb-3">Items</p>
            <ul className="space-y-3">
              {order.items.map((item) => {
                if (!item.product) return null
                const imageSrc = getMediaUrl(
                  item.product.image,
                  PLACEHOLDERS[item.product.id % PLACEHOLDERS.length],
                )
                const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2)
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#F5F0E6] shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0D3B2A] truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#5B3E31]">
                        {item.quantity} × GH₵ {parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#2E7D32] shrink-0">
                      GH₵ {subtotal}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ── Total ── */}
          <div className="flex items-center justify-between py-3 border-t border-[#E6D8BD]">
            <span className="text-sm text-[#5B3E31]">
              {order.discount_amount && parseFloat(order.discount_amount) > 0
                ? 'Total (after discount)'
                : 'Total'}
            </span>
            <span className="font-bold text-[#2E7D32]">
              GH₵ {parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>

          {/* ── Delivery address ── */}
          {order.delivery_address && (
            <div className="flex gap-2 text-sm text-[#5B3E31]">
              <PinIcon />
              <span>{order.delivery_address}</span>
            </div>
          )}

          {/* ── Download Receipt ── */}
          <div className="mt-4 flex justify-end">
            <a
              href={`https://api.legitorganic.com/api/orders/${order.reference}/receipt/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D3B2A] text-[#F4C430] rounded-xl font-semibold text-sm hover:bg-[#1a5c40] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Receipt
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
