'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types'
import { getMediaUrl } from '@/lib/media'
import { useCart } from '@/lib/cart'

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

interface ProductCardProps {
  product: Product
  featured?: boolean
  preview?: boolean
}

const PLACEHOLDERS = [
  '/images/products/p1.webp',
  '/images/products/p2.webp',
  '/images/products/p3.webp',
  '/images/products/p4.webp',
]

export default function ProductCard({ product, featured = false, preview = false }: ProductCardProps) {
  const imageSrc = product.images && product.images.length > 0
    ? getMediaUrl(product.images[0].image, PLACEHOLDERS[product.id % PLACEHOLDERS.length])
    : getMediaUrl(product.image, PLACEHOLDERS[product.id % PLACEHOLDERS.length])
  const { addItem, isInCart } = useCart()
  const inCart = isInCart(product.id)

  return (
    <article className={`group overflow-hidden border-b border-[#0D3B2A]/20 bg-transparent dark:border-white/15 ${featured ? 'md:grid md:min-h-[500px] md:grid-cols-[1.15fr_.85fr]' : 'flex min-h-[420px] flex-col'}`}>
      {/* Image */}
      <div className={`relative overflow-hidden bg-beige dark:bg-[#273029] ${featured ? 'h-80 md:h-auto' : 'h-64'}`}>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={featured ? '(max-width: 768px) 100vw, 55vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        />
        {product.badge && (
            <span className="absolute top-0 left-0 bg-forest-green text-ghana-gold text-xs font-bold px-3 py-2 z-10">
            {product.badge?.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${featured ? 'justify-center p-8 md:p-10' : 'p-6'}`}>
        <h3 className={`display-organic text-forest-green dark:text-[#faf7f0] break-words w-full mb-2 ${featured ? 'text-4xl md:text-5xl' : 'text-2xl'}`}>
          {product.name}
        </h3>

        <div className="min-h-[28px] flex items-center mb-3">
          <span className="inline-block border-b border-[#2E7D32]/40 pb-1 text-xs text-[#2e7d32] dark:text-[#9FC5A4] font-semibold uppercase tracking-wide">
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
                'flex items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap',
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
              className="flex items-center gap-1 border border-[#0D3B2A]/20 px-3 py-2 text-xs font-semibold text-[#0D3B2A] hover:bg-[#E6D8BD] transition-colors whitespace-nowrap dark:border-white/20 dark:text-[#faf7f0] dark:hover:bg-white/10"
            >
              <span>{preview ? 'Preview' : 'View'}</span>
              <span aria-hidden="true" className="leading-none">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
