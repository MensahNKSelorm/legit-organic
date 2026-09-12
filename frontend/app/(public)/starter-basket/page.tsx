import type { Metadata } from "next";
import StarterBasket from "@/components/starter/StarterBasket";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Ghanaian Kitchen Starter Basket",
  description:
    "Plan three familiar Ghanaian meals, see the current market price and add the complete basket in one step.",
  path: "/starter-basket",
});

export default function StarterBasketPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#0D3B2A] dark:bg-[#171B18] dark:text-white">
      <header className="bg-[#0D3B2A] px-6 pt-36 pb-16 text-white md:pb-24">
        <div className="page-container">
          <p className="text-xs font-bold tracking-[.18em] text-[#F4C430] uppercase">
            The Ghanaian kitchen starter basket
          </p>
          <h1 className="display-organic mt-5 max-w-5xl text-6xl leading-[.86] md:text-8xl">
            Three meals. One market run.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#D5E7D8]">
            Start with familiar meals, check today’s basket price and know your delivery day before
            checkout.
          </p>
        </div>
      </header>
      <main className="page-container py-16 md:py-24">
        <StarterBasket />
      </main>
    </div>
  );
}
