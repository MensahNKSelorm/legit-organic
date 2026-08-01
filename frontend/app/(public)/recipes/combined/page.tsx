export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Recipe, RecipeWithPairings } from '@/types'
import { getMediaUrl } from '@/lib/media'

const INTERNAL_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

type Props = { searchParams: Promise<{ q?: string }> }

type DemoRecipe = {
  title: string
  slug: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  image: string
  ingredients: string[]
  steps: string[]
}

const demoRecipes: DemoRecipe[] = [
  { title: 'Fufu', slug: 'fufu', description: 'Pounded cassava and plantain with a smooth, elastic finish.', prepTime: 20, cookTime: 30, servings: 4, image: '/images/hero/4.webp', ingredients: ['Cassava', 'Green plantain', 'Water'], steps: ['Peel and cut the cassava and plantain.', 'Boil until completely tender.', 'Pound and turn until smooth and elastic.'] },
  { title: 'Light soup', slug: 'light-soup', description: 'A clear, peppery tomato soup made for pairing with a swallow.', prepTime: 20, cookTime: 40, servings: 4, image: '/images/hero/8.webp', ingredients: ['Tomatoes', 'Onion', 'Fresh pepper', 'Ginger', 'Protein of choice'], steps: ['Season and gently cook the protein.', 'Blend the tomatoes, onion, pepper and ginger.', 'Add the blended base and simmer until light, fragrant and fully cooked.'] },
  { title: 'Groundnut soup', slug: 'groundnut-soup', description: 'Groundnut paste simmered with tomato, aromatics and your chosen protein.', prepTime: 20, cookTime: 55, servings: 4, image: '/images/hero/6.webp', ingredients: ['Groundnut paste', 'Tomatoes', 'Onion', 'Pepper', 'Protein of choice'], steps: ['Cook the seasoned protein with onion.', 'Loosen and cook the groundnut paste until glossy.', 'Add the tomato base and simmer everything together.'] },
  { title: 'Palm nut soup', slug: 'palm-nut-soup', description: 'A deeply flavoured soup built from palm fruit concentrate and spices.', prepTime: 25, cookTime: 65, servings: 4, image: '/images/hero/7.webp', ingredients: ['Palm fruit concentrate', 'Tomatoes', 'Onion', 'Pepper', 'Protein of choice'], steps: ['Season and cook the protein.', 'Add palm fruit concentrate and enough water.', 'Simmer with tomato, onion and pepper until rich.'] },
  { title: 'Ebunebunu soup', slug: 'ebunebunu-soup', description: 'A green soup of cocoyam leaves, herbs and warming pepper.', prepTime: 20, cookTime: 35, servings: 4, image: '/images/hero/3.webp', ingredients: ['Cocoyam leaves', 'Onion', 'Pepper', 'Smoked fish'], steps: ['Wash and cook the leaves until tender.', 'Blend the leaves with onion and pepper.', 'Simmer with smoked fish and adjust the seasoning.'] },
  { title: 'Kontomire stew', slug: 'kontomire-stew', description: 'Cocoyam leaves cooked down with egusi, tomato and aromatics.', prepTime: 20, cookTime: 30, servings: 4, image: '/images/hero/9.webp', ingredients: ['Kontomire', 'Egusi', 'Tomatoes', 'Onion', 'Palm oil'], steps: ['Cook and chop the kontomire.', 'Build the tomato, onion and palm oil base.', 'Fold in egusi and kontomire, then simmer gently.'] },
  { title: 'Plain rice', slug: 'plain-rice', description: 'Separate, tender grains ready for stew, soup or sauce.', prepTime: 5, cookTime: 25, servings: 4, image: '/images/products/p1.webp', ingredients: ['Rice', 'Water', 'Salt'], steps: ['Rinse the rice until the water is mostly clear.', 'Cook with measured water and salt.', 'Rest covered, then fluff before serving.'] },
  { title: 'Garden egg stew', slug: 'garden-egg-stew', description: 'Slow-cooked garden eggs, tomato and smoked fish.', prepTime: 15, cookTime: 30, servings: 4, image: '/images/products/p2.webp', ingredients: ['Garden eggs', 'Tomatoes', 'Onion', 'Pepper', 'Smoked fish'], steps: ['Boil and mash the garden eggs.', 'Cook the tomato, onion and pepper base.', 'Add fish and garden eggs, then simmer together.'] },
]

const clean = (value: string) => value.replace(/<[^>]*>/g, '').trim()
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

