"use client";

import { useRouter } from "next/navigation";
import type { BlogCategory } from "@/types";

interface Props {
  categories: BlogCategory[];
  activeCategory?: string;
}

export default function BlogCategoryFilter({ categories, activeCategory }: Props) {
  const router = useRouter();

  const base = "journal-desk-link";
  const active = "journal-desk-link--active";
  const inactive = "";

  return (
    <nav className="journal-desks" aria-label="Journal desks">
      <button
        onClick={() => router.push("/blog")}
        className={[base, !activeCategory ? active : inactive].join(" ")}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => router.push(`/blog?category=${cat.slug}`)}
          className={[base, activeCategory === cat.slug ? active : inactive].join(" ")}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
