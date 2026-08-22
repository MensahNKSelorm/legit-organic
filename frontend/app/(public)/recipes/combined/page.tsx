export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Product, Recipe, RecipeWithPairings } from "@/types";
import { getMediaUrl } from "@/lib/media";
import CombinedRecipeEditor, {
  type EditableMealIngredient,
} from "@/components/recipes/CombinedRecipeEditor";
import AddDishSearch from "@/components/recipes/AddDishSearch";
import CombinationNote from "@/components/recipes/CombinationNote";
import { normaliseRecipeText, parseRecipeQuery } from "@/lib/recipe-query";

const INTERNAL_API =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Props = { searchParams: Promise<{ q?: string }> };

type DemoRecipe = {
  title: string;
  slug: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  image: string;
  ingredients: string[];
  steps: string[];
};

const demoRecipes: DemoRecipe[] = [
  {
    title: "Fufu",
    slug: "fufu",
    description: "Pounded cassava and plantain with a smooth, elastic finish.",
    prepTime: 20,
    cookTime: 30,
    servings: 4,
    image: "/images/hero/4.webp",
    ingredients: ["Cassava", "Green plantain", "Water"],
    steps: [
      "Peel and cut the cassava and plantain.",
      "Boil until completely tender.",
      "Pound and turn until smooth and elastic.",
    ],
  },
  {
    title: "Light soup",
    slug: "light-soup",
    description: "A clear, peppery tomato soup made for pairing with a swallow.",
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    image: "/images/hero/8.webp",
    ingredients: ["Tomatoes", "Onion", "Fresh pepper", "Ginger", "Protein of choice"],
    steps: [
      "Season and gently cook the protein.",
      "Blend the tomatoes, onion, pepper and ginger.",
      "Add the blended base and simmer until light, fragrant and fully cooked.",
    ],
  },
  {
    title: "Groundnut soup",
    slug: "groundnut-soup",
    description: "Groundnut paste simmered with tomato, aromatics and your chosen protein.",
    prepTime: 20,
    cookTime: 55,
    servings: 4,
    image: "/images/hero/6.webp",
    ingredients: ["Groundnut paste", "Tomatoes", "Onion", "Pepper", "Protein of choice"],
    steps: [
      "Cook the seasoned protein with onion.",
      "Loosen and cook the groundnut paste until glossy.",
      "Add the tomato base and simmer everything together.",
    ],
  },
  {
    title: "Palm nut soup",
    slug: "palm-nut-soup",
    description: "A deeply flavoured soup built from palm fruit concentrate and spices.",
    prepTime: 25,
    cookTime: 65,
    servings: 4,
    image: "/images/hero/7.webp",
    ingredients: ["Palm fruit concentrate", "Tomatoes", "Onion", "Pepper", "Protein of choice"],
    steps: [
      "Season and cook the protein.",
      "Add palm fruit concentrate and enough water.",
      "Simmer with tomato, onion and pepper until rich.",
    ],
  },
  {
    title: "Ebunebunu soup",
    slug: "ebunebunu-soup",
    description: "A green soup of cocoyam leaves, herbs and warming pepper.",
    prepTime: 20,
    cookTime: 35,
    servings: 4,
    image: "/images/hero/3.webp",
    ingredients: ["Cocoyam leaves", "Onion", "Pepper", "Smoked fish"],
    steps: [
      "Wash and cook the leaves until tender.",
      "Blend the leaves with onion and pepper.",
      "Simmer with smoked fish and adjust the seasoning.",
    ],
  },
  {
    title: "Kontomire stew",
    slug: "kontomire-stew",
    description: "Cocoyam leaves cooked down with egusi, tomato and aromatics.",
    prepTime: 20,
    cookTime: 30,
    servings: 4,
    image: "/images/hero/9.webp",
    ingredients: ["Kontomire", "Egusi", "Tomatoes", "Onion", "Palm oil"],
    steps: [
      "Cook and chop the kontomire.",
      "Build the tomato, onion and palm oil base.",
      "Fold in egusi and kontomire, then simmer gently.",
    ],
  },
  {
    title: "Plain rice",
    slug: "plain-rice",
    description: "Separate, tender grains ready for stew, soup or sauce.",
    prepTime: 5,
    cookTime: 25,
    servings: 4,
    image: "/images/products/p1.webp",
    ingredients: ["Rice", "Water", "Salt"],
    steps: [
      "Rinse the rice until the water is mostly clear.",
      "Cook with measured water and salt.",
      "Rest covered, then fluff before serving.",
    ],
  },
  {
    title: "Garden egg stew",
    slug: "garden-egg-stew",
    description: "Slow-cooked garden eggs, tomato and smoked fish.",
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    image: "/images/products/p2.webp",
    ingredients: ["Garden eggs", "Tomatoes", "Onion", "Pepper", "Smoked fish"],
    steps: [
      "Boil and mash the garden eggs.",
      "Cook the tomato, onion and pepper base.",
      "Add fish and garden eggs, then simmer together.",
    ],
  },
];

