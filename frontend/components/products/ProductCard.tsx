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
    <article className={`group h-full overflow-hidden border-b border-[#0D3B2A]/20 bg-transparent dark:border-white/15 ${featured ? 'md:grid md:min-h-[500px] md:grid-cols-[1.15fr_.85fr]' : 'flex min-h-[500px] flex-col'}`}>
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
        <h3 className={`display-organic w-full break-words text-forest-green dark:text-[#faf7f0] ${featured ? 'mb-2 text-4xl md:text-5xl' : 'mb-2 line-clamp-2 min-h-[3.5rem] text-2xl'}`}>
          {product.name}
        </h3>

        <div className={`mb-3 flex items-start ${featured ? 'min-h-[28px]' : 'min-h-[44px]'}`}>
          <span className="line-clamp-2 inline-block border-b border-[#2E7D32]/40 pb-1 text-xs font-semibold uppercase tracking-wide text-[#2e7d32] dark:text-[#9FC5A4]">
            {product.category?.name} · {product.region?.name}
          </span>
        </div>

        <p className={`text-sm leading-relaxed text-charcoal/70 dark:text-[#d1d5db] ${featured ? 'flex-1 line-clamp-3' : 'line-clamp-3 min-h-[4.125rem]'}`}>
          {stripHtml(product.description)}
        </p>

        <div className="flex items-end justify-between mt-4 pt-4 border-t border-[#E6D8BD] dark:border-[#374151]">
          <div className="flex flex-col">
            <span className="font-bold text-[#2E7D32] dark:text-[#81C784] text-xl leading-tight">
              GH₵ {product.price}
            </span>
            <span className="mt-0.5 min-h-[2rem] max-w-[80px] text-xs leading-snug text-[#5B3E31] dark:text-[#E6D8BD]">
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
