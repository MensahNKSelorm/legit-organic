import Link from 'next/link'
import Image from 'next/image'
import SectionWrapper from '@/components/ui/SectionWrapper'
import type { Product } from '@/types'
import { getMediaUrl } from '@/lib/media'

const PLACEHOLDERS = [
  '/images/products/p1.webp',
  '/images/products/p2.webp',
  '/images/products/p3.webp',
  '/images/products/p4.webp',
]


interface FeaturedProductsProps {
  products: Product[]
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <SectionWrapper id="products" background="beige">
      {/* Section header */}
      <div className="text-center mb-16">
        <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
          What We Offer
        </span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-forest-green mt-3 mb-5">
          Featured Organic Products
        </h2>
        <p className="text-charcoal/70 text-lg leading-relaxed max-w-2xl mx-auto">
          Every product is sourced directly from verified Ghanaian farmers who grow without
          synthetic chemicals — so you get the real thing.
        </p>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <p className="text-center text-charcoal/50 py-12">No products available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => {
            const imageSrc = getMediaUrl(product.image, PLACEHOLDERS[product.id % PLACEHOLDERS.length])
            return (
              <article
                key={product.id}
                className="group bg-mist-white dark:bg-[#1f2937] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 border border-sand dark:border-[#374151] flex flex-col min-h-[420px]"
              >
                {/* Product image */}
                <div className="relative h-52 overflow-hidden bg-beige dark:bg-[#374151]">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-forest-green text-ghana-gold text-xs font-bold px-2.5 py-1 rounded-full z-10">
                      {product.badge?.name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-lg font-bold text-forest-green dark:text-[#faf7f0] break-words w-full mb-2">
                    {product.name}
                  </h3>

                  <div className="min-h-[28px] flex items-center mb-3">
                    <span className="inline-block text-xs bg-[#F5F0E6] dark:bg-[#374151] text-[#2e7d32] dark:text-[#81C784] rounded-full px-3 py-1 font-semibold uppercase tracking-wide">
                      {product.category?.name} · {product.region?.name}
                    </span>
                  </div>

                  <p className="text-charcoal/70 dark:text-[#d1d5db] text-sm leading-relaxed flex-1 line-clamp-3">
                    {product.description}
                  </p>

                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-[#E6D8BD] dark:border-[#374151]">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2E7D32] dark:text-[#81C784] text-xl leading-tight">
                        GH₵ {product.price}
                      </span>
                      <span className="text-xs text-[#5B3E31] dark:text-[#E6D8BD] max-w-[80px] leading-snug mt-0.5">
                        {product.unit}
                      </span>
                    </div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C] transition-colors whitespace-nowrap"
                    >
                      View <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="text-center mt-14">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-forest-green font-semibold border-b-2 border-ghana-gold pb-0.5 hover:text-leaf-green transition-colors text-lg"
        >
          Browse All Products
          <span aria-hidden>→</span>
        </Link>
      </div>
    </SectionWrapper>
  )
}
