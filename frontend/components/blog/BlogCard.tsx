import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/types'
import { getMediaUrl } from '@/lib/media'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function readingTime(excerpt: string): string {
  const words = excerpt.trim().split(/\s+/).length
  return `${Math.max(3, Math.ceil((words * 8) / 200))} min read`
}

export default function BlogCard({ post }: { post: BlogPost }) {
  const coverSrc = getMediaUrl(post.cover_image)
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="bg-mist-white dark:bg-[#1f2937] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-sand dark:border-[#374151] flex flex-col h-full">
        {/* Cover */}
        <div className="relative h-48 overflow-hidden shrink-0">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-forest-green/20 to-leaf-green/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="none"
                stroke="#0D3B2A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.2 }}
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-[#F4C430]/90 text-[#0D3B2A] text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            {post.category.name}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-charcoal/50 dark:text-[#9ca3af] mb-3">
            <span>{formatDate(post.published_at)}</span>
            <span>·</span>
            <span>{readingTime(post.excerpt)}</span>
          </div>

          <h3 className="font-display text-xl font-bold text-forest-green dark:text-[#faf7f0] mb-3 group-hover:text-leaf-green dark:group-hover:text-[#81C784] transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>

          <p className="text-charcoal/70 dark:text-[#d1d5db] text-sm leading-relaxed line-clamp-2 flex-1 mb-5">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-2 pt-4 border-t border-sand dark:border-[#374151]">
            <div className="w-7 h-7 rounded-full bg-[#F4C430]/30 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] text-xs font-bold shrink-0">
              {post.author_name ? post.author_name[0].toUpperCase() : '?'}
            </div>
            <span className="text-xs text-charcoal/60 dark:text-[#9ca3af] truncate">
              {post.author_name}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
