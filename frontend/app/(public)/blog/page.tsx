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
  const previewStories = process.env.NODE_ENV === 'development' && posts.length === 0 && !category
    ? [
        { title: 'What freshness looks like before the market opens', desk: 'Field notes', image: '/images/hero/3.webp', excerpt: 'A closer look at harvest timing, handling and the short journey between a farm and a household.' },
        { title: 'The case for eating with Ghana’s seasons', desk: 'Kitchen notes', image: '/images/hero/7.webp', excerpt: 'Seasonal eating is less about rules and more about noticing what is abundant, good and fairly priced.' },
        { title: 'Meet the hands behind the harvest', desk: 'People', image: '/images/hero/1.webp', excerpt: 'The knowledge, decisions and daily labour that do not fit neatly onto a product label.' },
      ]
    : []

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">
      <header className="bg-[#FAF7F0] pb-12 pt-32 text-[#0D3B2A] dark:bg-[#171B18] dark:text-white md:pb-16 md:pt-36">
        <div className="page-container">
          <div className="flex items-center justify-between border-y editorial-rule py-3 text-xs font-bold">
            <span>Field reports · kitchen notes · people</span><span>Accra, Ghana</span>
          </div>
          <h1 className="display-organic my-8 text-center text-[clamp(5rem,14vw,12rem)] leading-[.72] tracking-[-.06em]">The Journal</h1>
          <div className="grid gap-7 border-t editorial-rule pt-7 md:grid-cols-[1fr_1.3fr_1fr] md:items-start">
            <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">Published when there is something worth saying.</p>
            <p className="display-organic text-3xl leading-tight md:text-4xl">Stories from the places where food is grown, sold and cooked.</p>
            <p className="text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD] md:text-right">Reporting and observation from Ghanaian farms, kitchens and the route between them.</p>
          </div>
        </div>
      </header>

      <div className="page-container py-12 lg:py-20">

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

        {posts.length > 0 && <p className="mb-6 text-sm text-charcoal/50 dark:text-[#9ca3af]">{posts.length} article{posts.length !== 1 ? 's' : ''}</p>}

        {/* ── Grid ─────────────────────────────────────────────── */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : previewStories.length > 0 ? (
          <div className="grid gap-x-8 gap-y-12 lg:grid-cols-2">
            {previewStories.map((story, index) => (
              <article key={story.title} className={`group border-t editorial-rule pt-5 ${index === 0 ? 'lg:col-span-2 lg:grid lg:grid-cols-[1.2fr_.8fr] lg:gap-10' : ''}`}>
                <div className={`relative overflow-hidden ${index === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                  <Image src={story.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width:768px) 100vw, 288px" />
                </div>
                <div className="pt-6">
                  <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">{story.desk}</p>
                  <h2 className={`display-organic mt-3 leading-tight text-[#0D3B2A] dark:text-white ${index === 0 ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl'}`}>{story.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">{story.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="border-y editorial-rule py-12">
            <h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-white">{category ? 'Nothing has been filed under this subject yet.' : 'The first journal edition is being prepared.'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">Stories will appear here once they have been reported, edited and are ready to be useful.</p>
            {category && <Link href="/blog" className="mt-7 inline-flex border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]">Return to the journal ↗</Link>}
          </div>
        ) : null}
      </div>
    </div>
  )
}
