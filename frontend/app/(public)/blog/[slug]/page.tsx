export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { BlogPost } from '@/types'
import { getMediaUrl } from '@/lib/media'
import ArticleShare from '@/components/blog/ArticleShare'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const post = await api.blog.detail(slug)
    const description = post.excerpt || `Read about ${post.title} on the Legit Organic blog — health, food safety, and nutrition in Ghana.`

    return {
      title: post.title,
      description,
      keywords: [
        post.title,
        post.category?.name || '',
        'organic food Ghana',
        'healthy eating Ghana',
        'food safety Ghana',
        'nutrition Ghana',
        'Ghanaian food blog',
      ],
      openGraph: {
        title: post.title,
        description,
        images: post.cover_image ? [{ url: post.cover_image }] : [],
        type: 'article',
      },
    }
  } catch {
    return { title: 'Article | Legit Organic Blog' }
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
// Page — a single-column newspaper reading experience (The Journal)
// ---------------------------------------------------------------------------

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await api.blog.detail(slug).catch(() => notFound())
  const coverSrc = getMediaUrl(post.cover_image)

  let related: BlogPost[] = []
  try {
    const same = await api.blog.list('category=' + post.category?.slug)
    related = same.filter((p) => p.slug !== slug).slice(0, 3)
  } catch {
    // ignore
  }

  const content = post.content ?? ''

  return (
    <div className="story-page min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">

      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="pt-32 pb-10 text-[#0D3B2A] dark:text-[#FAF7F0] md:pt-36 md:pb-14">
        <div className="page-container max-w-4xl">
          {/* Section line */}
          <div className="flex items-center justify-between border-y editorial-rule py-3 editorial-label text-[#5B3E31] dark:text-[#B8D4BD]">
            <Link
              href={`/blog${post.category?.slug ? `?category=${post.category.slug}` : ''}`}
              className="transition-colors hover:text-[#0D3B2A] dark:hover:text-white"
            >
              {post.category?.name ?? 'Field report'}
            </Link>
            <span>Accra, Ghana</span>
          </div>

          {/* Headline */}
          <h1 className="display-organic mt-8 text-[clamp(2.4rem,6vw,4.75rem)] leading-[0.98] tracking-[-0.03em] md:mt-10">
            {post.title}
          </h1>

          {/* Standfirst */}
          {post.excerpt && (
            <p className="display-organic mt-6 max-w-3xl text-2xl leading-tight text-[#5B3E31] dark:text-[#B8D4BD] md:text-3xl">
              {post.excerpt}
            </p>
          )}

          {/* Byline */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t editorial-rule pt-5 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">
            <span className="editorial-label text-[#0D3B2A] dark:text-[#FAF7F0]">
              By {post.author_name || 'Legit Organic'}
            </span>
            {post.published_at && (
              <>
                <span className="opacity-40">·</span>
                <span>{formatDate(post.published_at)}</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span>{readingTime(content || post.excerpt)}</span>
          </div>
        </div>
      </header>

      {/* ── Lead image (only if one is set) ──────────────────────── */}
      {coverSrc && (
        <figure className="page-container max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image src={coverSrc} alt={post.title} fill className="object-cover" sizes="100vw" priority />
          </div>
        </figure>
      )}

      {/* ── Article column ───────────────────────────────────────── */}
      <article className="page-container max-w-2xl py-10 md:py-14">
        {content ? (
          <div className="journal-article" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="space-y-5 text-[#5B3E31] dark:text-[#B8D4BD]">
            <p className="text-lg leading-relaxed">{post.excerpt}</p>
            <p className="text-sm italic opacity-60">Full article content is being prepared.</p>
          </div>
        )}

        <div className="mt-14 border-t editorial-rule pt-6">
          <ArticleShare title={post.title} slug={slug} />
        </div>
      </article>

      {/* ── More field reports ───────────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-t editorial-rule">
          <div className="page-container max-w-4xl py-12 md:py-16">
            <div className="flex items-baseline justify-between border-b editorial-rule pb-3">
              <h2 className="display-organic text-3xl text-[#0D3B2A] dark:text-[#FAF7F0] md:text-4xl">
                More field reports
              </h2>
              <Link
                href="/blog"
                className="editorial-label text-[#5B3E31] transition-colors hover:text-[#0D3B2A] dark:text-[#B8D4BD] dark:hover:text-white"
              >
                The Journal →
              </Link>
            </div>
            <ul>
              {related.map((p) => (
                <li key={p.id} className="border-b editorial-rule">
                  <Link href={`/blog/${p.slug}`} className="group block py-6">
                    <h3 className="display-organic text-xl leading-snug text-[#0D3B2A] transition-colors group-hover:text-[#2E7D32] dark:text-[#FAF7F0] dark:group-hover:text-[#9FC5A4] md:text-2xl">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5B3E31] line-clamp-2 dark:text-[#B8D4BD]">
                        {p.excerpt}
                      </p>
                    )}
                    <span className="editorial-label mt-3 block text-[#5B3E31]/70 dark:text-[#B8D4BD]/70">
                      {post.category?.name}
                      {p.published_at ? ` · ${formatDate(p.published_at)}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
