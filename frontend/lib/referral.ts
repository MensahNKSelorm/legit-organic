const REFERRAL_COOKIE_KEY = 'lo_ref_code'
const REFERRAL_COOKIE_DAYS = 30

export function captureReferralCode(searchParams: URLSearchParams) {
  const code = searchParams.get('ref')
  if (!code) return
  // First-touch wins — never overwrite an existing cookie
  if (getReferralCode()) return
  const expires = new Date()
  expires.setDate(expires.getDate() + REFERRAL_COOKIE_DAYS)
  document.cookie = `${REFERRAL_COOKIE_KEY}=${encodeURIComponent(code)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export function getReferralCode(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REFERRAL_COOKIE_KEY}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function clearReferralCode() {
  document.cookie = `${REFERRAL_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
