'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { WishlistItem } from '@/types'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface WishlistContextValue {
  items: WishlistItem[]
  isLoading: boolean
  addItem: (productId: number) => Promise<void>
  removeItem: (wishlistItemId: number) => Promise<void>
  isInWishlist: (productId: number) => boolean
  itemCount: number
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  isLoading: false,
  addItem: async () => {},
  removeItem: async () => {},
  isInWishlist: () => false,
  itemCount: 0,
})

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }
    setIsLoading(true)
    try {
      const data = await api.users.wishlist.list()
      setItems(data)
    } catch {
      // silent — user may not be authenticated yet
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  const addItem = async (productId: number) => {
    const item = await api.users.wishlist.add(productId)
    setItems(prev => [item, ...prev.filter(i => i.product.id !== productId)])
  }

  const removeItem = async (wishlistItemId: number) => {
    await api.users.wishlist.remove(wishlistItemId)
    setItems(prev => prev.filter(i => i.id !== wishlistItemId))
  }

  const isInWishlist = (productId: number) =>
    items.some(i => i.product.id === productId)

  return (
    <WishlistContext.Provider
      value={{ items, isLoading, addItem, removeItem, isInWishlist, itemCount: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  return useContext(WishlistContext)
}
