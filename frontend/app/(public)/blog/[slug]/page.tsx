export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BlogPost } from "@/types";
import { getMediaUrl } from "@/lib/media";
import ArticleShare from "@/components/blog/ArticleShare";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await api.blog.detail(slug);
    const description =
      post.excerpt ||
      `Read about ${post.title} on the Legit Organic blog — health, food safety, and nutrition in Ghana.`;

    return {
      title: post.title,
      description,
      keywords: [
        post.title,
        post.category?.name || "",
        "organic food Ghana",
        "healthy eating Ghana",
        "food safety Ghana",
        "nutrition Ghana",
        "Ghanaian food blog",
      ],
      openGraph: {
        title: post.title,
        description,
        images: post.cover_image ? [{ url: post.cover_image }] : [],
        type: "article",
      },
    };
  } catch {
    return { title: "Article | Legit Organic Times" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

// ---------------------------------------------------------------------------
// Page — a single-column newspaper reading experience (The Journal)
// ---------------------------------------------------------------------------

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = await api.blog.detail(slug).catch(() => notFound());
  const coverSrc = getMediaUrl(post.cover_image);

  let related: BlogPost[] = [];
  try {
    const same = await api.blog.list("category=" + post.category?.slug);
    related = same.filter((p) => p.slug !== slug).slice(0, 3);
  } catch {
    // ignore
  }

  const content = post.content ?? "";

  return (
    <div className="story-page journal-paper min-h-screen">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="journal-article-head">
        <div className="page-container max-w-5xl">
          <div className="journal-article-head__edition">
            <Link href="/blog">Legit Organic Times</Link>
          </div>
          <div className="journal-article-head__desk">
            <Link
              href={`/blog${post.category?.slug ? `?category=${post.category.slug}` : ""}`}
              className="journal-article-head__category"
            >
              {post.category?.name ?? "Field report"}
            </Link>
            <span>{post.published_at ? formatDate(post.published_at) : "The Journal"}</span>
          </div>

          <h1 className="journal-article-head__title">{post.title}</h1>

          {post.excerpt && <p className="journal-article-head__standfirst">{post.excerpt}</p>}

          <div className="journal-article-head__byline">
            <span>Words by {post.author_name || "Legit Organic"}</span>
            <span>{readingTime(content || post.excerpt)}</span>
          </div>
        </div>
      </header>

      {/* ── Lead image (only if one is set) ──────────────────────── */}
      {coverSrc && (
        <figure className="page-container journal-article-cover max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={coverSrc}
              alt={post.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
          <figcaption>From the Legit Organic field desk</figcaption>
        </figure>
      )}

      <div className="page-container journal-article-layout max-w-5xl">
        <aside className="journal-article-folio" aria-label="Article details">
          <span>{post.category?.name || "Journal"}</span>
          <span>{readingTime(content || post.excerpt)}</span>
          <span>Legit Organic</span>
        </aside>

        <article className="journal-article-sheet">
          {content ? (
            <div className="journal-article" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="journal-article">
              <p>{post.excerpt}</p>
              <p>
                <em>Full article content is being prepared.</em>
              </p>
            </div>
          )}

          <div className="journal-share-rule">
            <ArticleShare title={post.title} slug={slug} />
          </div>
        </article>
      </div>

      {/* ── More field reports ───────────────────────────────────── */}
      {related.length > 0 && (
        <section className="journal-related">
          <div className="page-container max-w-5xl">
            <div className="journal-related__head">
              <h2>Continue reading</h2>
              <Link href="/blog" className="journal-related__all">
                Front page →
              </Link>
            </div>
            <ul className="journal-related__list">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="group">
                    <span>{p.published_at ? formatDate(p.published_at) : post.category?.name}</span>
                    <h3>{p.title}</h3>
                    {p.excerpt && <p>{p.excerpt}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
