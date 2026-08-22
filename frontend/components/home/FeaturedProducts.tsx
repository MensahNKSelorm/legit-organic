import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { getMediaUrl } from "@/lib/media";
import { PRODUCT_BLUR_DATA_URL } from "@/lib/image-placeholders";

const PLACEHOLDERS = [
  "/images/products/p1.webp",
  "/images/products/p2.webp",
  "/images/products/p3.webp",
  "/images/products/p4.webp",
];

const DEMO_PRODUCTS: Product[] = [
  {
    id: -1,
    name: "Perfumed White Rice",
    slug: "preview-rice",
    description: "Fragrant Ghana-grown rice for everyday meals.",
    price: "48.00",
    unit: "5 kg bag",
    region: { id: -1, name: "Volta Region", slug: "volta", country: "Ghana" },
    category: { id: -1, name: "Grains", slug: "grains", description: "", image: null },
    image: "/images/products/p1.webp",
    badge: { id: -1, name: "Farm favourite", slug: "farm-favourite", color: "#F4C430" },
    is_featured: true,
    is_available: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: -2,
    name: "Seasonal Vegetable Box",
    slug: "preview-vegetables",
    description: "A colourful selection chosen from what is freshest.",
    price: "85.00",
    unit: "mixed box",
    region: { id: -2, name: "Eastern Region", slug: "eastern", country: "Ghana" },
    category: { id: -2, name: "Vegetables", slug: "vegetables", description: "", image: null },
    image: "/images/products/p2.webp",
    badge: null,
    is_featured: true,
    is_available: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: -3,
    name: "Golden Maize",
    slug: "preview-maize",
    description: "Naturally dried maize for porridge, banku and more.",
    price: "30.00",
    unit: "2 kg bag",
    region: { id: -3, name: "Bono East", slug: "bono-east", country: "Ghana" },
    category: { id: -3, name: "Grains", slug: "grains", description: "", image: null },
    image: "/images/products/p3.webp",
    badge: null,
    is_featured: true,
    is_available: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: -4,
    name: "Mixed Local Beans",
    slug: "preview-beans",
    description: "A nourishing pantry staple sourced from local growers.",
    price: "36.00",
    unit: "2 kg bag",
    region: { id: -4, name: "Northern Region", slug: "northern", country: "Ghana" },
    category: { id: -4, name: "Legumes", slug: "legumes", description: "", image: null },
    image: "/images/products/p4.webp",
    badge: null,
    is_featured: true,
    is_available: true,
    created_at: "",
    updated_at: "",
  },
];

interface FeaturedProductsProps {
  products: Product[];
}

function productImage(product: Product, index: number) {
  return product.images?.length
    ? getMediaUrl(product.images[0].image, PLACEHOLDERS[index % PLACEHOLDERS.length])
    : getMediaUrl(product.image, PLACEHOLDERS[index % PLACEHOLDERS.length]);
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const usingDemo = products.length === 0 && process.env.NODE_ENV === "development";
  const marketProducts = (usingDemo ? DEMO_PRODUCTS : products).slice(0, 4);
  const featured = marketProducts[0];

  return (
    <section
      id="products"
      className="relative overflow-hidden bg-[#faf7f0] py-24 text-[#0d3b2a] md:py-32 dark:bg-[#171b18] dark:text-[#fefcf7]"
    >
      <div className="page-container relative">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:gap-20">
          <h2 className="display-organic text-6xl leading-[.87] md:text-8xl">
            Today at the market
          </h2>
          <div className="pb-2">
            <p className="max-w-lg text-lg leading-8 text-[#5b3e31] dark:text-[#b8d4bd]">
              A quick look at what is in season and ready for your kitchen.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex border-b border-[#0d3b2a] pb-2 font-bold whitespace-nowrap transition-colors hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:border-[#f4c430] dark:text-[#f4c430]"
            >
              See today&apos;s market →
            </Link>
          </div>
        </div>

        {!featured ? (
          <p className="mt-14 border-y border-[#0d3b2a]/20 py-16 text-[#0d3b2a]/65 dark:border-white/15 dark:text-[#b8d4bd]">
            Fresh stock will be listed here soon.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.16fr_.84fr] lg:gap-0">
            <Link
              href={usingDemo ? "/products" : `/products/${featured.slug}`}
              className="group relative min-h-[430px] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] sm:min-h-[580px] md:min-h-[720px]"
            >
              <Image
                src={productImage(featured, 0)}
                alt={featured.name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                placeholder="blur"
                blurDataURL={PRODUCT_BLUR_DATA_URL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 bg-black/85 p-5 text-white sm:p-7 md:p-10">
                <p className="w-fit bg-black px-2 py-1 text-[10px] font-bold tracking-[.18em] text-[#f4c430] uppercase">
                  {featured.region?.name} · {featured.category?.name}
                </p>
                <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                  <h3 className="product-name-sans max-w-xl bg-black px-2 py-1 text-3xl leading-[.95] font-bold sm:text-5xl md:text-7xl">
                    {featured.name}
                  </h3>
                  <div className="shrink-0 bg-[#f4c430] px-4 py-3 text-left text-[#0d3b2a] sm:px-5 sm:py-4 sm:text-right">
                    <strong className="block text-xl">GH₵ {featured.price}</strong>
                    <span className="text-xs">{featured.unit}</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="grid grid-rows-3 border-[#0d3b2a]/20 lg:border-y lg:border-r dark:border-white/15">
              {marketProducts.slice(1).map((product, index) => (
                <Link
                  key={product.id}
                  href={usingDemo ? "/products" : `/products/${product.slug}`}
                  className={`group grid min-h-0 grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F4C430] ${index ? "border-t border-[#0d3b2a]/20 dark:border-white/15" : ""}`}
                >
                  <div className="relative min-h-[220px] overflow-hidden bg-[#e6d8bd]">
                    <Image
                      src={productImage(product, index + 1)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 45vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      placeholder="blur"
                      blurDataURL={PRODUCT_BLUR_DATA_URL}
                    />
                  </div>
                  <div className="flex flex-col justify-between p-5 md:p-7">
                    <p className="text-[9px] font-bold tracking-[.16em] text-[#2e7d32] uppercase dark:text-[#9fc5a4]">
                      {product.region?.name}
                    </p>
                    <div>
                      <h3 className="product-name-sans text-2xl leading-tight font-bold md:text-3xl">
                        {product.name}
                      </h3>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <span className="font-bold">GH₵ {product.price}</span>
                        <span className="text-xs text-[#5b3e31] dark:text-[#b8d4bd]">
                          {product.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
