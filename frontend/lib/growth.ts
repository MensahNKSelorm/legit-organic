const SESSION_KEY = "lo_growth_session";
const ATTRIBUTION_KEY = "lo_growth_attribution";
const GROWTH_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Attribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
};

function browserSession(): string {
  if (typeof window === "undefined") return "";
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function growthAttribution(): Attribution & { growth_session: string } {
  if (typeof window === "undefined") {
    return { growth_session: "", source: "", medium: "", campaign: "", content: "" };
  }
  let attribution: Attribution | null = null;
  try {
    attribution = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "null") as Attribution;
  } catch {}
  if (!attribution) {
    const params = new URLSearchParams(window.location.search);
    let referringHost = "";
    try {
      referringHost = document.referrer ? new URL(document.referrer).hostname : "";
      if (referringHost === window.location.hostname) referringHost = "";
    } catch {}
    const salesReferral = params.get("ref") || "";
    attribution = {
      source: params.get("utm_source") || (salesReferral ? "sales-referral" : referringHost),
      medium: params.get("utm_medium") || (salesReferral || referringHost ? "referral" : ""),
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || salesReferral,
    };
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  }
  return { growth_session: browserSession(), ...attribution };
}

export function orderGrowthFields() {
  const attribution = growthAttribution();
  return {
    growth_session: attribution.growth_session,
    growth_source: attribution.source,
    growth_medium: attribution.medium,
    growth_campaign: attribution.campaign,
    growth_content: attribution.content,
  };
}

export function trackGrowth(
  event: "page_view" | "product_view" | "recipe_view" | "add_to_cart" | "checkout_started",
  details: { object_type?: string; object_id?: string | number; object_label?: string } = {}
) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
  const attribution = growthAttribution();
  void fetch(`${GROWTH_API}/api/orders/growth-events/`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      session: attribution.growth_session,
      path: window.location.pathname,
      referrer: document.referrer,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      content: attribution.content,
      ...details,
    }),
  }).catch(() => undefined);
}
