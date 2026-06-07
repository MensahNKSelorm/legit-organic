'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types'
import { getMediaUrl } from '@/lib/media'
import { useCart } from '@/lib/cart'

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

interface ProductCardProps {
  product: Product
}

const PLACEHOLDERS = [
  '/images/products/p1.webp',
  '/images/products/p2.webp',
  '/images/products/p3.webp',
  '/images/products/p4.webp',
]

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc = getMediaUrl(product.image, PLACEHOLDERS[product.id % PLACEHOLDERS.length])
  const { addItem, isInCart } = useCart()
  const inCart = isInCart(product.id)

  return (
    <article className="group bg-mist-white dark:bg-[#1f2937] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 border border-sand dark:border-[#374151] flex flex-col min-h-[420px]">
      {/* Image */}
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
          {stripHtml(product.description)}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => addItem(product)}
              className={[
                'flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap',
                inCart
                  ? 'bg-[#2E7D32] text-white cursor-default'
                  : 'bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C]',
              ].join(' ')}
              disabled={inCart}
            >
              {inCart ? 'In Cart ✓' : 'Add to Cart'}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#F5F0E6] text-[#0D3B2A] hover:bg-[#E6D8BD] transition-colors whitespace-nowrap dark:bg-[#374151] dark:text-[#faf7f0] dark:hover:bg-[#4B5563]"
            >
              View <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
