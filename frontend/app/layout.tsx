import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { CartProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VerificationBanner from '@/components/ui/VerificationBanner'
import GoogleProvider from '@/components/providers/GoogleProvider'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { ReferralCapture } from '@/components/ReferralCapture'

export const metadata: Metadata = {
  metadataBase: new URL('https://legitorganic.com'),
  title: {
    default: 'Legit Organic — Fresh Organic Food in Ghana',
    template: '%s | Legit Organic',
  },
  description: "Ghana's trusted organic food marketplace. Buy fresh, certified organic produce directly from verified Ghanaian farmers. Rice, vegetables, yam, spices — delivered to your door in Accra and beyond.",
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
    description: 'Buy fresh, certified organic produce directly from verified Ghanaian farmers.',
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
    description: 'Buy fresh, certified organic produce directly from verified Ghanaian farmers.',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <GoogleProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Navbar />
                <VerificationBanner />
                <main>{children}</main>
                <Footer />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </GoogleProvider>
        <WhatsAppButton />
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
      </body>
    </html>
  )
}
