'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { RecipeWithPairings } from '@/types'

export default function RecipeDetailActions({ recipe }: { recipe: RecipeWithPairings }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveAsIs() {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.recipes.myRecipes.create({
        name: recipe.title,
        description: recipe.description,
        base_recipe_ids: [recipe.id],
        ingredients: recipe.ingredients.map((ing, i) => ({
          name: ing.name,
          product_id: ing.product?.id ?? null,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          order: i,
        })),
      })
      setSaved(true)
      setTimeout(() => router.push('/my-recipes'), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/recipes/builder?base=${recipe.slug}`}
          className="inline-flex items-center gap-2 bg-[#F4C430] text-[#0D3B2A] font-semibold px-6 py-3 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
        >
          Customise This Recipe
        </Link>
        <button
          onClick={handleSaveAsIs}
          disabled={saving || saved}
          className="inline-flex items-center gap-2 border-2 border-mist-white/60 text-mist-white font-semibold px-6 py-3 rounded-xl hover:border-mist-white hover:bg-white/10 transition-colors text-sm disabled:opacity-60"
        >
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save As Is'}
        </button>
      </div>
      {error && (
        <p className="text-red-300 text-sm">{error}</p>
      )}
    </div>
  )
}
