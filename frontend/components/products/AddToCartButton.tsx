'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useWishlist } from '@/lib/wishlist'
import type { ProductDetail } from '@/types'

interface AddToCartButtonProps {
  product: ProductDetail
}

export function WishlistButton({ productId }: { productId: number }) {
  const router = useRouter()
  const { user } = useAuth()
  const { addItem, removeItem, isInWishlist, items } = useWishlist()
  const [loading, setLoading] = useState(false)

  const inWishlist = isInWishlist(productId)
  const wishlistItem = items.find(i => i.product.id === productId)

  const handleClick = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      if (inWishlist && wishlistItem) {
        await removeItem(wishlistItem.id)
      } else {
        await addItem(productId)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={[
        'w-full border-2 font-semibold px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2',
        inWishlist
          ? 'border-red-400 bg-red-50 text-red-500 dark:bg-red-950/30 dark:border-red-500 dark:text-red-400'
          : 'border-[#0D3B2A] dark:border-[#81C784] text-[#0D3B2A] dark:text-[#81C784] hover:bg-[#0D3B2A]/5',
        loading ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : inWishlist ? (
        <>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Save to My List
        </>
      )}
    </button>
  )
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, isInCart, items, updateQuantity } = useCart()
  const inCart = isInCart(product.id)
  const cartItem = items.find((i) => i.product.id === product.id)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (inCart && cartItem) {
    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center gap-1 border-2 border-[#2E7D32] rounded-xl overflow-hidden">
          <button
            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
            aria-label="Decrease quantity"
            className="w-10 h-11 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold text-lg"
          >
            −
          </button>
          <span className="w-10 text-center font-bold text-[#0D3B2A] dark:text-[#faf7f0]">
            {cartItem.quantity}
          </span>
          <button
            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
            aria-label="Increase quantity"
            className="w-10 h-11 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold text-lg"
          >
            +
          </button>
        </div>
        <span className="text-[#2E7D32] dark:text-[#81C784] text-sm font-semibold">
          In Cart ✓
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className={[
        'w-full font-semibold px-6 py-3 rounded-xl transition-all duration-300',
        added
          ? 'bg-[#2E7D32] text-white'
          : 'bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C]',
      ].join(' ')}
    >
      {added ? 'Added to Cart ✓' : 'Add to Cart'}
    </button>
  )
}
