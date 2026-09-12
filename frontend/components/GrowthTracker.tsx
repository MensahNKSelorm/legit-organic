"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackGrowth } from "@/lib/growth";

export function GrowthTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackGrowth("page_view");
    const product = pathname.match(/^\/products\/([^/]+)$/)?.[1];
    const recipe = pathname.match(/^\/recipes\/([^/]+)$/)?.[1];
    if (product) {
      trackGrowth("product_view", { object_type: "product", object_label: product });
    } else if (recipe) {
      trackGrowth("recipe_view", { object_type: "recipe", object_label: recipe });
    }
  }, [pathname]);

  return null;
}
