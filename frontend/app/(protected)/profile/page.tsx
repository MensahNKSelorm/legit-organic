'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { UserRecipe } from '@/types'

type Tab = 'personal' | 'recipes' | 'orders'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('personal')

  // ── Personal info form ──────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  // ── My Recipes tab ──────────────────────────────────────────
  const [myRecipes, setMyRecipes] = useState<UserRecipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipesError, setRecipesError] = useState<string | null>(null)
  const [recipesLoaded, setRecipesLoaded] = useState(false)
  const [deletingRecipeId, setDeletingRecipeId] = useState<number | null>(null)

  // Sync form with user from context
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setPhone(user.phone_number ?? '')
      setAddress(user.delivery_address ?? '')
    }
  }, [user])

  // Lazy-load recipes on first tab activation
  useEffect(() => {
    if (activeTab === 'recipes' && !recipesLoaded) {
      setRecipesLoading(true)
      api.recipes.myRecipes.list()
        .then((data) => { setMyRecipes(data); setRecipesLoaded(true) })
        .catch((e) => setRecipesError(e instanceof Error ? e.message : 'Failed to load recipes'))
        .finally(() => setRecipesLoading(false))
    }
  }, [activeTab, recipesLoaded])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveStatus('idle')
    setSaveError('')
    try {
      const updated = await api.users.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        delivery_address: address,
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
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : ''

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-sand bg-cream text-charcoal text-sm focus:outline-none focus:border-leaf-green focus:ring-1 focus:ring-leaf-green transition-colors'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal', label: 'Account Details' },
    { id: 'recipes', label: 'My Recipes' },
    { id: 'orders', label: 'Order History' },
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
              <div className="w-20 h-20 rounded-full bg-[#F4C430] flex items-center justify-center text-[#0D3B2A] text-2xl font-bold font-display mb-3">
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
                      ? 'bg-beige text-forest-green font-semibold'
                      : 'text-charcoal/70 hover:bg-beige hover:text-forest-green',
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
          <div className="md:col-span-2 bg-mist-white rounded-2xl p-8 border border-sand">

            {/* ── Personal Info tab ── */}
            {activeTab === 'personal' && (
              <>
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

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      className={`${inputClass} opacity-60 cursor-not-allowed`}
                    />
                    <p className="mt-1 text-xs text-charcoal/40">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-charcoal/70 mb-1.5">
                      Delivery Address
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      placeholder="Street, City, Region"
                      className={`${inputClass} resize-none`}
                    />
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
              </>
            )}

            {/* ── My Recipes tab ── */}
            {activeTab === 'recipes' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-forest-green">
                    My Recipes
                  </h2>
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
                  <div className="text-center py-12 text-charcoal/40 text-sm">
                    Loading your recipes…
                  </div>
                ) : myRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[#F4C430]/20 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F4C430" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                        <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-forest-green mb-1">No saved recipes yet</p>
                    <p className="text-charcoal/60 text-sm mb-5">
                      You haven&apos;t saved any recipes yet.
                    </p>
                    <Link
                      href="/recipes"
                      className="text-sm font-semibold text-leaf-green hover:underline"
                    >
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
              </>
            )}

            {/* ── Order History tab ── */}
            {activeTab === 'orders' && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📦</div>
                <h2 className="font-display text-xl font-bold text-forest-green mb-2">
                  Order History
                </h2>
                <p className="text-charcoal/60 text-sm max-w-xs mx-auto">
                  Order tracking is coming soon. Your past orders will appear here once the shop
                  goes live.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
