import Link from 'next/link'
import SectionWrapper from '@/components/ui/SectionWrapper'
import RecipeCard from '@/components/recipes/RecipeCard'
import type { Recipe } from '@/types'

interface RecipesTeaserProps {
  recipes: Recipe[]
}

export default function RecipesTeaser({ recipes }: RecipesTeaserProps) {
  return (
    <SectionWrapper id="recipes" background="cream">
      <div className="text-center mb-14">
        <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
          In the Kitchen
        </span>
        <h2 className="font-display text-4xl font-bold text-forest-green mt-3 mb-5">
          Recipes With Organic Ingredients
        </h2>
        <p className="text-charcoal/70 text-lg leading-relaxed max-w-xl mx-auto">
          Discover traditional Ghanaian recipes reimagined with purely organic ingredients.
          Simple, nourishing, and deeply rooted in culture.
        </p>
      </div>

      {recipes.length === 0 ? (
        <p className="text-center text-charcoal/50 py-12">No recipes available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 text-[#2E7D32] dark:text-[#81C784] font-semibold border-b-2 border-[#F4C430] pb-0.5 hover:text-[#0D3B2A] dark:hover:text-white transition-colors text-lg"
        >
          See All Recipes
          <span aria-hidden>→</span>
        </Link>
      </div>
    </SectionWrapper>
  )
}
