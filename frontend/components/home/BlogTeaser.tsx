import Link from "next/link";
import SectionWrapper from "@/components/ui/SectionWrapper";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

const featuredPosts: BlogPost[] = [
  {
    id: 1,
    title: "Why Organic Food Matters More Than Ever for Ghanaian Families",
    slug: "why-organic-matters-ghanaian-families",
    excerpt:
      "Rising rates of non-communicable diseases in Ghana are being linked to ultra-processed foods and pesticide residues. We break down why switching to organic produce is one of the most impactful health decisions a Ghanaian family can make.",
    content: "",
    coverImage: undefined,
    tags: ["health", "organic", "ghana", "nutrition"],
    category: { id: 1, name: "Health & Wellness", slug: "health-wellness" },
    author: { id: 1, firstName: "Dr. Abena", lastName: "Owusu", avatar: undefined },
    publishedAt: "2025-03-01T00:00:00Z",
    readingTime: 7,
    isFeatured: true,
  },
  {
    id: 2,
    title: "The Hidden Chemicals in Ghana's Market Food — And How to Avoid Them",
    slug: "hidden-chemicals-ghana-market-food",
    excerpt:
      "A recent study found pesticide residues in over 60% of fresh produce sampled from major Ghanaian markets. Here's what to look out for, which crops are most at risk, and how certified organic sourcing protects your family.",
    content: "",
    coverImage: undefined,
    tags: ["food-safety", "pesticides", "organic", "research"],
    category: { id: 2, name: "Food Safety", slug: "food-safety" },
    author: { id: 3, firstName: "Nana", lastName: "Boateng", avatar: undefined },
    publishedAt: "2025-03-22T00:00:00Z",
    readingTime: 9,
    isFeatured: true,
  },
];

export default function BlogTeaser() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {featuredPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

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
  );
}
