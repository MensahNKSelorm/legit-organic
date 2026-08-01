'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { Product } from '@/types'

export type EditableMealIngredient = {
  key: string
  group: string
  name: string
  quantity: string
  unit: string
  notes: string
  productId: number | null
  productName: string | null
  productSlug: string | null
}

function IngredientEditorRow({ ingredient, onChange }: { ingredient: EditableMealIngredient; onChange: (next: EditableMealIngredient) => void }) {
  const [results, setResults] = useState<Product[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function changeName(name: string) {
    onChange({ ...ingredient, name, productId: null, productName: null, productSlug: null })
    if (timer.current) clearTimeout(timer.current)
    if (name.trim().length < 2) return setResults([])
    timer.current = setTimeout(async () => {
      try { setResults((await api.products.search(name)).results.slice(0, 4)) }
      catch { setResults([]) }
    }, 250)
  }

  return (
    <div className="relative grid gap-2 border-t border-[#0D3B2A]/15 py-3 dark:border-white/10 sm:grid-cols-[6rem_7rem_1fr]">
      <input aria-label={`Quantity for ${ingredient.name}`} value={ingredient.quantity} onChange={event => onChange({ ...ingredient, quantity: event.target.value })} className="border-b border-[#0D3B2A]/35 bg-transparent py-2 text-sm outline-none dark:border-white/25" />
      <input aria-label={`Unit for ${ingredient.name}`} value={ingredient.unit} onChange={event => onChange({ ...ingredient, unit: event.target.value })} className="border-b border-[#0D3B2A]/35 bg-transparent py-2 text-sm outline-none dark:border-white/25" />
      <div className="relative">
        <input aria-label="Ingredient name" value={ingredient.name} onChange={event => changeName(event.target.value)} className="w-full border-b border-[#0D3B2A]/35 bg-transparent py-2 text-sm outline-none dark:border-white/25" />
        {results.length > 0 && <div className="absolute inset-x-0 top-full z-20 border border-[#0D3B2A]/20 bg-[#FAF7F0] shadow-lg dark:border-white/15 dark:bg-[#202720]">{results.map(product => <button type="button" key={product.id} onClick={() => { onChange({ ...ingredient, name: product.name, productId: product.id, productName: product.name, productSlug: product.slug }); setResults([]) }} className="flex w-full justify-between border-b border-[#0D3B2A]/10 px-3 py-2 text-left text-sm last:border-0 hover:bg-[#F4C430]/20 dark:border-white/10"><span>{product.name}</span><span>GH₵ {product.price}</span></button>)}</div>}
      </div>
      {ingredient.productSlug && <Link href={`/products/${ingredient.productSlug}`} className="text-xs font-bold text-[#2E7D32] underline dark:text-[#F4C430] sm:col-start-3">Linked to {ingredient.productName} in the shop ↗</Link>}
    </div>
  )
}

export default function CombinedRecipeEditor({ title, baseRecipeIds, initialIngredients, returnTo }: { title: string; baseRecipeIds: number[]; initialIngredients: EditableMealIngredient[]; returnTo: string }) {
  const { isAuthenticated } = useAuth()
  const [editing, setEditing] = useState(false)
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(key: string, next: EditableMealIngredient) {
    setIngredients(current => current.map(item => item.key === key ? next : item))
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      await api.recipes.myRecipes.create({
        name: `My ${title}`,
        description: `A personal version of ${title}.`,
        base_recipe_ids: baseRecipeIds,
        ingredients: ingredients.map((ingredient, order) => ({ name: ingredient.name, product_id: ingredient.productId, quantity: ingredient.quantity || '1', unit: ingredient.unit, notes: `${ingredient.group}${ingredient.notes ? ` — ${ingredient.notes}` : ''}`, order })),
      })
      setSaved(true); setEditing(false)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save this recipe.') }
    finally { setSaving(false) }
  }

  if (!isAuthenticated) return <div className="mt-8 border-t editorial-rule pt-5 text-sm text-[#5B3E31] dark:text-[#B8D4BD]"><Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="font-bold text-[#0D3B2A] underline dark:text-[#F4C430]">Log in</Link> to edit the ingredients and save your own version.</div>

  return (
    <div className="mt-8 border-t editorial-rule pt-5">
      {!editing ? <button type="button" onClick={() => { setEditing(true); setSaved(false) }} className="border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">{saved ? 'Saved to My Recipes — edit another copy' : 'Edit ingredients and save my version'} ↗</button> : <div>
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-bold">Your private version</p><button type="button" onClick={() => setEditing(false)} className="text-xs underline">Cancel</button></div>
        <div className="mt-4">{ingredients.map(ingredient => <IngredientEditorRow key={ingredient.key} ingredient={ingredient} onChange={next => update(ingredient.key, next)} />)}</div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="button" onClick={save} disabled={saving} className="mt-5 bg-[#F4C430] px-6 py-3 text-sm font-bold text-[#0D3B2A] disabled:opacity-60">{saving ? 'Saving…' : 'Save to My Recipes'}</button>
      </div>}
    </div>
  )
}
