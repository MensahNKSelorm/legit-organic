export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Product, BlogPost, Recipe } from "@/types";
import HeroSection from "@/components/home/HeroSection";
import HomeJourney from "@/components/home/HomeJourney";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import WhyUs from "@/components/home/WhyUs";
import RecipesTeaser from "@/components/home/RecipesTeaser";
import BlogTeaser from "@/components/home/BlogTeaser";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Fresh Organic Food in Ghana",
  description:
    "Fresh Ghanaian produce with clearer information about where it comes from, how it is handled and when it is available.",
  path: "/",
});

const INTERNAL_API =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function HomePage() {
  let products: Product[] = [];
  let blogPosts: BlogPost[] = [];
  let recipes: Recipe[] = [];

  const [productsResult, blogResult, recipesResult] = await Promise.allSettled([
    fetch(`${INTERNAL_API}/api/products/featured/`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    }).then((r) => (r.ok ? r.json() : [])),
    fetch(`${INTERNAL_API}/api/blog/`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    }).then((r) => (r.ok ? r.json() : [])),
    fetch(`${INTERNAL_API}/api/recipes/?is_default=true`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    }).then((r) => (r.ok ? r.json() : [])),
  ]);
  if (productsResult.status === "fulfilled") products = productsResult.value || [];
  if (blogResult.status === "fulfilled") blogPosts = blogResult.value || [];
  if (recipesResult.status === "fulfilled") recipes = recipesResult.value || [];

  return (
    <>
      <HeroSection />
      <HomeJourney />
      <FeaturedProducts products={products} />
      <RecipesTeaser recipes={recipes} />
      <WhyUs />
      <BlogTeaser posts={blogPosts} />
    </>
  );
}
