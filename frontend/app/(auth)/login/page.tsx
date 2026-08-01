'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/lib/auth'

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
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const { login, googleLogin } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)

  const inputClass =
    'w-full border-0 border-b border-[#0D3B2A]/30 bg-transparent px-0 py-3 text-[#0D3B2A] outline-none transition-colors placeholder:text-[#5B3E31]/45 focus:border-[#2E7D32] dark:border-white/25 dark:text-[#FEFCF7] dark:placeholder:text-white/35 dark:focus:border-[#F4C430]'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNeedsVerification(false)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      const lower = msg.toLowerCase()
      if (lower.includes('verify your email')) {
        setNeedsVerification(true)
        setError(msg)
      } else {
        setError(
          lower.includes('no active account')
            ? 'Invalid email or password. Please try again.'
            : msg
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-[#FAF7F0] pt-[76px] dark:bg-[#171B18] lg:grid-cols-2">
      <div className="relative hidden min-h-[calc(100vh-76px)] overflow-hidden bg-[#0D3B2A] lg:block">
        <Image src="/images/hero/7.webp" alt="Fresh Ghanaian produce" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D3B2A]/90 via-[#0D3B2A]/20 to-transparent" />
        <p className="display-organic absolute bottom-14 left-14 max-w-lg text-5xl leading-[.95] text-white">Good to have you <em className="font-normal text-[#F4C430]">back at the market.</em></p>
      </div>
      <div className="flex items-center justify-center px-6 py-16 md:px-12">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-10">
          <div className="mb-8">
            <Image
              src="/images/logo-lightmode.svg"
              alt="Legit Organic"
              width={120}
              height={60}
              className="dark:hidden"
              style={{ width: 'auto', height: '60px' }}
            />
            <Image
              src="/images/logo-darkmode.svg"
              alt="Legit Organic"
              width={120}
              height={60}
              className="hidden dark:block"
              style={{ width: 'auto', height: '60px' }}
            />
          </div>
          <h1 className="display-organic text-5xl text-[#0D3B2A] dark:text-[#FEFCF7]">Welcome back.</h1>
          <p className="mt-3 text-[#5B3E31] dark:text-[#B8D4BD]">Sign in to continue shopping, cooking and tracking orders.</p>
        </div>

        <div>
          {/* Google OAuth */}
          <div className="mb-6">
            <div className="flex justify-center w-full overflow-hidden">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    googleLogin(credentialResponse.credential).catch(() =>
                      setError('Google login failed. Please try again.')
                    )
                  }
                }}
                onError={() => setError('Google login failed. Please try again.')}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>
          </div>

          <div className="relative flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-xs text-[#5B3E31] dark:text-[#B8D4BD]">or continue with email</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
              {needsVerification && (
                <Link
                  href={`/check-email?email=${encodeURIComponent(email)}`}
                  className="block mt-2 font-semibold text-forest-green underline hover:text-leaf-green"
                >
                  Resend verification email
                </Link>
              )}
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
              className="flex w-full items-center justify-center gap-2 bg-[#F4C430] py-4 font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white disabled:opacity-60 dark:hover:bg-white dark:hover:text-[#0D3B2A]"
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
    </div>
  )
}
