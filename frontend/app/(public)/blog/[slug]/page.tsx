import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <div className="bg-forest-green pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-light-leaf hover:text-mist-white text-sm mb-8 transition-colors"
          >
            ← Back to Blog
          </Link>
          <span className="inline-block bg-ghana-gold/20 text-ghana-gold text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Health &amp; Wellness
          </span>
          <h1 className="font-display text-4xl font-bold text-mist-white mb-4">{title}</h1>
          <div className="flex items-center gap-4 text-light-leaf text-sm">
            <span>By Dr. Abena Owusu</span>
            <span>·</span>
            <span>March 2025</span>
            <span>·</span>
            <span>7 min read</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <p className="text-charcoal/80 text-lg leading-relaxed mb-6">
            This article is currently being written by our editorial team. Check back soon for
            the full piece on <strong>{title}</strong>.
          </p>
          <p className="text-charcoal/70 leading-relaxed">
            In the meantime, explore our other articles on health, food safety, and organic
            living in Ghana.
          </p>
        </div>
        <div className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-ghana-gold text-forest-green font-semibold px-6 py-3 rounded-xl hover:bg-dark-gold transition-colors"
          >
            ← Browse All Articles
          </Link>
        </div>
      </div>
    </>
  );
}