async function getRecipes(query: string): Promise<RecipeWithPairings[]> {
  const terms = query.split('+').map(term => term.trim()).filter(Boolean)
  const results: Recipe[] = await fetch(`${INTERNAL_API}/api/recipes/default/?search=${encodeURIComponent(query)}`, { next: { revalidate: 0 } })
    .then(response => response.ok ? response.json() : [])
    .catch(() => [])

  const selected = terms.map(term => {
    const needle = normalise(term)
    return results.find(recipe => normalise(recipe.title) === needle)
      || results.find(recipe => normalise(recipe.title).includes(needle))
  }).filter((recipe): recipe is Recipe => Boolean(recipe))

  return Promise.all(selected.map(recipe =>
    fetch(`${INTERNAL_API}/api/recipes/${recipe.slug}/`, { next: { revalidate: 0 } })
      .then(response => response.ok ? response.json() : null)
  )).then(items => items.filter((recipe): recipe is RecipeWithPairings => Boolean(recipe)))
}

export default async function CombinedRecipePage({ searchParams }: Props) {
  const { q: rawQuery } = await searchParams
  const query = rawQuery?.trim().slice(0, 200) || ''
  if (!query) notFound()

  const realRecipes = await getRecipes(query)
  const terms = query.split('+').map(term => term.trim()).filter(Boolean)
  const demos = realRecipes.length === 0
    ? terms.map(term => demoRecipes.find(recipe => normalise(recipe.title) === normalise(term))).filter((recipe): recipe is DemoRecipe => Boolean(recipe))
    : []

  const recipes = realRecipes.length ? realRecipes.map(recipe => ({
    title: recipe.title, slug: recipe.slug, description: clean(recipe.description), prepTime: recipe.prep_time, cookTime: recipe.cook_time, servings: recipe.servings,
    image: getMediaUrl(recipe.cover_image) || '/images/hero/8.webp',
    ingredients: recipe.ingredients.map(ingredient => `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ''} ${ingredient.name}`),
    steps: recipe.steps.map(step => clean(step.instruction)),
  })) : demos

  if (!recipes.length || recipes.length !== terms.length) notFound()

  const title = recipes.map(recipe => recipe.title).join(' + ')
  const totalPrep = recipes.reduce((sum, recipe) => sum + recipe.prepTime, 0)
  const totalCook = Math.max(...recipes.map(recipe => recipe.cookTime))
  const servings = Math.min(...recipes.map(recipe => recipe.servings))

  return (
    <main className="min-h-screen bg-[#FAF7F0] pt-[76px] text-[#0D3B2A] dark:bg-[#171B18] dark:text-white">
      <header className="grid min-h-[62vh] bg-[#0D3B2A] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative min-h-[42vh] overflow-hidden">
          <Image src={recipes[0].image} alt={title} fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 45vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="flex items-center px-6 py-14 text-white md:px-12 lg:px-16">
          <div>
            <Link href="/recipes" className="border-b border-white/50 pb-1 text-sm">Back to the recipe shelf</Link>
            <p className="mt-10 text-sm font-bold text-[#F4C430]">Your combined plate</p>
            <h1 className="display-organic mt-4 max-w-3xl text-5xl leading-[.95] md:text-7xl">{title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/75">One meal, with every component kept clear. Prepare each part from its own list, then bring them together at the table.</p>
            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/25 pt-5 text-sm">
              <div><dt className="text-white/55">Prep</dt><dd className="font-bold">{totalPrep} min</dd></div>
              <div><dt className="text-white/55">Cooking window</dt><dd className="font-bold">about {totalCook} min</dd></div>
              <div><dt className="text-white/55">Serves</dt><dd className="font-bold">{servings}</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <div className="page-container py-14 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <section>
            <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">Everything you need</p>
            <h2 className="display-organic mt-3 text-5xl">Ingredients, kept in their place.</h2>
            <div className="mt-10 space-y-10">
              {recipes.map(recipe => <div key={recipe.slug} className="border-t editorial-rule pt-5"><h3 className="display-organic text-3xl">For the {recipe.title}</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">{recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul></div>)}
            </div>
          </section>
          <section>
            <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">Cook the plate</p>
            <h2 className="display-organic mt-3 text-5xl">Make each part. Meet at the table.</h2>
            <div className="mt-10 space-y-12">
              {recipes.map(recipe => <div key={recipe.slug} className="border-t editorial-rule pt-6"><div className="flex items-baseline justify-between gap-5"><h3 className="display-organic text-3xl">{recipe.title}</h3><span className="text-xs font-bold text-[#5B3E31] dark:text-[#B8D4BD]">{recipe.prepTime + recipe.cookTime} min</span></div><ol className="mt-6 space-y-5">{recipe.steps.map((step, index) => <li key={`${recipe.slug}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-7"><span className="font-bold text-[#2E7D32] dark:text-[#F4C430]">{index + 1}</span><span className="text-[#5B3E31] dark:text-[#B8D4BD]">{step}</span></li>)}</ol></div>)}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
