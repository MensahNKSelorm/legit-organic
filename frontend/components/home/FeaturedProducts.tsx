import Link from "next/link";
import Image from "next/image";
import SectionWrapper from "@/components/ui/SectionWrapper";

const products = [
  {
    id: 1,
    image: "/images/products/p1.webp",
    name: "Organic Jasmine Rice",
    category: "Grains",
    region: "Volta Region",
    description:
      "Fragrant, long-grain rice grown in the rich wetlands of the Volta Region without synthetic pesticides.",
    price: "GH₵ 45",
    unit: "/ 5 kg bag",
    badge: "Best Seller",
  },
  {
    id: 2,
    image: "/images/products/p2.webp",
    name: "Farm-Fresh Yam",
    category: "Tubers",
    region: "Brong-Ahafo",
    description:
      "Starchy, nutrient-rich yam sourced from small-scale farmers in Brong-Ahafo — a Ghanaian staple, untreated.",
    price: "GH₵ 30",
    unit: "/ medium tuber",
    badge: "Seasonal",
  },
  {
    id: 3,
    image: "/images/products/p3.webp",
    name: "Mixed Organic Vegetables",
    category: "Vegetables",
    region: "Eastern Region",
    description:
      "A curated box of seasonal greens: garden eggs, kontomire, tomatoes, and peppers — freshly harvested.",
    price: "GH₵ 35",
    unit: "/ weekly box",
    badge: "Fresh",
  },
  {
    id: 4,
    image: "/images/products/p4.webp",
    name: "Natural Ghanaian Spices",
    category: "Spices",
    region: "Northern Region",
    description:
      "Handpicked and sun-dried: dawadawa, grains of selim, calabash nutmeg, and dried red chilli — zero additives.",
    price: "GH₵ 25",
    unit: "/ spice bundle",
    badge: "Artisan",
  },
];

export default function FeaturedProducts() {
  return (
    <SectionWrapper id="products" background="beige">
      {/* Section header */}
      <div className="text-center mb-16">
        <span className="text-ghana-gold text-sm font-semibold uppercase tracking-widest">
          What We Offer
        </span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-forest-green mt-3 mb-5">
          Featured Organic Products
        </h2>
        <p className="text-charcoal/70 text-lg leading-relaxed max-w-2xl mx-auto">
          Every product is sourced directly from verified Ghanaian farmers who grow without
          synthetic chemicals — so you get the real thing.
        </p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <article
            key={product.id}
            className="group bg-mist-white dark:bg-[#1f2937] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 border border-sand dark:border-[#374151] flex flex-col min-h-[420px]"
          >
            {/* Product image */}
            <div className="relative h-52 overflow-hidden bg-beige dark:bg-[#374151]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <span className="absolute top-3 left-3 bg-forest-green text-ghana-gold text-xs font-bold px-2.5 py-1 rounded-full z-10">
                {product.badge}
              </span>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
              {/* Product name — wraps freely, never bleeds into price row */}
              <h3 className="font-display text-lg font-bold text-forest-green dark:text-[#faf7f0] break-words w-full mb-2">
                {product.name}
              </h3>

              {/* Category tag — fixed-height container so cards stay aligned */}
              <div className="min-h-[28px] flex items-center mb-3">
                <span className="inline-block text-xs bg-[#F5F0E6] dark:bg-[#374151] text-[#2e7d32] dark:text-[#81C784] rounded-full px-3 py-1 font-semibold uppercase tracking-wide">
                  {product.category} · {product.region}
                </span>
              </div>

              {/* Description fills remaining space */}
              <p className="text-charcoal/70 dark:text-[#d1d5db] text-sm leading-relaxed flex-1 line-clamp-3">
                {product.description}
              </p>

              {/* Price + button — always pinned to bottom */}
              <div className="flex items-end justify-between mt-4 pt-4 border-t border-[#E6D8BD] dark:border-[#374151]">
                <div className="flex flex-col">
                  <span className="font-bold text-[#2E7D32] dark:text-[#81C784] text-xl leading-tight">{product.price}</span>
                  <span className="text-xs text-[#5B3E31] dark:text-[#E6D8BD] max-w-[80px] leading-snug mt-0.5">{product.unit}</span>
                </div>
                <Link
                  href="/products"
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C] transition-colors whitespace-nowrap"
                >
                  View <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-14">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-forest-green font-semibold border-b-2 border-ghana-gold pb-0.5 hover:text-leaf-green transition-colors text-lg"
        >
          Browse All Products
          <span aria-hidden>→</span>
        </Link>
      </div>
    </SectionWrapper>
  );
}
