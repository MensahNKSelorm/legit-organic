'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

function PaymentResult() {
  const params = useSearchParams()
  const reference = params.get('reference') || undefined
  const weekId = Number(params.get('week') || 0) || undefined
  const { isAuthenticated, isLoading } = useAuth()
  const [state, setState] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('Checking your payment…')
  const paymentPath = `/subscriptions/payment?${params.toString()}`
  const loginPath = `/login?next=${encodeURIComponent(paymentPath)}`

  useEffect(() => {
    if (isLoading || !isAuthenticated || (!reference && !weekId)) return
    api.subscriptions.verifyPayment(reference, weekId)
      .then(() => { setState('success'); setMessage('Your weekly delivery is active.') })
      .catch((reason) => { setState('error'); setMessage(reason instanceof Error ? reason.message : 'Payment could not be verified.') })
  }, [isAuthenticated, isLoading, reference, weekId])

  if (isLoading) {
    return <div className="max-w-xl border-t border-[#C9BEAA] pt-8 text-center dark:border-white/20"><p className="text-sm font-bold text-[#625B51] dark:text-[#C7CEC8]">Restoring your secure session…</p></div>
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl border-t border-[#C9BEAA] pt-8 text-center dark:border-white/20">
        <p className="text-lg font-semibold">Log in to finish confirming this delivery</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#625B51] dark:text-[#C7CEC8]">Your checkout details are still here. Use the Legit Organic account that started the order and we’ll bring you straight back to this payment.</p>
        <Link href={loginPath} className="mt-8 inline-block bg-[#173C2A] px-7 py-3 font-bold text-white outline-none transition-colors hover:bg-[#24553D] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 dark:bg-[#F4C430] dark:text-[#173C2A]">Log in and continue</Link>
      </div>
    )
  }

  if (!reference && !weekId) {
    return <div className="max-w-xl border-t border-[#C9BEAA] pt-8 text-center dark:border-white/20"><p className="text-sm font-bold text-red-700 dark:text-red-300">Payment reference is missing.</p><Link href="/subscriptions/manage" className="mt-8 inline-block bg-[#173C2A] px-7 py-3 font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]">View deliveries</Link></div>
  }

  return <div className="max-w-xl border-t border-[#C9BEAA] pt-8 text-center dark:border-white/20"><p className={`text-sm font-bold ${state === 'error' ? 'text-red-700 dark:text-red-300' : 'text-[#2E7D32] dark:text-[#F4C430]'}`}>{message}</p>{state !== 'checking' && <Link href="/subscriptions/manage" className="mt-8 inline-block bg-[#173C2A] px-7 py-3 font-bold text-white outline-none transition-colors hover:bg-[#24553D] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 dark:bg-[#F4C430] dark:text-[#173C2A]">View deliveries</Link>}</div>
}

export default function SubscriptionPaymentPage() {
  return <main className="grid min-h-screen place-items-center bg-[#F4EFE4] px-6 text-[#173C2A] dark:bg-[#171B18] dark:text-white"><Suspense fallback={<p>Checking payment…</p>}><PaymentResult /></Suspense></main>
}
