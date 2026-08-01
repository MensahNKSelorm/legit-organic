'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

const footerlessRoutes = new Set([
  '/login',
  '/signup',
  '/check-email',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
])

export default function SiteFooter() {
  const pathname = usePathname()
  return footerlessRoutes.has(pathname) ? null : <Footer />
}
