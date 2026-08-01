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
    <div className="account-page min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-[#0D3B2A] pb-12 pt-32 text-white">
        <div className="page-container flex flex-wrap items-end justify-between gap-7">
          <div>
            <p className="editorial-label mb-3 text-ghana-gold">
              {user ? `${user.first_name}'s Kitchen` : 'My Kitchen'}
            </p>
            <h1 className="display-organic text-6xl text-mist-white lg:text-7xl">
              Your kitchen notebook.
            </h1>
            <p className="mt-3 text-sm text-[#B8D4BD]">Recipes you&apos;ve saved, changed and made your own.</p>
          </div>
          <Link
            href="/recipes/builder"
            className="flex items-center gap-2 bg-[#F4C430] px-5 py-3 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-white"
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
          <div className="mx-auto max-w-3xl border-y editorial-rule py-14 text-left md:grid md:grid-cols-[7rem_1fr] md:gap-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center bg-[#F4C430]/20 md:mb-0">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#F4C430" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            </div>
            <div><h2 className="display-organic mb-3 text-4xl text-forest-green dark:text-[#faf7f0]">
              The first page is still blank.
            </h2>
            <p className="text-charcoal/60 dark:text-[#9ca3af] mb-8 text-sm leading-relaxed">
              Save a recipe that worked, or begin with an ingredient and write your own version as you cook.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recipes"
                className="inline-block bg-[#F4C430] px-6 py-3 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white"
              >
                Browse Recipes
              </Link>
              <Link
                href="/recipes/builder"
                className="inline-block border-b border-[#0D3B2A] px-2 py-3 text-sm font-bold text-[#0D3B2A] transition-colors hover:text-[#2E7D32] dark:border-[#81C784] dark:text-[#81C784]"
              >
                Build from Scratch
              </Link>
            </div></div>
          </div>
        ) : (
          /* ── Recipe cards ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <article
                key={recipe.id}
                className="flex flex-col border-t editorial-rule bg-transparent p-6"
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
