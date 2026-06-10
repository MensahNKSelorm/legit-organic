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

  const [productsResult, blogResult, recipesResult] = await Promise.allSettled([
    api.products.featured(),
    api.blog.list(),
    api.recipes.default(),
  ])
  if (productsResult.status === 'fulfilled') products = productsResult.value
  if (blogResult.status === 'fulfilled') blogPosts = blogResult.value
  if (recipesResult.status === 'fulfilled') recipes = recipesResult.value

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
