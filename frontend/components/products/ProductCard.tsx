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
    <article className={`group flex h-full min-h-[430px] flex-col overflow-hidden border-b border-[#0D3B2A]/20 bg-transparent dark:border-white/15 sm:min-h-[500px] ${featured ? 'md:grid md:grid-cols-[1.15fr_.85fr]' : ''}`}>
      {/* Image */}
      <div className={`relative h-44 overflow-hidden bg-beige dark:bg-[#273029] sm:h-64 ${featured ? 'md:h-auto' : ''}`}>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={featured ? '(max-width: 640px) 50vw, (max-width: 768px) 100vw, 55vw' : '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw'}
        />
        {product.badge && (
            <span className="absolute left-0 top-0 z-10 bg-forest-green px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide text-ghana-gold sm:px-3 sm:py-2 sm:text-xs">
            {product.badge?.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-1 flex-col p-3 sm:p-6 ${featured ? 'md:justify-center md:p-10' : ''}`}>
        <h3 className={`w-full break-words font-sans font-bold leading-tight text-forest-green dark:text-[#faf7f0] ${featured ? 'mb-2 line-clamp-2 min-h-[2.5rem] text-base sm:min-h-[3.5rem] sm:text-2xl md:min-h-0 md:text-5xl' : 'mb-2 line-clamp-2 min-h-[2.5rem] text-base sm:min-h-[3.5rem] sm:text-2xl'}`}>
          {product.name}
        </h3>

        <div className={`mb-2 flex min-h-[2.25rem] items-start sm:mb-3 ${featured ? 'md:min-h-[28px]' : 'sm:min-h-[44px]'}`}>
          <span className="line-clamp-2 inline-block border-b border-[#2E7D32]/40 pb-1 text-[9px] font-semibold uppercase leading-snug tracking-wide text-[#2e7d32] dark:text-[#9FC5A4] sm:text-xs">
            {product.category?.name} · {product.region?.name}
          </span>
        </div>

        <p className={`hidden text-sm leading-relaxed text-charcoal/70 dark:text-[#d1d5db] sm:block ${featured ? 'flex-1 line-clamp-3' : 'line-clamp-3 min-h-[4.125rem]'}`}>
          {stripHtml(product.description)}
        </p>

        <div className="mt-auto flex flex-col gap-3 border-t border-[#E6D8BD] pt-3 dark:border-[#374151] sm:mt-4 sm:flex-row sm:items-end sm:justify-between sm:pt-4">
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight text-[#2E7D32] dark:text-[#81C784] sm:text-xl">
              GH₵ {product.price}
            </span>
            <span className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-[#5B3E31] dark:text-[#E6D8BD] sm:min-h-[2rem] sm:max-w-[80px] sm:text-xs">
              {product.unit}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2">
            <button
              onClick={() => addItem(product)}
              className={[
                'flex items-center justify-center gap-1 whitespace-nowrap px-2 py-2 text-[10px] font-semibold transition-colors sm:px-3 sm:text-xs',
                inCart
                  ? 'bg-[#2E7D32] text-white cursor-default'
                  : 'bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C]',
              ].join(' ')}
              disabled={inCart}
            >
              {inCart ? 'In Cart ✓' : <><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add to Cart</span></>}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="flex items-center justify-center gap-1 whitespace-nowrap border border-[#0D3B2A]/20 px-2 py-2 text-[10px] font-semibold text-[#0D3B2A] transition-colors hover:bg-[#E6D8BD] dark:border-white/20 dark:text-[#faf7f0] dark:hover:bg-white/10 sm:px-3 sm:text-xs"
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
