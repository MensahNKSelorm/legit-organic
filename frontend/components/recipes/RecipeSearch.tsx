'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { normaliseRecipeText, parseRecipeDraft } from '@/lib/recipe-query'

type Suggestion = { title: string }

export default function RecipeSearch({ recipes, initialQuery = '' }: { recipes: Suggestion[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [focused, setFocused] = useState(false)

  const options = useMemo(() => {
    if (!query.trim()) return []
    const catalogue = recipes.map(recipe => recipe.title)
    const { selected: earlier, fragment: current } = parseRecipeDraft(query, catalogue)
    const matches = recipes
      .filter(recipe => !earlier.some(title => normaliseRecipeText(title) === normaliseRecipeText(recipe.title)))
      .filter(recipe => !current || normaliseRecipeText(recipe.title).includes(normaliseRecipeText(current)))
      .slice(0, 6)

    return matches.map(recipe => {
      const titles = [...earlier, recipe.title]
      const combined = titles.length > 1
      const label = titles.join(' + ')
      return {
        label,
        note: combined ? 'Open as one combined meal' : 'Open this recipe',
        href: combined
          ? `/recipes/combined?q=${encodeURIComponent(label)}`
          : `/recipes?q=${encodeURIComponent(recipe.title)}`,
      }
    })
  }, [query, recipes])

  return (
    <form action="/recipes" method="get" className="relative mb-12 border-y editorial-rule py-5 lg:mb-16">
      <label htmlFor="recipe-search" className="block text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">Find a recipe or build a plate</label>
      <div className="mt-3 flex items-end gap-3">
        <input
          id="recipe-search"
          name="q"
          type="search"
          autoComplete="off"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder="Try fufu light soup, fufu + light soup, or use a comma"
          className="min-w-0 flex-1 border-0 border-b-2 border-[#0D3B2A] bg-transparent px-0 py-3 text-xl text-[#0D3B2A] placeholder:text-[#0D3B2A]/35 focus:border-[#2E7D32] focus:outline-none dark:border-white dark:text-white dark:placeholder:text-white/35 md:text-2xl"
        />
        <button type="submit" className="shrink-0 bg-[#F4C430] px-6 py-3.5 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white dark:hover:bg-white dark:hover:text-[#0D3B2A]">Search</button>
      </div>

      {focused && options.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%-1.25rem)] z-30 border border-[#0D3B2A]/20 bg-[#FAF7F0] shadow-xl dark:border-white/15 dark:bg-[#202720]">
          {options.map(option => (
            <Link key={option.href} href={option.href} className="flex items-center justify-between gap-5 border-b border-[#0D3B2A]/10 px-5 py-4 last:border-0 hover:bg-[#F4C430]/20 dark:border-white/10">
              <span className="display-organic text-xl text-[#0D3B2A] dark:text-white">{option.label}</span>
              <span className="text-xs font-bold text-[#5B3E31] dark:text-[#B8D4BD]">{option.note} ↗</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#5B3E31] dark:text-[#B8D4BD]">
        <span>Try:</span>
        <Link href="/recipes?q=fufu" className="border-b border-current">fufu</Link>
        <Link href="/recipes/combined?q=fufu%20%2B%20light%20soup" className="border-b border-current">fufu + light soup</Link>
        <Link href="/recipes/combined?q=plain%20rice%20%2B%20kontomire%20stew" className="border-b border-current">rice + kontomire stew</Link>
      </div>
    </form>
  )
}
