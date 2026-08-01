import Link from 'next/link'
import Image from 'next/image'
import type { Recipe } from '@/types'
import { getMediaUrl } from '@/lib/media'

interface RecipesTeaserProps { recipes: Recipe[] }

const DEMO_RECIPE: Recipe = {
  id: -1,
  title: 'Fragrant Ghanaian Rice Bowl',
  slug: 'preview-rice-bowl',
  description: 'A simple bowl built around fragrant local rice, garden vegetables and fresh herbs.',
  cover_image: '/images/products/p1.webp',
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  difficulty: 'easy',
  is_default: true,
  created_at: '',
}

export default function RecipesTeaser({ recipes }: RecipesTeaserProps) {
  const usingDemo = recipes.length === 0 && process.env.NODE_ENV === 'development'
  const featured = recipes[0] || (usingDemo ? DEMO_RECIPE : undefined)
  const cover = featured ? getMediaUrl(featured.cover_image, '/images/products/p1.webp') : '/images/products/p1.webp'

  return (
    <section id="recipes" className="bg-[#f4c430] py-6 md:py-10">
      <div className="page-container">
        <div className="grid overflow-hidden bg-[#faf7f0] dark:bg-[#202621] lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative min-h-[480px] lg:min-h-[650px]">
            <Image src={cover} alt={featured?.title || 'A nourishing Ghanaian meal'} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 max-w-xs text-sm leading-6 text-white/80 md:bottom-10 md:left-10">Good ingredients do not need complicated treatment. Start with what is fresh, then let the food speak.</p>
          </div>
          <div className="flex flex-col justify-between p-8 md:p-14 lg:p-16">
            <div>
            <p className="font-medium text-[#2e7d32]">Cook with what is growing now.</p>
              <h2 className="display-organic mt-7 text-5xl leading-[.92] text-[#0d3b2a] dark:text-[#FEFCF7] md:text-7xl">A better meal begins at the <em className="font-normal">market.</em></h2>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#5b3e31] dark:text-[#B8D4BD]">Explore Ghanaian recipes built around fresh produce, familiar flavours and ingredients you can order directly.</p>
            </div>

            <div className="mt-14 border-t border-[#0d3b2a]/20 pt-7">
              {featured ? (
                <Link href={usingDemo ? '/recipes' : `/recipes/${featured.slug}`} className="group flex items-end justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2e7d32]">Featured recipe</span>
                    <h3 className="display-organic mt-2 text-3xl text-[#0d3b2a]">{featured.title}</h3>
                    <p className="mt-2 text-sm text-[#5b3e31]">{featured.prep_time + featured.cook_time} minutes · Serves {featured.servings}</p>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center bg-[#0d3b2a] text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
                </Link>
              ) : (
                <Link href="/recipes" className="group flex items-center justify-between font-bold text-[#0d3b2a]">Explore the recipe kitchen <span className="text-2xl transition-transform group-hover:translate-x-1">→</span></Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
