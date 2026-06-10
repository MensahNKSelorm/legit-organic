'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { api } from '@/lib/api'
import { getMediaUrl } from '@/lib/media'
import type { UserRecipe, Order, Product } from '@/types'
import OrderCard from '@/components/orders/OrderCard'
import LocationPicker from '@/components/ui/LocationPicker'

type Tab = 'personal' | 'recipes' | 'orders' | 'wishlist'

const GHANA_REGIONS = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
  'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
  'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
  'International',
]

const PHONE_RE = /^(\+233|0)[0-9]{9}$/

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function getWishlistImageSrc(product: Product): string {
  if (product.images && product.images.length > 0) {
    return getMediaUrl(product.images[0].image) || '/images/products/p1.webp'
  }
  if (product.image) {
    return getMediaUrl(product.image) || '/images/products/p1.webp'
  }
  return '/images/products/p1.webp'
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { addItem: addToCart } = useCart()
  const { items: wishlistItems, isLoading: wishlistLoading, removeItem: removeWishlistItem } = useWishlist()

  const [activeTab, setActiveTab] = useState<Tab>('personal')

  // ── Personal info form ──────────────────────────────────────
  const [firstName, setFirstName]         = useState('')
  const [lastName, setLastName]           = useState('')
  const [phone, setPhone]                 = useState('')
  const [phoneError, setPhoneError]       = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [houseNumber, setHouseNumber]     = useState('')
  const [city, setCity]                   = useState('')
  const [deliveryRegion, setDeliveryRegion] = useState('')

  const [showMap, setShowMap] = useState(false)

  const [saving, setSaving]       = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError]   = useState('')

  // ── My Recipes tab ──────────────────────────────────────────
  const [myRecipes, setMyRecipes]         = useState<UserRecipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipesError, setRecipesError]   = useState<string | null>(null)
  const [recipesLoaded, setRecipesLoaded] = useState(false)
  const [deletingRecipeId, setDeletingRecipeId] = useState<number | null>(null)

  // ── Order History tab ───────────────────────────────────────
  const [orders, setOrders]             = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError]   = useState<string | null>(null)
  const [ordersLoaded, setOrdersLoaded] = useState(false)

  // Sync form with user from context
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setPhone(user.phone_number ?? '')
      setStreetAddress(user.street_address ?? '')
      setHouseNumber(user.house_number ?? '')
      setCity(user.city ?? '')
      setDeliveryRegion(user.delivery_region ?? '')
    }
  }, [user])

  // Lazy-load recipes
  useEffect(() => {
    if (activeTab === 'recipes' && !recipesLoaded) {
      setRecipesLoading(true)
      api.recipes.myRecipes.list()
        .then((data) => { setMyRecipes(data); setRecipesLoaded(true) })
        .catch((e) => setRecipesError(e instanceof Error ? e.message : 'Failed to load recipes'))
        .finally(() => setRecipesLoading(false))
    }
  }, [activeTab, recipesLoaded])

  // Lazy-load orders
  useEffect(() => {
    if (activeTab === 'orders' && !ordersLoaded) {
      setOrdersLoading(true)
      api.orders.myOrders()
        .then((data) => { setOrders(data); setOrdersLoaded(true) })
        .catch((e) => setOrdersError(e instanceof Error ? e.message : 'Failed to load orders'))
        .finally(() => setOrdersLoading(false))
    }
  }, [activeTab, ordersLoaded])

  const validatePhone = (value: string): boolean => {
    if (!value) { setPhoneError(''); return true }
    if (!PHONE_RE.test(value.replace(/\s/g, ''))) {
      setPhoneError('Enter a valid Ghana phone number e.g. +233244123456 or 0244123456')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePhone(phone)) return
    setSaving(true)
    setSaveStatus('idle')
    setSaveError('')
    try {
      const updated = await api.users.updateProfile({
        email: user!.email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone.replace(/\s/g, ''),
        street_address: streetAddress,
        house_number: houseNumber,
        city,
        delivery_region: deliveryRegion,
      })
      updateUser(updated)
      setSaveStatus('success')
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRecipe(id: number) {
    if (!confirm('Delete this recipe?')) return
    setDeletingRecipeId(id)
    setRecipesError(null)
    try {
      await api.recipes.myRecipes.delete(id)
      setMyRecipes((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setRecipesError(e instanceof Error ? e.message : 'Failed to delete recipe')
    } finally {
      setDeletingRecipeId(null)
    }
  }

  const initials = user
    ? [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('').toUpperCase() || user.email[0].toUpperCase()
    : '?'
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : ''

  const inputBase =
    'w-full px-4 py-2.5 rounded-xl border bg-cream text-charcoal text-sm focus:outline-none focus:ring-1 transition-colors'
  const inputOk  = `${inputBase} border-sand focus:border-leaf-green focus:ring-leaf-green`
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-400`

  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal',  label: 'Account Details' },
    { id: 'wishlist',  label: 'My List' },
    { id: 'recipes',   label: 'My Recipes' },
    { id: 'orders',    label: 'Order History' },
  ]

  return (
    <>
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-mist-white">My Profile</h1>
          <p className="text-light-leaf mt-2 text-lg">Manage your account details and preferences</p>
        </div>
      </div>

      <SectionWrapper background="cream">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Sidebar */}
          <div className="bg-mist-white rounded-2xl p-6 border border-sand h-fit">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0D3B2A] to-[#2E7D32] flex items-center justify-center text-white text-3xl font-display italic font-bold ring-4 ring-[#F4C430] ring-offset-4 shadow-xl mb-3">
                {initials}
              </div>
              <p className="font-semibold text-forest-green">{fullName}</p>
              <p className="text-charcoal/60 text-sm">{user?.email}</p>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#F5F0E6] text-[#0D3B2A] font-semibold dark:bg-gray-700 dark:text-white'
                      : 'text-[#0D3B2A] dark:text-gray-300 hover:bg-[#F5F0E6] dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}

              <div className="border-t border-sand pt-3 mt-3">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>

          {/* Main panel */}
          <div className="md:col-span-2 space-y-6">

            {/* ── Personal Info tab ── */}
            {activeTab === 'personal' && (
              <>
                {/* Personal info card */}
                <div className="bg-mist-white rounded-2xl p-8 border border-sand">
                  <h2 className="font-display text-xl font-bold text-forest-green mb-6">
                    Account Details
                  </h2>

                  {saveStatus === 'success' && (
                    <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                      Changes saved successfully.
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {saveError}
                    </div>
                  )}

                  <form onSubmit={handleSave} noValidate className="space-y-5">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className={inputOk}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className={inputOk}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email ?? ''}
                        readOnly
                        className={`${inputOk} opacity-60 cursor-not-allowed`}
                      />
                      <p className="mt-1 text-xs text-charcoal/40">Email cannot be changed.</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                        onBlur={(e) => validatePhone(e.target.value)}
                        placeholder="+233244123456 or 0244123456"
                        className={phoneError ? inputErr : inputOk}
                      />
                      {phoneError ? (
                        <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                      ) : (
                        <p className="mt-1 text-xs text-charcoal/40">
                          Format: +233244123456 or 0244123456
                        </p>
                      )}
                    </div>

                    {/* Delivery Address section */}
                    <div className="border-t border-sand pt-5">
                      <h3 className="font-semibold text-forest-green mb-4">Delivery Address</h3>

                      <div className="space-y-4">
                        {/* Map toggle */}
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#2E7D32] text-[#2E7D32] font-semibold text-sm hover:bg-[#2E7D32]/5 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {showMap ? 'Hide Map' : 'Pick Location on Map'}
                        </button>

                        {showMap && (
                          <div className="mb-4">
                            <LocationPicker
                              onLocationSelect={(data) => {
                                if (data.street_address) setStreetAddress(data.street_address)
                                setHouseNumber(data.house_number || '')
                                if (data.city) setCity(data.city)
                                if (data.delivery_region) setDeliveryRegion(data.delivery_region)
                              }}
                            />
                          </div>
                        )}

                        {/* House number */}
                        <div>
                          <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                            House / Apartment Number
                          </label>
                          <input
                            type="text"
                            value={houseNumber}
                            onChange={(e) => setHouseNumber(e.target.value)}
                            placeholder="e.g. A14, Flat 3"
                            className={inputOk}
                          />
                        </div>

                        {/* Street address */}
                        <div>
                          <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="e.g. 12 Independence Ave"
                            className={inputOk}
                          />
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                            City
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Accra"
                            className={inputOk}
                          />
                        </div>

                        {/* Region */}
                        <div>
                          <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                            Region
                          </label>
                          <select
                            value={deliveryRegion}
                            onChange={(e) => setDeliveryRegion(e.target.value)}
                            className={inputOk}
                          >
                            <option value="">Select region…</option>
                            {GHANA_REGIONS.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-ghana-gold text-forest-green font-semibold px-8 py-3 rounded-xl hover:bg-dark-gold transition-colors disabled:opacity-60 flex items-center gap-2"
                      >
                        {saving && (
                          <span className="inline-block w-4 h-4 border-2 border-forest-green border-t-transparent rounded-full animate-spin" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* ── My List (Wishlist) tab ── */}
            {activeTab === 'wishlist' && (
              <div className="bg-mist-white rounded-2xl p-8 border border-sand">
                <h2 className="font-display text-xl font-bold text-forest-green mb-6">My List</h2>

                {wishlistLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <span className="inline-block w-8 h-8 border-2 border-leaf-green border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-charcoal/40">Loading your list…</span>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-forest-green mb-1">Your list is empty</p>
                    <p className="text-charcoal/60 text-sm mb-5">Browse products and save items to find them here.</p>
                    <Link href="/products" className="text-sm font-semibold text-leaf-green hover:underline">
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {wishlistItems.map((item) => {
                      const imgSrc = getWishlistImageSrc(item.product)
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-4 p-4 rounded-xl border border-sand bg-cream hover:border-leaf-green/40 transition-colors"
                        >
                          {/* Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-beige flex-shrink-0">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-charcoal/20 text-xs">No img</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.product.slug}`} className="font-semibold text-forest-green text-sm leading-snug hover:text-leaf-green transition-colors truncate block">
                              {item.product.name}
                            </Link>
                            <p className="text-xs text-charcoal/50 mt-0.5">
                              GH₵ {item.product.price} · {item.product.unit}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => addToCart(item.product)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-forest-green text-mist-white hover:opacity-90 transition-opacity"
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={() => removeWishlistItem(item.id)}
                              aria-label="Remove from list"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors text-sm font-bold"
                            >
                              ×
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* ── My Recipes tab ── */}
            {activeTab === 'recipes' && (
              <div className="bg-mist-white rounded-2xl p-8 border border-sand">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-forest-green">My Recipes</h2>
                  <Link
                    href="/recipes/builder"
                    className="text-xs font-semibold bg-ghana-gold text-forest-green px-4 py-2 rounded-xl hover:bg-dark-gold transition-colors"
                  >
                    + New Recipe
                  </Link>
                </div>

                {recipesError && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {recipesError}
                  </div>
                )}

                {recipesLoading ? (
                  <div className="text-center py-12 text-charcoal/40 text-sm">Loading your recipes…</div>
                ) : myRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[#F4C430]/20 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F4C430" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                        <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-forest-green mb-1">No saved recipes yet</p>
                    <p className="text-charcoal/60 text-sm mb-5">You haven&apos;t saved any recipes yet.</p>
                    <Link href="/recipes" className="text-sm font-semibold text-leaf-green hover:underline">
                      Browse Recipes
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {myRecipes.map((recipe) => (
                      <li
                        key={recipe.id}
                        className="flex items-start justify-between gap-4 p-4 rounded-xl border border-sand bg-cream hover:border-leaf-green/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-forest-green text-sm leading-snug mb-0.5 truncate">
                            {recipe.name}
                          </p>
                          {recipe.base_recipes.length > 0 && (
                            <p className="text-xs text-charcoal/50 truncate">
                              Built from:{' '}
                              <span className="text-charcoal/70">
                                {recipe.base_recipes.map((r) => r.title).join(', ')}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-charcoal/40 mt-1">
                            {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                            {' · '}
                            {formatDate(recipe.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Link
                            href={`/recipes/builder?edit=${recipe.id}`}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-forest-green text-mist-white hover:opacity-90 transition-opacity"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.id)}
                            disabled={deletingRecipeId === recipe.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deletingRecipeId === recipe.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── Order History tab ── */}
            {activeTab === 'orders' && (
              <div className="bg-mist-white rounded-2xl p-8 border border-sand">
                <h2 className="font-display text-xl font-bold text-forest-green mb-6">Order History</h2>

                {ordersError && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {ordersError}
                  </div>
                )}

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <span className="inline-block w-8 h-8 border-2 border-leaf-green border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-charcoal/40">Loading your orders…</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📦</div>
                    <p className="font-semibold text-forest-green mb-2">No orders yet</p>
                    <p className="text-charcoal/60 text-sm max-w-xs mx-auto mb-5">
                      Your order history will appear here after your first purchase.
                    </p>
                    <Link href="/products" className="text-sm font-semibold text-leaf-green hover:underline">
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard key={order.reference} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
