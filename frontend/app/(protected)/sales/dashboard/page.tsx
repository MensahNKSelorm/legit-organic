"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import type { ReferredCustomer, CommissionSummary } from "@/types";

type Tab = "customers" | "commissions" | "referral" | "add";

const PHONE_RE = /^(\+233|0)[0-9]{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SOURCE_LABEL: Record<ReferredCustomer["source"], string> = {
  rep_form: "Rep Form",
  referral_link: "Referral Link",
};

const COMMISSION_TYPE_LABEL: Record<string, string> = {
  registration: "Registration",
  first_purchase: "First Purchase",
  repeat_purchase: "Repeat Purchase",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Icons (SVG, no emoji) ─────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18.09" />
      <path d="M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Small 16×16 link icon for the "Copy referral link" action button —
// kept separate from the tab-bar LinkIcon (18×18) so that one isn't resized.
function SmallLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; icon: () => React.ReactElement }[] = [
  { id: "customers", label: "My Customers", icon: UsersIcon },
  { id: "commissions", label: "My Commissions", icon: CoinsIcon },
  { id: "referral", label: "My Referral Link", icon: LinkIcon },
  { id: "add", label: "Add Customer", icon: PlusIcon },
];

// ── Badges ─────────────────────────────────────────────────────────────────

function CustomerStatusBadge({ status }: { status: ReferredCustomer["status"] }) {
  const isConverted = status === "converted";
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        isConverted ? "bg-[#FFFBEB] text-[#C59F2C]" : "bg-[#F0FFF4] text-[#2E7D32]",
      ].join(" ")}
    >
      {isConverted ? "Converted" : "Registered"}
    </span>
  );
}

