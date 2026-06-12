'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import type { Product, Recipe, RecipeWithPairings } from '@/types'
import { getMediaUrl } from '@/lib/media'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const UNITS = ['kg', 'g', 'pieces', 'cups', 'tablespoons', 'teaspoons', 'litres', 'ml', 'bunches', 'cloves']

let nextId = 1
function localId() { return nextId++ }

interface BuilderIngredient {
  localId: number
  name: string
  quantity: string
  unit: string
  notes: string
  order: number
  productId: number | null
  productName: string | null
  productSlug: string | null
  sourceRecipeId: number | null
}

interface BaseRecipeEntry {
  id: number
  title: string
  slug: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ingredientsFromRecipe(recipe: RecipeWithPairings, startOrder = 0): BuilderIngredient[] {
  return (recipe.ingredients ?? []).map((ing, i) => ({
    localId: localId(),
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit || 'pieces',
    notes: ing.notes || '',
    order: startOrder + i,
    productId: ing.product?.id ?? null,
    productName: ing.product?.name ?? null,
    productSlug: ing.product?.slug ?? null,
    sourceRecipeId: recipe.id,
  }))
}

function blankIngredient(): BuilderIngredient {
  return {
    localId: localId(),
    name: '',
    quantity: '1',
    unit: 'pieces',
    notes: '',
    order: 0,
    productId: null,
    productName: null,
    productSlug: null,
    sourceRecipeId: null,
  }
}

// ---------------------------------------------------------------------------
// Builder content (needs Suspense for useSearchParams)
// ---------------------------------------------------------------------------

function BuilderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const baseSlug = searchParams.get('base')
  const addSlug = searchParams.get('add')
  const editId = searchParams.get('edit') ? Number(searchParams.get('edit')) : null

