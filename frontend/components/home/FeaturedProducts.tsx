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
            className="group bg-mist-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 border border-sand flex flex-col"
          >
            {/* Product image */}
            <div className="relative h-52 overflow-hidden bg-beige">
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
              <span className="text-leaf-green text-xs font-semibold uppercase tracking-wide">
                {product.category} · {product.region}
              </span>
              <h3 className="font-display text-lg font-bold text-forest-green mt-2 mb-3">
                {product.name}
              </h3>
              <p className="text-charcoal/70 text-sm leading-relaxed mb-5 flex-1 line-clamp-3">
                {product.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-sand">
                <div>
                  <span className="font-bold text-forest-green text-xl">{product.price}</span>
                  <span className="text-charcoal/50 text-xs ml-1">{product.unit}</span>
                </div>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-ghana-gold bg-ghana-gold/10 hover:bg-ghana-gold hover:text-forest-green px-4 py-2 rounded-lg transition-colors"
                >
                  View →
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
