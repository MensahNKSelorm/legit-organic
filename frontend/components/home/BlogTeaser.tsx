import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/types'
import { getMediaUrl } from '@/lib/media'

interface BlogTeaserProps { posts: BlogPost[] }

const DEMO_POSTS: BlogPost[] = [
  {
    id: -1, title: 'What Freshness Really Looks Like', slug: 'preview-freshness', excerpt: 'A practical look at harvest timing, handling and the journey from farm to kitchen.', cover_image: '/images/hero/6.webp', author_name: 'Legit Organic',
    category: { id: -1, name: 'From the Field', slug: 'field' }, tags: 'farming,freshness', is_published: true, published_at: new Date().toISOString(), created_at: '',
  },
  {
    id: -2, title: 'Why Eating With the Season Matters', slug: 'preview-seasons', excerpt: 'How seasonal choices can bring better flavour, value and variety to everyday meals.', cover_image: '/images/hero/9.webp', author_name: 'Legit Organic',
    category: { id: -2, name: 'Food & Health', slug: 'food-health' }, tags: 'seasonal,health', is_published: true, published_at: new Date().toISOString(), created_at: '',
  },
]

export default function BlogTeaser({ posts }: BlogTeaserProps) {
  const usingDemo = posts.length === 0 && process.env.NODE_ENV === 'development'
  const journalPosts = usingDemo ? DEMO_POSTS : posts
  return (
    <section id="blog" className="overflow-hidden bg-[#e6d8bd] py-20 text-[#0d3b2a] dark:bg-[#171b18] dark:text-[#fefcf7] md:py-28">
      <div className="page-container">
        <div className="border-y border-[#0d3b2a]/30 py-3 text-[10px] font-bold uppercase tracking-[.2em] dark:border-white/20">
          <div className="flex flex-wrap justify-between gap-3">
            <span>Legit Organic Field Notes</span>
            <span>Food · Farming · Everyday health</span>
            <span>Ghana</span>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[130px_1fr] lg:gap-16">
          <div className="lg:border-r lg:border-[#0d3b2a]/25 lg:pr-9 dark:lg:border-white/20">
            <h2 className="display-organic text-7xl leading-none text-[#0d3b2a] dark:text-[#fefcf7] lg:[writing-mode:vertical-rl] lg:rotate-180 lg:text-8xl">
              The <em className="font-normal text-[#2e7d32] dark:text-[#9fc5a4]">Journal</em>
            </h2>
          </div>

          <div>
            <div className="grid gap-8 border-b border-[#0d3b2a]/25 pb-10 dark:border-white/20 md:grid-cols-[1.2fr_.8fr] md:items-end md:gap-16">
              <p className="display-organic max-w-3xl text-4xl leading-[1.02] md:text-6xl">
                Notes on what Ghana grows, how we cook, and the choices shaping the way we eat.
              </p>
              <div>
                <p className="leading-7 text-[#5b3e31] dark:text-[#b8d4bd]">A growing collection of field observations, kitchen ideas and conversations worth keeping.</p>
                <Link href="/blog" className="mt-7 inline-flex border-b border-[#0d3b2a] pb-2 font-bold dark:border-[#f4c430] dark:text-[#f4c430]">Open the journal ↗</Link>
              </div>
            </div>

            {journalPosts.length ? (
              <div className="mt-10 grid gap-8 md:grid-cols-2">
                {journalPosts.slice(0, 2).map((post, index) => {
                  const image = getMediaUrl(post.cover_image, `/images/hero/${index ? 9 : 6}.webp`)
                  return (
                    <Link key={post.id} href={usingDemo ? '/blog' : `/blog/${post.slug}`} className="group block">
                      <article>
                        <div className={`relative overflow-hidden bg-[#d1c19f] ${index ? 'aspect-[4/3] md:mt-16' : 'aspect-[4/3]'}`}>
                          <Image src={image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                        </div>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#2e7d32] dark:text-[#9fc5a4]">{post.category?.name || 'Journal'} · {post.author_name}</p>
                        <h3 className="display-organic mt-3 text-3xl leading-[1.02]">{post.title}</h3>
                      </article>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                <p className="display-organic max-w-2xl text-4xl leading-tight">The first edition is taking root.</p>
                <p className="max-w-sm leading-7 text-[#5b3e31] dark:text-[#b8d4bd]">New stories from Ghana&apos;s farms and kitchens will appear here as they are published.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