  const [recipeName, setRecipeName] = useState('My Custom Recipe')
  const [ingredients, setIngredients] = useState<BuilderIngredient[]>([])
  const [baseRecipes, setBaseRecipes] = useState<BaseRecipeEntry[]>([])
  const [allDefaultRecipes, setAllDefaultRecipes] = useState<Recipe[]>([])
  const [recipeSearch, setRecipeSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------------
  // Auth guard
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const dest = window.location.pathname + window.location.search
      router.push('/login?next=' + encodeURIComponent(dest))
    }
  }, [authLoading, isAuthenticated, router])

  // ---------------------------------------------------------------------------
  // Load initial data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    async function load() {
      setIsLoading(true)
      try {
        const allRecipes = await api.recipes.list()
        setAllDefaultRecipes(allRecipes)

        if (editId) {
          // Edit mode: load existing user recipe
          const userRecipe = await api.recipes.myRecipes.get(editId)
          setEditingId(editId)
          setRecipeName(userRecipe.name)
          setBaseRecipes(userRecipe.base_recipes.map((r) => ({ id: r.id, title: r.title, slug: r.slug })))
          setIngredients(
            userRecipe.ingredients.map((ing) => ({
              localId: localId(),
              name: ing.name,
              quantity: String(ing.quantity),
              unit: ing.unit,
              notes: ing.notes || '',
              order: ing.order,
              productId: ing.product?.id ?? null,
              productName: ing.product?.name ?? null,
              productSlug: ing.product?.slug ?? null,
              sourceRecipeId: null,
            }))
          )
        } else {
          // Create mode: load base recipe(s)
          const fetches: Promise<RecipeWithPairings>[] = []
          if (baseSlug) fetches.push(api.recipes.detail(baseSlug))
          if (addSlug) fetches.push(api.recipes.detail(addSlug))

          const results = await Promise.all(fetches)
          const allIngredients: BuilderIngredient[] = []
          const bases: BaseRecipeEntry[] = []
          let orderOffset = 0

          for (const recipe of results) {
            bases.push({ id: recipe.id, title: recipe.title, slug: recipe.slug })
            const ings = ingredientsFromRecipe(recipe, orderOffset)
            allIngredients.push(...ings)
            orderOffset += ings.length
          }

          if (results.length > 0) {
            setRecipeName(results.length === 1 ? results[0].title : 'My Combined Recipe')
            setBaseRecipes(bases)
            setIngredients(allIngredients)
          } else {
            setIngredients([blankIngredient()])
          }
        }
      } catch (e) {
        console.error('Builder load error:', e)
        setIngredients([blankIngredient()])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, baseSlug, addSlug, editId])

  // ---------------------------------------------------------------------------
  // Ingredient operations
  // ---------------------------------------------------------------------------
  function updateIngredient(localId: number, field: keyof BuilderIngredient, value: string) {
    setIngredients((prev) =>
      prev.map((ing) => ing.localId === localId ? { ...ing, [field]: value } : ing)
    )
  }

  function removeIngredient(localId: number) {
    setIngredients((prev) => prev.filter((ing) => ing.localId !== localId))
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...blankIngredient(), order: prev.length }])
  }

  function moveIngredient(localId: number, dir: -1 | 1) {
    setIngredients((prev) => {
      const idx = prev.findIndex((i) => i.localId === localId)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr.map((ing, i) => ({ ...ing, order: i }))
    })
  }

  function removeBaseRecipe(id: number) {
    setBaseRecipes((prev) => prev.filter((r) => r.id !== id))
    setIngredients((prev) => prev.filter((ing) => ing.sourceRecipeId !== id))
  }

  function linkProduct(localId: number, productId: number, productName: string, productSlug: string) {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.localId === localId
          ? { ...ing, productId, productName, productSlug }
          : ing
      )
    )
  }

  function unlinkProduct(localId: number) {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.localId === localId
          ? { ...ing, productId: null, productName: null, productSlug: null }
          : ing
      )
    )
  }

  async function addRecipeToBuilder(slug: string) {
    if (baseRecipes.some((r) => r.slug === slug)) return
    try {
      const recipe = await api.recipes.detail(slug)
      setBaseRecipes((prev) => [...prev, { id: recipe.id, title: recipe.title, slug: recipe.slug }])
      setIngredients((prev) => {
        const ings = ingredientsFromRecipe(recipe, prev.length)
        return [...prev, ...ings]
      })
      setRecipeSearch('')
    } catch (e) {
      console.error('Failed to add recipe:', e)
    }
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  async function handleSave() {
    setSaveError(null)
    if (!recipeName.trim()) {
      setSaveError('Please give your recipe a name.')
      nameRef.current?.focus()
      return
    }
    if (ingredients.length === 0) {
      setSaveError('Add at least one ingredient.')
      return
    }
    setIsSaving(true)
    try {
      const data = {
        name: recipeName.trim(),
        base_recipe_ids: baseRecipes.map((r) => r.id),
        ingredients: ingredients.map((ing, i) => ({
          name: ing.name,
          product_id: ing.productId ?? undefined,
          quantity: ing.quantity || '1',
          unit: ing.unit,
          notes: ing.notes,
          order: i,
        })),
      }

      if (editingId) {
        await api.recipes.myRecipes.update(editingId, data)
      } else {
        await api.recipes.myRecipes.create(data)
      }

      setSaveSuccess(true)
      setTimeout(() => router.push('/my-recipes'), 1200)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save recipe')
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Filtered recipe search
  // ---------------------------------------------------------------------------
  const searchResults = recipeSearch.trim()
    ? allDefaultRecipes.filter(
        (r) =>
          r.title.toLowerCase().includes(recipeSearch.toLowerCase()) &&
          !baseRecipes.some((b) => b.id === r.id)
      ).slice(0, 5)
    : []

  // ---------------------------------------------------------------------------
  // Order all linked ingredients via WhatsApp
  // ---------------------------------------------------------------------------
  function handleOrderAllIngredients() {
    const linked = ingredients.filter((i) => i.productSlug)
    if (linked.length === 0) {
      alert('Please link at least one ingredient to a product first by searching in the ingredient name field.')
      return
    }
    const itemsList = linked
      .map((i) => `• ${i.name}${i.quantity ? ` — ${i.quantity} ${i.unit}` : ''}`)
      .join('\n')
    const message = `Hello Legit Organic! 🌿\n\nI'd like to order ingredients for a recipe:\n\n${itemsList}\n\nPlease send me the total and MoMo payment details. Thank you!`
    const a = document.createElement('a')
    a.href = `https://wa.me/233539569260?text=${encodeURIComponent(message)}`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#111827] flex items-center justify-center">
        <div className="text-charcoal/40 dark:text-[#9ca3af]">Loading builder…</div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '1.5rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-ghana-gold text-xs font-bold uppercase tracking-widest mb-2">
                Recipe Builder
              </p>
              <input
                ref={nameRef}
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Give your recipe a name…"
                className="w-full font-display text-2xl lg:text-3xl font-bold text-mist-white bg-transparent border-b-2 border-mist-white/30 focus:border-[#F4C430] outline-none pb-1 placeholder:text-mist-white/30 truncate"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className="shrink-0 bg-[#F4C430] text-[#0D3B2A] font-semibold px-6 py-3 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm disabled:opacity-60 mt-6"
            >
              {saveSuccess ? 'Saved!' : isSaving ? 'Saving…' : editingId ? 'Update Recipe' : 'Save Recipe'}
            </button>
          </div>

          {/* Base recipe pills */}
          {baseRecipes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-light-leaf text-xs font-medium">Built from:</span>
              {baseRecipes.map((r) => (
                <span
                  key={r.id}
                  className="flex items-center gap-1 bg-white/10 text-mist-white text-xs font-medium px-3 py-1 rounded-full"
                >
                  {r.title}
                  <button
                    onClick={() => removeBaseRecipe(r.id)}
                    className="ml-1 hover:text-[#F4C430] transition-colors"
                    aria-label={`Remove ${r.title}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {saveError && (
            <p className="mt-3 text-red-300 text-sm">{saveError}</p>
          )}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">

          {/* ── Ingredients editor ───────────────────────────── */}
          <div>
            <h2 className="font-display text-xl font-bold text-forest-green dark:text-[#faf7f0] mb-6">
              Ingredients
              <span className="ml-2 text-sm font-normal text-charcoal/40 dark:text-[#9ca3af]">
                ({ingredients.length})
              </span>
            </h2>

            {ingredients.length === 0 ? (
              <p className="text-charcoal/40 dark:text-[#9ca3af] text-sm italic mb-6">
                No ingredients yet. Add one below or add a recipe from the sidebar.
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {ingredients.map((ing, idx) => (
                  <IngredientRow
                    key={ing.localId}
                    ing={ing}
                    isFirst={idx === 0}
                    isLast={idx === ingredients.length - 1}
                    onChange={(field, val) => updateIngredient(ing.localId, field, val)}
                    onRemove={() => removeIngredient(ing.localId)}
                    onMoveUp={() => moveIngredient(ing.localId, -1)}
                    onMoveDown={() => moveIngredient(ing.localId, 1)}
                    onLinkProduct={(productId, productName, productSlug) =>
                      linkProduct(ing.localId, productId, productName, productSlug)
                    }
                    onUnlinkProduct={() => unlinkProduct(ing.localId)}
                  />
                ))}
              </div>
            )}

            <button
              onClick={addIngredient}
              className="flex items-center gap-2 text-sm font-semibold text-[#2E7D32] dark:text-[#81C784] hover:text-[#0D3B2A] dark:hover:text-[#faf7f0] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Ingredient
            </button>
          </div>

          {/* ── Sidebar ──────────────────────────────────────── */}
          <div className="space-y-6 lg:sticky lg:top-24">

            {/* Add another recipe */}
            <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-3">
                Add Another Recipe
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Search recipes…"
                  className="w-full text-sm bg-white dark:bg-gray-800 text-[#333333] dark:text-white rounded-lg px-3 py-2 outline-none border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#F4C430]/50 placeholder-gray-400 dark:placeholder-gray-400"
                />
              </div>
              {searchResults.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => addRecipeToBuilder(r.slug)}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[#F5F0E6] dark:hover:bg-[#374151] text-forest-green dark:text-[#faf7f0] transition-colors"
                      >
                        {r.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {recipeSearch && searchResults.length === 0 && (
                <p className="mt-2 text-xs text-charcoal/40 dark:text-[#9ca3af]">No matching recipes found.</p>
              )}
              {!recipeSearch && allDefaultRecipes.filter((r) => !baseRecipes.some((b) => b.id === r.id)).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {allDefaultRecipes
                    .filter((r) => !baseRecipes.some((b) => b.id === r.id))
                    .map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => addRecipeToBuilder(r.slug)}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[#F5F0E6] dark:hover:bg-[#374151] text-charcoal/70 dark:text-[#d1d5db] transition-colors"
                        >
                          {r.title}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Shopping summary */}
            <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-3">
                Shopping Summary
              </p>
              <p className="text-sm text-charcoal/70 dark:text-[#d1d5db] mb-1">
                {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
              </p>
              {ingredients.filter((i) => i.productId).length > 0 && (
                <p className="text-xs text-[#2E7D32] dark:text-[#81C784] mb-4">
                  {ingredients.filter((i) => i.productId).length} available on Legit Organic
                </p>
              )}
              <button
                onClick={handleOrderAllIngredients}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] transition-colors text-sm"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Order All Ingredients
              </button>
            </div>

            <Link
              href="/recipes"
              className="block text-center text-sm text-charcoal/50 dark:text-[#9ca3af] hover:text-charcoal dark:hover:text-[#d1d5db] transition-colors"
            >
              ← Back to Recipes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ingredient row sub-component
// ---------------------------------------------------------------------------

interface IngredientRowProps {
  ing: BuilderIngredient
  isFirst: boolean
  isLast: boolean
  onChange: (field: keyof BuilderIngredient, value: string) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onLinkProduct: (productId: number, productName: string, productSlug: string) => void
  onUnlinkProduct: () => void
}

function IngredientRow({ ing, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown, onLinkProduct, onUnlinkProduct }: IngredientRowProps) {
  const [showNotes, setShowNotes] = useState(!!ing.notes)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const inputBase = 'bg-[#F5F0E6] dark:bg-gray-700 text-charcoal dark:text-white rounded-lg px-3 py-2 text-sm outline-none border border-transparent dark:border-gray-600 focus:ring-2 focus:ring-[#F4C430]/50 placeholder:text-gray-400 dark:placeholder:text-gray-500'

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleNameChange(value: string) {
    onChange('name', value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    // Don't search when a product is already linked
    if (ing.productId) return
    if (!value.trim() || value.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await api.products.search(value)
        const results = data.results.slice(0, 5)
        setSearchResults(results)
        setShowDropdown(results.length > 0)
      } catch {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)
  }

  function handleSelectProduct(product: Product) {
    onChange('name', product.name)
    onLinkProduct(product.id, product.name, product.slug)
    setShowDropdown(false)
    setSearchResults([])
  }

  return (
    <div
      ref={containerRef}
      className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-xl p-4 group"
    >
      <div className="flex items-center gap-2">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-charcoal/30 hover:text-charcoal/70 dark:hover:text-[#d1d5db] disabled:opacity-20 transition-colors leading-none"
            aria-label="Move up"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-charcoal/30 hover:text-charcoal/70 dark:hover:text-[#d1d5db] disabled:opacity-20 transition-colors leading-none"
            aria-label="Move down"
          >
            ▼
          </button>
        </div>

        {/* Name input + search dropdown */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={ing.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ingredient name"
            className={`${inputBase} w-full`}
          />
          {showDropdown && searchResults.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-[#E6D8BD] dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((product) => {
                const imgSrc = product.images && product.images.length > 0
                  ? getMediaUrl(product.images[0].image)
                  : getMediaUrl(product.image)
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(product) }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-[#F5F0E6] dark:hover:bg-gray-700 cursor-pointer text-left transition-colors"
                    >
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt={product.name} className="w-8 h-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-[#F5F0E6] dark:bg-gray-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#0D3B2A] dark:text-[#faf7f0] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#2E7D32] dark:text-[#81C784]">
                          GH₵ {product.price} · {product.unit}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Quantity */}
        <input
          type="text"
          inputMode="decimal"
          value={ing.quantity}
          onChange={(e) => onChange('quantity', e.target.value)}
          placeholder="Qty"
          className={`${inputBase} w-20 shrink-0 text-center`}
        />

        {/* Unit */}
        <select
          value={ing.unit}
          onChange={(e) => onChange('unit', e.target.value)}
          className={`${inputBase} w-24 shrink-0`}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="text-xs text-charcoal/40 dark:text-[#9ca3af] hover:text-charcoal/70 dark:hover:text-[#d1d5db] transition-colors shrink-0 hidden sm:block"
          title="Toggle notes"
        >
          {showNotes ? 'hide notes' : 'notes'}
        </button>

        {/* Delete */}
        <button
          onClick={onRemove}
          className="text-charcoal/30 hover:text-red-500 transition-colors shrink-0 text-lg leading-none"
          aria-label="Remove ingredient"
        >
          ×
        </button>
      </div>

      {/* Linked product badge + Buy button */}
      {ing.productSlug && (
        <div className="mt-2 ml-10 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-[#2E7D32] dark:text-[#81C784] bg-[#2E7D32]/10 px-2 py-0.5 rounded-full">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            {ing.productName}
            <button
              type="button"
              onClick={onUnlinkProduct}
              className="ml-0.5 hover:text-red-500 transition-colors leading-none"
              aria-label="Unlink product"
            >
              ×
            </button>
          </span>
          <a
            href={`/products/${ing.productSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs px-2 py-1 rounded-lg bg-[#0D3B2A] text-[#F4C430] hover:bg-[#2E7D32] transition-colors whitespace-nowrap"
          >
            Buy →
          </a>
        </div>
      )}

      {/* Notes */}
      {showNotes && (
        <div className="mt-2 ml-10">
          <input
            type="text"
            value={ing.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Optional notes (e.g. finely chopped)"
            className={`${inputBase} w-full`}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page export (wraps in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function RecipeBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#111827] flex items-center justify-center">
        <span className="text-charcoal/40 dark:text-[#9ca3af]">Loading builder…</span>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  )
}
