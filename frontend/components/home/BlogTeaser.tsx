import Link from 'next/link'
import SectionWrapper from '@/components/ui/SectionWrapper'
import BlogCard from '@/components/blog/BlogCard'
import type { BlogPost } from '@/types'

interface BlogTeaserProps {
  posts: BlogPost[]
}

export default function BlogTeaser({ posts }: BlogTeaserProps) {
  return (
    <SectionWrapper id="blog" background="beige">
      <div className="text-center mb-14">
        <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
          From Our Blog
        </span>
        <h2 className="font-display text-4xl font-bold text-forest-green mt-3 mb-5">
          Eat Well, Live Well
        </h2>
        <p className="text-charcoal/70 text-lg leading-relaxed max-w-xl mx-auto">
          Research-backed health articles, food safety reports, and nutritional guides — all
          written in the context of the Ghanaian diet and food system.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-charcoal/50 py-12">No articles available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-forest-green font-semibold border-b-2 border-ghana-gold pb-0.5 hover:text-leaf-green transition-colors"
        >
          Read All Articles
          <span aria-hidden>→</span>
        </Link>
      </div>
    </SectionWrapper>
  )
}
