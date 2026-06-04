import Link from "next/link";
import SectionWrapper from "@/components/ui/SectionWrapper";
import RecipeCard from "@/components/recipes/RecipeCard";
import type { Recipe } from "@/types";

const featuredRecipes: Recipe[] = [
  {
    id: 1,
    title: "Fufu & Light Soup",
    slug: "fufu-light-soup",
    description:
      "A classic Ghanaian comfort dish — smooth pounded fufu served with a light, fragrant soup made from garden eggs, tomatoes, and your choice of protein. Perfect with organic vegetables from the Eastern Region.",
    coverImage: undefined,
    prepTime: 30,
    cookTime: 60,
    servings: 4,
    difficulty: "medium",
    ingredients: [],
    steps: [],
    tags: ["traditional", "ghanaian", "soup", "comfort-food"],
    author: { id: 1, firstName: "Akosua", lastName: "Mensah", avatar: undefined },
    isFeatured: true,
    createdAt: "2025-01-15T00:00:00Z",
  },
  {
    id: 2,
    title: "One-Pot Jollof Rice",
    slug: "one-pot-jollof-rice",
    description:
      "The pride of Ghanaian cuisine — smoky, rich Jollof rice cooked with Legit Organic jasmine rice, fresh tomatoes, and a carefully balanced blend of natural Ghanaian spices. No artificial flavourings needed.",
    coverImage: undefined,
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    difficulty: "easy",
    ingredients: [],
    steps: [],
    tags: ["jollof", "rice", "party-food", "ghanaian"],
    author: { id: 2, firstName: "Kwame", lastName: "Asante", avatar: undefined },
    isFeatured: true,
    createdAt: "2025-02-10T00:00:00Z",
  },
];

export default function RecipesTeaser() {
  return (
    <SectionWrapper id="recipes" background="cream">
      <div className="text-center mb-14">
        <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
          In the Kitchen
        </span>
        <h2 className="font-display text-4xl font-bold text-forest-green mt-3 mb-5">
          Recipes With Organic Ingredients
        </h2>
        <p className="text-charcoal/70 text-lg leading-relaxed max-w-xl mx-auto">
          Discover traditional Ghanaian recipes reimagined with purely organic ingredients.
          Simple, nourishing, and deeply rooted in culture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {featuredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 text-forest-green font-semibold border-b-2 border-ghana-gold pb-0.5 hover:text-leaf-green transition-colors"
        >
          See All Recipes
          <span aria-hidden>→</span>
        </Link>
      </div>
    </SectionWrapper>
  );
}
