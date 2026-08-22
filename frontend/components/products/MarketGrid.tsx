'use client'

import { useMemo, useState } from 'react'
import type { Product } from '@/types'
import ProductCard from './ProductCard'

const INITIAL_COUNT = 18
const LOAD_MORE_COUNT = 12

type SortOption = 'market' | 'price-low' | 'price-high' | 'name'

interface MarketGridProps {
  products: Product[]
  preview?: boolean
  featureFirst?: boolean
}

export default function MarketGrid({ products, preview = false, featureFirst = false }: MarketGridProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('market')
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    const matches = search
      ? products.filter((product) =>
          [product.name, product.category?.name, product.region?.name, product.description]
            .filter(Boolean)
            .some((value) => String(value).toLocaleLowerCase().includes(search))
        )
      : [...products]

    if (sort === 'price-low') matches.sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'price-high') matches.sort((a, b) => Number(b.price) - Number(a.price))
    if (sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name))
    return matches
  }, [products, query, sort])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const canLoadMore = visibleCount < filteredProducts.length
  const useFeaturedCard = featureFirst && !query.trim() && sort === 'market'

  return (
    <div>
      <div className="mt-8 grid gap-3 border-b border-[#0D3B2A]/20 pb-6 dark:border-white/15 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search this market</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#5B3E31] dark:text-[#B8D4BD]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setVisibleCount(INITIAL_COUNT)
            }}
            placeholder="Search produce, grains or pantry staples"
            className="h-12 w-full border border-[#0D3B2A]/25 bg-transparent pr-4 pl-12 text-sm text-[#0D3B2A] outline-none placeholder:text-[#5B3E31]/65 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 dark:border-white/20 dark:text-white dark:placeholder:text-[#B8D4BD]/70 dark:focus:border-[#F4C430] dark:focus:ring-[#F4C430]/20"
          />
        </label>

        <label className="grid grid-cols-[auto_1fr] items-center gap-3 border border-[#0D3B2A]/25 px-4 dark:border-white/20 sm:min-w-56">
          <span className="text-[10px] font-bold tracking-[.14em] text-[#5B3E31] uppercase dark:text-[#B8D4BD]">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortOption)
              setVisibleCount(INITIAL_COUNT)
            }}
            className="h-12 min-w-0 bg-transparent text-sm font-semibold text-[#0D3B2A] outline-none dark:text-white"
            aria-label="Sort market products"
          >
            <option value="market">Market order</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-[#5B3E31] dark:text-[#B8D4BD]" aria-live="polite">
        <p>
          <strong className="text-[#0D3B2A] dark:text-white">{filteredProducts.length}</strong>{' '}
          {filteredProducts.length === 1 ? 'item' : 'items'} found
        </p>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setVisibleCount(INITIAL_COUNT)
            }}
            className="min-h-11 border-b border-current font-semibold text-[#2E7D32] dark:text-[#F4C430]"
          >
            Clear search
          </button>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-8 border-y border-[#0D3B2A]/20 py-16 text-center dark:border-white/15">
          <p className="display-organic text-3xl text-[#0D3B2A] dark:text-white">Nothing matched that search.</p>
          <p className="mt-2 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">Try a shorter name or browse another stall.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3">
            {visibleProducts.map((product, index) => (
              <div
                key={product.id}
                className={`h-full ${index === 0 && useFeaturedCard ? 'sm:col-span-2 lg:col-span-2' : ''}`}
              >
                <ProductCard
                  product={product}
                  featured={index === 0 && useFeaturedCard}
                  preview={preview}
                />
              </div>
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-14 flex flex-col items-center gap-3 border-t border-[#0D3B2A]/20 pt-8 dark:border-white/15">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
                className="min-h-12 bg-[#0D3B2A] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[#24553D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 dark:bg-[#F4C430] dark:text-[#0D3B2A] dark:hover:bg-[#DAB22D]"
              >
                Show more from the market
              </button>
              <p className="text-xs text-[#5B3E31] dark:text-[#B8D4BD]">
                Showing {visibleProducts.length} of {filteredProducts.length}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