function CommissionStatusBadge({ status }: { status: "pending" | "approved" | "paid" }) {
  const config = {
    pending: { label: "Pending", cls: "bg-[#FFFBEB] text-[#C59F2C]" },
    approved: { label: "Approved", cls: "bg-[#F0FFF4] text-[#2E7D32]" },
    paid: { label: "Paid", cls: "bg-[#0D3B2A]/10 text-[#0D3B2A]" },
  }[status];
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        config.cls,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-5 animate-pulse">
      <div className="h-4 w-1/3 bg-[#F5F0E6] dark:bg-[#374151] rounded mb-3" />
      <div className="h-3 w-1/2 bg-[#F5F0E6] dark:bg-[#374151] rounded" />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function SalesRepDashboardPage() {
  const { isLoading, isSalesRep, salesRepProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("customers");

  useEffect(() => {
    if (!isLoading && !isSalesRep) {
      router.replace("/");
    }
  }, [isLoading, isSalesRep, router]);

  // ── My Customers ──────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<ReferredCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [customersError, setCustomersError] = useState("");

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError("");
    try {
      const data = await api.sales.customers();
      setCustomers(data);
      setCustomersLoaded(true);
    } catch (err) {
      setCustomersError(err instanceof Error ? err.message : "Failed to load customers.");
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSalesRep && activeTab === "customers" && !customersLoaded) {
      Promise.resolve().then(loadCustomers);
    }
  }, [isSalesRep, activeTab, customersLoaded, loadCustomers]);

  // ── My Commissions ────────────────────────────────────────────────────
  const [commissionData, setCommissionData] = useState<CommissionSummary | null>(null);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionsLoaded, setCommissionsLoaded] = useState(false);
  const [commissionsError, setCommissionsError] = useState("");

  const loadCommissions = useCallback(async () => {
    setCommissionsLoading(true);
    setCommissionsError("");
    try {
      const data = await api.sales.commissions();
      setCommissionData(data);
      setCommissionsLoaded(true);
    } catch (err) {
      setCommissionsError(err instanceof Error ? err.message : "Failed to load commissions.");
    } finally {
      setCommissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSalesRep && activeTab === "commissions" && !commissionsLoaded) {
      Promise.resolve().then(loadCommissions);
    }
  }, [isSalesRep, activeTab, commissionsLoaded, loadCommissions]);

  // ── My Referral Link ──────────────────────────────────────────────────
  const referralUrl = salesRepProfile
    ? `https://legitorganic.com/?ref=${salesRepProfile.referral_code}`
    : "";

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!referralUrl) return;
    let cancelled = false;
    // Dynamically imported and only ever invoked inside an effect, so the QR
    // encoding (which needs a DOM/canvas) never runs during SSR — only after
    // this component has mounted in the browser.
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(referralUrl, {
        width: 320,
        margin: 1,
        color: { dark: "#0D3B2A", light: "#FAF7F0" },
      })
        .then((url) => {
          if (!cancelled) setQrDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setQrDataUrl("");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [referralUrl]);

  const handleCopy = useCallback(async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore, copy button is a convenience
    }
  }, [referralUrl]);

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Shop fresh organic food with my referral link: ${referralUrl}`
  )}`;

  const flyerRef = useRef<HTMLDivElement>(null);
  const [downloadingFlyer, setDownloadingFlyer] = useState(false);

  const handleDownloadFlyer = useCallback(async () => {
    if (!flyerRef.current) return;
    setDownloadingFlyer(true);
    try {
      // Dynamically imported and only invoked from this click handler, so
      // html2canvas (which needs a DOM to walk and a canvas to render into)
      // never runs during SSR — same client-only guard as the QR generation.
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(flyerRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "legit-organic-referral-flyer.png";
      link.click();
    } catch {
      // flyer capture failed (e.g. canvas tainted) — download is a convenience, not critical path
    } finally {
      setDownloadingFlyer(false);
    }
  }, []);

  // ── Add Customer ──────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!PHONE_RE.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Enter a valid Ghana phone number e.g. +233244123456 or 0244123456";
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.sales.addCustomer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setSuccessMessage(
        `Customer added. An SMS has been sent to ${phone.trim()} with a link to set their password.`
      );
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setFormErrors({});
      setCustomersLoaded(false);
      setActiveTab("customers");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add customer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !isSalesRep || !salesRepProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] dark:bg-[#111827]">
        <span className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#111827] min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#0D3B2A", paddingTop: "5.5rem", paddingBottom: "2rem" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <p className="text-[#F4C430] text-xs font-bold uppercase tracking-widest mb-1">
            Sales Rep Portal
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-white">
            {salesRepProfile.first_name} {salesRepProfile.last_name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 bg-[#2E7D32]/30 text-[#A7C4A0] text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              Active Sales Rep
            </span>
            <span className="text-white/70 text-xs font-medium">
              Referral code:{" "}
              <span className="text-[#F4C430] font-bold">{salesRepProfile.referral_code}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6 space-y-6">
        <ConnectionStatus />

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="-mx-6 px-6 lg:mx-0 lg:px-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap",
                    "min-h-[44px]",
                    active
                      ? "bg-[#0D3B2A] text-white"
                      : "bg-white dark:bg-[#1f2937] text-[#5B3E31] dark:text-[#9ca3af] border border-[#E6D8BD] dark:border-[#374151]",
                  ].join(" ")}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab 1: My Customers ──────────────────────────────────────── */}
        {activeTab === "customers" && (
          <section className="space-y-3">
            {customersLoading && (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {!customersLoading && customersError && (
              <div className="p-5 bg-white dark:bg-[#1f2937] rounded-2xl border border-red-200 dark:border-red-900/40 text-sm text-red-600">
                {customersError}
              </div>
            )}

            {!customersLoading && !customersError && customers.length === 0 && (
              <div className="p-8 bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] text-center">
                <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af]">
                  No customers yet. Add one below or share your referral link.
                </p>
              </div>
            )}

            {!customersLoading &&
              !customersError &&
              customers.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#0D3B2A] dark:text-white truncate">
                        {c.customer_name || c.customer_email}
                      </p>
                      <p className="text-xs text-[#5B3E31] dark:text-[#9ca3af] mt-0.5 truncate">
                        {c.customer_email}
                      </p>
                    </div>
                    <CustomerStatusBadge status={c.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F0E6] dark:bg-[#374151] text-[#5B3E31] dark:text-[#d1d5db]">
                      {SOURCE_LABEL[c.source]}
                    </span>
                    <span
                      className={[
                        "text-xs font-medium",
                        c.days_remaining < 30 ? "text-red-600" : "text-[#9ca3af]",
                      ].join(" ")}
                    >
                      {c.days_remaining} {c.days_remaining === 1 ? "day" : "days"} remaining
                    </span>
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* ── Tab 2: My Commissions ────────────────────────────────────── */}
        {activeTab === "commissions" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#C59F2C] mb-1">
                  Pending
                </p>
                <p className="text-2xl font-bold text-[#0D3B2A] dark:text-white">
                  GH₵ {parseFloat(commissionData?.summary.pending ?? "0").toFixed(2)}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2E7D32] mb-1">
                  Approved
                </p>
                <p className="text-2xl font-bold text-[#0D3B2A] dark:text-white">
                  GH₵ {parseFloat(commissionData?.summary.approved ?? "0").toFixed(2)}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0D3B2A] dark:text-[#F4C430] mb-1">
                  Paid
                </p>
                <p className="text-2xl font-bold text-[#0D3B2A] dark:text-white">
                  GH₵ {parseFloat(commissionData?.summary.paid ?? "0").toFixed(2)}
                </p>
              </div>
            </div>

            {commissionsLoading && (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {!commissionsLoading && commissionsError && (
              <div className="p-5 bg-white dark:bg-[#1f2937] rounded-2xl border border-red-200 dark:border-red-900/40 text-sm text-red-600">
                {commissionsError}
              </div>
            )}

            {!commissionsLoading &&
              !commissionsError &&
              (commissionData?.commissions.length ?? 0) === 0 && (
                <div className="p-8 bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] text-center">
                  <p className="text-sm text-[#5B3E31] dark:text-[#9ca3af]">No commissions yet.</p>
                </div>
              )}

            {!commissionsLoading &&
              !commissionsError &&
              commissionData?.commissions.map((com) => (
                <div
                  key={com.id}
                  className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#0D3B2A] dark:text-white truncate">
                      {com.customer_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F0E6] dark:bg-[#374151] text-[#5B3E31] dark:text-[#d1d5db]">
                        {COMMISSION_TYPE_LABEL[com.type]}
                      </span>
                      <span className="text-xs text-[#9ca3af]">{formatDate(com.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-[#0D3B2A] dark:text-white">
                      GH₵ {parseFloat(com.amount).toFixed(2)}
                    </p>
                    <div className="mt-1.5">
                      <CommissionStatusBadge status={com.status} />
                    </div>
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* ── Tab 3: My Referral Link ──────────────────────────────────── */}
        {activeTab === "referral" && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
          >
            {/* Flyer card — self-contained, screenshot-friendly. No interactive
                elements inside it; all actions live below. */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <div
                ref={flyerRef}
                className="border-[0.5px] border-[#E6D8BD] dark:border-[#374151]"
                style={{ width: 340, maxWidth: "100%", borderRadius: 20, overflow: "hidden" }}
              >
                {/* 1. Header band */}
                <div
                  style={{
                    backgroundColor: "#0D3B2A",
                    padding: "28px 24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* logo-darkmode.svg is a full wordmark (leaf mark + "Legit Organic
                      Ltd." text) — a separate text column would duplicate it, so the
                      logo image is the only element in this row. Plain <img>, not
                      next/image, so html2canvas reliably captures it (no srcset/lazy load). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/logo-darkmode.svg"
                    alt="Legit Organic Ltd."
                    style={{ height: 40, width: "auto", objectFit: "contain" }}
                  />
                  <p
                    style={{
                      color: "#FAF7F0",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      opacity: 0.7,
                      margin: 0,
                    }}
                  >
                    Fresh · Organic · Delivered
                  </p>
                </div>

                {/* 2. Rep identity band */}
                <div
                  style={{
                    backgroundColor: "#F4C430",
                    padding: "18px 24px 16px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      color: "#0D3B2A",
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      opacity: 0.6,
                      margin: "0 0 4px",
                    }}
                  >
                    Your representative
                  </p>
                  <p
                    style={{
                      color: "#0D3B2A",
                      fontSize: 26,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.1,
                      margin: 0,
                    }}
                  >
                    {salesRepProfile.first_name} {salesRepProfile.last_name}
                  </p>
                  <p
                    style={{
                      color: "#0D3B2A",
                      fontSize: 11,
                      opacity: 0.65,
                      letterSpacing: "0.03em",
                      margin: "4px 0 0",
                    }}
                  >
                    Legit Organic Sales Representative
                  </p>
                </div>

                {/* 3. QR code section */}
                <div
                  style={{
                    backgroundColor: "#FAF7F0",
                    padding: "24px 24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      height: 160,
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      border: "0.5px solid #E6D8BD",
                      padding: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt={`QR code for referral link ${referralUrl}`}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <span className="w-6 h-6 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  <p
                    style={{
                      color: "#5B3E31",
                      fontSize: 12,
                      letterSpacing: "0.04em",
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    Scan to shop fresh organic food
                  </p>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 24px",
                      lineHeight: 1,
                      fontFamily: "monospace",
                      fontSize: 13,
                      letterSpacing: "0.14em",
                      backgroundColor: "#0D3B2A",
                      color: "#FAF7F0",
                      borderRadius: 100,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Code: {salesRepProfile.referral_code}
                  </span>
                </div>

                {/* 4. Gold divider */}
                <div
                  style={{
                    width: "100%",
                    height: 2,
                    background:
                      "linear-gradient(90deg, transparent, #F4C430 30%, #F4C430 70%, transparent)",
                  }}
                />

                {/* 5. Footer band */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 24px",
                    backgroundColor: "#0D3B2A",
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: "#F4C430",
                      opacity: 0.7,
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  />
                  <p
                    style={{
                      color: "#FAF7F0",
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      opacity: 0.85,
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    legitorganic.com
                  </p>
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: "#F4C430",
                      opacity: 0.7,
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions — outside the card */}
            <div
              style={{
                width: 340,
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 24,
              }}
            >
              <button
                onClick={handleCopy}
                className="min-h-[44px]"
                style={{
                  backgroundColor: "#2E7D32",
                  color: "#FAF7F0",
                  padding: "11px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {copied ? <CheckIcon /> : <SmallLinkIcon />}
                {copied ? "Copied!" : "Copy referral link"}
              </button>

              <button
                onClick={handleDownloadFlyer}
                disabled={downloadingFlyer}
                className="min-h-[44px]"
                style={{
                  backgroundColor: "#F4C430",
                  color: "#0D3B2A",
                  padding: "11px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: downloadingFlyer ? 0.6 : 1,
                }}
              >
                {downloadingFlyer ? (
                  <span className="w-4 h-4 border-2 border-[#0D3B2A]/40 border-t-[#0D3B2A] rounded-full animate-spin" />
                ) : (
                  <DownloadIcon />
                )}
                {downloadingFlyer ? "Preparing…" : "Download flyer"}
              </button>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px]"
                style={{
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                  padding: "11px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <WhatsAppIcon />
                Share on WhatsApp
              </a>
            </div>
          </section>
        )}

        {/* ── Tab 4: Add Customer ──────────────────────────────────────── */}
        {activeTab === "add" && (
          <section className="bg-white dark:bg-[#1f2937] rounded-2xl border border-[#E6D8BD] dark:border-[#374151] p-6 max-w-[480px] mx-auto">
            {successMessage && (
              <div className="mb-5 p-4 rounded-xl bg-[#F0FFF4] dark:bg-[#0a1f14] border border-[#2E7D32]/20 text-sm text-[#2E7D32] dark:text-[#81C784]">
                {successMessage}
              </div>
            )}

            {submitError && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-[#E6D8BD] dark:border-[#374151] bg-[#FAF7F0] dark:bg-[#111827] text-[#0D3B2A] dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
                />
                {formErrors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-[#E6D8BD] dark:border-[#374151] bg-[#FAF7F0] dark:bg-[#111827] text-[#0D3B2A] dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
                />
                {formErrors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233244123456 or 0244123456"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-[#E6D8BD] dark:border-[#374151] bg-[#FAF7F0] dark:bg-[#111827] text-[#0D3B2A] dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0D3B2A] dark:text-[#d1d5db] mb-1.5">
                  Email <span className="font-normal text-[#9ca3af]">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-[#E6D8BD] dark:border-[#374151] bg-[#FAF7F0] dark:bg-[#111827] text-[#0D3B2A] dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                )}
              </div>

              {!isOnline && (
                <div
                  style={{
                    backgroundColor: "#FAF7F0",
                    border: "1px solid #F4C430",
                    color: "#5B3E31",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  You&apos;re offline. Connect to the internet to add a customer.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="w-full min-h-[44px] rounded-xl bg-[#0D3B2A] text-white font-semibold text-sm hover:bg-[#0D3B2A]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {submitting ? "Adding Customer…" : "Add Customer"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
