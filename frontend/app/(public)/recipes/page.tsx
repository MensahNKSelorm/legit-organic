export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Recipe } from '@/types'

const INTERNAL_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import RecipeCard from '@/components/recipes/RecipeCard'

export const metadata: Metadata = {
  title: 'Recipes — Traditional Ghanaian Cuisine with Organic Ingredients',
  description:
    'Ghanaian recipes, seasonal ideas and practical ways to cook with what is fresh.',
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function RecipesPage({ searchParams }: Props) {
  const { q: rawQuery } = await searchParams
  const query = rawQuery?.trim().slice(0, 200) || ''
  if (query.includes('+')) {
    redirect(`/recipes/combined?q=${encodeURIComponent(query)}`)
  }
  const recipes: Recipe[] = await fetch(`${INTERNAL_API}/api/recipes/default/${query ? `?search=${encodeURIComponent(query)}` : ''}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 0 },
  }).then(r => r.ok ? r.json() : []).catch(() => [])

  const demoCatalogue = [
    { title: 'Fufu', note: 'Pounded cassava and plantain with a smooth, elastic finish.', time: '50 minutes', image: '/images/hero/4.webp' },
    { title: 'Light soup', note: 'A clear, peppery tomato soup made for pairing with a swallow.', time: '1 hour', image: '/images/hero/8.webp' },
    { title: 'Groundnut soup', note: 'Groundnut paste simmered with tomato, aromatics and your chosen protein.', time: '1 hour 15 minutes', image: '/images/hero/6.webp' },
    { title: 'Palm nut soup', note: 'A deeply flavoured soup built from palm fruit concentrate and spices.', time: '1 hour 30 minutes', image: '/images/hero/7.webp' },
    { title: 'Ebunebunu soup', note: 'A green soup of cocoyam leaves, herbs and warming pepper.', time: '55 minutes', image: '/images/hero/3.webp' },
    { title: 'Kontomire stew', note: 'Cocoyam leaves cooked down with egusi, tomato and aromatics.', time: '50 minutes', image: '/images/hero/9.webp' },
    { title: 'Plain rice', note: 'Separate, tender grains ready for stew, soup or sauce.', time: '30 minutes', image: '/images/products/p1.webp' },
    { title: 'Garden egg stew', note: 'Slow-cooked garden eggs, tomato and smoked fish.', time: '45 minutes', image: '/images/products/p2.webp' },
  ]
  const queryTerms = query.toLowerCase().split('+').map(term => term.trim()).filter(Boolean)
  const previewRecipes = recipes.length === 0
    ? demoCatalogue.filter(recipe => !queryTerms.length || queryTerms.some(term => `${recipe.title} ${recipe.note}`.toLowerCase().includes(term)))
    : []

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">
      <header className="grid min-h-[78svh] overflow-hidden bg-[#0D3B2A] pt-[76px] lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative min-h-[48vh] lg:min-h-0">
          <Image src="/images/hero/8.webp" alt="A Ghanaian dish being prepared with fresh ingredients" fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 54vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <p className="absolute bottom-7 left-6 max-w-sm text-sm leading-6 text-white/85 md:bottom-10 md:left-10">Keep the recipes that worked. Change the ones that did not. Cook them again until they feel like yours.</p>
        </div>
        <div className="flex items-center bg-[#F4C430] px-6 py-14 text-[#0D3B2A] md:px-12 lg:px-16">
          <div>
            <p className="text-sm font-bold">The kitchen notebook</p>
            <h1 className="display-organic mt-8 text-6xl leading-[.88] md:text-8xl">Cook it.<br /><em className="font-normal">Taste it.</em><br />Write it down.</h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-[#274C3D]">Ghanaian recipes, seasonal ideas and useful ways to make more of what is fresh.</p>
          </div>
        </div>
      </header>

      {/* ── Recipes grid ─────────────────────────────────────── */}
      <div className="page-container py-12 lg:py-20">
        <form action="/recipes" method="get" className="mb-12 border-y editorial-rule py-5 lg:mb-16">
          <label htmlFor="recipe-search" className="block text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">Find a recipe or build a plate</label>
          <div className="mt-3 flex items-end gap-3">
            <input id="recipe-search" name="q" type="search" defaultValue={query} placeholder="Try fufu + light soup" className="min-w-0 flex-1 border-0 border-b-2 border-[#0D3B2A] bg-transparent px-0 py-3 text-xl text-[#0D3B2A] placeholder:text-[#0D3B2A]/35 focus:border-[#2E7D32] focus:outline-none dark:border-white dark:text-white dark:placeholder:text-white/35 md:text-2xl" />
            <button type="submit" className="shrink-0 bg-[#F4C430] px-6 py-3.5 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white dark:hover:bg-white dark:hover:text-[#0D3B2A]">Search</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#5B3E31] dark:text-[#B8D4BD]">
            <span>Try:</span>
            <Link href={{ pathname: '/recipes', query: { q: 'fufu' } }} className="border-b border-current">fufu</Link>
            <Link href={{ pathname: '/recipes', query: { q: 'fufu + light soup' } }} className="border-b border-current">fufu + light soup</Link>
            <Link href={{ pathname: '/recipes', query: { q: 'rice + kontomire stew' } }} className="border-b border-current">rice + kontomire stew</Link>
          </div>
        </form>
        {recipes.length > 0 ? (
          <>
            <div className="mb-10 border-b editorial-rule pb-5">
              <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">{query ? 'Search results' : 'The recipe shelf'}</p>
              <h2 className="display-organic mt-2 text-4xl text-[#0D3B2A] dark:text-white md:text-5xl">{query ? <>Recipes for <em className="font-normal">“{query}”</em>.</> : 'Cook one part. Pair it with another.'}</h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
            </div>
          </>
        ) : previewRecipes.length > 0 ? (
          <>
            <div className="mb-10 flex items-end justify-between border-b editorial-rule pb-5">
              <div><p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">{query ? 'Search results' : 'The recipe shelf'}</p><h2 className="display-organic mt-2 text-4xl text-[#0D3B2A] dark:text-white md:text-5xl">{query ? <>What goes into <em className="font-normal">“{query}”</em>.</> : 'Cook one part. Pair it with another.'}</h2></div>
              {query && <Link href="/recipes" className="hidden border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430] md:block">Clear search</Link>}
            </div>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {previewRecipes.map((recipe, index) => (
                <Link href={`/recipes/combined?q=${encodeURIComponent(recipe.title)}`} key={recipe.title} className="group block border-b editorial-rule pb-6" aria-label={`Open ${recipe.title} recipe`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={recipe.image} alt="" fill priority={index === 0} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width:1024px) 100vw, 40vw" />
                  </div>
                  <p className="mt-5 text-xs font-bold text-[#2E7D32] dark:text-[#9FC5A4]">{recipe.time}</p>
                  <h3 className="display-organic mt-2 text-3xl text-[#0D3B2A] dark:text-white">{recipe.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">{recipe.note}</p>
                  <span className="mt-5 inline-block border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">Open recipe ↗</span>
                </Link>
              ))}
            </div>
          </>
        ) : query ? (
          <div className="border-y editorial-rule py-12"><h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-white">Nothing matched “{query}” yet.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">Try one component at a time, or browse the full recipe shelf.</p><Link href="/recipes" className="mt-7 inline-flex border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">Clear search</Link></div>
        ) : (
          <div className="grid border-y editorial-rule py-12 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
            <div><h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-white">The first recipes are being tested.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">Until they are ready, turn the ingredients already in your kitchen into a practical starting point.</p></div>
            <Link href="/recipes/builder" className="mt-7 w-fit border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430] md:mt-0">Open the recipe builder ↗</Link>
          </div>
        )}
      </div>
    </div>
  )
}
