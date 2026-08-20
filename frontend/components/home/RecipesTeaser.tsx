import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/types";
import { getMediaUrl } from "@/lib/media";

interface RecipesTeaserProps {
  recipes: Recipe[];
}

const DEMO_RECIPE: Recipe = {
  id: -1,
  title: "Fragrant Ghanaian Rice Bowl",
  slug: "preview-rice-bowl",
  description: "A simple bowl built around fragrant local rice, garden vegetables and fresh herbs.",
  cover_image: "/images/products/p1.webp",
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  difficulty: "easy",
  is_default: true,
  created_at: "",
};

export default function RecipesTeaser({ recipes }: RecipesTeaserProps) {
  const usingDemo = recipes.length === 0 && process.env.NODE_ENV === "development";
  const featured = recipes[0] || (usingDemo ? DEMO_RECIPE : undefined);
  const cover = featured
    ? getMediaUrl(featured.cover_image, "/images/products/p1.webp")
    : "/images/products/p1.webp";

  return (
    <section id="recipes" className="bg-[#f4c430] py-6 md:py-10">
      <div className="page-container">
        <div className="grid overflow-hidden bg-[#faf7f0] lg:grid-cols-[1.08fr_.92fr] dark:bg-[#202621]">
          <div className="relative min-h-[480px] lg:min-h-[650px]">
            <Image
              src={cover}
              alt={featured?.title || "A nourishing Ghanaian meal"}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 max-w-xs text-sm leading-6 text-white/80 md:bottom-10 md:left-10">
              From market basket to cooking pot
            </p>
          </div>
          <div className="flex flex-col justify-between p-8 md:p-14 lg:p-16">
            <div>
              <p className="font-medium text-[#2e7d32] dark:text-[#F4C430]">The kitchen note</p>
              <h2 className="display-organic mt-7 text-5xl leading-[.92] text-[#0d3b2a] md:text-7xl dark:text-[#FEFCF7]">
                Dinner starts here
              </h2>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#5b3e31] dark:text-[#B8D4BD]">
                Pick a Ghanaian dish, gather what it needs and make it your own.
              </p>
            </div>

            <div className="mt-14 border-t border-[#0d3b2a]/20 pt-7 dark:border-white/20">
              {featured ? (
                <div>
                  <div className="mb-5 flex items-center justify-between gap-6">
                    <span className="text-[10px] font-bold tracking-[.18em] text-[#2e7d32] uppercase dark:text-[#F4C430]">
                      Featured recipe
                    </span>
                    <Link
                      href="/recipes"
                      className="border-b border-current pb-1 text-xs font-bold whitespace-nowrap text-[#2e7d32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:text-[#F4C430]"
                    >
                      Browse recipes →
                    </Link>
                  </div>
                  <Link
                    href={usingDemo ? "/recipes" : `/recipes/${featured.slug}`}
                    className="group flex items-end justify-between gap-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430]"
                  >
                    <div>
                      <h3 className="display-organic text-3xl text-[#0d3b2a] dark:text-white">
                        {featured.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#5b3e31] dark:text-[#B8D4BD]">
                        {featured.prep_time + featured.cook_time} minutes · Serves{" "}
                        {featured.servings}
                      </p>
                    </div>
                    <span className="grid size-12 shrink-0 place-items-center bg-[#0d3b2a] text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 dark:bg-[#F4C430] dark:text-[#0D3B2A]">
                      ↗
                    </span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/recipes"
                  className="group flex items-center justify-between gap-6 font-bold text-[#0d3b2a] dark:text-white"
                >
                  <span>Open the recipe kitchen</span>
                  <span className="grid size-12 shrink-0 place-items-center bg-[#0d3b2a] text-xl text-white transition-transform group-hover:translate-x-1 dark:bg-[#F4C430] dark:text-[#0d3b2a]">
                    →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
