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
      className="group w-full border-t border-[#0D3B2A]/20 pt-3 text-left dark:border-white/15"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EDE5D4] dark:bg-[#273029]">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.category && (
          <span className="absolute left-0 top-0 bg-[#0D3B2A] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white">
            {product.category?.name}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 py-3">
        <p className="product-name-sans text-sm font-bold leading-snug text-[#0D3B2A] transition-colors group-hover:text-[#2E7D32] dark:text-white dark:group-hover:text-[#F4C430] md:text-base">
          {product.name}
        </p>
        <p className="shrink-0 text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">
          GH₵ {product.price}
        </p>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse border-t border-[#0D3B2A]/20 pt-3 dark:border-white/15">
      <div className="aspect-[4/3] bg-[#E6D8BD] dark:bg-white/10" />
      <div className="flex justify-between gap-4 py-3">
        <div className="h-3 w-3/4 bg-[#E6D8BD] dark:bg-white/10" />
        <div className="h-3 w-1/4 bg-[#E6D8BD] dark:bg-white/10" />
      </div>
    </div>
  )
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Load the live catalogue suggestions once on mount.
  useEffect(() => {
    api.products.categories().then(setCategories).catch(() => {})
    api.products.featured().then(setSuggestedProducts).catch(() => {})
  }, [])

  // Autofocus + body scroll lock
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      Promise.resolve().then(() => {
        setQuery('')
        setSearchResult(null)
        setIsLoading(false)
      })
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = ''; previousFocusRef.current?.focus() }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Debounced search (300ms)
  useEffect(() => {
    if (!query.trim()) {
      Promise.resolve().then(() => {
        setSearchResult(null)
        setIsLoading(false)
      })
      return
    }
    Promise.resolve().then(() => setIsLoading(true))
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
    <div
      className="fixed inset-0 z-[200] overflow-y-auto bg-[#071F16]/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        className="relative z-10 mx-auto min-h-[72vh] w-full max-w-[1440px] bg-[#FAF7F0] shadow-[0_24px_80px_rgba(0,0,0,.28)] dark:bg-[#171B18] md:mt-5 md:w-[calc(100%-2.5rem)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid min-h-[72vh] md:grid-cols-[12rem_1fr] lg:grid-cols-[15rem_1fr]">
          <aside className="border-b border-[#0D3B2A]/20 bg-[#0D3B2A] px-6 pb-6 pt-6 text-white md:border-b-0 md:border-r md:border-white/15 md:px-7 md:py-9">
            <div className="flex items-start justify-between md:block">
              <h2 id="search-dialog-title" className="display-organic text-3xl text-[#F4C430]">Browse.</h2>
              <button onClick={onClose} aria-label="Close search" className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/30 text-white transition-colors hover:border-[#F4C430] hover:text-[#F4C430] md:hidden">×</button>
            </div>
            {!query.trim() && categories.length > 0 && (
              <div className="mt-6 border-t border-white/25 md:mt-10">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setQuery(cat.name)} className="flex w-full items-center justify-between border-b border-white/20 py-3 text-left text-sm text-white/75 transition-colors hover:text-[#F4C430]">
                    <span>{cat.name}</span><span aria-hidden>↗</span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="min-w-0 px-6 pb-10 pt-7 md:px-10 md:py-10 lg:px-14">
          <div className="mb-10 flex items-center gap-3 border-b-2 border-[#0D3B2A] pb-4 dark:border-[#F4C430]">
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-6 w-6 shrink-0 text-[#0D3B2A] dark:text-[#F4C430]"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              aria-label="Search products"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search the market"
              className="display-organic min-w-0 flex-1 bg-transparent text-2xl text-[#0D3B2A] placeholder:text-[#0D3B2A]/35 focus:outline-none dark:text-white dark:placeholder:text-white/30 md:text-4xl"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="flex h-8 w-8 shrink-0 items-center justify-center text-xl text-[#5B3E31]/60 transition-colors hover:text-[#0D3B2A] dark:text-white/50 dark:hover:text-white"
              >
                ×
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close search"
              className="hidden h-11 w-11 shrink-0 items-center justify-center border border-[#0D3B2A]/25 text-[#0D3B2A] transition-colors hover:border-[#0D3B2A] hover:bg-[#0D3B2A] hover:text-white dark:border-white/25 dark:text-white dark:hover:border-[#F4C430] dark:hover:bg-transparent dark:hover:text-[#F4C430] md:flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {!query.trim() && (
            <div>
              <div className="mb-5 flex items-end justify-between border-b border-[#0D3B2A]/20 pb-3 dark:border-white/15">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5B3E31]/65 dark:text-[#B8D4BD]">Suggested</p>
                <Link href="/products" onClick={onClose} className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">View all ↗</Link>
              </div>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {suggestedProducts.length > 0
                  ? suggestedProducts.slice(0, 8).map(product => <ProductCard key={product.id} product={product} onClose={onClose} />)
                  : [0, 1, 2, 3].map(item => <SkeletonCard key={item} />)}
              </div>
            </div>
          )}

          {/* B. LOADING — skeleton cards */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* C. HAS RESULTS */}
          {!isLoading && searchResult?.has_results && (
            <div>
              <p className="mb-6 text-xs font-bold uppercase tracking-[.16em] text-[#5B3E31]/65 dark:text-[#B8D4BD]">
                {searchResult.results.length} found
              </p>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {searchResult.results.map(product => (
                  <ProductCard key={product.id} product={product} onClose={onClose} />
                ))}
              </div>
            </div>
          )}

          {/* D. NO RESULTS + RELATED */}
          {!isLoading && searchResult && !searchResult.has_results && searchResult.related.length > 0 && (
            <div>
              <p className="mb-6 text-xs font-bold uppercase tracking-[.16em] text-[#5B3E31]/65 dark:text-[#B8D4BD]">Closest matches</p>
              <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {searchResult.related.map(product => (
                  <ProductCard key={product.id} product={product} onClose={onClose} />
                ))}
              </div>
              <Link
                href="/products"
                onClick={onClose}
                className="border-b border-current pb-1 text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]"
              >
                Browse all products →
              </Link>
            </div>
          )}

          {/* E. NO RESULTS + NO RELATED */}
          {!isLoading && searchResult && !searchResult.has_results && searchResult.related.length === 0 && (
            <div className="border-y border-[#0D3B2A]/20 py-10 text-left dark:border-white/15">
              <p className="display-organic mb-7 break-words text-4xl text-[#0D3B2A] dark:text-white">Nothing found.</p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-block bg-[#F4C430] px-6 py-3 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white dark:hover:bg-white dark:hover:text-[#0D3B2A]"
              >
                Browse all products →
              </Link>
            </div>
          )}
          </section>
        </div>
      </div>
    </div>
  )
}
