'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/types'
import { getMediaUrl } from '@/lib/media'

const PLACEHOLDERS = [
  '/images/products/p1.webp',
  '/images/products/p2.webp',
  '/images/products/p3.webp',
  '/images/products/p4.webp',
]

interface Props {
  images: ProductImage[]
  productName: string
  mainImage: string | null
}

function LeafPlaceholder() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0D3B2A] to-[#2E7D32] flex items-center justify-center">
      <svg
        viewBox="0 0 24 24" width="72" height="72"
        fill="none" stroke="white" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="opacity-30"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </div>
  )
}

export default function ProductImageGallery({ images, productName, mainImage }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Gallery images take priority. Fall back to mainImage, then placeholder.
  const allImages: { src: string; alt: string }[] =
    images.length > 0
      ? images.map((img) => ({
          src: getMediaUrl(img.image, PLACEHOLDERS[0]),
          alt: img.alt_text || productName,
        }))
      : mainImage
      ? [{ src: getMediaUrl(mainImage, PLACEHOLDERS[0]), alt: productName }]
      : []

  const current = allImages[selectedIndex] ?? null
  const hasMultiple = allImages.length > 1

  return (
    <div className="flex flex-col gap-3">

      {/* ── Main image ── */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-beige dark:bg-[#374151] shadow-sm">
        {current ? (
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority={selectedIndex === 0}
          />
        ) : (
          <LeafPlaceholder />
        )}

        {/* Image counter */}
        {hasMultiple && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View image ${idx + 1} of ${allImages.length}`}
              className={[
                'relative shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]',
                idx === selectedIndex
                  ? 'ring-2 ring-[#F4C430] opacity-100'
                  : 'opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
