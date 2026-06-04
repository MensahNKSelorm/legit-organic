import Link from 'next/link'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

const difficultyLabel: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Advanced',
}

const difficultyColor: Record<string, string> = {
  easy: 'text-leaf-green bg-leaf-green/10',
  medium: 'text-ghana-gold bg-ghana-gold/10',
  hard: 'text-earth-brown bg-earth-brown/10',
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const label = difficultyLabel[recipe.difficulty] ?? recipe.difficulty
  const colorClass = difficultyColor[recipe.difficulty] ?? 'text-charcoal/60 bg-charcoal/10'

  return (
    <article className="group bg-mist-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-sand flex flex-col">
      {/* Cover */}
      <div className="h-52 bg-gradient-to-br from-earth-brown/10 to-ghana-gold/20 flex items-center justify-center relative overflow-hidden">
        <span className="text-7xl">🍲</span>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-green/30 to-transparent" />
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${colorClass}`}
        >
          {label}
        </span>
      </div>

      {/* Body */}
      <div className="p-8 flex flex-col flex-1">
        <Link href={`/recipes/${recipe.slug}`}>
          <h3 className="font-display text-xl font-bold text-forest-green mb-2 group-hover:text-leaf-green transition-colors">
            {recipe.title}
          </h3>
        </Link>

        <p className="text-charcoal/70 text-sm leading-relaxed line-clamp-3 flex-1 mb-5">
          {recipe.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 border-t border-sand pt-4 text-xs text-charcoal/60">
          <span className="flex items-center gap-1">
            <span>⏱</span>
            {recipe.prep_time + recipe.cook_time} min
          </span>
          <span className="flex items-center gap-1">
            <span>👥</span>
            {recipe.servings} servings
          </span>
        </div>
      </div>
    </article>
  )
}
