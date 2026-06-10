'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getMediaUrl } from '@/lib/media'
import type { Product, Category } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  query: string
  results: Product[]
  related: Product[]
  has_results: boolean
}

function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    return getMediaUrl(product.images[0].image) || '/images/products/p1.webp'
  }
  return getMediaUrl(product.image) || '/images/products/p1.webp'
}

function ProductCard({ product, onClose }: { product: Product; onClose: () => void }) {
  const router = useRouter()
  const imgSrc = getProductImage(product)

  return (
    <button
      onClick={() => { router.push(`/products/${product.slug}`); onClose() }}
      className="group text-left rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-[#E6D8BD] dark:border-gray-700 hover:shadow-md transition-shadow w-full"
    >
      <div className="relative h-28 md:h-36 bg-[#F5F0E6] dark:bg-gray-700">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.category && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-[#0D3B2A]/80 text-white px-2 py-0.5 rounded-full">
            {product.category?.name}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-[#0D3B2A] dark:text-white text-xs md:text-sm leading-snug group-hover:text-[#2E7D32] dark:group-hover:text-[#81C784] transition-colors line-clamp-2">
          {product.name}
        </p>
        <p className="text-[#2E7D32] dark:text-[#81C784] font-bold text-sm mt-1">
          GH₵ {product.price}
        </p>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-[#E6D8BD] dark:border-gray-700 animate-pulse">
      <div className="h-28 md:h-36 bg-[#E6D8BD] dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#E6D8BD] dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-[#E6D8BD] dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load categories once on mount
  useEffect(() => {
    api.products.categories().then(setCategories).catch(() => {})
  }, [])

  // Autofocus + body scroll lock
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      setQuery('')
      setSearchResult(null)
      setIsLoading(false)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Debounced search (300ms)
  useEffect(() => {
    if (!query.trim()) {
      setSearchResult(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await api.products.search(query.trim())
        setSearchResult(data)
      } catch {
        setSearchResult(null)
      } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Content panel */}
      <div className="relative z-10 bg-[#FAF7F0] dark:bg-gray-900 w-full mx-4 mt-16 rounded-2xl md:max-w-3xl md:mx-auto md:mt-20 max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-4 md:p-6">

          {/* Search input */}
          <div className="flex items-center gap-3 border-b-2 border-[#E6D8BD] dark:border-gray-700 pb-4 mb-6">
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 md:w-6 md:h-6 text-[#0D3B2A]/40 dark:text-gray-400 shrink-0"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for organic rice, vegetables..."
              className="flex-1 text-base md:text-xl bg-transparent text-[#0D3B2A] dark:text-white placeholder:text-[#0D3B2A]/30 dark:placeholder:text-gray-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="w-10 h-10 flex items-center justify-center text-[#0D3B2A]/40 dark:text-gray-400 hover:text-[#0D3B2A] dark:hover:text-white transition-colors text-2xl leading-none shrink-0"
              >
                ×
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center ml-1 text-sm font-semibold text-[#0D3B2A]/50 dark:text-gray-400 hover:text-[#0D3B2A] dark:hover:text-white transition-colors shrink-0"
            >
              Close
            </button>
          </div>

          {/* A. EMPTY — category pills */}
          {!query.trim() && (
            <div>
              <p className="text-[#0D3B2A] dark:text-gray-300 font-semibold mb-4">
                What are you looking for?
              </p>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setQuery(cat.name)}
                      className="px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-800 border border-[#E6D8BD] dark:border-gray-700 text-[#0D3B2A] dark:text-gray-200 hover:bg-[#0D3B2A] hover:text-white dark:hover:bg-[#2E7D32] transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* B. LOADING — skeleton cards */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* C. HAS RESULTS */}
          {!isLoading && searchResult?.has_results && (
            <div>
              <p className="text-xs font-semibold text-[#0D3B2A]/50 dark:text-gray-400 uppercase tracking-widest mb-4">
                {searchResult.results.length} result{searchResult.results.length !== 1 ? 's' : ''} for &ldquo;{searchResult.query}&rdquo;
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResult.results.map(product => (
                  <ProductCard key={product.id} product={product} onClose={onClose} />
                ))}
              </div>
            </div>
          )}

          {/* D. NO RESULTS + RELATED */}
          {!isLoading && searchResult && !searchResult.has_results && searchResult.related.length > 0 && (
            <div>
              <p className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-1">
                We don&apos;t have &ldquo;{searchResult.query}&rdquo; right now 😔
              </p>
              <p className="text-[#0D3B2A]/60 dark:text-gray-400 text-sm mb-6">
                But you might like these:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {searchResult.related.map(product => (
                  <ProductCard key={product.id} product={product} onClose={onClose} />
                ))}
              </div>
              <Link
                href="/products"
                onClick={onClose}
                className="text-sm font-semibold text-[#2E7D32] dark:text-[#81C784] hover:underline"
              >
                Browse all products →
              </Link>
            </div>
          )}

          {/* E. NO RESULTS + NO RELATED */}
          {!isLoading && searchResult && !searchResult.has_results && searchResult.related.length === 0 && (
            <div className="text-center py-8">
              <p className="font-display text-xl font-bold text-[#0D3B2A] dark:text-white mb-2">
                We don&apos;t have &ldquo;{searchResult.query}&rdquo; right now
              </p>
              <p className="text-[#0D3B2A]/60 dark:text-gray-400 text-sm mb-6">
                Check back soon — we&apos;re always adding new products!
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-block bg-[#F4C430] text-[#0D3B2A] font-semibold px-6 py-2.5 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
              >
                Browse all products →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
