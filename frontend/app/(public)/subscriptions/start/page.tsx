"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DeliveryZone, Product, SubscriptionPlan } from "@/types";

const LocationPicker = dynamic(() => import("@/components/ui/LocationPicker"), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center border border-[#C9BEAA] bg-[#F8F3E9] text-sm text-[#756D61] dark:border-white/15 dark:bg-[#202620] dark:text-[#AAB4AB]">Opening the map…</div>,
});

type Stage = "basket" | "delivery" | "review";
type FieldErrors = Partial<Record<"items" | "zone" | "phone" | "street" | "city" | "region", string>>;

interface AddressFields {
  houseNumber: string;
  street: string;
  city: string;
  region: string;
  phone: string;
}

interface SavedDraft {
  planSlug: string;
  quantities: Record<number, number>;
}

const STAGES: Array<{ id: Stage; label: string; hint: string }> = [
  { id: "basket", label: "Basket", hint: "Choose what comes each week" },
  { id: "delivery", label: "Delivery", hint: "Tell us where to bring it" },
  { id: "review", label: "Review", hint: "Check everything before payment" },
];

const PHONE_RE = /^(\+233|0)[0-9]{9}$/;
const DRAFT_KEY = "legitorganic-weekly-basket";
const PENDING_SUBSCRIPTION_KEY = "legitorganic-pending-subscription";
const HAS_MAPS = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
const inputClass = "mt-2 w-full border border-[#C9BEAA] bg-[#FFFDF8] px-4 py-3 text-[#173C2A] outline-none transition-colors placeholder:text-[#8C8478] focus-visible:border-[#2E7D32] focus-visible:ring-2 focus-visible:ring-[#2E7D32]/25 dark:border-white/15 dark:bg-[#202620] dark:text-white dark:placeholder:text-[#849087]";

function money(value: number | string) {
  return `GH₵${Number(value || 0).toFixed(2)}`;
}

