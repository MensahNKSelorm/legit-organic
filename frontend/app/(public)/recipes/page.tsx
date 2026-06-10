export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Link from 'next/link'
import type { Recipe } from '@/types'

const INTERNAL_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import RecipeCard from '@/components/recipes/RecipeCard'

export const metadata: Metadata = {
  title: 'Recipes — Traditional Ghanaian Cuisine with Organic Ingredients',
  description:
    'Discover authentic Ghanaian recipes made with certified organic ingredients. From Jollof Rice to Fufu — real food, the way it should taste.',
}

export default async function RecipesPage() {
  const recipes: Recipe[] = await fetch(`${INTERNAL_API}/api/recipes/default/`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 0 },
  }).then(r => r.ok ? r.json() : []).catch(() => [])

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '9rem', paddingBottom: '5rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-xs font-bold uppercase tracking-widest">
            FROM OUR KITCHEN
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-5">
            Recipes &amp; Meal Ideas
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Curated Ghanaian recipes using our organic ingredients — cook better, eat better.
          </p>
          <Link
            href="/recipes/builder"
            className="inline-flex items-center gap-2 bg-[#F4C430] text-[#0D3B2A] font-semibold px-7 py-3 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Build Your Own Recipe
          </Link>
        </div>
      </div>

      {/* ── Recipes grid ─────────────────────────────────────── */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-charcoal/40 dark:text-[#9ca3af] text-lg mb-6">
              Recipes coming soon — check back shortly.
            </p>
            <Link
              href="/recipes/builder"
              className="inline-block bg-[#F4C430] text-[#0D3B2A] font-semibold px-7 py-3 rounded-xl hover:bg-[#c59f2c] transition-colors text-sm"
            >
              Build Your Own Recipe
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
