"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order, PublicOrderTracking } from "@/types";

type Props = { params: Promise<{ token: string }> };

const STEPS: Array<{ key: Order["status"]; label: string }> = [
  { key: "processing", label: "Preparing" },
  { key: "ready_for_dispatch", label: "Packed" },
  { key: "out_for_delivery", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_INDEX: Partial<Record<Order["status"], number>> = {
  paid: 0,
  processing: 0,
  ready_for_dispatch: 1,
  out_for_delivery: 2,
  shipped: 2,
  delivered: 3,
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusCopy(status: Order["status"]) {
  if (status === "delivered") return ["Delivered", "Your delivery has been completed."];
  if (status === "cancelled") return ["Delivery cancelled", "This delivery will not continue."];
  if (status === "out_for_delivery" || status === "shipped")
    return ["Your order is on the way", "The assigned driver has your produce."];
  return ["Preparing your delivery", "We will update this page as your order moves."];
}

function TrackingSkeleton() {
  return (
    <main className="min-h-[70vh] bg-[#F5F0E6] px-4 py-10 sm:py-16 dark:bg-[#141915]">
      <div className="mx-auto max-w-5xl animate-pulse space-y-5" aria-label="Loading delivery">
        <div className="h-44 bg-[#0D3B2A]/15 dark:bg-white/10" />
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-64 bg-white/70 dark:bg-white/5" />
          <div className="h-64 bg-white/70 dark:bg-white/5" />
        </div>
      </div>
    </main>
  );
}

export default function DeliveryTrackingPage({ params }: Props) {
  const { token } = use(params);
  const [delivery, setDelivery] = useState<PublicOrderTracking | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.orders
      .tracking(token)
      .then((data) => active && setDelivery(data))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Tracking is unavailable.");
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!delivery && !error) return <TrackingSkeleton />;

  if (!delivery) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#F5F0E6] px-4 py-16 dark:bg-[#141915]">
        <section className="w-full max-w-xl border border-[#0D3B2A]/20 bg-[#FFFEFA] p-7 sm:p-10 dark:border-white/15 dark:bg-[#202622]">
          <p className="text-xs font-bold tracking-[.14em] text-[#2E7D32] uppercase dark:text-[#F4C430]">
            Delivery tracking
          </p>
          <h1 className="display-organic mt-3 text-4xl text-[#0D3B2A] dark:text-white">
            This link is no longer available
          </h1>
          <p className="mt-4 text-[#5B3E31] dark:text-[#C7CEC8]">
            It may have expired or been replaced. Check your latest Legit Organic message, or ask us
            for help.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex min-h-11 items-center bg-[#0D3B2A] px-5 py-3 text-sm font-bold text-white outline-none hover:bg-[#174F3A] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 dark:bg-[#F4C430] dark:text-[#0D3B2A]"
          >
            Contact us
          </Link>
        </section>
      </main>
    );
  }

  const currentIndex = STATUS_INDEX[delivery.status] ?? 0;
  const [title, description] = statusCopy(delivery.status);

  return (
    <main className="min-h-[70vh] bg-[#F5F0E6] px-4 py-10 sm:py-16 dark:bg-[#141915]">
      <div className="mx-auto max-w-5xl">
        <header className="border-t-[6px] border-[#F4C430] bg-[#0D3B2A] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[.16em] text-[#F4C430] uppercase">
                Delivery tracking
              </p>
              <h1 className="display-organic mt-3 text-4xl text-white sm:text-5xl">{title}</h1>
              <p className="mt-3 max-w-xl text-sm text-[#D8E7DB] sm:text-base">{description}</p>
            </div>
            <div className="border-l border-white/25 pl-4 sm:text-right">
              <p className="text-xs text-[#B8D4BD]">Order reference</p>
              <p className="mt-1 font-mono text-sm font-bold text-white">{delivery.reference}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-5 py-5 lg:grid-cols-[1.55fr_1fr]">
          <section className="border border-[#D9D0C0] bg-[#FFFEFA] p-6 sm:p-8 dark:border-white/15 dark:bg-[#202622]">
            <h2 className="text-base font-bold text-[#0D3B2A] dark:text-white">
              Delivery progress
            </h2>
            {delivery.status === "cancelled" ? (
              <p className="mt-5 border-l-2 border-red-500 pl-4 text-sm text-red-700 dark:text-red-300">
                This delivery was cancelled. Contact us if you need more information.
              </p>
            ) : (
              <ol className="mt-6 space-y-0">
                {STEPS.map((step, index) => {
                  const complete = index < currentIndex || delivery.status === "delivered";
                  const current = index === currentIndex && delivery.status !== "delivered";
                  const event = delivery.timeline.find((item) => item.status === step.key);
                  return (
                    <li key={step.key} className="grid grid-cols-[32px_1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`grid size-8 place-items-center border text-xs font-bold ${
                            complete
                              ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                              : current
                                ? "border-[#D4A800] bg-[#F4C430] text-[#0D3B2A]"
                                : "border-[#C9BEAA] text-[#80786D] dark:border-white/20 dark:text-[#8E9990]"
                          }`}
                          aria-label={
                            complete ? "Completed" : current ? "Current stage" : "Pending"
                          }
                        >
                          {complete ? "✓" : index + 1}
                        </span>
                        {index < STEPS.length - 1 && (
                          <span
                            className={`min-h-12 w-px flex-1 ${complete ? "bg-[#2E7D32]" : "bg-[#D9D0C0] dark:bg-white/15"}`}
                          />
                        )}
                      </div>
                      <div className="pt-1 pb-7">
                        <p
                          className={`text-sm font-semibold ${complete || current ? "text-[#0D3B2A] dark:text-white" : "text-[#80786D] dark:text-[#8E9990]"}`}
                        >
                          {step.label}
                        </p>
                        {event && (
                          <p className="mt-1 text-xs text-[#6F675D] dark:text-[#AAB4AB]">
                            {formatDate(event.occurred_at)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="border-t border-[#E6D8BD] pt-4 text-xs text-[#6F675D] dark:border-white/15 dark:text-[#AAB4AB]">
              Last updated {formatDate(delivery.updated_at)}
            </p>
          </section>

          <aside className="space-y-5">
            <section className="border border-[#D9D0C0] bg-[#FFFEFA] p-6 dark:border-white/15 dark:bg-[#202622]">
              <h2 className="text-base font-bold text-[#0D3B2A] dark:text-white">Your driver</h2>
              {delivery.driver ? (
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-[#6F675D] dark:text-[#AAB4AB]">Name</dt>
                    <dd className="mt-1 font-semibold text-[#0D3B2A] dark:text-white">
                      {delivery.driver.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6F675D] dark:text-[#AAB4AB]">Vehicle</dt>
                    <dd className="mt-1 text-[#0D3B2A] dark:text-white">
                      {delivery.driver.vehicle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6F675D] dark:text-[#AAB4AB]">Contact</dt>
                    <dd className="mt-1">
                      <a
                        className="font-semibold text-[#2E7D32] underline underline-offset-4 dark:text-[#F4C430]"
                        href={`tel:${delivery.driver.phone_number}`}
                      >
                        {delivery.driver.phone_number}
                      </a>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-[#5B3E31] dark:text-[#C7CEC8]">
                  Driver details are being prepared.
                </p>
              )}
            </section>

            <section className="border border-[#D9D0C0] bg-[#FFFEFA] p-6 dark:border-white/15 dark:bg-[#202622]">
              <h2 className="text-base font-bold text-[#0D3B2A] dark:text-white">
                Delivery address
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#5B3E31] dark:text-[#C7CEC8]">
                {delivery.delivery_address}
              </p>
              {delivery.dispatched_at && (
                <p className="mt-4 text-xs text-[#6F675D] dark:text-[#AAB4AB]">
                  Dispatched {formatDate(delivery.dispatched_at)}
                </p>
              )}
            </section>
          </aside>
        </div>

        <p className="text-center text-xs text-[#6F675D] dark:text-[#AAB4AB]">
          This private link expires 24 hours after delivery. Do not share it publicly.
        </p>
      </div>
    </main>
  );
}
