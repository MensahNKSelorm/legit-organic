import Link from 'next/link'
import Image from 'next/image'
import type { Recipe } from '@/types'
import { getMediaUrl } from '@/lib/media'

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

const difficultyConfig: Record<string, { label: string; classes: string }> = {
  easy:   { label: 'Easy',     classes: 'text-[#2E7D32] bg-[#2E7D32]/10' },
  medium: { label: 'Medium',   classes: 'text-[#F4C430] bg-[#F4C430]/10' },
  hard:   { label: 'Advanced', classes: 'text-red-600 bg-red-600/10' },
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const diff = difficultyConfig[recipe.difficulty] ?? { label: recipe.difficulty, classes: 'text-charcoal/60 bg-charcoal/10' }
  const coverSrc = getMediaUrl(recipe.cover_image)
  const totalTime = recipe.prep_time + recipe.cook_time

  return (
    <article className="group bg-mist-white dark:bg-[#1f2937] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-sand dark:border-[#374151] flex flex-col">
      {/* Cover */}
      <div className="relative h-52 overflow-hidden shrink-0">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-earth-brown/10 to-ghana-gold/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#5B3E31" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-green/20 to-transparent" />
        <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${diff.classes}`}>
          {diff.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <Link href={`/recipes/${recipe.slug}`}>
          <h3 className="font-display text-xl font-bold text-forest-green dark:text-[#faf7f0] mb-2 group-hover:text-leaf-green dark:group-hover:text-[#81C784] transition-colors line-clamp-2">
            {recipe.title}
          </h3>
        </Link>

        <p className="text-charcoal/70 dark:text-[#d1d5db] text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
          {stripHtml(recipe.description)}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 border-t border-sand dark:border-[#374151] pt-4 text-xs text-charcoal/60 dark:text-[#9ca3af] mb-4">
          <span>
            {recipe.prep_time > 0 && recipe.cook_time > 0
              ? `${formatTime(recipe.prep_time)} prep · ${formatTime(recipe.cook_time)} cook`
              : `${formatTime(totalTime)} total`}
          </span>
          <span>·</span>
          <span>{recipe.servings} servings</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C] transition-colors whitespace-nowrap"
          >
            View Recipe
          </Link>
          <Link
            href={`/recipes/builder?base=${recipe.slug}`}
            className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-[#F4C430] text-[#0D3B2A] dark:text-[#F4C430] hover:bg-[#F4C430]/20 transition-colors whitespace-nowrap"
          >
            Customise
          </Link>
        </div>
      </div>
    </article>
  )
}
