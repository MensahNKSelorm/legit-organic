"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import type { Product, SubscriptionPlan } from "@/types";
import DeliveryPromise from "@/components/delivery/DeliveryPromise";
import { trackGrowth } from "@/lib/growth";

const MEALS = [
  ["Tomato stew + rice", "/recipes/tomato-stew"],
  ["Fufu + light soup", "/recipes/combined?q=fufu%2C%20light%20soup"],
  ["Garden egg stew + yam", "/recipes/garden-egg-stew"],
] as const;

const STARTER_CONTENTS = [
  ["Tomatoes", 2],
  ["Onion", 2],
  ["Rice (Local Perfume)", 1],
  ["Yam", 1],
  ["Garden Eggs", 2],
  ["Beef", 1],
  ["Ginger", 1],
  ["Garlic", 1],
  ["Chilli Pepper", 1],
  ["Cassava", 1],
] as const;

export default function StarterBasket() {
  const { addItem } = useCart();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    Promise.all([api.subscriptions.plans(), api.products.list()])
      .then(([plans, market]) => {
        setPlan(
          plans.find((item) => item.slug.includes("family")) ||
            plans.find((item) => item.plan_type === "curated") ||
            null
        );
        setProducts(market);
      })
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    const market = new Map(products.map((product) => [product.id, product]));
    const configured = (plan?.items || []).flatMap((item) => {
      const product = market.get(item.product.id);
      return product ? [{ product, quantity: item.quantity }] : [];
    });
    if (configured.length) return configured;
    return STARTER_CONTENTS.flatMap(([name, quantity]) => {
      const product = products.find((item) => item.name.toLowerCase() === name.toLowerCase());
      return product ? [{ product, quantity }] : [];
    });
  }, [plan, products]);
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const addAll = () => {
    items.forEach((item) => addItem(item.product, item.quantity));
    trackGrowth("add_to_cart", {
      object_type: "offer",
      object_label: "Ghanaian Kitchen Starter Basket",
    });
    setAdded(true);
  };

  if (loading)
    return (
      <div className="py-24 text-center text-[#5B3E31] dark:text-[#B8D4BD]">
        Loading this week’s basket…
      </div>
    );
  if (!plan || !items.length)
    return (
      <div className="py-24 text-center">
        <p className="text-[#5B3E31] dark:text-[#B8D4BD]">The starter basket is being prepared.</p>
        <Link
          href="/products"
          className="mt-5 inline-block font-bold text-[#2E7D32] dark:text-[#F4C430]"
        >
          Shop the market →
        </Link>
      </div>
    );

  return (
    <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
      <div>
        <p className="text-xs font-bold tracking-[.16em] text-[#2E7D32] uppercase dark:text-[#F4C430]">
          Three familiar meals
        </p>
        <ol className="mt-6 border-t border-[#0D3B2A]/20 dark:border-white/15">
          {MEALS.map(([name, href], index) => (
            <li
              key={name}
              className="flex items-center gap-4 border-b border-[#0D3B2A]/20 py-5 dark:border-white/15"
            >
              <span className="text-sm text-[#5B3E31] dark:text-[#B8D4BD]">0{index + 1}</span>
              <Link
                href={href}
                className="text-lg font-semibold hover:text-[#2E7D32] dark:hover:text-[#F4C430]"
              >
                {name}
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm leading-6 text-[#5B3E31] dark:text-[#B8D4BD]">
          Use the recipes as a guide. The basket contains purchasable market packs, so you can
          adjust quantities in your bag.
        </p>
      </div>
      <div className="bg-[#0D3B2A] p-6 text-white md:p-10">
        <div className="flex items-end justify-between gap-6 border-b border-white/20 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[.16em] text-[#F4C430] uppercase">
              {plan.name}
            </p>
            <h2 className="display-organic mt-2 text-5xl">Your week, gathered</h2>
          </div>
          <strong className="text-2xl whitespace-nowrap text-[#F4C430]">
            GH₵ {total.toFixed(2)}
          </strong>
        </div>
        <ul className="divide-y divide-white/15">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-4 py-4 text-sm">
              <span>
                {product.name}
                <small className="ml-2 text-white/55">{product.unit}</small>
              </span>
              <strong>× {quantity}</strong>
            </li>
          ))}
        </ul>
        <button
          onClick={addAll}
          disabled={added}
          className="mt-7 min-h-14 w-full bg-[#F4C430] px-6 font-bold text-[#0D3B2A] transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:bg-[#82C68A]"
        >
          {added ? "Basket added ✓" : `Add ${items.length} items to my bag`}
        </button>
        <div className="mt-7">
          <DeliveryPromise compact inverted subtotal={total} />
        </div>
      </div>
    </div>
  );
}
