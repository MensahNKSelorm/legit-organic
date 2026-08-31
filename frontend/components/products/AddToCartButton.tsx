"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import type { ProductDetail } from "@/types";

interface AddToCartButtonProps {
  product: ProductDetail;
}

export function WishlistButton({ productId }: { productId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, removeItem, isInWishlist, items } = useWishlist();
  const [loading, setLoading] = useState(false);

  const inWishlist = isInWishlist(productId);
  const wishlistItem = items.find((i) => i.product.id === productId);

  const handleClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (inWishlist && wishlistItem) {
        await removeItem(wishlistItem.id);
      } else {
        await addItem(productId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={[
        "w-full border font-semibold px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2",
        inWishlist
          ? "border-red-400 bg-red-50 text-red-500 dark:bg-red-950/30 dark:border-red-500 dark:text-red-400"
          : "border-[#0D3B2A] dark:border-[#81C784] text-[#0D3B2A] dark:text-[#81C784] hover:bg-[#0D3B2A]/5",
        loading ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : inWishlist ? (
        <>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Save to My List
        </>
      )}
    </button>
  );
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem, isInCart, items, updateQuantity } = useCart();
  const { isB2B } = useAuth();
  const inCart = isInCart(product.id);
  const cartItem = items.find((i) => i.product.id === product.id);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isB2B) {
    return (
      <button
        type="button"
        onClick={() => router.push("/b2b/supply")}
        className="w-full bg-[#F4C430] px-6 py-3 font-semibold text-[#0D3B2A] transition-colors hover:bg-[#C59F2C]"
      >
        Add to supply request
      </button>
    );
  }

  if (!product.is_available) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed bg-[#D8D1C3] px-6 py-3 font-semibold text-[#5B3E31] dark:bg-white/10 dark:text-white/55"
      >
        Currently unavailable
      </button>
    );
  }

  if (inCart && cartItem) {
    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center gap-1 border border-[#2E7D32] overflow-hidden">
          <button
            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
            aria-label="Decrease quantity"
            className="w-10 h-11 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold text-lg"
          >
            −
          </button>
          <span className="w-10 text-center font-bold text-[#0D3B2A] dark:text-[#faf7f0]">
            {cartItem.quantity}
          </span>
          <button
            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
            aria-label="Increase quantity"
            className="w-10 h-11 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold text-lg"
          >
            +
          </button>
        </div>
        <span className="text-[#2E7D32] dark:text-[#81C784] text-sm font-semibold">In Cart ✓</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={[
        "w-full font-semibold px-6 py-3 transition-all duration-300",
        added ? "bg-[#2E7D32] text-white" : "bg-[#F4C430] text-[#0D3B2A] hover:bg-[#C59F2C]",
      ].join(" ")}
    >
      {added ? "Added to Cart ✓" : "Add to Cart"}
    </button>
  );
}

export function MobilePurchaseBar({ product }: AddToCartButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const purchaseActions = document.getElementById("primary-purchase-actions");
    if (!purchaseActions || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(purchaseActions);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#0D3B2A]/20 bg-[#FAF7F0]/98 px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(13,59,42,.12)] backdrop-blur md:hidden dark:border-white/15 dark:bg-[#171B18]/98",
        "transition-transform duration-200 motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      ].join(" ")}
    >
      <div className="mx-auto grid max-w-lg grid-cols-[auto_1fr] items-center gap-4">
        <div>
          <strong className="block text-lg leading-tight text-[#2E7D32] dark:text-[#F4C430]">
            GH₵ {product.price}
          </strong>
          <span className="block max-w-28 truncate text-xs text-[#5B3E31] dark:text-[#B8D4BD]">
            {product.unit}
          </span>
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
