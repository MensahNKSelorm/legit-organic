export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Product, ProductDetail } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import ProductTabs from "@/components/products/ProductTabs";
import AddToCartButton, { WishlistButton } from "@/components/products/AddToCartButton";
import ProductImageGallery from "@/components/products/ProductImageGallery";

type Props = { params: Promise<{ slug: string }> };

const PREVIEW_DATA = [
  [
    "preview-1",
    "Perfumed White Rice",
    "48.00",
    "5 kg bag",
    "/images/products/p1.webp",
    "Grains",
    "Volta Region",
  ],
  [
    "preview-2",
    "Seasonal Vegetable Box",
    "85.00",
    "mixed box",
    "/images/products/p2.webp",
    "Vegetables",
    "Eastern Region",
  ],
  [
    "preview-3",
    "Golden Maize",
    "30.00",
    "2 kg bag",
    "/images/products/p3.webp",
    "Grains",
    "Bono East",
  ],
  [
    "preview-4",
    "Mixed Local Beans",
    "36.00",
    "2 kg bag",
    "/images/products/p4.webp",
    "Legumes",
    "Northern Region",
  ],
] as const;

function previewProduct(slug: string): ProductDetail | null {
  const index = PREVIEW_DATA.findIndex((item) => item[0] === slug);
  if (index < 0 || process.env.NODE_ENV !== "development") return null;
  const [productSlug, name, price, unit, image, category, region] = PREVIEW_DATA[index];
  return {
    id: -(index + 1),
    slug: productSlug,
    name,
    price,
    unit,
    image,
    description: `<p>${name} selected for its flavour, consistency and usefulness in everyday Ghanaian cooking. Sourced with care and packed to preserve quality.</p>`,
    category: {
      id: -1,
      name: category,
      slug: category.toLowerCase(),
      description: "",
      image: null,
    },
    region: {
      id: -1,
      name: region,
      slug: region.toLowerCase().replaceAll(" ", "-"),
      country: "Ghana",
    },
    badge:
      index === 0
        ? { id: -1, name: "Market favourite", slug: "market-favourite", color: "#F4C430" }
        : null,
    is_featured: index === 0,
    is_available: true,
    created_at: "",
    updated_at: "",
    images: [],
    storage_tips:
      "<p>Keep sealed in a cool, dry place away from direct sunlight. Transfer to an airtight container after opening.</p>",
    nutritional_info:
      "<p>A wholesome pantry ingredient that supports balanced everyday meals when paired with vegetables and protein.</p>",
    nutritional_score: 86,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const demo = previewProduct(slug);
  if (demo) return { title: `${demo.name} | Product Preview` };
  try {
    const product = await api.products.detail(slug);
    return {
      title: `${product.name} | ${product.category?.name || "Fresh Produce"}`,
      description: product.description?.replace(/<[^>]*>/g, "").slice(0, 160),
    };
  } catch {
    return { title: "Product | Legit Organic" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const demo = previewProduct(slug);
  const product: ProductDetail = demo || (await api.products.detail(slug).catch(() => notFound()));

  let related: Product[] = [];
  if (demo) {
    related = PREVIEW_DATA.filter((item) => item[0] !== slug)
      .slice(0, 3)
      .map((item) => previewProduct(item[0]) as ProductDetail);
  } else {
    try {
      const same = await api.products.list("category=" + product.category?.slug);
      related = same.filter((item) => item.slug !== slug).slice(0, 3);
    } catch {
      /* related products are optional */
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0D3B2A] dark:bg-[#171B18] dark:text-[#FEFCF7]">
      <div className="bg-[#0D3B2A] pt-[76px] text-white">
        <div className="page-container flex flex-wrap items-center gap-2 py-5 text-xs text-[#B8D4BD]">
          <Link href="/products" className="hover:text-white">
            The market
          </Link>
          <span>→</span>
          <span className="text-[#F4C430]">{product.name}</span>
        </div>
      </div>

      <div className="page-container py-10 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.12fr_.88fr] lg:gap-20">
          <ProductImageGallery
            images={product.images ?? []}
            productName={product.name}
            mainImage={product.image}
          />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center justify-between gap-5 border-b border-[#0D3B2A]/20 pb-4 text-[10px] font-bold tracking-[.16em] text-[#2E7D32] uppercase dark:border-white/15 dark:text-[#9FC5A4]">
              <span>{product.category?.name}</span>
              <span>{product.region?.name}</span>
            </div>
            <h1 className="product-name-sans mt-8 text-5xl leading-[.9] font-bold md:text-7xl">
              {product.name}
            </h1>
            <div className="mt-7 flex items-end gap-3">
              <strong className="text-3xl text-[#2E7D32] dark:text-[#F4C430]">
                GH₵ {product.price}
              </strong>
              <span className="pb-1 text-sm text-[#5B3E31] dark:text-[#B8D4BD]">
                {product.unit}
              </span>
            </div>
            <div
              className="prose prose-lg dark:prose-invert mt-7 text-[#5B3E31] dark:text-[#D5E7D8]"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <AddToCartButton product={product} />
              {demo ? (
                <button
                  disabled
                  className="border border-[#0D3B2A]/30 px-6 py-3 font-bold text-[#0D3B2A]/50 dark:border-white/25 dark:text-white/50"
                >
                  Save preview
                </button>
              ) : (
                <WishlistButton productId={product.id} />
              )}
            </div>

            <div className="mt-10 grid grid-cols-3 border-y border-[#0D3B2A]/20 py-5 dark:border-white/15">
              {[
                [product.category?.name, "Category"],
                [product.region?.name, "Origin"],
                [product.unit, "Sold as"],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className={index ? "border-l border-[#0D3B2A]/20 pl-4 dark:border-white/15" : ""}
                >
                  <strong className="display-organic block text-xl">{value}</strong>
                  <span className="text-[10px] tracking-[.14em] text-[#5B3E31] uppercase dark:text-[#9FC5A4]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-7 border-l-2 border-[#F4C430] pl-5 text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">
              Sourced from Ghanaian growers and handled with care from collection to delivery.
            </p>
          </div>
        </div>
      </div>

      <section className="border-y border-[#0D3B2A]/15 bg-[#F5F0E6] dark:border-white/15 dark:bg-[#202621]">
        <div className="page-container pt-16 pb-8 md:pt-20 md:pb-10">
          <ProductTabs product={product} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="page-container py-20 md:py-28">
          <div className="flex items-end justify-between gap-8 border-b border-[#0D3B2A]/20 pb-7 dark:border-white/15">
            <h2 className="display-organic text-4xl md:text-6xl">More from the market</h2>
            <Link href="/products" className="font-bold">
              Browse everything ↗
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} preview={!!demo} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
