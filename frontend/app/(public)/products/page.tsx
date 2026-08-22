export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import Image from "next/image";
import type { Product, Category } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";

const INTERNAL_API =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const metadata: Metadata = {
  title: "Market | Fresh Food from Ghanaian Farmers",
  description:
    "Browse fresh food sourced from Ghanaian farmers, with origin and availability made clear.",
};

const DEMO_CATEGORIES: Category[] = [
  { id: -1, name: "Grains", slug: "grains", description: "", image: null },
  { id: -2, name: "Vegetables", slug: "vegetables", description: "", image: null },
  { id: -3, name: "Legumes", slug: "legumes", description: "", image: null },
  { id: -4, name: "Fruit", slug: "fruit", description: "", image: null },
];

function demoProduct(
  id: number,
  name: string,
  price: string,
  unit: string,
  image: string,
  category: Category,
  region: string,
  badge?: string
): Product {
  return {
    id,
    name,
    slug: `preview-${Math.abs(id)}`,
    description: `Fresh ${name.toLowerCase()} selected for flavour, quality and everyday cooking.`,
    price,
    unit,
    region: { id, name: region, slug: region.toLowerCase().replaceAll(" ", "-"), country: "Ghana" },
    category,
    image,
    badge: badge
      ? { id, name: badge, slug: badge.toLowerCase().replaceAll(" ", "-"), color: "#F4C430" }
      : null,
    is_featured: id === -1,
    is_available: true,
    created_at: "",
    updated_at: "",
  };
}

const DEMO_PRODUCTS: Product[] = [
  demoProduct(
    -1,
    "Perfumed White Rice",
    "48.00",
    "5 kg bag",
    "/images/products/p1.webp",
    DEMO_CATEGORIES[0],
    "Volta Region",
    "Market favourite"
  ),
  demoProduct(
    -2,
    "Seasonal Vegetable Box",
    "85.00",
    "mixed box",
    "/images/products/p2.webp",
    DEMO_CATEGORIES[1],
    "Eastern Region",
    "In season"
  ),
  demoProduct(
    -3,
    "Golden Maize",
    "30.00",
    "2 kg bag",
    "/images/products/p3.webp",
    DEMO_CATEGORIES[0],
    "Bono East"
  ),
  demoProduct(
    -4,
    "Mixed Local Beans",
    "36.00",
    "2 kg bag",
    "/images/products/p4.webp",
    DEMO_CATEGORIES[2],
    "Northern Region"
  ),
  demoProduct(
    -5,
    "Brown Rice",
    "52.00",
    "5 kg bag",
    "/images/products/p1.webp",
    DEMO_CATEGORIES[0],
    "Upper East Region"
  ),
  demoProduct(
    -6,
    "Garden Harvest Box",
    "72.00",
    "family box",
    "/images/products/p2.webp",
    DEMO_CATEGORIES[1],
    "Greater Accra"
  ),
  demoProduct(
    -7,
    "Whole Yellow Corn",
    "25.00",
    "2 kg bag",
    "/images/products/p3.webp",
    DEMO_CATEGORIES[0],
    "Ashanti Region"
  ),
  demoProduct(
    -8,
    "Red Cowpeas",
    "38.00",
    "2 kg bag",
    "/images/products/p4.webp",
    DEMO_CATEGORIES[2],
    "Savannah Region"
  ),
];

type SearchParams = Promise<{ category?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeCategory = params.category || "";

  const [productsResult, categoriesResult] = await Promise.allSettled([
    fetch(
      activeCategory
        ? `${INTERNAL_API}/api/products/?category=${activeCategory}`
        : `${INTERNAL_API}/api/products/`,
      { headers: { "Content-Type": "application/json" }, next: { revalidate: 0 } }
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(`${INTERNAL_API}/api/products/categories/`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 0 },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  let products: Product[] = productsResult.status === "fulfilled" ? productsResult.value : [];
  let categories: Category[] =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const usingDemo = products.length === 0 && process.env.NODE_ENV === "development";

  if (usingDemo) {
    categories = DEMO_CATEGORIES;
    products = activeCategory
      ? DEMO_PRODUCTS.filter((product) => product.category.slug === activeCategory)
      : DEMO_PRODUCTS;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0D3B2A] dark:bg-[#171B18] dark:text-[#FEFCF7]">
      <section className="grid overflow-hidden bg-[#0D3B2A] pt-[76px] text-white lg:min-h-[78svh] lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex items-end px-6 py-12 md:px-12 lg:px-[max(3rem,calc((100vw-80rem)/2+1.5rem))] lg:py-20">
          <div>
            <h1 className="display-organic text-[clamp(4.5rem,8vw,8.6rem)] leading-[.82]">
              Open market,
              <br />
              <span className="font-normal text-[#F4C430]">fresh harvest</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#B8D4BD]">
              Shop fresh food from Ghanaian farms, with clear information about where it came from.
            </p>
          </div>
        </div>
        <div className="relative min-h-[38vh] lg:min-h-0">
          <Image
            src="/images/photography/market-hero.webp"
            alt="A market stall filled with fresh produce"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D3B2A]/50 to-transparent lg:bg-gradient-to-r" />
          <div className="absolute right-0 bottom-0 bg-[#F4C430] px-6 py-5 text-[#0D3B2A] md:px-8">
            <strong className="display-organic block text-4xl">{products.length}</strong>
            <span className="text-[10px] font-bold tracking-[.16em] uppercase">
              choices in today&apos;s market
            </span>
          </div>
        </div>
      </section>

      <main id="market-grid" className="page-container scroll-mt-24 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display-organic text-5xl md:text-7xl">Browse the stalls</h2>
            <p className="mt-4 text-[#5B3E31] dark:text-[#B8D4BD]">
              Filter by what you are shopping for, or take a look at everything.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <CategoryFilter categories={categories} activeCategory={activeCategory} />
        </div>

        {products.length === 0 ? (
          <p className="border-b border-[#0D3B2A]/20 py-24 text-[#5B3E31] dark:border-white/15 dark:text-[#B8D4BD]">
            Nothing is available in this part of the market right now.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`h-full ${index === 0 && !activeCategory ? "sm:col-span-2 lg:col-span-2" : ""}`}
              >
                <ProductCard
                  product={product}
                  featured={index === 0 && !activeCategory}
                  preview={usingDemo}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
