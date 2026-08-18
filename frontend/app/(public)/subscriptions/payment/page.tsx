'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function PaymentResult() {
  const params = useSearchParams()
  const reference = params.get('reference') || undefined
  const weekId = Number(params.get('week') || 0) || undefined
  const [state, setState] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('Checking your payment…')
  useEffect(() => {
    if (!reference && !weekId) { setState('error'); setMessage('Payment reference is missing.'); return }
    api.subscriptions.verifyPayment(reference, weekId)
      .then(() => { setState('success'); setMessage('Your weekly delivery is active.') })
      .catch((reason) => { setState('error'); setMessage(reason instanceof Error ? reason.message : 'Payment could not be verified.') })
  }, [reference, weekId])
  return <div className="max-w-xl border-t border-[#C9BEAA] pt-8 text-center dark:border-white/20"><p className={`text-sm font-bold ${state === 'error' ? 'text-red-700 dark:text-red-300' : 'text-[#2E7D32] dark:text-[#F4C430]'}`}>{message}</p>{state !== 'checking' && <Link href="/subscriptions/manage" className="mt-8 inline-block bg-[#173C2A] px-7 py-3 font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]">View deliveries</Link>}</div>
}

export default function SubscriptionPaymentPage() {
  return <main className="grid min-h-screen place-items-center bg-[#F4EFE4] px-6 text-[#173C2A] dark:bg-[#171B18] dark:text-white"><Suspense fallback={<p>Checking payment…</p>}><PaymentResult /></Suspense></main>
}
