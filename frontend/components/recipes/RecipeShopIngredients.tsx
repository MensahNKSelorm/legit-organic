'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/lib/cart'
import type { IngredientProduct, Product, RecipeIngredient } from '@/types'

function asCartProduct(product: IngredientProduct): Product {
  return {
    ...product,
    description: '', region: null,
    category: { id: 0, name: 'Recipe ingredient', slug: 'recipe-ingredient', description: '', image: null },
    badge: null, is_featured: false, created_at: '', updated_at: '',
  }
}

function productOptions(ingredient: RecipeIngredient) {
  const options = [ingredient.product, ...ingredient.matched_products]
    .filter((product): product is IngredientProduct => Boolean(product?.is_available))
  return options.filter((product, index) => options.findIndex((item) => item.id === product.id) === index)
}

export default function RecipeShopIngredients({ ingredients }: { ingredients: RecipeIngredient[] }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState<number[]>([])
  const [selected, setSelected] = useState<Record<number, number>>(() => Object.fromEntries(
    ingredients.map((ingredient) => [ingredient.id, productOptions(ingredient)[0]?.id]).filter(([, id]) => id),
  ))
  const shoppable = useMemo(
    () => ingredients.map((ingredient) => {
      const options = productOptions(ingredient)
      return {
        ingredient, options,
        product: options.find((option) => option.id === selected[ingredient.id]) || options[0] || null,
      }
    }),
    [ingredients, selected],
  )
  const available = shoppable.filter((item) => item.product)

  const add = (product: IngredientProduct) => {
    addItem(asCartProduct(product), 1)
    setAdded((current) => current.includes(product.id) ? current : [...current, product.id])
  }

  const addAll = () => {
    const unique = new Map<number, IngredientProduct>()
    available.forEach(({ product }) => product && unique.set(product.id, product))
    unique.forEach(add)
  }

  return (
    <section className="border-y border-[#0D3B2A]/20 py-7 dark:border-white/15">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#2E7D32] dark:text-[#9FC5A4]">
            From the Market
          </p>
          <h2 className="display-organic mt-2 text-3xl text-[#0D3B2A] dark:text-white">
            Shop what is available
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">
            Recipe quantities are cooking guidance. Market items are added as one purchasable pack each.
          </p>
        </div>
        {available.length > 0 && (
          <button onClick={addAll} className="inline-flex items-center gap-2 bg-[#F4C430] px-5 py-3 text-sm font-bold text-[#0D3B2A] transition-transform hover:-translate-y-0.5">
            <span aria-hidden="true">＋</span> Add available ingredients
          </button>
        )}
      </div>
      <div className="mt-7 divide-y divide-[#0D3B2A]/12 dark:divide-white/10">
        {shoppable.map(({ ingredient, options, product }) => (
          <div key={ingredient.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-semibold text-[#0D3B2A] dark:text-[#F8F4EA]">
                {ingredient.quantity} {ingredient.unit} {ingredient.name}
                {ingredient.optional ? <span className="ml-2 text-xs font-normal opacity-60">optional</span> : null}
              </p>
              {options.length > 1 ? (
                <label className="mt-2 block text-xs text-[#5B3E31] dark:text-[#B8D4BD]">
                  Choose a Market item
                  <select
                    value={product?.id || ''}
                    onChange={(event) => setSelected((current) => ({
                      ...current, [ingredient.id]: Number(event.target.value),
                    }))}
                    className="mt-1 block max-w-full border border-[#0D3B2A]/20 bg-transparent px-3 py-2 text-sm text-[#0D3B2A] dark:border-white/20 dark:text-white"
                  >
                    {options.map((option) => (
                      <option key={option.id} value={option.id} className="text-black">
                        {option.name} · GHS {option.price} / {option.unit}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-1 text-xs text-[#5B3E31]/75 dark:text-[#B8D4BD]">
                  {product ? `${product.name} · GHS ${product.price} / ${product.unit}` : 'Not currently matched to an available Market item'}
                </p>
              )}
            </div>
            {product ? (
              <button onClick={() => add(product)} className="inline-flex w-fit items-center gap-2 border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">
                {added.includes(product.id) ? <>✓ Added</> : 'Add one pack'}
              </button>
            ) : (
              <span className="text-xs font-semibold text-[#5B3E31]/55 dark:text-white/45">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
