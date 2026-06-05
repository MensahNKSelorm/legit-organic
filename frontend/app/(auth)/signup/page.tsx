'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

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
  const { register } = useAuth()

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

  const inputClass =
    'w-full px-4 py-3 rounded-xl border bg-cream text-charcoal text-sm focus:outline-none transition-colors'
  const inputBorder = (field: keyof FieldErrors) =>
    fieldErrors[field]
      ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300'
      : 'border-sand focus:border-leaf-green focus:ring-1 focus:ring-leaf-green'

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
    setLoading(true)
    try {
      await register(email, password, firstName, lastName)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo-lightmode.svg"
              alt="Legit Organic"
              width={120}
              height={60}
              className="dark:hidden"
            />
            <Image
              src="/images/logo-darkmode.svg"
              alt="Legit Organic"
              width={120}
              height={60}
              className="hidden dark:block"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-forest-green">Join the community</h1>
          <p className="text-charcoal/60 mt-2 text-sm">
            Access Ghana&apos;s most trusted organic marketplace
          </p>
        </div>

        <div className="bg-mist-white rounded-2xl p-8 border border-sand shadow-sm">
          {/* Google (UI only) */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-sand rounded-xl text-sm font-medium text-charcoal hover:bg-beige transition-colors mb-6"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">or continue with email</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>

          {apiError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ghana-gold text-forest-green font-semibold py-3 rounded-xl hover:bg-dark-gold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Spinner /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal/60 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-leaf-green font-semibold hover:text-forest-green transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
