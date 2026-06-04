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

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <div className="bg-forest-green pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 text-light-leaf hover:text-mist-white text-sm mb-8 transition-colors"
          >
            ← Back to Recipes
          </Link>
          <span className="inline-block bg-ghana-gold/20 text-ghana-gold text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Ghanaian Classic
          </span>
          <h1 className="font-display text-4xl font-bold text-mist-white mb-4">{title}</h1>
          <div className="flex flex-wrap gap-4 text-light-leaf text-sm">
            <span className="flex items-center gap-1">⏱ 90 min total</span>
            <span>·</span>
            <span className="flex items-center gap-1">👥 4 servings</span>
            <span>·</span>
            <span className="flex items-center gap-1">📊 Medium difficulty</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-charcoal/80 text-lg leading-relaxed mb-6">
          Full recipe instructions for <strong>{title}</strong> are being added by our culinary
          team. Check back soon!
        </p>
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 bg-ghana-gold text-forest-green font-semibold px-6 py-3 rounded-xl hover:bg-dark-gold transition-colors"
        >
          ← Browse All Recipes
        </Link>
      </div>
    </>
  );
}
