'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function VerificationBanner() {
  const { user, resendVerification } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  if (!user || user.email_verified || dismissed) return null

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
    <div
      className="fixed left-0 right-0 z-40 flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
      style={{ top: '68px', backgroundColor: '#F4C430', color: '#0D3B2A' }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span aria-hidden>⚠️</span>
        <span className="font-medium">
          Please verify your email address to access all features.
        </span>

        {resendState === 'sent' ? (
          <span className="font-semibold ml-1">Verification email sent! Check your inbox.</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === 'loading'}
            className="underline font-semibold hover:opacity-70 transition-opacity disabled:opacity-50 whitespace-nowrap ml-1"
          >
            {resendState === 'loading' ? 'Sending...' : 'Resend verification email'}
          </button>
        )}

        {resendState === 'error' && (
          <span className="text-red-700 ml-1">Failed. Please try again.</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors font-bold text-base leading-none"
      >
        ×
      </button>
    </div>
  )
}
