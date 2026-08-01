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
          'group relative flex h-10 w-10 items-center justify-center border transition-colors',
          isTransparent
            ? 'border-white/35 hover:border-white hover:bg-white/10'
            : 'border-[#0D3B2A]/20 text-[#0D3B2A] hover:border-[#0D3B2A] dark:border-white/25 dark:text-white dark:hover:border-[#F4C430]',
        ].join(' ')}
        style={isTransparent ? { color: '#ffffff' } : undefined}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4.5 8.5h15l-1.2 11H5.7l-1.2-11Z" />
          <path d="M8.5 8.5c0-2.7 1.3-4.5 3.5-4.5s3.5 1.8 3.5 4.5" />
          <path d="M8 13h8" />
        </svg>

        {itemCount > 0 && (
          <span
            className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-[#FAF7F0] dark:ring-[#171B18]"
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