const clean = (value: string) => value.replace(/<[^>]*>/g, "").trim();
const normalise = normaliseRecipeText;

async function getRecipes(terms: string[], results: Recipe[]): Promise<RecipeWithPairings[]> {
  const selected = terms
    .map((term) => {
      const needle = normalise(term);
      return (
        results.find((recipe) => normalise(recipe.title) === needle) ||
        results.find((recipe) => normalise(recipe.title).includes(needle))
      );
    })
    .filter((recipe): recipe is Recipe => Boolean(recipe));

  return Promise.all(
    selected.map((recipe) =>
      fetch(`${INTERNAL_API}/api/recipes/${recipe.slug}/`, { next: { revalidate: 0 } }).then(
        (response) => (response.ok ? response.json() : null)
      )
    )
  ).then((items) => items.filter((recipe): recipe is RecipeWithPairings => Boolean(recipe)));
}

export default async function CombinedRecipePage({ searchParams }: Props) {
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim().slice(0, 200) || "";
  if (!query) notFound();

  const [catalogueRecipes, products] = await Promise.all([
    fetch(`${INTERNAL_API}/api/recipes/default/`, { next: { revalidate: 0 } })
      .then((response) => (response.ok ? (response.json() as Promise<Recipe[]>) : []))
      .catch(() => []),
    fetch(`${INTERNAL_API}/api/products/`, { next: { revalidate: 0 } })
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        return (Array.isArray(data) ? data : data.results || []) as Product[];
      })
      .catch(() => []),
  ]);
  const catalogueTitles = [
    ...catalogueRecipes.map((recipe) => recipe.title),
    ...demoRecipes.map((recipe) => recipe.title),
  ];
  const terms = parseRecipeQuery(query, catalogueTitles);
  if (terms.length > 4) notFound();
  const realRecipes = await getRecipes(terms, catalogueRecipes);
  const matchProduct = (name: string) =>
    products.find((product) => normalise(product.name) === normalise(name)) ||
    products.find(
      (product) =>
        normalise(product.name).includes(normalise(name)) ||
        normalise(name).includes(normalise(product.name))
    );
  const recipes = terms
    .map((term) => {
      const real =
        realRecipes.find((recipe) => normalise(recipe.title) === normalise(term)) ||
        realRecipes.find((recipe) => normalise(recipe.title).includes(normalise(term)));
      if (real)
        return {
          id: real.id,
          title: real.title,
          slug: real.slug,
          href: `/recipes/${real.slug}`,
          description: clean(real.description),
          prepTime: real.prep_time,
          cookTime: real.cook_time,
          servings: real.servings,
          image: getMediaUrl(real.cover_image) || "/images/hero/8.webp",
          ingredients: real.ingredients.map((ingredient) => {
            const product = ingredient.product || matchProduct(ingredient.name);
            return {
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              notes: ingredient.notes,
              productId: product?.id ?? null,
              productName: product?.name ?? null,
              productSlug: product?.slug ?? null,
            };
          }),
          steps: real.steps.map((step) => clean(step.instruction)),
        };
      const demo = demoRecipes.find((recipe) => normalise(recipe.title) === normalise(term));
      if (!demo) return null;
      return {
        id: null,
        title: demo.title,
        slug: demo.slug,
        href: `/recipes/combined?q=${encodeURIComponent(demo.title)}`,
        description: demo.description,
        prepTime: demo.prepTime,
        cookTime: demo.cookTime,
        servings: demo.servings,
        image: demo.image,
        ingredients: demo.ingredients.map((name) => {
          const product = matchProduct(name);
          return {
            name,
            quantity: "1",
            unit: "portion",
            notes: "",
            productId: product?.id ?? null,
            productName: product?.name ?? null,
            productSlug: product?.slug ?? null,
          };
        }),
        steps: demo.steps,
      };
    })
    .filter((recipe): recipe is NonNullable<typeof recipe> => Boolean(recipe));

  if (!recipes.length || recipes.length !== terms.length) notFound();

  const title = recipes.map((recipe) => recipe.title).join(" + ");
  const totalPrep = recipes.reduce((sum, recipe) => sum + recipe.prepTime, 0);
  const totalCook = Math.max(...recipes.map((recipe) => recipe.cookTime));
  const servings = Math.min(...recipes.map((recipe) => recipe.servings));
  const fallbackDescription =
    recipes.length === 1
      ? recipes[0].description
      : `${recipes.map((recipe) => recipe.title).join(" and ")} bring contrasting flavours and textures together on one plate.`;
  const editableIngredients: EditableMealIngredient[] = recipes.flatMap((recipe) =>
    recipe.ingredients.map((ingredient, index) => ({
      key: `${recipe.slug}-${index}`,
      group: recipe.title,
      ...ingredient,
    }))
  );
  const uniqueCatalogueTitles = catalogueTitles.filter(
    (name, index, all) => all.findIndex((item) => normalise(item) === normalise(name)) === index
  );
  const isCombination = recipes.length > 1;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0D3B2A] dark:bg-[#171B18] dark:text-white">
      <header className="grid min-h-[62vh] bg-[#0D3B2A] pt-[76px] lg:grid-cols-[.9fr_1.1fr]">
        <div
          className="grid min-h-[42vh] overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${Math.min(recipes.length, 3)}, minmax(0, 1fr))` }}
        >
          {recipes.slice(0, 3).map((recipe, index) => (
            <div
              key={recipe.slug}
              className="relative min-h-[42vh] overflow-hidden border-r border-white/20 last:border-r-0"
            >
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                priority={index === 0}
                className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                sizes={`(max-width:1024px) ${Math.round(100 / recipes.length)}vw, ${Math.round(45 / recipes.length)}vw`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <Link
                href={recipe.href}
                className="absolute bottom-5 left-5 border-b border-white/60 pb-1 text-sm font-bold text-white"
              >
                {recipe.title} ↗
              </Link>
            </div>
          ))}
        </div>
        <div className="flex items-center px-6 py-14 text-white md:px-12 lg:px-16">
          <div>
            <Link href="/recipes" className="border-b border-white/50 pb-1 text-sm">
              Back to the recipe shelf
            </Link>
            <p className="mt-10 text-sm font-bold text-[#F4C430]">
              {isCombination ? `${recipes.length}-part meal` : "Recipe notebook"}
            </p>
            <h1 className="display-organic mt-4 max-w-3xl text-5xl leading-[.95] md:text-7xl">
              {recipes.map((recipe, index) => (
                <span key={recipe.slug}>
                  {index > 0 && <span className="font-normal text-white/35"> + </span>}
                  <Link
                    href={recipe.href}
                    className="underline decoration-white/25 underline-offset-8 hover:decoration-[#F4C430]"
                  >
                    {recipe.title}
                  </Link>
                </span>
              ))}
            </h1>
            <AddDishSearch
              currentTitles={recipes.map((recipe) => recipe.title)}
              catalogue={uniqueCatalogueTitles}
            />
            {isCombination ? (
              <CombinationNote
                titles={recipes.map((recipe) => recipe.title)}
                fallback={fallbackDescription}
              />
            ) : (
              <p className="mt-7 max-w-2xl text-base leading-7 text-white/75">
                {fallbackDescription}
              </p>
            )}
            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/25 pt-5 text-sm">
              <div>
                <dt className="text-white/55">Prep</dt>
                <dd className="font-bold">{totalPrep} min</dd>
              </div>
              <div>
                <dt className="text-white/55">Cooking window</dt>
                <dd className="font-bold">about {totalCook} min</dd>
              </div>
              <div>
                <dt className="text-white/55">Serves</dt>
                <dd className="font-bold">{servings}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <div className="page-container py-14 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <section>
            <h2 className="display-organic text-5xl">Ingredients</h2>
            <CombinedRecipeEditor
              key={terms.map(normalise).join("|")}
              title={title}
              baseRecipeIds={recipes.flatMap((recipe) => (recipe.id ? [recipe.id] : []))}
              initialIngredients={editableIngredients}
              returnTo={`/recipes/combined?q=${encodeURIComponent(query)}`}
            />
          </section>
          <section>
            <h2 className="display-organic text-5xl">Method</h2>
            <div className="mt-8 space-y-12">
              {recipes.map((recipe) => (
                <div key={recipe.slug} className="editorial-rule border-t pt-6">
                  <div className="flex items-baseline justify-between gap-5">
                    <h3 className="display-organic text-3xl">
                      <Link
                        href={recipe.href}
                        className="underline decoration-[#0D3B2A]/25 underline-offset-4 hover:decoration-[#2E7D32] dark:decoration-white/25"
                      >
                        {recipe.title}
                      </Link>
                    </h3>
                    <span className="text-xs font-bold text-[#5B3E31] dark:text-[#B8D4BD]">
                      {recipe.prepTime + recipe.cookTime} min
                    </span>
                  </div>
                  <ol className="mt-6 space-y-5">
                    {recipe.steps.map((step, index) => (
                      <li
                        key={`${recipe.slug}-${index}`}
                        className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-7"
                      >
                        <span className="font-bold text-[#2E7D32] dark:text-[#F4C430]">
                          {index + 1}
                        </span>
                        <span className="text-[#5B3E31] dark:text-[#B8D4BD]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="editorial-rule mt-20 border-y py-10 lg:grid lg:grid-cols-[.7fr_1.3fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-bold text-[#2E7D32] dark:text-[#9FC5A4]">From the kitchen</p>
            <h2 className="display-organic mt-3 text-4xl md:text-5xl">
              See how the plate comes together
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
              When a preparation video is added in the dashboard, it will appear here with the full
              cooking walkthrough.
            </p>
          </div>
          <div className="relative mt-8 aspect-video overflow-hidden bg-[#0D3B2A] lg:mt-0">
            <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_25%_25%,#F4C430,transparent_42%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 text-xl">
                ▶
              </span>
              <p className="mt-5 text-sm font-bold">Recipe video preview</p>
              <p className="mt-1 text-xs text-white/55">Video managed from the admin dashboard</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
