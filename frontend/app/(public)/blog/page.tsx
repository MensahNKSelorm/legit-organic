export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost, BlogCategory } from '@/types'

const INTERNAL_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import BlogCard from '@/components/blog/BlogCard'
import BlogCategoryFilter from '@/components/blog/BlogCategoryFilter'
import { getMediaUrl } from '@/lib/media'

export const metadata: Metadata = {
  title: 'Blog — Health, Food Safety & Nutrition',
  description:
    'Research-backed articles on organic food, food safety in Ghana, nutrition, and sustainable farming.',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams

  let posts: BlogPost[] = []
  let categories: BlogCategory[] = []

  const [postsResult, categoriesResult] = await Promise.allSettled([
    fetch(
      category
        ? `${INTERNAL_API}/api/blog/?category=${category}`
        : `${INTERNAL_API}/api/blog/`,
      { headers: { 'Content-Type': 'application/json' }, next: { revalidate: 0 } }
    ).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`${INTERNAL_API}/api/blog/categories/`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 },
    }).then(r => r.ok ? r.json() : []).catch(() => []),
  ])
  posts = postsResult.status === 'fulfilled' ? postsResult.value : []
  categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []

  const featured = !category && posts.length > 0 ? posts[0] : null
  const gridPosts = featured ? posts.slice(1) : posts

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '9rem', paddingBottom: '5rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-xs font-bold uppercase tracking-widest">
            THE LEGIT ORGANIC BLOG
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-5">
            Health, Food &amp; Farming Insights
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-xl mx-auto">
            Research-backed articles on organic food, food safety in Ghana, nutrition, and
            sustainable farming.
          </p>
        </div>
      </div>

      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* ── Category filter ──────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="mb-10">
            <BlogCategoryFilter categories={categories} activeCategory={category} />
          </div>
        )}

        {/* ── Featured post ────────────────────────────────────── */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <div className="bg-mist-white dark:bg-[#1f2937] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-sand dark:border-[#374151]">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="relative h-64 md:h-auto md:min-h-[300px] overflow-hidden">
                  {featured.cover_image ? (
                    <Image
                      src={getMediaUrl(featured.cover_image) || ''}
                      alt={featured.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-forest-green to-leaf-green flex items-center justify-center">
                      <span className="font-display font-bold text-mist-white/10 text-[8rem] leading-none select-none">
                        L
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    {featured.category && (
                      <span className="bg-[#F4C430]/20 text-[#0D3B2A] dark:text-[#F4C430] text-xs font-semibold px-3 py-1 rounded-full">
                        {featured.category.name}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-ghana-gold uppercase tracking-wide">
                      Featured
                    </span>
                  </div>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-forest-green dark:text-[#faf7f0] mb-4 group-hover:text-leaf-green dark:group-hover:text-[#81C784] transition-colors line-clamp-3 leading-snug">
                    {featured.title}
                  </h2>
                  <p className="text-charcoal/70 dark:text-[#d1d5db] leading-relaxed line-clamp-3 mb-6">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-charcoal/50 dark:text-[#9ca3af]">
                    <div className="w-6 h-6 rounded-full bg-[#F4C430]/30 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] text-xs font-bold shrink-0">
                      {featured.author_name ? featured.author_name[0].toUpperCase() : '?'}
                    </div>
                    <span>{featured.author_name}</span>
                    <span className="opacity-40">·</span>
                    <span>{formatDate(featured.published_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Post count ───────────────────────────────────────── */}
        <p className="text-sm text-charcoal/50 dark:text-[#9ca3af] mb-6">
          Showing {posts.length} article{posts.length !== 1 ? 's' : ''}
        </p>

        {/* ── Grid ─────────────────────────────────────────────── */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-charcoal/40 dark:text-[#9ca3af] text-lg mb-4">
              No articles found.
            </p>
            {category && (
              <Link
                href="/blog"
                className="text-sm text-leaf-green hover:underline"
              >
                View all articles
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
