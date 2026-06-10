'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { Product, CartItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  total: number
  itemCount: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: number) => boolean
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'legit_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  // Keep a ref so effects/callbacks always read the latest items
  // without needing items in their dependency arrays.
  const itemsRef = useRef<CartItem[]>(items)
  useEffect(() => { itemsRef.current = items }, [items])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {
      // ignore corrupt data
    }
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Sync with DB when a user logs in
  useEffect(() => {
    if (!user) return

    const syncCart = async () => {
      try {
        const dbCart = await api.cart.get()
        const localItems = itemsRef.current

        // Push any local items that are missing from the DB cart
        for (const localItem of localItems) {
          const inDb = dbCart.items.find(i => i.product.id === localItem.product.id)
          if (!inDb) {
            await api.cart.addItem(localItem.product.id, localItem.quantity)
          }
        }

        // Re-fetch to get the merged state and use DB as source of truth
        const finalCart = await api.cart.get()
        const merged: CartItem[] = finalCart.items.map(i => ({
          product: i.product,
          quantity: i.quantity,
        }))
        setItems(merged)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // Sync failed — keep localStorage cart as-is
      }
    }

    syncCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = useCallback(async (product: Product, quantity = 1) => {
    // Compute the new absolute quantity for the DB call before state update
    const currentItem = itemsRef.current.find(i => i.product.id === product.id)
    const newQuantity = currentItem ? currentItem.quantity + quantity : quantity

    // Optimistic local update
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { product, quantity }]
    })

    if (user) {
      try { await api.cart.addItem(product.id, newQuantity) } catch {}
    }
  }, [user])

  const removeItem = useCallback(async (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))

    if (user) {
      try { await api.cart.removeItem(productId) } catch {}
    }
  }, [user])

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
      if (user) {
        try { await api.cart.removeItem(productId) } catch {}
      }
    } else {
      setItems((prev) =>
        prev.map((i) => i.product.id === productId ? { ...i, quantity } : i)
      )
      if (user) {
        try { await api.cart.addItem(productId, quantity) } catch {}
      }
    }
  }, [user])

  const clearCart = useCallback(async () => {
    setItems([])
    if (user) {
      try { await api.cart.clear() } catch {}
    }
  }, [user])

  const isInCart = useCallback(
    (productId: number) => items.some((i) => i.product.id === productId),
    [items]
  )

  return (
    <CartContext.Provider
      value={{ items, total, itemCount, addItem, removeItem, updateQuantity, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
