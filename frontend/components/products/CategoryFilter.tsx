"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
}

export default function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  const router = useRouter();
  const navigate = (slug: string) =>
    router.push(slug ? `/products?category=${slug}#market-grid` : "/products#market-grid");
  const items = [{ id: 0, name: "Everything", slug: "" }, ...categories];

  return (
    <div className="overflow-x-auto border-y border-[#0D3B2A]/20 dark:border-white/15">
      <div className="flex min-w-max items-center gap-8 md:gap-12">
        {items.map((item) => {
          const active = activeCategory === item.slug;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.slug)}
              className={`relative py-5 text-sm font-bold transition-colors ${active ? "text-[#0D3B2A] dark:text-[#F4C430]" : "text-[#5B3E31]/60 hover:text-[#2E7D32] dark:text-[#B8D4BD]/70 dark:hover:text-white"}`}
            >
              {item.name}
              {active && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#F4C430]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
