export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import ProductTabs from '@/components/products/ProductTabs'
import AddToCartButton from '@/components/products/AddToCartButton'
import ProductImageGallery from '@/components/products/ProductImageGallery'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 mt-0.5"
      aria-hidden
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const product = await api.products.detail(slug)
    return {
      title: product.name,
      description: product.description.replace(/<[^>]*>/g, '').slice(0, 160),
    }
  } catch {
    return { title: 'Product Not Found' }
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params

  const product = await api.products.detail(slug).catch(() => notFound())

  // Related products — same category, excluding this product
  let related: Product[] = []
  try {
    const same = await api.products.list('category=' + product.category?.slug)
    related = same.filter((p) => p.slug !== slug).slice(0, 3)
  } catch {
    // ignore
  }

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '1rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-light-leaf flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-mist-white transition-colors">
              Home
            </Link>
            <span className="opacity-50">/</span>
            <Link href="/products" className="hover:text-mist-white transition-colors">
              Products
            </Link>
            <span className="opacity-50">/</span>
            <span className="text-ghana-gold font-medium truncate max-w-[240px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Product hero ───────────────────────────────────────── */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

          {/* Left: image gallery */}
          <div className="lg:col-span-3">
            <div className="relative">
              <ProductImageGallery
                images={product.images ?? []}
                productName={product.name}
                mainImage={product.image}
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-forest-green text-ghana-gold text-sm font-bold px-3 py-1.5 rounded-full z-20 shadow pointer-events-none">
                  {product.badge.name}
                </span>
              )}
            </div>
          </div>

          {/* Right: details */}
          <div className="lg:col-span-2 flex flex-col justify-center">

            {/* Category · Region pill */}
            <div className="mb-4">
              <span className="inline-block text-xs bg-[#F5F0E6] dark:bg-[#374151] text-[#2e7d32] dark:text-[#81C784] rounded-full px-3 py-1 font-semibold uppercase tracking-wide">
                {product.category?.name} · {product.region?.name}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-forest-green dark:text-[#faf7f0] mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-5">
              <span className="font-bold text-[#2E7D32] dark:text-[#81C784] text-3xl leading-tight">
                GH₵ {product.price}
              </span>
              <span className="ml-2 text-sm text-[#5B3E31] dark:text-[#E6D8BD]">{product.unit}</span>
            </div>

            {/* Description */}
            <div
              className="prose prose-green max-w-none dark:prose-invert mb-6"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            <div className="border-t border-[#E6D8BD] dark:border-[#374151] mb-6" />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <AddToCartButton product={product} />
              </div>

              <div className="relative group flex-1">
                <button
                  disabled
                  className="w-full border-2 border-[#0D3B2A] dark:border-[#81C784] text-[#0D3B2A] dark:text-[#81C784] font-semibold px-6 py-3 rounded-xl opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Save to My List
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0D3B2A] text-mist-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                  Coming soon
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#0D3B2A]" />
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-start gap-3 p-4 bg-[#F0F7F0] dark:bg-[#1a2e1a] border border-[#C3E6CB] dark:border-[#2d4a2d] rounded-xl">
              <span className="text-leaf-green">
                <LeafIcon />
              </span>
              <p className="text-sm text-[#2E7D32] dark:text-[#81C784] font-medium leading-snug">
                Sourced from verified Ghanaian farmers · No synthetic pesticides
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product detail tabs ────────────────────────────────── */}
      <div className="bg-mist-white dark:bg-[#1f2937] border-t border-[#E6D8BD] dark:border-[#374151]">
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <ProductTabs product={product} />
        </div>
      </div>

      {/* ── Related products ───────────────────────────────────── */}
      {related.length > 0 && (
        <div className="bg-beige dark:bg-[#111827] border-t border-[#E6D8BD] dark:border-[#374151]">
          <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
            <h2 className="font-display text-2xl font-bold text-forest-green dark:text-[#faf7f0] mb-8">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
