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
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(
        msg.toLowerCase().includes('no active account')
          ? 'Invalid email or password. Please try again.'
          : msg
      )
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
          <h1 className="font-display text-3xl font-bold text-forest-green">Welcome back</h1>
          <p className="text-charcoal/60 mt-2 text-sm">Sign in to your account to continue</p>
        </div>

        <div className="bg-mist-white rounded-2xl p-8 border border-sand shadow-sm">
          {/* Google (UI only) */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-sand rounded-xl text-sm font-medium text-charcoal hover:bg-beige transition-colors mb-6"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">or continue with email</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                required
                tabIndex={1}
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-charcoal/80">Password</label>
                <Link
                  href="/forgot-password"
                  tabIndex={-1}
                  className="text-xs text-leaf-green hover:text-forest-green transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  tabIndex={2}
                  className={`${inputClass} pr-12`}
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
            </div>

            <button
              type="submit"
              disabled={loading}
              tabIndex={3}
              className="w-full bg-ghana-gold text-forest-green font-semibold py-3 rounded-xl hover:bg-dark-gold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-leaf-green font-semibold hover:text-forest-green transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
