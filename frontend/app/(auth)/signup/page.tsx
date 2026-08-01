'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/lib/auth'
import { getReferralCode, clearReferralCode } from '@/lib/referral'
import Turnstile, { TURNSTILE_ENABLED } from '@/components/Turnstile'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-forest-green border-t-transparent rounded-full animate-spin" aria-hidden />
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function SignupPage() {
  const { register, googleLogin } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  // Turnstile token (null until solved). turnstileKey remounts the widget to get
  // a fresh single-use token after a failed/expired attempt. turnstileError marks
  // a hard failure (widget error or script-load failure) so we can surface a
  // message + retry control instead of leaving submit silently disabled.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [turnstileError, setTurnstileError] = useState(false)

  const retryTurnstile = () => {
    setTurnstileError(false)
    setTurnstileToken(null)
    setTurnstileKey((k) => k + 1)
  }

  const inputClass =
    'w-full border-0 border-b bg-transparent px-0 py-3 text-[#0D3B2A] outline-none transition-colors placeholder:text-[#5B3E31]/45 dark:text-[#FEFCF7] dark:placeholder:text-white/35'
  const inputBorder = (field: keyof FieldErrors) =>
    fieldErrors[field]
      ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300'
      : 'border-[#0D3B2A]/30 focus:border-[#2E7D32] dark:border-white/25 dark:focus:border-[#F4C430]'

  const validate = (): boolean => {
    const errs: FieldErrors = {}
    if (!firstName.trim()) errs.firstName = 'First name is required.'
    if (!lastName.trim()) errs.lastName = 'Last name is required.'
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!isValidEmail(email)) errs.email = 'Please enter a valid email address.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.'
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setApiError('Please complete the verification challenge.')
      return
    }
    setLoading(true)
    const referralCode = getReferralCode() ?? undefined
    try {
      await register(email, password, firstName, lastName, referralCode, turnstileToken)
      clearReferralCode()
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
      // The token is single-use; reset the widget so the user can retry.
      if (TURNSTILE_ENABLED) {
        setTurnstileToken(null)
        setTurnstileKey((k) => k + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-[#FAF7F0] pt-[76px] dark:bg-[#171B18] lg:h-screen lg:grid-cols-[.9fr_1.1fr] lg:overflow-hidden">
      <div className="relative hidden min-h-[calc(100vh-76px)] overflow-hidden bg-[#0D3B2A] lg:block">
        <Image src="/images/hero/3.webp" alt="Produce grown in Ghana" fill priority sizes="45vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D3B2A]/90 via-[#0D3B2A]/25 to-transparent" />
        <p className="display-organic absolute bottom-14 left-14 max-w-md text-5xl leading-[.95] text-white">Your next meal can begin with a <em className="font-normal text-[#F4C430]">better choice.</em></p>
      </div>
      <div className="flex items-start justify-center overflow-y-auto px-6 py-10 md:px-12 lg:py-6 xl:items-center xl:py-8">
      <div className="w-full max-w-xl">
        {/* Brand */}
        <div className="mb-6 xl:mb-8">
          <div className="mb-4 xl:mb-6">
            <Image
              src="/images/logo-lightmode.svg"
              alt="Legit Organic"
              width={120}
              height={60}
              className="dark:hidden"
              style={{ width: 'auto', height: '48px' }}
            />
            <Image
              src="/images/logo-darkmode.svg"
              alt="Legit Organic"
              width={120}
              height={60}
              className="hidden dark:block"
              style={{ width: 'auto', height: '48px' }}
            />
          </div>
          <h1 className="display-organic text-4xl text-[#0D3B2A] dark:text-[#FEFCF7] xl:text-5xl">Create your market account.</h1>
          <p className="mt-2 text-sm text-[#5B3E31] dark:text-[#B8D4BD] xl:mt-3 xl:text-base">
            Save recipes, manage orders and bring fresh produce home more easily.
          </p>
        </div>

        <div>
          {/* Google OAuth */}
          <div className="mb-4 xl:mb-5">
            <div className="flex justify-center w-full overflow-hidden">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    googleLogin(credentialResponse.credential).catch(() =>
                      setApiError('Google signup failed. Please try again.')
                    )
                  }
                }}
                onError={() => setApiError('Google signup failed. Please try again.')}
                text="signup_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>
          </div>

          <div className="relative mb-4 flex items-center xl:mb-5">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-xs text-[#5B3E31] dark:text-[#B8D4BD]">or continue with email</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>

          {apiError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3 xl:space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Kwame"
                  autoComplete="given-name"
                  className={`${inputClass} ${inputBorder('firstName')}`}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Asante"
                  autoComplete="family-name"
                  className={`${inputClass} ${inputBorder('lastName')}`}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={`${inputClass} ${inputBorder('email')}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`${inputClass} ${inputBorder('password')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`${inputClass} ${inputBorder('confirmPassword')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Cloudflare Turnstile — renders only when a site key is configured. */}
            {TURNSTILE_ENABLED && (
              <div className="pt-1">
                {turnstileError ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>Couldn&apos;t load the verification challenge.</span>
                    <button
                      type="button"
                      onClick={retryTurnstile}
                      className="font-semibold text-forest-green underline hover:text-leaf-green"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <Turnstile
                    key={turnstileKey}
                    onToken={(t) => {
                      setTurnstileToken(t)
                      if (t) setTurnstileError(false)
                    }}
                    onError={() => {
                      setTurnstileToken(null)
                      setTurnstileError(true)
                    }}
                  />
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (TURNSTILE_ENABLED && !turnstileToken)}
              className="mt-3 flex w-full items-center justify-center gap-2 bg-[#F4C430] py-4 font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white disabled:opacity-60 dark:hover:bg-white dark:hover:text-[#0D3B2A]"
            >
              {loading ? <Spinner /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-charcoal/60 xl:mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-leaf-green font-semibold hover:text-forest-green transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
