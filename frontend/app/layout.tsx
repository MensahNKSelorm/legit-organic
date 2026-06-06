import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { CartProvider } from '@/lib/cart'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VerificationBanner from '@/components/ui/VerificationBanner'
import GoogleProvider from '@/components/providers/GoogleProvider'
import WhatsAppButton from '@/components/ui/WhatsAppButton'

export const metadata: Metadata = {
  title: {
    default: "Legit Organic — Rebuilding Trust in Ghana's Food Ecosystem",
    template: '%s | Legit Organic',
  },
  description:
    "Ghana's premier organic food marketplace. Traceable, certified-organic produce sourced directly from verified Ghanaian farmers — delivered with integrity.",
  keywords: [
    'organic food Ghana',
    'organic produce',
    'Ghanaian farmers',
    'farm to table Ghana',
    'certified organic',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    siteName: 'Legit Organic',
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
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <GoogleProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <VerificationBanner />
              <main>{children}</main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </GoogleProvider>
        <WhatsAppButton />
      </body>
    </html>
  )
}
