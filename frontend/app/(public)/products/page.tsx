export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import type { Product, Category } from '@/types'

const INTERNAL_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import ProductCard from '@/components/products/ProductCard'
import CategoryFilter from '@/components/products/CategoryFilter'

export const metadata: Metadata = {
  title: 'Products — Certified Organic from Ghanaian Farmers',
  description:
    'Browse our full range of certified organic products sourced directly from verified Ghanaian farmers — grown without synthetic chemicals.',
}

type SearchParams = Promise<{ category?: string }>

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const activeCategory = params.category || ''

  let products: Product[] = []
  let categories: Category[] = []

  const [productsResult, categoriesResult] = await Promise.allSettled([
    fetch(
      activeCategory
        ? `${INTERNAL_API}/api/products/?category=${activeCategory}`
        : `${INTERNAL_API}/api/products/`,
      { headers: { 'Content-Type': 'application/json' }, next: { revalidate: 0 } }
    ).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`${INTERNAL_API}/api/products/categories/`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 },
    }).then(r => r.ok ? r.json() : []).catch(() => []),
  ])
  products = productsResult.status === 'fulfilled' ? productsResult.value : []
  categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []

  return (
    <>
      {/* Page hero */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '9rem', paddingBottom: '5rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
            From the Farm
          </span>
          <h1 className="font-display text-5xl font-bold text-white mt-3 mb-5">
            Our Organic Products
          </h1>
          <p
            className="text-white/80 text-lg leading-relaxed"
            style={{ maxWidth: '40rem', margin: '0 auto' }}
          >
            Sourced directly from verified Ghanaian farmers — grown without synthetic pesticides,
            certified organic, and delivered fresh to your door.
          </p>
        </div>
      </div>

      {/* Filter + grid */}
      <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12">

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="mb-10">
              <CategoryFilter categories={categories} activeCategory={activeCategory} />
            </div>
          )}

          {/* Product grid */}
          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-charcoal/50 dark:text-[#9ca3af] text-lg">
                {activeCategory
                  ? 'No products found in this category.'
                  : 'No products available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
