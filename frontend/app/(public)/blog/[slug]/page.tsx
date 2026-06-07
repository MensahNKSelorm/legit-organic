import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { BlogPost } from '@/types'
import { getMediaUrl } from '@/lib/media'
import BlogCard from '@/components/blog/BlogCard'

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  try {
    const posts = await api.blog.list()
    return posts.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await api.blog.detail(slug)
    return {
      title: `${post.title} | Legit Organic Blog`,
      description: post.excerpt,
    }
  } catch {
    return { title: 'Article Not Found' }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}


// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await api.blog.detail(slug).catch(() => notFound())
  const coverSrc = getMediaUrl(post.cover_image)

  let related: BlogPost[] = []
  try {
    const same = await api.blog.list('category=' + post.category.slug)
    related = same.filter((p) => p.slug !== slug).slice(0, 3)
  } catch {
    // ignore
  }

  const content = post.content ?? ''

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0D3B2A', paddingTop: '5.5rem', paddingBottom: '1rem' }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-light-leaf flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-mist-white transition-colors">
              Home
            </Link>
            <span className="opacity-50">/</span>
            <Link href="/blog" className="hover:text-mist-white transition-colors">
              Blog
            </Link>
            <span className="opacity-50">/</span>
            <span className="text-ghana-gold font-medium truncate max-w-[240px]">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: '#0D3B2A', minHeight: '340px' }}
      >
        {coverSrc && (
          <Image
            src={coverSrc}
            alt={post.title}
            fill
            className="object-cover opacity-25"
            sizes="100vw"
            priority
          />
        )}
        <div className="relative z-10 page-container max-w-4xl mx-auto px-6 lg:px-8 py-16 pb-20">
          <span className="inline-block bg-[#F4C430]/20 text-[#F4C430] text-xs font-semibold px-3 py-1 rounded-full mb-5">
            {post.category.name}
          </span>
          <h1 className="font-display text-3xl lg:text-5xl font-bold text-mist-white mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-light-leaf text-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#F4C430]/30 flex items-center justify-center text-[#F4C430] text-xs font-bold shrink-0">
                {post.author_name ? post.author_name[0].toUpperCase() : '?'}
              </div>
              <span>{post.author_name}</span>
            </div>
            <span className="opacity-40">·</span>
            <span>{formatDate(post.published_at)}</span>
            <span className="opacity-40">·</span>
            <span>{readingTime(content || post.excerpt)}</span>
          </div>
        </div>
      </div>

      {/* ── Content + Sidebar ──────────────────────────────────── */}
      <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-start">

          {/* Left: article body */}
          <div>
            {content ? (
              <div
                className="prose prose-green max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="space-y-5 text-charcoal/70 dark:text-[#d1d5db]">
                <p className="text-lg leading-relaxed">{post.excerpt}</p>
                <p className="text-sm text-charcoal/40 dark:text-[#9ca3af] italic">
                  Full article content is being prepared. Check back soon.
                </p>
              </div>
            )}

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-[#E6D8BD] dark:border-[#374151]">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-4">
                Share this article
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors">
                  X / Twitter
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                  WhatsApp
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E6D8BD] dark:bg-[#374151] text-charcoal dark:text-[#d1d5db] hover:bg-[#d1c9aa] dark:hover:bg-[#4b5563] transition-colors">
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24">

            {/* Author card */}
            <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-4">
                Written by
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#F4C430] flex items-center justify-center text-[#0D3B2A] font-bold text-lg shrink-0">
                  {post.author_name ? post.author_name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <p className="font-semibold text-forest-green dark:text-[#faf7f0]">
                    {post.author_name}
                  </p>
                  <p className="text-xs text-charcoal/50 dark:text-[#9ca3af] mt-0.5">
                    Legit Organic Editorial
                  </p>
                </div>
              </div>
            </div>

            {/* TOC placeholder */}
            <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-4">
                In this article
              </p>
              <p className="text-sm text-charcoal/40 dark:text-[#9ca3af] italic">
                Table of contents coming soon.
              </p>
            </div>

            {/* Related in sidebar */}
            {related.length > 0 && (
              <div className="bg-mist-white dark:bg-[#1f2937] border border-sand dark:border-[#374151] rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-charcoal/40 dark:text-[#9ca3af] mb-4">
                  More in {post.category.name}
                </p>
                <ul className="space-y-4">
                  {related.slice(0, 2).map((p) => (
                    <li key={p.id}>
                      <Link href={`/blog/${p.slug}`} className="group">
                        <p className="text-sm font-semibold text-forest-green dark:text-[#faf7f0] group-hover:text-leaf-green dark:group-hover:text-[#81C784] transition-colors line-clamp-2 leading-snug">
                          {p.title}
                        </p>
                        <p className="text-xs text-charcoal/40 dark:text-[#9ca3af] mt-1">
                          {new Date(p.published_at).toLocaleDateString('en-GH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Related posts ──────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="bg-beige dark:bg-[#111827] border-t border-[#E6D8BD] dark:border-[#374151]">
          <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
            <h2 className="font-display text-2xl font-bold text-forest-green dark:text-[#faf7f0] mb-8">
              More from {post.category.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
