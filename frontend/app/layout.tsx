import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { CartProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import Navbar from '@/components/layout/Navbar'
import SiteFooter from '@/components/layout/SiteFooter'
import VerificationBanner from '@/components/ui/VerificationBanner'
import GoogleProvider from '@/components/providers/GoogleProvider'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { ReferralCapture } from '@/components/ReferralCapture'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  metadataBase: new URL('https://legitorganic.com'),
  title: {
    default: 'Legit Organic — Fresh Organic Food in Ghana',
    template: '%s | Legit Organic',
  },
  description: "Fresh Ghanaian produce with clearer information about where it comes from, how it is handled and when it is available.",
  keywords: [
    'organic food Ghana',
    'organic produce Accra',
    'buy organic food Ghana',
    'certified organic Ghana',
    'fresh vegetables Accra',
    'organic rice Ghana',
    'farm to table Ghana',
    'Ghanaian farmers organic',
    'healthy food delivery Ghana',
    'organic spices Ghana',
  ],
  authors: [{ name: 'Legit Organic Limited' }],
  creator: 'Legit Organic Limited',
  publisher: 'Legit Organic Limited',
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://legitorganic.com',
    siteName: 'Legit Organic',
    title: 'Legit Organic — Fresh Organic Food in Ghana',
    description: 'Fresh Ghanaian produce, seasonal availability and practical food stories.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Legit Organic — Fresh Organic Food in Ghana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legit Organic — Fresh Organic Food in Ghana',
    description: 'Fresh Ghanaian produce, seasonal availability and practical food stories.',
    images: ['/images/og-image.jpg'],
    creator: '@legitorganicltd',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'w-yk7o14_14SX7lNlF928YFcGI0MT5ltOWa3cY-8HJA',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=boska@400,500,600,700&f[]=cabinet-grotesk@400,500,700,800&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Legit Organic" />
        <meta name="theme-color" content="#0D3B2A" />
      </head>
      <body className="antialiased">
        <GoogleProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Navbar />
                <VerificationBanner />
                <main>{children}</main>
                <SiteFooter />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </GoogleProvider>
        <WhatsAppButton />
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        <Suspense fallback={null}>
          <ServiceWorkerRegistration />
        </Suspense>
      </body>
    </html>
  )
}