function formatAddress(address: AddressFields) {
  return [address.houseNumber, address.street, address.city, address.region]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function StartSubscriptionContent() {
  const { user, isLoading: authLoading, isB2B, updateUser } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const requestedPlan = params.get("plan") || "custom";
  const audience = params.get("audience") === "business" ? "business" : "household";
  const profileLoaded = useRef(false);

  const [stage, setStage] = useState<Stage>("basket");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [planSlug, setPlanSlug] = useState(() => {
    if (typeof window === "undefined") return requestedPlan;
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      return stored ? (JSON.parse(stored) as SavedDraft).planSlug || requestedPlan : requestedPlan;
    } catch {
      return requestedPlan;
    }
  });
  const [zoneId, setZoneId] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      return stored ? (JSON.parse(stored) as SavedDraft).quantities || {} : {};
    } catch {
      return {};
    }
  });
  const [address, setAddress] = useState<AddressFields>({ houseNumber: "", street: "", city: "", region: "", phone: "" });
  const [showMap, setShowMap] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ planSlug, quantities } satisfies SavedDraft));
  }, [planSlug, quantities]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.subscriptions.plans(audience),
      api.subscriptions.zones(),
      api.products.list("is_available=true"),
    ])
      .then(([planRows, zoneRows, productRows]) => {
        if (cancelled) return;
        setPlans(planRows);
        setZones(zoneRows);
        setProducts(productRows);
      })
      .catch(() => {
        if (!cancelled) setLoadError("We couldn’t open the market list. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => { cancelled = true; };
  }, [audience]);

  useEffect(() => {
    if (!user || profileLoaded.current) return;
    setAddress((current) => ({
      houseNumber: current.houseNumber || user.house_number || "",
      street: current.street || user.street_address || "",
      city: current.city || user.city || "",
      region: current.region || user.delivery_region || "",
      phone: current.phone || user.phone_number || "",
    }));
    profileLoaded.current = true;
  }, [user]);

  const selectedPlan = plans.find((plan) => plan.slug === planSlug);
  const isCustom = planSlug === "custom" || !selectedPlan || selectedPlan.plan_type === "custom";
  const chosenProducts = useMemo(
    () => products.filter((product) => (quantities[product.id] || 0) > 0).map((product) => ({ product, quantity: quantities[product.id] })),
    [products, quantities]
  );
  const basketItems = isCustom
    ? chosenProducts.map(({ product, quantity }) => ({ product, quantity }))
    : selectedPlan?.items.map((item) => ({ product: item.product, quantity: item.quantity })) || [];
  const subtotal = isCustom
    ? chosenProducts.reduce((sum, row) => sum + Number(row.product.price) * row.quantity, 0)
    : Number(selectedPlan?.weekly_price || 0);
  const selectedZone = zones.find((zone) => zone.id === Number(zoneId));
  const deliveryFee = Number(selectedZone?.delivery_fee || 0);
  const weeklyTotal = subtotal + deliveryFee;

  function choosePlan(slug: string) {
    setPlanSlug(slug);
    setPendingSubscriptionId(null);
    sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
    setFieldErrors((current) => ({ ...current, items: undefined }));
  }

  function changeQuantity(productId: number, amount: number) {
    setQuantities((current) => ({ ...current, [productId]: Math.max(0, (current[productId] || 0) + amount) }));
    setPendingSubscriptionId(null);
    sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
    setFieldErrors((current) => ({ ...current, items: undefined }));
  }

  function validateBasket() {
    if (isCustom && chosenProducts.length === 0) {
      setFieldErrors((current) => ({ ...current, items: "Add at least one Market item to your basket." }));
      return false;
    }
    setFieldErrors((current) => ({ ...current, items: undefined }));
    return true;
  }

  function validateDelivery() {
    const next: FieldErrors = {};
    if (!zoneId) next.zone = "Choose a delivery area.";
    if (!address.street.trim()) next.street = "Enter a street or landmark.";
    if (!address.city.trim()) next.city = "Enter your town or city.";
    if (!address.region.trim()) next.region = "Enter your region.";
    const cleanedPhone = address.phone.replace(/\s/g, "");
    if (!cleanedPhone) next.phone = "Enter the number we should call for delivery.";
    else if (!PHONE_RE.test(cleanedPhone)) next.phone = "Use a Ghana number such as 0244123456.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function moveTo(nextStage: Stage) {
    setSubmitError("");
    if (nextStage === "delivery" && !validateBasket()) return;
    if (nextStage === "review" && (!validateBasket() || !validateDelivery())) return;
    setStage(nextStage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function continueToPayment() {
    if (!validateBasket() || !validateDelivery()) return;
    if (!user) {
      const next = `/subscriptions/start?plan=${encodeURIComponent(planSlug)}${audience === "business" ? "&audience=business" : ""}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (audience === "business" && !isB2B) return;

    setSaving(true);
    setSubmitError("");
    try {
      let subscriptionId = pendingSubscriptionId;
      if (!subscriptionId) {
        const profile = {
          email: user.email,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone_number: address.phone.replace(/\s/g, ""),
          house_number: address.houseNumber.trim(),
          street_address: address.street.trim(),
          city: address.city.trim(),
          delivery_region: address.region.trim(),
        };
        await api.users.updateProfile(profile);
        updateUser(profile);

        const subscription = await api.subscriptions.create({
          name: selectedPlan?.name || "My weekly basket",
          audience,
          plan: isCustom ? null : selectedPlan?.id,
          delivery_zone: Number(zoneId),
          delivery_address: formatAddress(address),
          contact_phone: address.phone.replace(/\s/g, ""),
          payment_method: "mobile_money",
          items: isCustom ? chosenProducts.map(({ product, quantity }) => ({ product_id: product.id, quantity })) : undefined,
        });
        subscriptionId = subscription.id;
        setPendingSubscriptionId(subscription.id);
        sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, String(subscription.id));
      }

      const checkout = await api.subscriptions.initializePayment(subscriptionId);
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
      window.location.assign(checkout.checkout_url);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "We couldn’t open secure payment. Your basket is safe—try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage === "basket") moveTo("delivery");
    else if (stage === "delivery") moveTo("review");
    else void continueToPayment();
  }

  if (authLoading) return <main className="min-h-screen bg-[#F4EFE4] pt-36 dark:bg-[#171B18]" />;

  return (
    <main className="min-h-screen bg-[#F4EFE4] pt-28 pb-24 text-[#173C2A] md:pt-36 dark:bg-[#171B18] dark:text-white">
      <div className="page-container">
        <Link href={audience === "business" ? "/b2b/dashboard" : "/subscriptions"} className="inline-flex min-h-11 items-center text-sm font-bold text-[#2E7D32] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:text-[#F4C430]">
          ← {audience === "business" ? "Business portal" : "Plan the week"}
        </Link>

        <header className="mt-7 max-w-4xl border-b border-[#C9BEAA] pb-8 dark:border-white/15">
          <h1 className="display-organic max-w-3xl text-5xl leading-[0.96] md:text-7xl">
            {audience === "business" ? "Build your supply order" : "Build this week’s basket"}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#625B51] dark:text-[#B8C0B9]">
            Pick the food that suits your week, confirm where it should go, then approve the first delivery through SeevCash. Future weeks always wait for you to pay—nothing is charged automatically.
          </p>
        </header>

        <nav aria-label="Basket registration progress" className="grid border-b border-[#C9BEAA] sm:grid-cols-3 dark:border-white/15">
          {STAGES.map((item) => {
            const active = stage === item.id;
            return (
              <button key={item.id} type="button" disabled={Boolean(pendingSubscriptionId && item.id !== "review")} onClick={() => moveTo(item.id)} aria-current={active ? "step" : undefined} className={`min-h-20 border-b-4 px-1 py-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E7D32] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 ${active ? "border-[#2E7D32] text-[#173C2A] dark:border-[#F4C430] dark:text-white" : "border-transparent text-[#756D61] hover:text-[#173C2A] dark:text-[#8F9B91] dark:hover:text-white"}`}>
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs">{item.hint}</span>
              </button>
            );
          })}
        </nav>

        {loadError ? (
          <section className="mt-12 border-l-4 border-[#C94F38] bg-[#FFFDF8] p-6 dark:bg-[#202620]" role="alert">
            <h2 className="text-xl font-semibold">The market list didn’t load</h2>
            <p className="mt-2 text-sm text-[#625B51] dark:text-[#B8C0B9]">{loadError}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 border border-[#173C2A] px-5 font-semibold outline-none hover:bg-[#173C2A] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:border-white">Try again</button>
          </section>
        ) : (
          <form onSubmit={handleFormSubmit} noValidate className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-16">
            <div className="min-w-0">
              {stage === "basket" && (
                <section aria-labelledby="basket-heading">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 id="basket-heading" className="text-2xl font-semibold md:text-3xl">Choose the shape of your week</h2>
                      <p className="mt-2 text-sm text-[#625B51] dark:text-[#B8C0B9]">Start with a prepared basket or build directly from Market.</p>
                    </div>
                    <Link href="/products" className="min-h-11 py-3 text-sm font-bold text-[#2E7D32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:text-[#F4C430]">Browse full Market ↗</Link>
                  </div>

                  <div className="mt-6 grid gap-px border border-[#C9BEAA] bg-[#C9BEAA] sm:grid-cols-2 dark:border-white/15 dark:bg-white/15">
                    {[...plans, { id: 0, slug: "custom", name: "Build your own", short_description: "Choose individual Market items for your week.", weekly_price: "0" } as SubscriptionPlan].map((plan) => {
                      const selected = planSlug === plan.slug;
                      return (
                        <button type="button" key={plan.slug} onClick={() => choosePlan(plan.slug)} aria-pressed={selected} className={`min-h-32 p-5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F4C430] ${selected ? "bg-[#173C2A] text-white" : "bg-[#FFFDF8] hover:bg-[#EEE5D5] dark:bg-[#202620] dark:hover:bg-[#293129]"}`}>
                          <span className="flex items-start justify-between gap-4"><span className="text-lg font-semibold">{plan.name}</span>{selected && <span aria-hidden className="text-[#F4C430]">●</span>}</span>
                          <span className={`mt-2 block text-sm leading-5 ${selected ? "text-white/75" : "text-[#756D61] dark:text-[#AAB4AB]"}`}>{plan.short_description || "A ready-made weekly basket."}</span>
                          {Number(plan.weekly_price) > 0 && <span className="mt-4 block text-sm font-bold">{money(plan.weekly_price)} / week</span>}
                        </button>
                      );
                    })}
                  </div>

                  {isCustom ? (
                    <div className="mt-10">
                      <div className="flex items-baseline justify-between gap-4 border-b border-[#C9BEAA] pb-3 dark:border-white/15">
                        <h3 className="text-lg font-semibold">Pick from Market</h3>
                        <span className="text-xs text-[#756D61] dark:text-[#AAB4AB]">{chosenProducts.length} selected</span>
                      </div>
                      {loadingData ? (
                        <div className="divide-y divide-[#D8CEBC] dark:divide-white/10" aria-busy="true">
                          {[0, 1, 2, 3].map((row) => <div key={row} className="h-20 animate-pulse bg-[#FFFDF8]/55 dark:bg-white/[0.03]" />)}
                        </div>
                      ) : products.length ? (
                        <div className="divide-y divide-[#D8CEBC] dark:divide-white/10">
                          {products.map((product) => {
                            const quantity = quantities[product.id] || 0;
                            return (
                              <article key={product.id} className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 ${quantity ? "bg-[#FFF8DA]/45 dark:bg-[#F4C430]/[0.04]" : ""}`}>
                                <div className="min-w-0 pl-2">
                                  <Link href={`/products/${product.slug}`} className="font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]">{product.name} ↗</Link>
                                  <p className="mt-1 text-xs text-[#756D61] dark:text-[#AAB4AB]">{product.category?.name || "Market produce"} · {money(product.price)} / {product.unit}</p>
                                </div>
                                <div className="flex items-center border border-[#A89C87] bg-[#FFFDF8] dark:border-white/20 dark:bg-[#202620]" aria-label={`${product.name} quantity`}>
                                  <button type="button" aria-label={`Remove one ${product.name}`} disabled={!quantity} onClick={() => changeQuantity(product.id, -1)} className="min-h-11 min-w-11 text-xl outline-none hover:bg-[#EEE5D5] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E7D32] disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/10">−</button>
                                  <output aria-live="polite" className="w-9 text-center text-sm font-bold">{quantity}</output>
                                  <button type="button" aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, 1)} className="min-h-11 min-w-11 text-xl outline-none hover:bg-[#EEE5D5] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E7D32] dark:hover:bg-white/10">+</button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border-b border-[#C9BEAA] py-8 dark:border-white/15"><p className="font-semibold">Market is being stocked.</p><p className="mt-1 text-sm text-[#756D61] dark:text-[#AAB4AB]">No products are available for a custom basket yet.</p></div>
                      )}
                      {fieldErrors.items && <p className="mt-3 text-sm text-[#B42318] dark:text-[#FFB4A8]" role="alert">{fieldErrors.items}</p>}
                    </div>
                  ) : selectedPlan ? (
                    <div className="mt-10 border-y border-[#C9BEAA] py-5 dark:border-white/15">
                      <h3 className="font-semibold">Inside this basket</h3>
                      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                        {selectedPlan.items.map((item) => <li key={item.id} className="flex justify-between gap-3 text-sm"><Link href={`/products/${item.product.slug}`} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]">{item.product.name}</Link><span className="font-semibold">× {item.quantity}</span></li>)}
                      </ul>
                    </div>
                  ) : null}

                  <button type="submit" disabled={loadingData} className="mt-8 min-h-12 w-full bg-[#173C2A] px-6 py-3 font-bold text-white outline-none hover:bg-[#24553D] focus-visible:ring-2 focus-visible:ring-[#F4C430] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]">Set delivery details →</button>
                </section>
              )}

              {stage === "delivery" && (
                <section aria-labelledby="delivery-heading">
                  <h2 id="delivery-heading" className="text-2xl font-semibold md:text-3xl">Where should the basket meet you?</h2>
                  <p className="mt-2 text-sm text-[#625B51] dark:text-[#B8C0B9]">{user ? "We’ve filled in what we know. Change anything that is no longer current." : "You can enter your details now, then sign in before registration."}</p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    <label className="sm:col-span-2"><span className="text-sm font-semibold">Delivery area</span><select name="delivery_zone" value={zoneId} onChange={(event) => { setZoneId(event.target.value); setFieldErrors((current) => ({ ...current, zone: undefined })); }} className={inputClass} aria-invalid={Boolean(fieldErrors.zone)}><option value="">Choose an area…</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {zone.delivery_day} · {money(zone.delivery_fee)} delivery</option>)}</select>{fieldErrors.zone && <p className="mt-1 text-xs text-[#B42318] dark:text-[#FFB4A8]">{fieldErrors.zone}</p>}</label>
                    <label><span className="text-sm font-semibold">Phone number</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" value={address.phone} onChange={(event) => { setAddress((current) => ({ ...current, phone: event.target.value })); setFieldErrors((current) => ({ ...current, phone: undefined })); }} placeholder="024 412 3456" className={inputClass} aria-invalid={Boolean(fieldErrors.phone)} />{fieldErrors.phone && <p className="mt-1 text-xs text-[#B42318] dark:text-[#FFB4A8]">{fieldErrors.phone}</p>}</label>
                    <label><span className="text-sm font-semibold">House or apartment <span className="font-normal text-[#756D61]">(optional)</span></span><input name="house_number" autoComplete="address-line1" value={address.houseNumber} onChange={(event) => setAddress((current) => ({ ...current, houseNumber: event.target.value }))} placeholder="A14 or Flat 3" className={inputClass} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-semibold">Street, neighbourhood or landmark</span><input name="street_address" autoComplete="address-line2" value={address.street} onChange={(event) => { setAddress((current) => ({ ...current, street: event.target.value })); setFieldErrors((current) => ({ ...current, street: undefined })); }} placeholder="12 Independence Avenue, near…" className={inputClass} aria-invalid={Boolean(fieldErrors.street)} />{fieldErrors.street && <p className="mt-1 text-xs text-[#B42318] dark:text-[#FFB4A8]">{fieldErrors.street}</p>}</label>
                    <label><span className="text-sm font-semibold">Town or city</span><input name="city" autoComplete="address-level2" value={address.city} onChange={(event) => { setAddress((current) => ({ ...current, city: event.target.value })); setFieldErrors((current) => ({ ...current, city: undefined })); }} placeholder="Accra" className={inputClass} aria-invalid={Boolean(fieldErrors.city)} />{fieldErrors.city && <p className="mt-1 text-xs text-[#B42318] dark:text-[#FFB4A8]">{fieldErrors.city}</p>}</label>
                    <label><span className="text-sm font-semibold">Region</span><input name="region" autoComplete="address-level1" value={address.region} onChange={(event) => { setAddress((current) => ({ ...current, region: event.target.value })); setFieldErrors((current) => ({ ...current, region: undefined })); }} placeholder="Greater Accra" className={inputClass} aria-invalid={Boolean(fieldErrors.region)} />{fieldErrors.region && <p className="mt-1 text-xs text-[#B42318] dark:text-[#FFB4A8]">{fieldErrors.region}</p>}</label>
                  </div>

                  {HAS_MAPS && (
                    <div className="mt-8 border-t border-[#C9BEAA] pt-6 dark:border-white/15">
                      <button type="button" aria-expanded={showMap} onClick={() => setShowMap((open) => !open)} className="min-h-11 border border-[#173C2A] px-5 text-sm font-bold outline-none hover:bg-[#173C2A] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:border-white">{showMap ? "Close map" : "Find this address on a map"}</button>
                      <p className="mt-2 text-xs text-[#756D61] dark:text-[#AAB4AB]">Optional—search, drop a pin or use your current location.</p>
                      {showMap && <div className="mt-5"><LocationPicker initialAddress={formatAddress(address)} onLocationSelect={(location) => { setAddress((current) => ({ houseNumber: location.house_number || current.houseNumber, street: location.street_address || current.street, city: location.city || current.city, region: location.delivery_region || current.region, phone: current.phone })); setFieldErrors((current) => ({ ...current, street: undefined, city: undefined, region: undefined })); }} /></div>}
                    </div>
                  )}

                  <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row">
                    <button type="button" onClick={() => moveTo("basket")} className="min-h-12 border border-[#173C2A] px-6 font-bold outline-none hover:bg-[#173C2A] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:border-white sm:w-1/3">Back to basket</button>
                    <button type="submit" className="min-h-12 bg-[#173C2A] px-6 font-bold text-white outline-none hover:bg-[#24553D] focus-visible:ring-2 focus-visible:ring-[#F4C430] dark:bg-[#F4C430] dark:text-[#173C2A] sm:flex-1">Review the week →</button>
                  </div>
                </section>
              )}

              {stage === "review" && (
                <section aria-labelledby="review-heading">
                  <h2 id="review-heading" className="text-2xl font-semibold md:text-3xl">Ready for your first week</h2>
                  <p className="mt-2 text-sm text-[#625B51] dark:text-[#B8C0B9]">Nothing is registered until you continue. Check the details, then SeevCash will handle the payment securely.</p>

                  <div className="mt-8 divide-y divide-[#D8CEBC] border-y border-[#C9BEAA] dark:divide-white/10 dark:border-white/15">
                    <div className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr_auto]"><span className="text-sm font-semibold text-[#756D61] dark:text-[#AAB4AB]">Basket</span><div><p className="font-semibold">{selectedPlan?.name || "Build your own"}</p><p className="mt-1 text-sm text-[#625B51] dark:text-[#B8C0B9]">{basketItems.length} Market {basketItems.length === 1 ? "item" : "items"}</p></div>{!pendingSubscriptionId && <button type="button" onClick={() => moveTo("basket")} className="min-h-11 text-left text-sm font-bold text-[#2E7D32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:text-[#F4C430]">Edit</button>}</div>
                    <div className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr_auto]"><span className="text-sm font-semibold text-[#756D61] dark:text-[#AAB4AB]">Delivery</span><div><p className="font-semibold">{selectedZone?.name || "Delivery area"} · {selectedZone?.delivery_day || "day to confirm"}</p><p className="mt-1 text-sm leading-6 text-[#625B51] dark:text-[#B8C0B9]">{formatAddress(address)}<br />{address.phone}</p></div>{!pendingSubscriptionId && <button type="button" onClick={() => moveTo("delivery")} className="min-h-11 text-left text-sm font-bold text-[#2E7D32] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] dark:text-[#F4C430]">Edit</button>}</div>
                    <div className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr]"><span className="text-sm font-semibold text-[#756D61] dark:text-[#AAB4AB]">Payment rhythm</span><div><p className="font-semibold">You approve every delivery</p><p className="mt-1 text-sm leading-6 text-[#625B51] dark:text-[#B8C0B9]">A new renewal order is created each week. Pay it through a fresh SeevCash checkout, or skip, pause or cancel before the cutoff.</p></div></div>
                  </div>

                  {audience === "business" && !isB2B && <p className="mt-6 border-l-4 border-[#F4C430] pl-4 text-sm" role="alert">An approved business account is required before registration.</p>}
                  {submitError && <div className="mt-6 border-l-4 border-[#C94F38] bg-[#FFFDF8] p-4 dark:bg-[#202620]" role="alert"><p className="font-semibold">Payment didn’t open</p><p className="mt-1 text-sm text-[#625B51] dark:text-[#B8C0B9]">{submitError}</p>{pendingSubscriptionId && <p className="mt-2 text-xs text-[#756D61] dark:text-[#AAB4AB]">Your registration was saved. Retrying will not create another subscription.</p>}</div>}
                  <button type="submit" disabled={saving || (audience === "business" && !isB2B)} className="mt-8 min-h-14 w-full bg-[#173C2A] px-6 py-4 font-bold text-white outline-none hover:bg-[#24553D] focus-visible:ring-2 focus-visible:ring-[#F4C430] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F4C430] dark:text-[#173C2A]">{!user ? "Sign in to register this basket" : saving ? "Opening secure payment…" : pendingSubscriptionId ? "Retry secure payment" : `Continue to SeevCash · ${money(weeklyTotal)}`}</button>
                  <p className="mt-3 text-center text-xs text-[#756D61] dark:text-[#AAB4AB]">Secure checkout opens on SeevCash. This is not an automatic recurring charge.</p>
                </section>
              )}
            </div>

            <aside className="border-t-4 border-[#173C2A] bg-[#FFFDF8] p-6 lg:sticky lg:top-28 dark:border-[#F4C430] dark:bg-[#202620]" aria-label="Weekly basket summary">
              <div className="flex items-baseline justify-between gap-4"><h2 className="text-lg font-semibold">This week</h2><span className="text-xs text-[#756D61] dark:text-[#AAB4AB]">{basketItems.length} items</span></div>
              <div className="mt-5 max-h-64 divide-y divide-[#E3D9C8] overflow-y-auto border-y border-[#D8CEBC] dark:divide-white/10 dark:border-white/15">
                {basketItems.length ? basketItems.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-4 py-3 text-sm"><span className="min-w-0 truncate">{product.name}</span><span className="shrink-0 font-semibold">× {quantity}</span></div>) : <p className="py-5 text-sm text-[#756D61] dark:text-[#AAB4AB]">Your basket is waiting for its first item.</p>}
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[#756D61] dark:text-[#AAB4AB]">Basket</dt><dd>{money(subtotal)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#756D61] dark:text-[#AAB4AB]">Delivery</dt><dd>{selectedZone ? money(deliveryFee) : "Choose area"}</dd></div>
                <div className="flex justify-between gap-4 border-t border-[#C9BEAA] pt-4 text-lg font-semibold dark:border-white/15"><dt>Weekly total</dt><dd>{money(weeklyTotal)}</dd></div>
              </dl>
              {selectedZone && <p className="mt-5 border-l-2 border-[#F4C430] pl-3 text-xs leading-5 text-[#625B51] dark:text-[#B8C0B9]">{selectedZone.name} deliveries are scheduled for {selectedZone.delivery_day}. The exact first date is confirmed when you register.</p>}
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

export default function StartSubscriptionPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#F4EFE4] pt-36 dark:bg-[#171B18]" />}><StartSubscriptionContent /></Suspense>;
}
