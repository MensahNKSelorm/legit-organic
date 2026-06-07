export const dynamic = 'force-dynamic'
export const revalidate = 0

import { api } from '@/lib/api'
import type { Product, BlogPost, Recipe } from '@/types'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import WhyUs from '@/components/home/WhyUs'
import RecipesTeaser from '@/components/home/RecipesTeaser'
import BlogTeaser from '@/components/home/BlogTeaser'

export default async function HomePage() {
  let products: Product[] = []
  let blogPosts: BlogPost[] = []
  let recipes: Recipe[] = []

  try {
    ;[products, blogPosts, recipes] = await Promise.all([
      api.products.featured(),
      api.blog.list(),
      api.recipes.default(),
    ])
  } catch {
    // API unavailable — render with empty arrays
  }

  return (
    <>
      <HeroSection />
      <FeaturedProducts products={products} />
      <WhyUs />
      <RecipesTeaser recipes={recipes} />
      <BlogTeaser posts={blogPosts} />
    </>
  )
}
