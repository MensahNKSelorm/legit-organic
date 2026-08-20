import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/types";
import { getMediaUrl } from "@/lib/media";

function formatDate(iso?: string | null) {
  if (!iso) return "Latest edition";
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(excerpt: string): string {
  const words = excerpt.trim().split(/\s+/).length;
  return `${Math.max(3, Math.ceil((words * 8) / 200))} min read`;
}

type BlogCardProps = {
  post: BlogPost;
  position?: number;
};

export default function BlogCard({ post, position = 0 }: BlogCardProps) {
  const coverSrc = getMediaUrl(post.cover_image);
  const prominent = position === 0;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`journal-story-card group block min-w-0 focus-visible:outline-none ${prominent ? "journal-story-card--prominent" : ""}`}
    >
      <article className="journal-story-card__inner">
        <div className="journal-story-card__image">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={post.title}
              fill
              className="object-cover"
              sizes={
                prominent ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 30vw"
              }
            />
          ) : (
            <div className="journal-story-card__placeholder" aria-hidden="true">
              <span>LO</span>
            </div>
          )}
        </div>

        <div className="journal-story-card__copy">
          <div className="journal-story-card__kicker">
            <span>{post.category?.name || "Journal"}</span>
            <span aria-hidden="true">/</span>
            <span>{formatDate(post.published_at)}</span>
          </div>

          <h3 className="journal-story-card__title">{post.title}</h3>

          <p className="journal-story-card__excerpt">{post.excerpt}</p>

          <div className="journal-story-card__byline">
            <span>By {post.author_name || "Legit Organic"}</span>
            <span>{readingTime(post.excerpt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
