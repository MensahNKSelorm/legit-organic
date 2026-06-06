'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-8 h-8 border-[3px] border-forest-green border-t-transparent rounded-full animate-spin" aria-hidden />
  )
}

type VerifyState = 'loading' | 'success' | 'error-no-token' | 'error-invalid'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, updateUser } = useAuth()

  const [state, setState] = useState<VerifyState>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setState('error-no-token')
      return
    }

    api.auth.verifyEmail(token)
      .then(() => {
        if (user) updateUser({ email_verified: true })
        setState('success')
        setTimeout(() => router.push('/profile'), 3000)
      })
      .catch(() => setState('error-invalid'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <div className="bg-mist-white rounded-2xl p-10 border border-sand shadow-sm text-center">

          {state === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <Spinner />
              </div>
              <h1 className="font-display text-2xl font-bold text-forest-green">
                Verifying your email...
              </h1>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-leaf-green flex items-center justify-center">
                  <CheckIcon />
                </div>
              </div>
              <h1 className="font-display text-3xl font-bold text-forest-green mb-3">
                Email verified!
              </h1>
              {user && (
                <p className="text-charcoal/70 text-base mb-4">
                  Welcome to Legit Organic, {user.first_name}!
                </p>
              )}
              <p className="text-charcoal/50 text-sm">
                Redirecting to your profile...
              </p>
            </>
          )}

          {(state === 'error-no-token' || state === 'error-invalid') && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
                  <XIcon />
                </div>
              </div>
              <h1 className="font-display text-3xl font-bold text-forest-green mb-3">
                Verification failed
              </h1>
              <p className="text-charcoal/60 text-sm leading-relaxed mb-8">
                {state === 'error-no-token'
                  ? 'Invalid verification link.'
                  : 'This link may have expired or already been used.'}
              </p>
              <Link
                href="/signup"
                className="inline-block bg-ghana-gold text-forest-green font-semibold py-3 px-8 rounded-xl hover:bg-dark-gold transition-colors text-sm"
              >
                Back to signup
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
