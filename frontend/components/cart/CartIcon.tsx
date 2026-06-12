'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'
import CartDrawer from './CartDrawer'

interface CartIconProps {
  isTransparent: boolean
}

export default function CartIcon({ isTransparent }: CartIconProps) {
  const { itemCount } = useCart()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
        className={[
          'relative w-9 h-9 flex items-center justify-center rounded-full transition-colors',
          isTransparent
            ? 'hover:bg-white/15'
            : 'text-[#0D3B2A] dark:text-white hover:bg-[#F5F0E6] dark:hover:bg-gray-700',
        ].join(' ')}
        style={isTransparent ? { color: '#ffffff' } : undefined}
      >
        {/* Shopping bag icon */}
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>

        {itemCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
            style={{ backgroundColor: '#F4C430', color: '#0D3B2A' }}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
