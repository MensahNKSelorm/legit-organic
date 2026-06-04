import Link from "next/link";
import type { BlogPost } from "@/types";

interface BlogCardProps {
  post: BlogPost;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group bg-mist-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-sand flex flex-col">
      {/* Cover placeholder */}
      <div className="h-48 bg-gradient-to-br from-forest-green/10 to-leaf-green/20 flex items-center justify-center relative overflow-hidden">
        <span className="text-6xl opacity-30">📰</span>
        <span className="absolute top-3 left-3 bg-ghana-gold text-forest-green text-xs font-bold px-3 py-1 rounded-full">
          {post.category.name}
        </span>
      </div>

      {/* Body */}
      <div className="p-8 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-charcoal/50 mb-3">
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-display text-xl font-bold text-forest-green mb-3 group-hover:text-leaf-green transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
        </Link>

        <p className="text-charcoal/70 text-sm leading-relaxed line-clamp-3 flex-1 mb-5">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-sand pt-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-leaf-green/20 flex items-center justify-center text-leaf-green text-xs font-bold">
              {post.author.firstName[0]}
            </div>
            <span className="text-xs text-charcoal/60">
              {post.author.firstName} {post.author.lastName}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-leaf-green bg-leaf-green/10 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
