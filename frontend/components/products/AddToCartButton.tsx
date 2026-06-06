'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'
import type { ProductDetail } from '@/types'

interface AddToCartButtonProps {
  product: ProductDetail
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
