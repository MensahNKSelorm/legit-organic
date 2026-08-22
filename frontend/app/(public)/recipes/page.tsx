export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Recipe } from "@/types";

const INTERNAL_API =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeSearch from "@/components/recipes/RecipeSearch";
import { normaliseRecipeText, parseRecipeQuery } from "@/lib/recipe-query";

export const metadata: Metadata = {
  title: "Recipes | Ghanaian Food and Organic Ingredients",
  description: "Ghanaian recipes, seasonal ideas and practical ways to cook with what is fresh.",
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function RecipesPage({ searchParams }: Props) {
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim().slice(0, 200) || "";
  const allRecipes: Recipe[] = await fetch(`${INTERNAL_API}/api/recipes/`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 0 },
  })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  const catalogueTitles = allRecipes.map((recipe) => recipe.title);
  const parsedQuery = parseRecipeQuery(query, catalogueTitles);
  if (parsedQuery.length > 1)
    redirect(`/recipes/combined?q=${encodeURIComponent(parsedQuery.join(" + "))}`);
  const searchTerm = parsedQuery[0] || "";
  const recipes = query
    ? allRecipes.filter((recipe) =>
        normaliseRecipeText(`${recipe.title} ${recipe.description}`).includes(
          normaliseRecipeText(searchTerm)
        )
      )
    : allRecipes;
  const suggestions = allRecipes.map((recipe) => ({ title: recipe.title })).filter(
    (recipe, index, all) =>
      all.findIndex((item) => item.title.toLowerCase() === recipe.title.toLowerCase()) === index
  );

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#171B18]">
      <header className="grid min-h-[78svh] overflow-hidden bg-[#0D3B2A] pt-[76px] lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative min-h-[48vh] lg:min-h-0">
          <Image
            src="/images/photography/cook-hero.webp"
            alt="Fresh vegetables being seasoned in a kitchen"
            fill
            priority
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 54vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <p className="absolute bottom-7 left-6 max-w-sm text-sm leading-6 text-white/85 md:bottom-10 md:left-10">
            Keep the recipes that worked. Change the ones that did not. Cook them again until they
            feel like yours.
          </p>
        </div>
        <div className="flex items-center bg-[#F4C430] px-6 py-14 text-[#0D3B2A] md:px-12 lg:px-16">
          <div>
            <p className="text-sm font-bold">The kitchen notebook</p>
            <h1 className="display-organic mt-8 text-6xl leading-[.88] md:text-8xl">
              A kitchen built from what grows here
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-[#274C3D]">
              Ghanaian recipes, seasonal ideas and useful ways to make more of what is fresh.
            </p>
          </div>
        </div>
      </header>

      {/* ── Recipes grid ─────────────────────────────────────── */}
      <div className="page-container py-12 lg:py-20">
        <RecipeSearch recipes={suggestions} initialQuery={query} />
        {recipes.length > 0 ? (
          <>
            <div className="editorial-rule mb-10 flex items-end justify-between border-b pb-5">
              <div>
                <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">
                  {query ? "Search results" : "The recipe shelf"}
                </p>
                <h2 className="display-organic mt-2 text-4xl text-[#0D3B2A] md:text-5xl dark:text-white">
                  {query ? (
                    <>
                      What goes into <span className="font-normal">“{query}”</span>
                    </>
                  ) : (
                    "Build a plate from the shelf"
                  )}
                </h2>
              </div>
              {query && (
                <Link
                  href="/recipes"
                  className="hidden border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] md:block dark:text-[#F4C430]"
                >
                  Clear search
                </Link>
              )}
            </div>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={`real-${recipe.id}`} recipe={recipe} />
              ))}
            </div>
          </>
        ) : query ? (
          <div className="editorial-rule border-y py-12">
            <h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-white">
              Nothing matched “{query}” yet.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
              Try one component at a time, or browse the full recipe shelf.
            </p>
            <Link
              href="/recipes"
              className="mt-7 inline-flex border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] dark:text-[#F4C430]"
            >
              Clear search
            </Link>
          </div>
        ) : (
          <div className="editorial-rule grid border-y py-12 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
            <div>
              <h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-white">
                The first recipes are being tested.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
                Until they are ready, turn the ingredients already in your kitchen into a practical
                starting point.
              </p>
            </div>
            <Link
              href="/recipes/builder"
              className="mt-7 w-fit border-b border-current pb-1 text-sm font-bold text-[#0D3B2A] md:mt-0 dark:text-[#F4C430]"
            >
              Open the recipe builder ↗
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
