'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
      Promise.resolve().then(() => {
        setFirstName(user.first_name)
        setLastName(user.last_name)
        setPhone(user.phone_number ?? '')
        setStreetAddress(user.street_address ?? '')
        setHouseNumber(user.house_number ?? '')
        setCity(user.city ?? '')
        setDeliveryRegion(user.delivery_region ?? '')
      })
    }
  }, [user])

  // Lazy-load recipes
  useEffect(() => {
    if (activeTab === 'recipes' && !recipesLoaded) {
      Promise.resolve()
        .then(() => setRecipesLoading(true))
        .then(() => api.recipes.myRecipes.list())
        .then((data) => { setMyRecipes(data); setRecipesLoaded(true) })
        .catch((e) => setRecipesError(e instanceof Error ? e.message : 'Failed to load recipes'))
        .finally(() => setRecipesLoading(false))
    }
  }, [activeTab, recipesLoaded])

  // Lazy-load orders
  useEffect(() => {
    if (activeTab === 'orders' && !ordersLoaded) {
      Promise.resolve()
        .then(() => setOrdersLoading(true))
        .then(() => api.orders.myOrders())
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
    'w-full border-0 border-b bg-transparent px-0 py-3 text-charcoal text-sm placeholder:text-charcoal/35 focus:outline-none transition-colors dark:text-white dark:placeholder:text-white/35'
  const inputOk  = `${inputBase} border-sand focus:border-leaf-green focus:ring-leaf-green dark:border-white/25 dark:focus:border-[#F4C430]`
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-400`

  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal',  label: 'Account Details' },
    { id: 'wishlist',  label: 'My List' },
    { id: 'recipes',   label: 'My Recipes' },
    { id: 'orders',    label: 'Order History' },
  ]

  return (
    <div className="account-page min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">
      <header className="overflow-hidden border-b editorial-rule pb-10 pt-28 md:pb-14 md:pt-36">
        <div className="page-container grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div><p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Your market book</p><h1 className="display-organic mt-5 max-w-4xl text-5xl leading-[.92] text-[#0D3B2A] dark:text-white sm:text-6xl md:text-8xl md:leading-[.88]">Everything you keep<br /><em className="font-normal text-[#2E7D32] dark:text-[#F4C430]">for the next shop.</em></h1></div>
          <div className="bg-[#0D3B2A] p-6 text-white md:p-8">
            <div className="display-organic text-6xl text-[#F4C430]">{initials}</div>
            <p className="mt-5 text-lg font-bold">{fullName || 'Customer'}</p>
            <p className="mt-1 break-all text-sm text-white/60">{user?.email}</p>
            <button onClick={logout} className="mt-7 border-b border-white/45 pb-1 text-xs font-bold text-white/70 hover:border-[#F4C430] hover:text-[#F4C430]">Sign out</button>
          </div>
        </div>
      </header>

      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[15rem_1fr] lg:gap-20">

          {/* Sidebar */}
          <aside className="h-fit lg:sticky lg:top-28">
            <nav className="grid grid-cols-2 border-t editorial-rule sm:grid-cols-4 lg:block">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'relative w-full border-b editorial-rule px-3 py-4 text-left text-sm transition-colors lg:px-0',
                    activeTab === tab.id
                      ? 'font-bold text-[#0D3B2A] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[#F4C430] dark:text-white lg:before:-left-4'
                      : 'text-[#5B3E31] hover:text-[#2E7D32] dark:text-[#B8D4BD] dark:hover:text-white',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <Link
              href="/subscriptions/manage"
              className="mt-5 flex w-full items-center justify-between border border-[#0D3B2A]/25 bg-[#0D3B2A] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#24553D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 dark:border-[#F4C430]/40 dark:bg-[#F4C430] dark:text-[#0D3B2A] dark:hover:bg-[#E2B426]"
            >
              <span>Weekly Deliveries</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </aside>

          {/* Main panel */}
          <div className="min-w-0">

            {/* ── Personal Info tab ── */}
            {activeTab === 'personal' && (
              <>
                {/* Personal info card */}
                <div>
                  <div className="mb-10 grid gap-4 border-b editorial-rule pb-7 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">Personal record</p><h2 className="display-organic mt-2 text-5xl text-[#0D3B2A] dark:text-white md:text-6xl">Account details</h2></div><p className="max-w-xs text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">Names, contact details and the address we use for delivery.</p></div>

                  {saveStatus === 'success' && (
                    <div className="mb-5 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-200">
                      Changes saved successfully.
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200">
                      {saveError}
                    </div>
                  )}

                  <form onSubmit={handleSave} noValidate className="space-y-7">
                    {/* Name row */}
                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
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
                        <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
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
                      <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email ?? ''}
                        readOnly
                        className={`${inputOk} opacity-60 cursor-not-allowed`}
                      />
                      <p className="mt-1 text-xs text-charcoal/50 dark:text-white/50">Email cannot be changed.</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
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
                        <p className="mt-1 text-xs text-charcoal/50 dark:text-white/50">
                          Format: +233244123456 or 0244123456
                        </p>
                      )}
                    </div>

                    {/* Delivery Address section */}
                    <div className="border-t editorial-rule pt-9">
                      <div className="mb-8 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div>
                          <p className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">Where the harvest goes</p>
                          <h3 className="display-organic mt-1 text-4xl text-[#0D3B2A] dark:text-white">Delivery address</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="flex w-fit items-center gap-2 border-b border-[#2E7D32] pb-1 text-sm font-bold text-[#2E7D32] transition-colors hover:text-[#0D3B2A] dark:border-[#F4C430] dark:text-[#F4C430]"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {showMap ? 'Hide Map' : 'Pick Location on Map'}
                        </button>
                      </div>

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

                      <div className="grid gap-6 sm:grid-cols-2">

                        {/* House number */}
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
                            House / Apartment Number
                          </label>
                          <input
                            type="text"
                            value={houseNumber}
                            onChange={(e) => setHouseNumber(e.target.value)}
                            placeholder="e.g. A14, Flat 3"
                            className={`${inputOk} dark:[color-scheme:dark]`}
                          />
                        </div>

                        {/* Street address */}
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
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
                          <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
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
                          <label className="mb-1.5 block text-sm font-semibold text-charcoal/70 dark:text-white/75">
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
                        className="flex items-center gap-2 bg-[#F4C430] px-8 py-4 font-bold text-[#0D3B2A] transition-colors hover:bg-[#E2B426] disabled:opacity-60"
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
              <div>
                <div className="mb-8 border-b editorial-rule pb-7"><p className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">Saved for later</p><h2 className="display-organic mt-2 text-5xl text-[#0D3B2A] dark:text-white md:text-6xl">My list</h2></div>

                {wishlistLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <span className="inline-block w-8 h-8 border-2 border-leaf-green border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-charcoal/50 dark:text-white/55">Loading your list…</span>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="border-b editorial-rule py-12 text-left">
                    <p className="display-organic text-4xl text-[#0D3B2A] dark:text-white">Nothing held aside yet.</p>
                    <p className="mt-3 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">Save produce while browsing and it will wait here.</p>
                    <Link href="/products" className="mt-6 inline-block border-b border-current pb-1 text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Browse the stalls ↗</Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {wishlistItems.map((item) => {
                      const imgSrc = getWishlistImageSrc(item.product)
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-4 border-b editorial-rule py-5 text-[#0D3B2A] dark:text-white"
                        >
                          {/* Image */}
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-beige dark:bg-white/[.06]">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-charcoal/30 dark:text-white/35">No image</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.product.slug}`} className="block truncate text-sm font-semibold leading-snug text-forest-green transition-colors hover:text-leaf-green dark:text-white dark:hover:text-[#F4C430]">
                              {item.product.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-charcoal/60 dark:text-white/55">
                              GH₵ {item.product.price} · {item.product.unit}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => addToCart(item.product)}
                              className="border border-forest-green bg-forest-green px-3 py-2 text-xs font-semibold text-mist-white transition-colors hover:bg-[#24553D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] dark:border-[#F4C430] dark:bg-[#F4C430] dark:text-[#0D3B2A] dark:hover:bg-[#E2B426]"
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={() => removeWishlistItem(item.id)}
                              aria-label="Remove from list"
                              className="flex size-8 items-center justify-center border border-red-200 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-red-400/35 dark:text-red-300 dark:hover:bg-red-400/10"
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
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div><p className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">Kitchen notes</p><h2 className="display-organic mt-2 text-5xl text-[#0D3B2A] dark:text-white md:text-6xl">My recipes</h2></div>
                  <Link
                    href="/recipes/builder"
                    className="border-b border-current pb-1 text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]"
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
                  <div className="border-y editorial-rule py-12 text-left">
                    <p className="display-organic text-4xl text-[#0D3B2A] dark:text-white">Your notebook is open.</p>
                    <p className="mt-3 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">Save a recipe or write your own version as you cook.</p>
                    <Link href="/recipes" className="mt-6 inline-block border-b border-current pb-1 text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Visit the recipe shelf ↗</Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {myRecipes.map((recipe) => (
                      <li
                        key={recipe.id}
                        className="flex items-start justify-between gap-4 border-b editorial-rule py-5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="mb-0.5 truncate text-sm font-semibold leading-snug text-[#0D3B2A] dark:text-[#FEFCF7]">
                            {recipe.name}
                          </p>
                          {recipe.base_recipes.length > 0 && (
                            <p className="truncate text-xs text-[#5B3E31]/75 dark:text-[#B8D4BD]">
                              Built from:{' '}
                              <span className="text-[#0D3B2A]/75 dark:text-white/75">
                                {recipe.base_recipes.map((r) => r.title).join(', ')}
                              </span>
                            </p>
                          )}
                          <p className="mt-1 text-xs text-[#5B3E31]/60 dark:text-white/50">
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
              <div>
                <div className="mb-8 border-b editorial-rule pb-7"><p className="text-xs font-bold text-[#2E7D32] dark:text-[#F4C430]">From basket to doorstep</p><h2 className="display-organic mt-2 text-5xl text-[#0D3B2A] dark:text-white md:text-6xl">Order history</h2></div>

                {ordersError ? (
                  <div className="border-b editorial-rule py-12 text-left">
                    <p className="display-organic text-4xl text-[#0D3B2A] dark:text-white">We couldn’t load your deliveries.</p>
                    <p className="mt-3 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">Your orders are safe. Try loading them again.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setOrdersError(null)
                        setOrdersLoaded(false)
                      }}
                      className="mt-6 border-b border-current pb-1 text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]"
                    >
                      Retry order history ↗
                    </button>
                  </div>
                ) : ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <span className="inline-block w-8 h-8 border-2 border-leaf-green border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-charcoal/40">Loading your orders…</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="border-b editorial-rule py-12 text-left">
                    <p className="display-organic text-4xl text-[#0D3B2A] dark:text-white">No deliveries recorded.</p>
                    <p className="mt-3 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">Your first order will be tracked here from payment to delivery.</p>
                    <Link href="/products" className="mt-6 inline-block border-b border-current pb-1 text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Browse the current harvest ↗</Link>
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
      </div>
    </div>
  )
}
