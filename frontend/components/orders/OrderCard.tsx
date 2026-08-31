"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Order, Product } from "@/types";
import { getMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";

const STEPS = [
  { key: "whatsapp_pending", label: "Order placed", icon: "order" },
  { key: "paid", label: "Payment confirmed", icon: "payment" },
  { key: "processing", label: "Being prepared", icon: "prepare" },
  { key: "ready_for_dispatch", label: "Packed", icon: "packed" },
  { key: "out_for_delivery", label: "On the way", icon: "delivery" },
  { key: "delivered", label: "Delivered", icon: "delivered" },
];

const STEP_ORDER = [
  "whatsapp_pending",
  "paid",
  "processing",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Awaiting payment",
    cls: "border-[#D7A90B]/35 bg-[#FFF8DC] text-[#765B00] dark:border-[#F4C430]/35 dark:bg-[#F4C430]/10 dark:text-[#FFE681]",
  },
  whatsapp_pending: {
    label: "Awaiting payment",
    cls: "border-[#D7A90B]/35 bg-[#FFF8DC] text-[#765B00] dark:border-[#F4C430]/35 dark:bg-[#F4C430]/10 dark:text-[#FFE681]",
  },
  paid: {
    label: "Payment confirmed",
    cls: "border-[#2E7D32]/25 bg-[#EDF7EE] text-[#215D26] dark:border-[#72B77A]/30 dark:bg-[#72B77A]/10 dark:text-[#A9E1AF]",
  },
  processing: {
    label: "Being prepared",
    cls: "border-[#2E7D32]/25 bg-[#EDF7EE] text-[#215D26] dark:border-[#72B77A]/30 dark:bg-[#72B77A]/10 dark:text-[#A9E1AF]",
  },
  ready_for_dispatch: {
    label: "Packed",
    cls: "border-[#D7A90B]/35 bg-[#FFF8DC] text-[#765B00] dark:border-[#F4C430]/35 dark:bg-[#F4C430]/10 dark:text-[#FFE681]",
  },
  out_for_delivery: {
    label: "Out for delivery",
    cls: "border-[#315A80]/25 bg-[#EEF5FA] text-[#294B6A] dark:border-[#78A9D2]/30 dark:bg-[#78A9D2]/10 dark:text-[#B6D7F2]",
  },
  shipped: {
    label: "On the way",
    cls: "border-[#315A80]/25 bg-[#EEF5FA] text-[#294B6A] dark:border-[#78A9D2]/30 dark:bg-[#78A9D2]/10 dark:text-[#B6D7F2]",
  },
  delivered: {
    label: "Delivered",
    cls: "border-[#2E7D32]/25 bg-[#E8F5E9] text-[#215D26] dark:border-[#72B77A]/30 dark:bg-[#72B77A]/10 dark:text-[#A9E1AF]",
  },
  cancelled: {
    label: "Cancelled",
    cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StatusIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "order")
    return (
      <svg {...common} aria-hidden>
        <path d="M7 3h10v4H7z" />
        <path d="M5 5H4v16h16V5h-1" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    );
  if (name === "payment")
    return (
      <svg {...common} aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </svg>
    );
  if (name === "prepare")
    return (
      <svg {...common} aria-hidden>
        <path d="M12 21V10M12 14c-4 0-7-2-7-6 4 0 7 2 7 6ZM12 11c4 0 7-2 7-6-4 0-7 2-7 6Z" />
      </svg>
    );
  if (name === "packed")
    return (
      <svg {...common} aria-hidden>
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9M8 5.25l8 4.5" />
      </svg>
    );
  if (name === "delivery")
    return (
      <svg {...common} aria-hidden>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  return (
    <svg {...common} aria-hidden>
      <path d="m5 12 4 4L19 6" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-[#2E7D32] dark:text-[#F4C430]"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const getProductImage = (product: Order["items"][number]["product"] | Product): string => {
  if (!product) return "/images/products/p1.webp";
  if ("images" in product && product.images && product.images.length > 0) {
    return getMediaUrl(product.images[0].image) || "/images/products/p1.webp";
  }
  if (product.image) {
    return getMediaUrl(product.image) || "/images/products/p1.webp";
  }
  return "/images/products/p1.webp";
};

export default function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [receiptState, setReceiptState] = useState<"idle" | "loading" | "error">("idle");

  const handleDownloadReceipt = async () => {
    setReceiptState("loading");
    try {
      // Receipt now requires authentication, so fetch it as an authenticated blob
      // and trigger a client-side download rather than linking to the API directly.
      const blob = await api.orders.downloadReceipt(order.reference);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LegitOrganic_Receipt_${order.reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setReceiptState("idle");
    } catch {
      setReceiptState("error");
    }
  };

  const trackerStatus =
    order.status === "pending"
      ? "whatsapp_pending"
      : order.status === "shipped"
        ? "out_for_delivery"
        : order.status;
  const currentStep = STEP_ORDER.indexOf(trackerStatus);
  const isCancelled = order.status === "cancelled";
  const isSubscription = order.order_source === "subscription";
  const badge = STATUS_BADGE[order.status] ?? {
    label: order.status,
    cls: "bg-gray-100 text-gray-700",
  };

  const stepCompleted = (idx: number) => {
    if (order.status === "delivered") return true;
    if (order.status === "cancelled") return false;
    return idx < currentStep;
  };
  const stepCurrent = (idx: number) => {
    if (order.status === "delivered") return false;
    if (order.status === "cancelled") return false;
    return idx === currentStep;
  };

  return (
    <article
      className={[
        "relative overflow-hidden border bg-[#FFFEFA] transition-colors duration-300 dark:bg-[#202622]",
        expanded
          ? "border-[#2E7D32]"
          : "border-[#D9D0C0] hover:border-[#9CB09F] dark:border-white/15 dark:hover:border-white/30",
      ].join(" ")}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${isSubscription ? "bg-[#F4C430]" : "bg-[#2E7D32]"}`}
      />

      {/* ── Header (always visible, click to toggle) ── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-6 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E7D32]"
      >
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#2E7D32] dark:text-[#F4C430]">
              {isSubscription ? "Weekly delivery" : "Market order"}
            </span>
            <span className={`border px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-sm font-bold tracking-tight text-[#0D3B2A] dark:text-white">
              {order.reference}
            </span>
            <span className="text-xs text-[#6F675D] dark:text-[#B8C0B9]">
              Placed {formatDate(order.created_at)}
            </span>
          </div>
        </div>
        <span className="hidden text-right sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#81786C] dark:text-[#AAB4AB]">
            Order total
          </span>
          <span className="mt-1 block text-lg font-semibold text-[#0D3B2A] dark:text-white">
            GH₵ {parseFloat(order.total_amount).toFixed(2)}
          </span>
        </span>

        {/* Chevron */}
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={[
            "shrink-0 text-[#0D3B2A] transition-transform duration-300 dark:text-white",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Expandable body ── */}
      <div
        className={[
          "overflow-hidden transition-all duration-500 ease-in-out",
          expanded ? "max-h-[1800px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="space-y-6 border-t border-[#D9D0C0] px-6 pb-6 dark:border-white/15">
          {/* ── Progress tracker ── */}
          {!isCancelled && (
            <div className="pt-5">
              {/* Delivered celebration banner */}
              {order.status === "delivered" && (
                <div className="mb-6 flex items-center gap-3 border border-[#2E7D32]/25 bg-[#EDF7EE] p-4 dark:border-[#72B77A]/25 dark:bg-[#72B77A]/10">
                  <span className="grid size-9 shrink-0 place-items-center bg-[#2E7D32] text-white">
                    <StatusIcon name="delivered" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#0D3B2A] dark:text-white">Order delivered</p>
                    <p className="text-sm text-[#2E7D32] dark:text-[#B9DDBD]">
                      Thank you for choosing Legit Organic. We hope you enjoy your fresh organic
                      produce!
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop: horizontal stepper */}
              <div className="hidden sm:flex items-start">
                {STEPS.map((step, idx) => {
                  const isCompleted = stepCompleted(idx);
                  const isCurrent = stepCurrent(idx);
                  const isLast = idx === STEPS.length - 1;

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {/* Connecting line — spans from center of this circle to center of next */}
                      {!isLast && (
                        <div className="absolute top-[18px] left-1/2 right-[-50%] z-0 h-[2px] overflow-hidden bg-[#E6D8BD] dark:bg-white/15">
                          <div
                            className="absolute inset-y-0 left-0 bg-[#2E7D32] transition-all duration-700"
                            style={{
                              width: expanded && isCompleted ? "100%" : "0%",
                              transitionDelay: expanded ? `${idx * 180}ms` : "0ms",
                            }}
                          />
                        </div>
                      )}

                      {/* Circle */}
                      <div
                        className={[
                          "relative z-10 flex size-9 items-center justify-center border transition-all duration-300",
                          isCompleted
                            ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                            : isCurrent
                              ? "border-[#D4A800] bg-[#F4C430] text-[#0D3B2A] shadow-[0_0_0_5px_rgba(244,196,48,.18),0_0_24px_rgba(244,196,48,.28)]"
                              : "border-[#D9D0C0] bg-[#F7F3EA] text-[#9B958C] dark:border-white/15 dark:bg-white/[.04] dark:text-[#7F8A82]",
                        ].join(" ")}
                      >
                        {isCompleted ? <CheckIcon /> : <StatusIcon name={step.icon} />}
                      </div>

                      {/* Label */}
                      <span
                        className={[
                          "mt-2 text-xs text-center leading-snug px-1",
                          isCompleted || isCurrent
                            ? "font-semibold text-[#0D3B2A] dark:text-white"
                            : "text-[#9CA3AF] dark:text-[#7F8A82]",
                        ].join(" ")}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile: vertical stepper */}
              <div className="sm:hidden">
                {STEPS.map((step, idx) => {
                  const isCompleted = stepCompleted(idx);
                  const isCurrent = stepCurrent(idx);
                  const isLast = idx === STEPS.length - 1;

                  return (
                    <div key={step.key} className="flex gap-3">
                      {/* Track column */}
                      <div className="flex flex-col items-center">
                        <div
                          className={[
                            "flex size-8 shrink-0 items-center justify-center border transition-all duration-300",
                            isCompleted
                              ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                              : isCurrent
                                ? "border-[#D4A800] bg-[#F4C430] text-[#0D3B2A] shadow-[0_0_0_5px_rgba(244,196,48,.18)]"
                                : "border-[#D9D0C0] bg-[#F7F3EA] text-[#9B958C] dark:border-white/15 dark:bg-white/[.04] dark:text-[#7F8A82]",
                          ].join(" ")}
                        >
                          {isCompleted ? <CheckIcon /> : <StatusIcon name={step.icon} />}
                        </div>
                        {!isLast && (
                          <div className="my-1 min-h-[20px] w-[2px] flex-1 overflow-hidden bg-[#E6D8BD] dark:bg-white/15">
                            <div
                              className="w-full bg-[#2E7D32] transition-all duration-700"
                              style={{
                                height: expanded && isCompleted ? "100%" : "0%",
                                transitionDelay: expanded ? `${idx * 180}ms` : "0ms",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Step label */}
                      <p
                        className={[
                          "text-sm font-medium leading-snug mt-1 pb-5",
                          isCompleted || isCurrent
                            ? "font-semibold text-[#0D3B2A] dark:text-white"
                            : "text-[#9CA3AF] dark:text-[#7F8A82]",
                        ].join(" ")}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="flex items-center gap-3 border border-red-200 bg-red-50 px-4 py-3 pt-5">
              <span className="grid size-8 place-items-center bg-red-100 text-red-700">
                <CloseIcon />
              </span>
              <span className="text-sm text-red-700 font-medium">This order was cancelled.</span>
            </div>
          )}

          {/* ── Order items ── */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5B3E31] dark:text-[#C7CEC8]">
              Items
            </p>
            <ul className="space-y-3">
              {order.items.map((item) => {
                if (!item.product) return null;
                const imageSrc = getProductImage(item.product);
                const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden bg-[#F5F0E6] dark:bg-white/[.06]">
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-[#0D3B2A] dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#5B3E31] dark:text-[#AAB4AB]">
                        {item.quantity} × GH₵ {parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#2E7D32] dark:text-[#F4C430]">
                      GH₵ {subtotal}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Total ── */}
          <div className="flex items-center justify-between border-t border-[#E6D8BD] py-3 dark:border-white/15">
            <span className="text-sm text-[#5B3E31] dark:text-[#C7CEC8]">
              {order.discount_amount && parseFloat(order.discount_amount) > 0
                ? "Total (after discount)"
                : "Total"}
            </span>
            <span className="font-bold text-[#2E7D32] dark:text-[#F4C430]">
              GH₵ {parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>

          {/* ── Delivery address ── */}
          {order.delivery_address && (
            <div className="flex gap-2 text-sm text-[#5B3E31] dark:text-[#C7CEC8]">
              <PinIcon />
              <span>{order.delivery_address}</span>
            </div>
          )}

          {/* ── Download Receipt ── */}
          <div className="mt-4 flex flex-col gap-3 border-t border-[#D9D0C0] pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/15">
            {isSubscription ? (
              <Link
                href="/subscriptions/manage"
                className="text-sm font-bold text-[#2E7D32] underline decoration-[#2E7D32]/30 underline-offset-4 outline-none hover:decoration-[#2E7D32] focus-visible:ring-2 focus-visible:ring-[#F4C430] dark:text-[#F4C430]"
              >
                Manage weekly deliveries
              </Link>
            ) : (
              <span />
            )}
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                disabled={receiptState === "loading"}
                className="inline-flex items-center gap-2 bg-[#0D3B2A] px-4 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#1a5c40] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {receiptState === "loading" ? "Preparing…" : "Download Receipt"}
              </button>
              {receiptState === "error" && (
                <span className="text-xs text-red-600">
                  Could not download receipt. Please try again.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
