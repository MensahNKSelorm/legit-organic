'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#2E7D32" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-forest-green border-t-transparent rounded-full animate-spin" aria-hidden />
  )
}

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const { resendVerification } = useAuth()

  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  const handleResend = async () => {
    setResendState('loading')
    try {
      await resendVerification()
      setResendState('sent')
    } catch {
      setResendState('error')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <div className="bg-mist-white rounded-2xl p-10 border border-sand shadow-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-leaf-green/10 flex items-center justify-center">
              <EmailIcon />
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold text-forest-green mb-3">
            Check your email
          </h1>

          {email && (
            <p className="text-charcoal/70 text-sm mb-4">
              We&apos;ve sent a verification link to{' '}
              <span className="font-semibold text-charcoal">{email}</span>
            </p>
          )}

          <p className="text-charcoal/60 text-sm leading-relaxed mb-8">
            Click the link in your email to verify your account.
            If you don&apos;t see it, check your spam folder.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/products"
              className="w-full bg-ghana-gold text-forest-green font-semibold py-3 rounded-xl hover:bg-dark-gold transition-colors text-sm text-center"
            >
              Continue to site
            </Link>

            {resendState === 'sent' ? (
              <p className="text-leaf-green text-sm font-medium py-3">
                Verification email sent! Check your inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState === 'loading'}
                className="w-full border border-sand text-charcoal/70 font-medium py-3 rounded-xl hover:bg-beige transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {resendState === 'loading' ? (
                  <><Spinner /> Sending...</>
                ) : (
                  'Resend verification email'
                )}
              </button>
            )}

            {resendState === 'error' && (
              <p className="text-red-600 text-xs">Failed to resend. Please try again.</p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-charcoal/40 mt-6">
          Wrong email?{' '}
          <Link href="/signup" className="text-leaf-green hover:text-forest-green transition-colors">
            Sign out and try again
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
