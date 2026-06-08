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

const MIN_SWIPE = 50

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
  const [touchStart, setTouchStart]       = useState<number | null>(null)
  const [touchEnd, setTouchEnd]           = useState<number | null>(null)
  const [dragStart, setDragStart]         = useState<number | null>(null)

  // Gallery images take priority. Fall back to mainImage, then empty.
  const allImages: { src: string; alt: string }[] =
    images.length > 0
      ? images.map((img) => ({
          src: getMediaUrl(img.image, PLACEHOLDERS[0]),
          alt: img.alt_text || productName,
        }))
      : mainImage
      ? [{ src: getMediaUrl(mainImage, PLACEHOLDERS[0]), alt: productName }]
      : []

  const current      = allImages[selectedIndex] ?? null
  const hasMultiple  = allImages.length > 1
  const total        = allImages.length

  // ── Touch handlers ──────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setTouchEnd(null)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (Math.abs(distance) >= MIN_SWIPE) {
      if (distance > 0) {
        setSelectedIndex((prev) => (prev + 1) % total)
      } else {
        setSelectedIndex((prev) => (prev - 1 + total) % total)
      }
    }
  }

  // ── Mouse drag handlers ─────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    setDragStart(e.clientX)
  }
  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStart === null) return
    const distance = dragStart - e.clientX
    if (Math.abs(distance) >= MIN_SWIPE) {
      if (distance > 0) {
        setSelectedIndex((prev) => (prev + 1) % total)
      } else {
        setSelectedIndex((prev) => (prev - 1 + total) % total)
      }
    }
    setDragStart(null)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Main image ── */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-beige dark:bg-[#374151] shadow-sm"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={{ cursor: 'grab' }}
      >
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
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm select-none z-10">
            {selectedIndex + 1} / {total}
          </div>
        )}

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={() => setSelectedIndex((prev) => (prev - 1 + total) % total)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-9 md:h-9 rounded-full bg-white/80 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center shadow-md transition-all hover:scale-110 text-[#0D3B2A] dark:text-white font-bold text-lg select-none"
              aria-label="Previous image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex((prev) => (prev + 1) % total)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-9 md:h-9 rounded-full bg-white/80 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center shadow-md transition-all hover:scale-110 text-[#0D3B2A] dark:text-white font-bold text-lg select-none"
              aria-label="Next image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 p-1 scrollbar-thin">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View image ${idx + 1} of ${total}`}
              className={[
                'relative shrink-0 w-20 h-20 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]',
                idx === selectedIndex
                  ? 'ring-2 ring-[#F4C430] ring-offset-2 opacity-100'
                  : 'opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover rounded-lg"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
