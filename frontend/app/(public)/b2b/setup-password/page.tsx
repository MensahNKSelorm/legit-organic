'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function SetupPasswordContent() {
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pwError, setPwError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  const inputBase =
    'w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#1f2937] text-[#0D3B2A] dark:text-[#faf7f0] text-sm focus:outline-none focus:ring-1 transition-colors'
  const inputOk = `${inputBase} border-[#E6D8BD] dark:border-[#374151] focus:border-[#2E7D32] focus:ring-[#2E7D32]`
  const inputErrCls = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-400`

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827] px-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-10">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-2">Invalid Link</h1>
          <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af] mb-6">
            This password setup link is missing required parameters. Please use the link from your approval email.
          </p>
          <Link href="/b2b" className="text-sm text-[#2E7D32] dark:text-[#81C784] hover:underline font-semibold">
            Back to B2B Portal
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setConfirmError('')
    setError(null)

    let valid = true
    if (password.length < 8) {
      setPwError('Password must be at least 8 characters.')
      valid = false
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match.')
      valid = false
    }
    if (!valid) return

    setSubmitting(true)
    try {
      const result = await api.b2b.setupPassword(uid, token, password)
      // Store tokens and do a full reload so auth context re-initialises
      localStorage.setItem('access_token', result.access)
      localStorage.setItem('refresh_token', result.refresh)
      window.location.href = '/b2b/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827] px-6 py-16">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-lightmode.svg" alt="Legit Organic" className="h-10 w-auto mx-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-darkmode.svg" alt="Legit Organic" className="h-10 w-auto mx-auto hidden dark:block" />
        </div>

        <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#F0FFF4] dark:bg-[#0a1f14] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0D3B2A] dark:text-white">
              Set Your Password
            </h1>
            <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af] mt-1">
              Create a password for your new B2B account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError('') }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={pwError ? inputErrCls : inputOk}
              />
              {pwError && <p className="mt-1 text-xs text-red-500">{pwError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setConfirmError('') }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={confirmError ? inputErrCls : inputOk}
              />
              {confirmError && <p className="mt-1 text-xs text-red-500">{confirmError}</p>}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#0D3B2A] text-[#F4C430] font-bold py-3 rounded-xl hover:bg-[#0a2e20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
                  Setting password…
                </>
              ) : (
                'Set Password & Go to Dashboard'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#9ca3af] mt-6">
            Need help?{' '}
            <a href="mailto:hello@legitorganic.com" className="text-[#2E7D32] dark:text-[#81C784] hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827]">
          <span className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  )
}
