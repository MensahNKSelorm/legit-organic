"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { BusinessPriceList, BusinessSupplyAgreement, Order, WholesaleQuote } from "@/types";

const ORDER_LABELS: Record<Order["status"], string> = {
  pending: "Pending",
  whatsapp_pending: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  ready_for_dispatch: "Packed",
  out_for_delivery: "Out for delivery",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function B2BDashboardPage() {
  const { isB2B, b2bProfile, isLoading } = useAuth();
  const router = useRouter();
  const [prices, setPrices] = useState<BusinessPriceList | null>(null);
  const [quotes, setQuotes] = useState<WholesaleQuote[]>([]);
  const [agreements, setAgreements] = useState<BusinessSupplyAgreement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState("");

  useEffect(() => {
    if (!isLoading && !isB2B && !b2bProfile) router.replace("/b2b/apply");
  }, [isLoading, isB2B, b2bProfile, router]);
  const loadDashboard = useCallback(async () => {
    if (!isB2B) return;
    setDataLoading(true);
    setDataError("");
    const [priceResult, quoteResult, supplyResult, orderResult] = await Promise.allSettled([
      api.b2b.prices(),
      api.subscriptions.quotes.list(),
      api.b2b.supply.list(),
      api.orders.myOrders(),
    ]);
    if (priceResult.status === "fulfilled") setPrices(priceResult.value.price_list);
    if (quoteResult.status === "fulfilled") setQuotes(quoteResult.value);
    if (supplyResult.status === "fulfilled") setAgreements(supplyResult.value);
    if (orderResult.status === "fulfilled") setOrders(orderResult.value);
    if (
      [priceResult, quoteResult, supplyResult, orderResult].some(
        (result) => result.status === "rejected"
      )
    ) {
      setDataError("Some business information could not be refreshed.");
    }
    setDataLoading(false);
  }, [isB2B]);

  useEffect(() => {
    Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  const downloadReceipt = async (order: Order) => {
    setReceiptBusy(order.reference);
    setReceiptError("");
    try {
      const blob = await api.orders.downloadReceipt(order.reference);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.reference}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setReceiptError("That receipt could not be prepared. Please try again.");
    } finally {
      setReceiptBusy(null);
    }
  };

  if (isLoading || !b2bProfile)
    return <div className="min-h-screen bg-[#F4EFE4] pt-32 dark:bg-[#171B18]" />;

  if (b2bProfile.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#F4EFE4] pb-24 pt-32 text-[#173C2A] dark:bg-[#171B18] dark:text-white">
        <div className="page-container max-w-3xl">
          <p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Business account</p>
          <h1 className="display-organic mt-3 text-5xl leading-[.92] md:text-7xl">
            {b2bProfile.status_display}
          </h1>
          <p className="mt-6 max-w-xl text-[#675E52] dark:text-[#AFC0B2]">
            Purchasing tools are unavailable while this account is being reviewed. Contact us if you
            need help with the application.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block bg-[#173C2A] px-5 py-3 text-sm font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]"
          >
            Contact the team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36">
      <div className="page-container">
        <header className="grid gap-10 border-b border-[#C9BEAA] pb-10 lg:grid-cols-[1fr_auto] lg:items-end dark:border-white/15">
          <div>
            <p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">Business account</p>
            <h1 className="display-organic mt-3 text-5xl leading-[.9] md:text-7xl">
              {b2bProfile.company_name}
            </h1>
            <p className="mt-4 text-sm text-[#675E52] dark:text-[#AFC0B2]">
              Approved{" "}
              {b2bProfile.registration_status === "informal" ? "owner-operated" : "organisation"}{" "}
              account · {b2bProfile.business_type_display}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/b2b/supply"
              className="bg-[#173C2A] px-5 py-3 text-sm font-bold text-white dark:bg-[#F4C430] dark:text-[#173C2A]"
            >
              New supply request
            </Link>
            <Link
              href="/b2b/quote"
              className="border border-[#9D927F] px-5 py-3 text-sm font-bold dark:border-white/25"
            >
              Request a quote
            </Link>
          </div>
        </header>

        {dataError && (
          <div className="flex flex-col gap-3 border-b border-[#C9BEAA] py-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/15">
            <p>{dataError}</p>
            <button
              type="button"
              onClick={loadDashboard}
              className="w-fit border-b border-current font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-px border-b border-[#C9BEAA] bg-[#C9BEAA] py-px sm:grid-cols-4 dark:border-white/15 dark:bg-white/15">
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]">
            <p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">
              Price list
            </p>
            <p className="mt-2 text-xl font-semibold">
              {prices?.name || "Standard business prices"}
            </p>
          </div>
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]">
            <p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">
              Open quotes
            </p>
            <p className="mt-2 text-xl font-semibold">
              {
                quotes.filter(
                  (quote) => !["declined", "expired", "converted"].includes(quote.status)
                ).length
              }
            </p>
          </div>
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]">
            <p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">
              Supply agreements
            </p>
            <p className="mt-2 text-xl font-semibold">
              {agreements.filter((row) => row.status === "active").length} active
            </p>
          </div>
          <div className="bg-[#F4EFE4] py-8 sm:px-6 dark:bg-[#171B18]">
            <p className="text-xs uppercase tracking-[.14em] text-[#756D61] dark:text-[#98A59B]">
              Payments due
            </p>
            <p className="mt-2 text-xl font-semibold">
              {
                agreements
                  .flatMap((row) => row.cycles)
                  .filter((cycle) => cycle.status === "payment_due").length
              }
            </p>
          </div>
        </section>

        <div className="grid gap-14 pt-14 lg:grid-cols-[1.2fr_.8fr]">
          <section>
            <div className="flex items-end justify-between border-b border-[#C9BEAA] pb-4 dark:border-white/15">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-.03em]">Tomatoes and onions</h2>
                <p className="mt-1 text-xs text-[#756D61] dark:text-[#98A59B]">
                  Approved pack sizes and business pricing.
                </p>
              </div>
              <Link href="/b2b/quote" className="text-sm font-bold">
                Request quote →
              </Link>
            </div>
            {prices?.prices.length ? (
              <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">
                {prices.prices.slice(0, 8).map((price) => (
                  <div key={price.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                    <div>
                      <p className="font-semibold">{price.product.name}</p>
                      <p className="text-xs text-[#756D61] dark:text-[#98A59B]">
                        Minimum {price.minimum_quantity} · {price.product.unit}
                      </p>
                    </div>
                    <p className="font-semibold">GH₵{Number(price.unit_price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-sm text-[#675E52] dark:text-[#AFC0B2]">
                Tomato and onion pricing will appear here when your price list is ready.
              </p>
            )}
          </section>

          <section>
            <h2 className="border-b border-[#C9BEAA] pb-4 text-2xl font-semibold tracking-[-.03em] dark:border-white/15">
              Quotes
            </h2>
            {quotes.length ? (
              <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">
                {quotes.slice(0, 5).map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold">Quote #{quote.id}</p>
                      <p className="text-xs text-[#756D61] dark:text-[#98A59B]">
                        {quote.items.length} items
                      </p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[.12em]">
                      {quote.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10">
                <p className="text-sm text-[#675E52] dark:text-[#AFC0B2]">No quote requests.</p>
                <Link
                  href="/b2b/quote"
                  className="mt-4 inline-block border-b border-current text-sm font-bold"
                >
                  Start one
                </Link>
              </div>
            )}
          </section>
        </div>

        <section className="mt-16 border-t border-[#C9BEAA] pt-8 dark:border-white/15">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#C9BEAA] pb-4 dark:border-white/15">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-.03em]">Supply agreements</h2>
              <p className="mt-1 text-sm text-[#675E52] dark:text-[#AFC0B2]">
                Bulk schedules, approvals and upcoming payment windows.
              </p>
            </div>
            <Link
              href="/b2b/supply"
              className="bg-[#173C2A] px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430] dark:bg-[#F4C430] dark:text-[#173C2A]"
            >
              Create request
            </Link>
          </div>
          {dataLoading ? (
            <p className="py-8 text-sm text-[#675E52] dark:text-[#AFC0B2]">
              Loading supply agreements…
            </p>
          ) : agreements.length ? (
            <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">
              {agreements.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 py-5 sm:grid-cols-[1.2fr_.8fr_.7fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-[#756D61] dark:text-[#98A59B]">
                      {row.delivery_zone_detail.name} · {row.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#756D61] dark:text-[#98A59B]">Next delivery</p>
                    <p className="text-sm font-semibold">
                      {row.next_delivery_date || "Not scheduled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#756D61] dark:text-[#98A59B]">Status</p>
                    <p className="text-sm font-semibold capitalize">
                      {row.status.replace("_", " ")}
                    </p>
                  </div>
                  <Link
                    href={`/b2b/supply/manage?id=${row.id}`}
                    className="text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                  >
                    Manage
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <p className="font-semibold">No supply agreement yet.</p>
              <p className="mt-1 text-sm text-[#675E52] dark:text-[#AFC0B2]">
                Submit the quantities and delivery rhythm your operation needs.
              </p>
            </div>
          )}
        </section>

        <section className="mt-16 border-t border-[#C9BEAA] pt-8 dark:border-white/15">
          <div className="flex items-end justify-between border-b border-[#C9BEAA] pb-4 dark:border-white/15">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-.03em]">Orders and receipts</h2>
              <p className="mt-1 text-sm text-[#675E52] dark:text-[#AFC0B2]">
                The latest purchases made through this account.
              </p>
            </div>
            <Link href="/profile" className="text-sm font-bold">
              Full history →
            </Link>
          </div>
          {receiptError && (
            <p
              role="alert"
              className="border-b border-[#C9BEAA] py-3 text-sm text-red-700 dark:border-white/15 dark:text-red-300"
            >
              {receiptError}
            </p>
          )}
          {dataLoading ? (
            <p className="py-8 text-sm text-[#675E52] dark:text-[#AFC0B2]">Loading orders…</p>
          ) : orders.length ? (
            <div className="divide-y divide-[#D8CEBC] dark:divide-white/15">
              {orders.slice(0, 6).map((order) => (
                <article
                  key={order.id}
                  className="grid gap-3 py-5 sm:grid-cols-[1.1fr_.7fr_.6fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.reference}</p>
                    <p className="text-xs text-[#756D61] dark:text-[#98A59B]">
                      {new Date(order.created_at).toLocaleDateString("en-GH", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{ORDER_LABELS[order.status]}</p>
                  <p className="text-sm font-semibold">
                    GH₵{Number(order.total_amount).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    disabled={receiptBusy === order.reference}
                    onClick={() => downloadReceipt(order)}
                    className="w-fit text-sm font-bold underline-offset-4 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                  >
                    {receiptBusy === order.reference ? "Preparing…" : "Receipt"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <p className="font-semibold">No completed purchasing history.</p>
              <Link href="/b2b/quote" className="mt-2 inline-block text-sm font-bold underline">
                Request tomato or onion pricing
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
