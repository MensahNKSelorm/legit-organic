import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Legit Organic — Rebuilding Trust in Ghana's Food Ecosystem",
    template: "%s | Legit Organic",
  },
  description:
    "Ghana's premier organic food marketplace. Traceable, certified-organic produce sourced directly from verified Ghanaian farmers — delivered with integrity.",
  keywords: ["organic food Ghana", "organic produce", "Ghanaian farmers", "farm to table Ghana", "certified organic"],
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "Legit Organic",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
