'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { captureReferralCode } from '@/lib/referral'

export function ReferralCapture() {
  const searchParams = useSearchParams()
  useEffect(() => {
    captureReferralCode(searchParams)
  }, [searchParams])
  return null
}
