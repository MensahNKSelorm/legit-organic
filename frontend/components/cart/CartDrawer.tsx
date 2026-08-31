"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { getMediaUrl } from "@/lib/media";
import { PRODUCT_BLUR_DATA_URL } from "@/lib/image-placeholders";
import { api } from "@/lib/api";
import type { PromoCode } from "@/types";
import CheckoutButton from "./CheckoutButton";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PLACEHOLDERS = [
  "/images/products/p1.webp",
  "/images/products/p2.webp",
  "/images/products/p3.webp",
  "/images/products/p4.webp",
];

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, total, itemCount, updateQuantity, removeItem } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const result = await api.orders.validatePromo(promoCode.trim(), total);
      setAppliedPromo(result);
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : "Invalid promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop — full screen, z-40 */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel — fixed, full viewport height, flex column */}
      <div
        id="shopping-cart-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={[
          "fixed top-0 right-0 z-50",
          "h-[100dvh] w-full max-w-lg",
          "flex flex-col overflow-hidden",
          "border-l border-[#0D3B2A]/15 bg-[#FAF7F0] shadow-[-12px_0_36px_rgba(13,59,42,.14)] dark:border-white/15 dark:bg-[#171B18] dark:shadow-[-12px_0_36px_rgba(0,0,0,.35)]",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* 1. Header — flex-shrink-0 */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#0D3B2A]/20 px-6 py-7 dark:border-white/15 md:px-8">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#2E7D32] dark:text-[#F4C430]">
              Current harvest
            </p>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2 className="display-organic text-4xl text-[#0D3B2A] dark:text-[#faf7f0]">
                Your market bag
              </h2>
              {itemCount > 0 && (
                <span className="text-sm font-semibold text-[#5B3E31] dark:text-[#9ca3af]">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close cart"
            className="w-11 h-11 flex items-center justify-center border border-[#0D3B2A]/20 hover:bg-[#0D3B2A] hover:text-white dark:border-white/20 dark:hover:bg-white dark:hover:text-[#0D3B2A] transition-colors text-[#0D3B2A] dark:text-[#faf7f0]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 2. Items list — flex-1, scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 md:px-8">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="relative mb-2 flex h-24 w-24 items-center justify-center border border-[#0D3B2A]/20 text-[#0D3B2A] dark:border-white/20 dark:text-[#F4C430]">
                <svg
                  viewBox="0 0 24 24"
                  width="52"
                  height="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4.5 8.5h15l-1.2 11H5.7l-1.2-11Z" />
                  <path d="M8.5 8.5c0-2.7 1.3-4.5 3.5-4.5s3.5 1.8 3.5 4.5" />
                  <path d="M8 13h8" />
                </svg>
                <span className="absolute -bottom-2 -right-2 h-5 w-5 bg-[#F4C430]" aria-hidden />
              </div>
              <h3 className="display-organic text-3xl text-[#0D3B2A] dark:text-white">
                Your bag is waiting.
              </h3>
              <p className="max-w-xs text-[#5B3E31] dark:text-[#B8D4BD]">
                Fill it with something fresh from the current harvest.
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="bg-[#F4C430] px-6 py-3 text-sm font-bold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 dark:hover:bg-white dark:hover:text-[#0D3B2A]"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => {
                const getProductImage = () => {
                  const p = item.product;
                  if (p.images && p.images.length > 0) {
                    return getMediaUrl(p.images[0].image) || "/images/products/p1.webp";
                  }
                  if (p.image) {
                    return getMediaUrl(p.image) || "/images/products/p1.webp";
                  }
                  return PLACEHOLDERS[p.id % PLACEHOLDERS.length];
                };
                const imageSrc = getProductImage();
                const subtotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);
                return (
                  <li
                    key={item.product.id}
                    className="flex gap-4 py-4 border-b border-[#E6D8BD] dark:border-[#374151] last:border-0"
                  >
                    {/* Product image */}
                    <div className="relative w-[76px] h-[88px] overflow-hidden bg-[#F5F0E6] dark:bg-[#273029] shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="76px"
                        placeholder="blur"
                        blurDataURL={PRODUCT_BLUR_DATA_URL}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0D3B2A] dark:text-[#faf7f0] leading-snug line-clamp-2">
                          {item.product.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          aria-label={`Remove ${item.product.name}`}
                          className="shrink-0 w-11 h-11 flex items-center justify-center text-[#9ca3af] hover:text-red-500 transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-[#5B3E31] dark:text-[#9ca3af] mt-0.5">
                        GH₵ {parseFloat(item.product.price).toFixed(2)} · {item.product.unit}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 border border-[#E6D8BD] dark:border-white/20 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            aria-label={`Decrease ${item.product.name} quantity`}
                            className="w-9 h-9 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            aria-label={`Increase ${item.product.name} quantity`}
                            className="w-9 h-9 flex items-center justify-center text-[#0D3B2A] dark:text-[#faf7f0] hover:bg-[#F5F0E6] dark:hover:bg-[#374151] transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-bold text-[#2E7D32] dark:text-[#81C784]">
                          GH₵ {subtotal}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 3. Promo code section — shrink-0, above footer */}
        {items.length > 0 && (
          <div className="shrink-0 px-6 py-4 border-t border-[#E6D8BD] dark:border-white/15 md:px-8">
            <div className="flex gap-2">
              <input
                aria-label="Promo code"
                aria-invalid={Boolean(promoError)}
                aria-describedby={promoError ? "promo-code-error" : undefined}
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyPromo();
                }}
                placeholder="Promo code"
                disabled={!!appliedPromo}
                className="flex-1 border border-[#E6D8BD] bg-transparent px-3 py-2 text-sm text-[#0D3B2A] placeholder:text-[#5B3E31]/45 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25 dark:text-[#faf7f0] dark:placeholder:text-white/40 dark:focus:border-[#F4C430] dark:focus:ring-[#F4C430]"
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoLoading || !!appliedPromo || !promoCode.trim()}
                className="bg-[#0D3B2A] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#24553D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F4C430] dark:text-[#0D3B2A]"
              >
                {promoLoading ? "…" : "Apply"}
              </button>
            </div>
            {promoError && (
              <p id="promo-code-error" role="alert" className="mt-2 text-xs text-red-500">
                {promoError}
              </p>
            )}
            {appliedPromo && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#2E7D32] dark:text-[#81C784] font-medium">
                  {appliedPromo.code}: {appliedPromo.message}
                </span>
                <button
                  onClick={handleRemovePromo}
                  className="text-xs text-[#9ca3af] hover:text-red-500 transition-colors ml-2 shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Footer — flex-shrink-0, always at bottom */}
        <div className="shrink-0 min-h-fit px-6 pt-5 pb-6 border-t border-[#E6D8BD] dark:border-white/15 bg-[#F5F0E6] dark:bg-[#202621] md:px-8">
          {appliedPromo ? (
            <div className="mb-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5B3E31] dark:text-[#9ca3af]">Product subtotal</span>
                <span className="text-sm text-[#0D3B2A] dark:text-[#faf7f0]">
                  GH₵ {total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2E7D32] dark:text-[#81C784]">
                  Discount ({appliedPromo.code})
                </span>
                <span className="text-sm text-[#2E7D32] dark:text-[#81C784]">
                  −GH₵ {appliedPromo.discount_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-[#E6D8BD] dark:border-[#374151]">
                <span className="text-base font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">
                  Products after discount
                </span>
                <span className="text-xl font-bold text-[#2E7D32] dark:text-[#81C784]">
                  GH₵ {appliedPromo.final_amount.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-[#0D3B2A] dark:text-[#faf7f0]">
                Product subtotal
              </span>
              <span className="text-xl font-bold text-[#2E7D32] dark:text-[#81C784]">
                GH₵ {total.toFixed(2)}
              </span>
            </div>
          )}
          <p className="mb-4 border-l-2 border-[#F4C430] pl-3 text-xs leading-5 text-[#5B3E31] dark:text-[#B8D4BD]">
            Delivery arrangements and any applicable charge are confirmed using the address you
            provide.
          </p>
          <CheckoutButton
            onClose={onClose}
            promoCode={appliedPromo?.code}
            appliedPromo={appliedPromo}
          />
          <Link
            href="/products"
            onClick={onClose}
            className="mt-3 block text-center text-sm font-medium text-[#5B3E31] underline decoration-transparent underline-offset-4 transition-colors hover:text-[#0D3B2A] hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] dark:text-[#B8C0B9] dark:hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </>
  );
}
