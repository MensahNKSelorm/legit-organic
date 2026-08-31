"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DeliveryZone, Product } from "@/types";

export default function BusinessSupplyRequestPage() {
  const { isB2B, b2bProfile, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [name, setName] = useState("Core produce supply");
  const [frequency, setFrequency] = useState<"weekly" | "fortnightly" | "monthly">("weekly");
  const [zone, setZone] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [receivingHours, setReceivingHours] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isB2B) router.replace("/b2b/apply");
  }, [isB2B, isLoading, router]);
  useEffect(() => {
    Promise.all([api.products.list("business_supply=true"), api.subscriptions.zones()])
      .then(([productRows, zoneRows]) => {
        setProducts(productRows);
        setZones(zoneRows);
        if (zoneRows[0]) setZone(String(zoneRows[0].id));
      })
      .catch(() => setError("Supply options could not be loaded. Please retry."));
  }, []);
  useEffect(() => {
    if (!b2bProfile) return;
    void Promise.resolve().then(() => {
      setAddress(b2bProfile.business_address || "");
      setContactName(b2bProfile.contact_person || "");
      setContactPhone(b2bProfile.business_phone || "");
    });
  }, [b2bProfile]);

  const chosen = useMemo(
    () => Object.entries(quantities).filter(([, quantity]) => quantity > 0),
    [quantities]
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!chosen.length || !zone) {
      setError("Choose at least one product and a delivery area.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.b2b.supply.create({
        name,
        frequency,
        delivery_zone: Number(zone),
        delivery_address: address,
        receiving_contact_name: contactName,
        receiving_contact_phone: contactPhone,
        receiving_hours: receivingHours,
        delivery_instructions: instructions,
        items: chosen.map(([id, quantity]) => ({ product_id: Number(id), quantity })),
      });
      router.push("/b2b/dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The supply request could not be sent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4EFE4] pb-24 pt-28 text-[#173C2A] dark:bg-[#171B18] dark:text-white md:pt-36">
      <form onSubmit={submit} className="page-container grid gap-14 xl:grid-cols-[.62fr_1.38fr]">
        <aside className="xl:sticky xl:top-32 xl:h-fit">
          <Link
            href="/b2b/dashboard"
            className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]"
          >
            ← Business account
          </Link>
          <p className="mt-10 text-xs font-bold uppercase tracking-[.16em] text-[#2E7D32] dark:text-[#F4C430]">
            Supply request
          </p>
          <h1 className="display-organic mt-4 max-w-[9ch] text-5xl leading-[.9] md:text-7xl">
            Set the supply rhythm.
          </h1>
          <p className="mt-7 max-w-sm text-sm leading-6 text-[#675E52] dark:text-[#AFC0B2]">
            Choose the tomato and onion quantities your operation needs. We confirm pricing and
            delivery terms before supply begins.
          </p>
        </aside>

        <div className="space-y-12">
          <section className="grid gap-6 border-t border-[#B9AD98] pt-6 sm:grid-cols-2 dark:border-white/20">
            <h2 className="sm:col-span-2 text-2xl font-semibold">Agreement details</h2>
            <label className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[.13em]">Agreement name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none focus:border-[#2E7D32] dark:border-white/25"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.13em]">
                Delivery frequency
              </span>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Every two weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.13em]">Delivery area</span>
              <select
                required
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              >
                <option value="">Select area</option>
                {zones.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} · {row.delivery_day}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="border-t border-[#B9AD98] pt-6 dark:border-white/20">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">Tomatoes and onions</h2>
                <p className="mt-1 text-sm text-[#675E52] dark:text-[#AFC0B2]">
                  Enter the quantity required for each delivery.
                </p>
              </div>
              <p className="text-sm font-bold">{chosen.length} selected</p>
            </div>
            {products.length ? (
              <div className="mt-5 divide-y divide-[#D8CEBC] border-y border-[#D8CEBC] dark:divide-white/15 dark:border-white/15">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-5 py-4"
                  >
                    <span>
                      <strong className="block">{product.name}</strong>
                      <small className="text-[#756D61] dark:text-[#98A59B]">{product.unit}</small>
                    </span>
                    <input
                      aria-label={`${product.name} quantity`}
                      type="number"
                      min="0"
                      value={quantities[product.id] || ""}
                      onChange={(e) =>
                        setQuantities((old) => ({ ...old, [product.id]: Number(e.target.value) }))
                      }
                      placeholder="Qty"
                      className="w-24 border border-[#B9AD98] bg-transparent px-3 py-2 text-right outline-none focus:border-[#2E7D32] dark:border-white/25"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-5 border-y border-[#D8CEBC] py-8 text-sm text-[#675E52] dark:border-white/15 dark:text-[#AFC0B2]">
                <p className="font-semibold text-[#173C2A] dark:text-white">
                  Catalogue being prepared.
                </p>
                <p className="mt-1">
                  Tomato and onion pack sizes will appear when pricing is published.
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-6 border-t border-[#B9AD98] pt-6 sm:grid-cols-2 dark:border-white/20">
            <h2 className="sm:col-span-2 text-2xl font-semibold">Receiving details</h2>
            <label className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[.13em]">Delivery address</span>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full resize-none border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.13em]">
                Receiving contact
              </span>
              <input
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.13em]">Phone</span>
              <input
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.13em]">Receiving hours</span>
              <input
                value={receivingHours}
                onChange={(e) => setReceivingHours(e.target.value)}
                placeholder="Mon–Fri, 8am–4pm"
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[.13em]">
                Delivery instructions
              </span>
              <input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Gate, loading bay or access notes"
                className="mt-2 w-full border-0 border-b border-[#9D927F] bg-transparent py-3 outline-none dark:border-white/25"
              />
            </label>
          </section>

          {error && (
            <p
              role="alert"
              className="border-l-2 border-red-600 pl-4 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[#B9AD98] pt-6 dark:border-white/20">
            <p className="max-w-lg text-sm text-[#675E52] dark:text-[#AFC0B2]">
              Submitting does not place an order or charge the account. Our team reviews the
              commercial terms first.
            </p>
            <button
              disabled={saving || !products.length}
              className="bg-[#173C2A] px-7 py-4 font-bold text-white disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]"
            >
              {saving ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
