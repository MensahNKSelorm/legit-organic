import type { Metadata } from "next";
import SectionWrapper from "@/components/ui/SectionWrapper";
import BlogCard from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "Blog — Health, Food Safety & Nutrition",
  description:
    "Research-backed articles on organic food, food safety in Ghana, nutrition, and sustainable farming.",
};

const posts: BlogPost[] = [
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
      "A recent study found pesticide residues in over 60% of fresh produce sampled from major Ghanaian markets. Here's what to look out for and how certified organic sourcing protects your family.",
    content: "",
    coverImage: undefined,
    tags: ["food-safety", "pesticides", "organic", "research"],
    category: { id: 2, name: "Food Safety", slug: "food-safety" },
    author: { id: 3, firstName: "Nana", lastName: "Boateng", avatar: undefined },
    publishedAt: "2025-03-22T00:00:00Z",
    readingTime: 9,
    isFeatured: true,
  },
  {
    id: 3,
    title: "5 Nutrient-Dense Ghanaian Superfoods You Should Eat Every Week",
    slug: "ghanaian-superfoods-eat-weekly",
    excerpt:
      "From moringa leaves to tiger nuts and dried baobab, Ghana is rich in superfoods that punch well above their weight nutritionally. Here's how to incorporate them into your daily meals.",
    content: "",
    coverImage: undefined,
    tags: ["superfoods", "nutrition", "ghanaian-diet"],
    category: { id: 1, name: "Health & Wellness", slug: "health-wellness" },
    author: { id: 1, firstName: "Dr. Abena", lastName: "Owusu", avatar: undefined },
    publishedAt: "2025-04-05T00:00:00Z",
    readingTime: 5,
    isFeatured: false,
  },
  {
    id: 4,
    title: "Regenerative Agriculture in Ghana: Why It's the Future",
    slug: "regenerative-agriculture-ghana-future",
    excerpt:
      "Conventional monoculture farming is depleting Ghana's soil at an alarming rate. We speak to smallholder farmers who have transitioned to regenerative practices — and the results are striking.",
    content: "",
    coverImage: undefined,
    tags: ["farming", "regenerative", "soil-health", "sustainability"],
    category: { id: 3, name: "Farming & Sustainability", slug: "farming-sustainability" },
    author: { id: 2, firstName: "Kwame", lastName: "Asante", avatar: undefined },
    publishedAt: "2025-04-18T00:00:00Z",
    readingTime: 11,
    isFeatured: false,
  },
];

export default function BlogPage() {
  return (
    <>
      <div style={{ backgroundColor: "#0D3B2A", paddingTop: "9rem", paddingBottom: "5rem" }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
            Our Blog
          </span>
          <h1 className="font-display text-5xl font-bold text-mist-white mt-3 mb-5">
            Eat Well, Live Well
          </h1>
          <p className="text-light-leaf text-lg leading-relaxed" style={{ maxWidth: "40rem", margin: "0 auto" }}>
            Research-backed health articles, food safety reports, and nutritional guides written
            in the context of the Ghanaian diet.
          </p>
        </div>
      </div>

      <SectionWrapper background="cream">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
