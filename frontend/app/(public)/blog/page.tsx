export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/types";

const INTERNAL_API =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
import BlogCard from "@/components/blog/BlogCard";
import BlogCategoryFilter from "@/components/blog/BlogCategoryFilter";
import { getMediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: "Legit Organic Times | Food, Farms & Kitchens",
  description:
    "Field notes, kitchen stories and practical reporting on food, farming and everyday life in Ghana.",
};

function formatDate(iso?: string | null) {
  if (!iso) return "Latest edition";
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = { searchParams: Promise<{ category?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams;

  let posts: BlogPost[] = [];
  let categories: BlogCategory[] = [];

  const [postsResult, categoriesResult] = await Promise.allSettled([
    fetch(
      category ? `${INTERNAL_API}/api/blog/?category=${category}` : `${INTERNAL_API}/api/blog/`,
      { headers: { "Content-Type": "application/json" }, next: { revalidate: 0 } }
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(`${INTERNAL_API}/api/blog/categories/`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);
  posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  const featured = !category && posts.length > 0 ? posts[0] : null;
  const gridPosts = featured ? posts.slice(1) : posts;
  const previewStories =
    process.env.NODE_ENV === "development" && posts.length === 0 && !category
      ? [
          {
            title: "What freshness looks like before the market opens",
            desk: "Field notes",
            image: "/images/hero/3.webp",
            excerpt:
              "How harvest timing and careful handling affect what reaches your home.",
          },
          {
            title: "The case for eating with Ghana’s seasons",
            desk: "Kitchen notes",
            image: "/images/hero/7.webp",
            excerpt:
              "Seasonal eating starts with noticing what is abundant, good and fairly priced.",
          },
          {
            title: "Meet the hands behind the harvest",
            desk: "People",
            image: "/images/hero/1.webp",
            excerpt:
              "The knowledge, decisions and daily labour that do not fit neatly onto a product label.",
          },
        ]
      : [];

  const editionDate = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="journal-front min-h-screen">
      <header className="journal-masthead">
        <div className="page-container">
          <div className="journal-edition-line">
            <span>{editionDate}</span>
            <span>Food · Farms · Kitchens</span>
          </div>
          <div className="journal-nameplate">
            <h1>Legit Organic Times</h1>
          </div>
        </div>
      </header>

      <main className="page-container journal-front__body">
        {/* ── Category filter ──────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="journal-desk-row">
            <span className="journal-desk-row__label">Sections</span>
            <BlogCategoryFilter categories={categories} activeCategory={category} />
          </div>
        )}

        {/* ── Featured post ────────────────────────────────────── */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="journal-lead group focus-visible:outline-none"
          >
            <article>
              <div className="journal-lead__image">
                {featured.cover_image ? (
                  <Image
                    src={getMediaUrl(featured.cover_image) || ""}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 62vw"
                    priority
                  />
                ) : (
                  <div className="journal-lead__placeholder" aria-hidden="true">
                    <span>LO</span>
                  </div>
                )}
              </div>
              <div className="journal-lead__copy">
                <div className="journal-lead__flag">Lead story</div>
                <p className="journal-lead__desk">{featured.category?.name || "From the field"}</p>
                <h2>{featured.title}</h2>
                <p className="journal-lead__excerpt">{featured.excerpt}</p>
                <div className="journal-lead__byline">
                  <span>By {featured.author_name || "Legit Organic"}</span>
                  <span>{formatDate(featured.published_at)}</span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {posts.length > 0 && (
          <div className="journal-section-heading">
            <h2>
              {category
                ? categories.find((item) => item.slug === category)?.name || "Selected stories"
                : "More from this edition"}
            </h2>
            <span>
              {posts.length} stor{posts.length !== 1 ? "ies" : "y"}
            </span>
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────── */}
        {gridPosts.length > 0 ? (
          <div className="journal-story-grid">
            {gridPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} position={index} />
            ))}
          </div>
        ) : previewStories.length > 0 ? (
          <div className="grid gap-x-8 gap-y-12 lg:grid-cols-2">
            {previewStories.map((story, index) => (
              <article
                key={story.title}
                className={`group editorial-rule border-t pt-5 ${index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.2fr_.8fr] lg:gap-10" : ""}`}
              >
                <div
                  className={`relative overflow-hidden ${index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                >
                  <Image
                    src={story.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width:768px) 100vw, 288px"
                  />
                </div>
                <div className="pt-6">
                  <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">
                    {story.desk}
                  </p>
                  <h2
                    className={`display-organic mt-3 leading-tight text-[#0D3B2A] dark:text-white ${index === 0 ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl"}`}
                  >
                    {story.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
                    {story.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="editorial-rule border-y py-12">
            <h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-white">
              {category
                ? "Nothing has been filed under this subject yet."
                : "The first journal edition is being prepared."}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
              We&apos;ll publish each story after it has been reported and edited.
            </p>
            {category && (
              <Link
                href="/blog"
                className="mt-7 inline-flex border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]"
              >
                Return to the journal ↗
              </Link>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
