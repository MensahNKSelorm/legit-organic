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
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, DEFAULT_SOCIAL_IMAGE, plainText } from "@/lib/seo";

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
      `Read ${post.title} in the Legit Organic Journal. Find practical reporting on food, farming and cooking in Ghana.`;

    return {
      title: post.title,
      description,
      alternates: { canonical: `/blog/${post.slug}` },
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
        url: `/blog/${post.slug}`,
        images: [{ url: getMediaUrl(post.cover_image, DEFAULT_SOCIAL_IMAGE), alt: post.title }],
        type: "article",
        publishedTime: post.published_at,
        modifiedTime: post.updated_at,
        authors: [post.author_name || "Legit Organic"],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: [getMediaUrl(post.cover_image, DEFAULT_SOCIAL_IMAGE)],
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
  const articleUrl = `https://legitorganic.com/blog/${post.slug}`;
  const articleImage = absoluteUrl(getMediaUrl(post.cover_image, DEFAULT_SOCIAL_IMAGE));

  return (
    <div className="story-page journal-paper min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${articleUrl}#article`,
          headline: post.title,
          description: plainText(post.excerpt, 500),
          image: articleImage ? [articleImage] : undefined,
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at || post.published_at || post.created_at,
          author: { "@type": "Person", name: post.author_name || "Legit Organic Editor" },
          publisher: { "@id": "https://legitorganic.com/#organization" },
          mainEntityOfPage: articleUrl,
          articleSection: post.category?.name,
          keywords: post.tags || undefined,
          inLanguage: "en-GH",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Journal",
              item: "https://legitorganic.com/blog",
            },
            { "@type": "ListItem", position: 2, name: post.title, item: articleUrl },
          ],
        }}
      />
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
