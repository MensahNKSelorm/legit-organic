export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Product, BlogPost, Recipe } from '@/types'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import WhyUs from '@/components/home/WhyUs'
import RecipesTeaser from '@/components/home/RecipesTeaser'
import BlogTeaser from '@/components/home/BlogTeaser'

const INTERNAL_API = process.env.INTERNAL_API_URL ||
                     process.env.NEXT_PUBLIC_API_URL ||
                     'http://localhost:8000'

export default async function HomePage() {
  let products: Product[] = []
  let blogPosts: BlogPost[] = []
  let recipes: Recipe[] = []

  const [productsResult, blogResult, recipesResult] = await Promise.allSettled([
    fetch(`${INTERNAL_API}/api/products/featured/`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }
    }).then(r => r.ok ? r.json() : []),
    fetch(`${INTERNAL_API}/api/blog/`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }
    }).then(r => r.ok ? r.json() : []),
    fetch(`${INTERNAL_API}/api/recipes/?is_default=true`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }
    }).then(r => r.ok ? r.json() : []),
  ])
  if (productsResult.status === 'fulfilled') products = productsResult.value || []
  if (blogResult.status === 'fulfilled') blogPosts = blogResult.value || []
  if (recipesResult.status === 'fulfilled') recipes = recipesResult.value || []

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
