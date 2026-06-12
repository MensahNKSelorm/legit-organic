'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { UserRecipe } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function MyRecipesPage() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<UserRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    api.recipes.myRecipes.list()
      .then(setRecipes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recipes'))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this recipe?')) return
    setDeletingId(id)
    try {
      await api.recipes.myRecipes.delete(id)
      setRecipes((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete recipe')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '2.5rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-ghana-gold text-xs font-bold uppercase tracking-widest mb-1">
              {user ? `${user.first_name}'s Kitchen` : 'My Kitchen'}
            </p>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-mist-white">
              My Recipes
            </h1>
            <p className="text-light-leaf mt-1 text-sm">Recipes you&apos;ve saved and built</p>
          </div>
          <Link
            href="/recipes/builder"
            className="flex items-center gap-2 bg-[#F4C430] text-[#0D3B2A] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Build New Recipe
          </Link>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-24 text-charcoal/40 dark:text-[#9ca3af]">
            Loading your recipes…
          </div>
        ) : recipes.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-mist-white dark:bg-[#1f2937] rounded-2xl p-16 border border-sand dark:border-[#374151] text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#F4C430]/20 flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#F4C430" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-forest-green dark:text-[#faf7f0] mb-3">
              No saved recipes yet
            </h2>
            <p className="text-charcoal/60 dark:text-[#9ca3af] mb-8 text-sm leading-relaxed">
              Browse our collection of organic Ghanaian recipes and customise them to your taste — or build your own from scratch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/recipes"
                className="inline-block bg-[#F4C430] text-[#0D3B2A] font-semibold px-6 py-3 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
              >
                Browse Recipes
              </Link>
              <Link
                href="/recipes/builder"
                className="inline-block border-2 border-[#0D3B2A] dark:border-[#81C784] text-[#0D3B2A] dark:text-[#81C784] font-semibold px-6 py-3 rounded-xl hover:bg-[#0D3B2A]/5 dark:hover:bg-[#81C784]/10 transition-colors text-sm"
              >
                Build from Scratch
              </Link>
            </div>
          </div>
        ) : (
          /* ── Recipe cards ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <article
                key={recipe.id}
                className="bg-mist-white dark:bg-[#1f2937] rounded-2xl border border-sand dark:border-[#374151] p-6 flex flex-col shadow-sm"
              >
                <div className="flex-1 mb-5">
                  <h3 className="font-display text-lg font-bold text-forest-green dark:text-[#faf7f0] mb-2 leading-snug">
                    {recipe.name}
                  </h3>

                  {recipe.base_recipes.length > 0 && (
                    <p className="text-xs text-charcoal/50 dark:text-[#9ca3af] mb-3">
                      Built from:{' '}
                      <span className="font-medium text-charcoal/70 dark:text-[#d1d5db]">
                        {recipe.base_recipes.map((r) => r.title).join(', ')}
                      </span>
                    </p>
                  )}

                  {recipe.description && (
                    <p className="text-charcoal/60 dark:text-[#9ca3af] text-sm leading-relaxed line-clamp-2 mb-3">
                      {recipe.description}
                    </p>
                  )}

                  <div className="text-xs text-charcoal/40 dark:text-[#9ca3af] mb-2">
                    {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''} · Saved {formatDate(recipe.created_at)}
                  </div>

                  {recipe.ingredients.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {recipe.ingredients.slice(0, 5).map((ing, i) => (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-charcoal/70 dark:text-[#d1d5db] truncate">
                            {ing.name}
                            <span className="text-charcoal/40 dark:text-[#9ca3af] ml-1">
                              {ing.quantity} {ing.unit}
                            </span>
                          </span>
                          {ing.product && (
                            <a
                              href={`/products/${ing.product.slug}`}
                              className="shrink-0 text-xs px-2 py-0.5 rounded bg-[#0D3B2A] text-[#F4C430] hover:bg-[#2E7D32] transition-colors whitespace-nowrap"
                            >
                              Buy →
                            </a>
                          )}
                        </li>
                      ))}
                      {recipe.ingredients.length > 5 && (
                        <li className="text-xs text-charcoal/40 dark:text-[#9ca3af]">
                          +{recipe.ingredients.length - 5} more ingredient{recipe.ingredients.length - 5 !== 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-sand dark:border-[#374151]">
                  <Link
                    href={`/recipes/builder?edit=${recipe.id}`}
                    className="flex-1 text-center bg-[#0D3B2A] dark:bg-[#F4C430] text-mist-white dark:text-[#0D3B2A] text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    disabled={deletingId === recipe.id}
                    className="flex-1 text-center border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {deletingId === recipe.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
