import type { Metadata } from "next";
import Link from "next/link";
import SectionWrapper from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "My Recipes",
};

export default function MyRecipesPage() {
  return (
    <>
      <div style={{ backgroundColor: "#0D3B2A", paddingTop: "8rem", paddingBottom: "4rem" }}>
        <div className="page-container max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-mist-white">My Recipes</h1>
            <p className="text-light-leaf mt-2">Recipes you&apos;ve saved and created</p>
          </div>
          <button className="bg-ghana-gold text-forest-green font-semibold px-5 py-2.5 rounded-xl hover:bg-dark-gold transition-colors text-sm">
            + New Recipe
          </button>
        </div>
      </div>

      <SectionWrapper background="cream">
        <div className="max-w-5xl mx-auto">
          {/* Empty state */}
          <div className="bg-mist-white rounded-2xl p-16 border border-sand text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="font-display text-2xl font-bold text-forest-green mb-3">
              No saved recipes yet
            </h2>
            <p className="text-charcoal/70 mb-8 max-w-sm mx-auto">
              Browse our collection of organic Ghanaian recipes and save the ones you love — or
              contribute your own.
            </p>
            <Link
              href="/recipes"
              className="inline-flex items-center gap-2 bg-ghana-gold text-forest-green font-semibold px-8 py-3 rounded-xl hover:bg-dark-gold transition-colors"
            >
              Browse Recipes
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
