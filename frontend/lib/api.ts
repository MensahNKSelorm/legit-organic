import type {
  Product,
  ProductDetail,
  Category,
  BlogPost,
  BlogCategory,
  Recipe,
  RecipeWithPairings,
  UserRecipe,
  User,
  Order,
  PromoCode,
  WishlistItem,
  B2BProfile,
  BusinessPriceList,
  BusinessSupplyAgreement,
  DeliveryZone,
  FoodSubscription,
  SubscriptionPlan,
  WholesaleQuote,
  SalesRepProfile,
  ReferredCustomer,
  CommissionSummary,
  AppNotification,
  NotificationResponse,
} from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function getAccessToken(): string | null {
  return accessToken;
}

/** Parse DRF error responses into a readable message. */
async function parseError(res: Response): Promise<never> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof data.detail === "string") throw new Error(data.detail);
  if (typeof data.message === "string") throw new Error(data.message);
  const first = Object.values(data)
    .flat()
    .find((v): v is string => typeof v === "string");
  throw new Error(first || `API error: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Public fetcher — used by server components
// ---------------------------------------------------------------------------

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) await parseError(res);
  if (res.status === 204) return null as T;
  return res.json();
}

async function fetchFormAPI<T>(endpoint: string, body: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    body,
    credentials: "include",
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

// ---------------------------------------------------------------------------
// Authenticated fetcher — client-only, with auto token-refresh on 401
// ---------------------------------------------------------------------------

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const buildHeaders = (token: string | null): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  });

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: buildHeaders(getAccessToken()),
  });

  // Attempt token refresh on 401
  if (res.status === 401 && typeof window !== "undefined") {
    {
      const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (refreshRes.ok) {
        const { access } = (await refreshRes.json()) as { access: string };
        setAccessToken(access);
        res = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          credentials: "include",
          cache: "no-store",
          headers: buildHeaders(access),
        });
      } else {
        setAccessToken(null);
        throw new Error("Session expired. Please log in again.");
      }
    }
  }

  if (!res.ok) await parseError(res);
  if (res.status === 204) return null as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Authenticated blob fetcher — for binary downloads (e.g. receipt PDFs) that
// now require an Authorization header. Mirrors fetchWithAuth's refresh logic.
// ---------------------------------------------------------------------------

async function fetchBlobWithAuth(endpoint: string): Promise<Blob> {
  const withToken = (token: string | null) =>
    fetch(`${API_BASE}${endpoint}`, {
      cache: "no-store",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  let res = await withToken(getAccessToken());

  if (res.status === 401 && typeof window !== "undefined") {
    {
      const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (refreshRes.ok) {
        const { access } = (await refreshRes.json()) as { access: string };
        setAccessToken(access);
        res = await withToken(access);
      } else {
        setAccessToken(null);
        throw new Error("Session expired. Please log in again.");
      }
    }
  }

  if (!res.ok) await parseError(res);
  return res.blob();
}

// ---------------------------------------------------------------------------
// Types for auth endpoints
// ---------------------------------------------------------------------------

export interface LoginResponse {
  access: string;
}
/** Registration no longer returns tokens — the account must verify email first. */
export interface RegisterResponse {
  user: User;
  email_verification_required?: boolean;
  detail?: string;
}
/** Verify-email now logs the user in and returns a session. */
export interface VerifyEmailResponse {
  message: string;
  access: string;
  user: User;
}
export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  phone_number?: string;
  referral_code?: string;
  turnstile_token?: string;
}

export interface CreateUserRecipeData {
  name: string;
  description?: string;
  base_recipe_ids?: number[];
  ingredients: {
    name: string;
    product_id?: number | null;
    quantity: string;
    unit: string;
    notes?: string;
    order?: number;
  }[];
}

// ---------------------------------------------------------------------------
// API object
// ---------------------------------------------------------------------------

export const api = {
  products: {
    featured: () => fetchAPI<Product[]>("/api/products/featured/"),
    list: (params?: string) => fetchAPI<Product[]>(`/api/products/${params ? "?" + params : ""}`),
    detail: (slug: string) => fetchAPI<ProductDetail>(`/api/products/${slug}/`),
    categories: () => fetchAPI<Category[]>("/api/products/categories/"),
    search: (query: string) =>
      fetchAPI<{
        query: string;
        results: Product[];
        related: Product[];
        has_results: boolean;
      }>(`/api/products/search/?q=${encodeURIComponent(query)}`),
  },
  blog: {
    list: (params?: string) => fetchAPI<BlogPost[]>(`/api/blog/${params ? "?" + params : ""}`),
    detail: (slug: string) => fetchAPI<BlogPost>(`/api/blog/${slug}/`),
    categories: () => fetchAPI<BlogCategory[]>("/api/blog/categories/"),
  },
  recipes: {
    default: () => fetchAPI<Recipe[]>("/api/recipes/default/"),
    list: () => fetchAPI<Recipe[]>("/api/recipes/"),
    detail: (slug: string) => fetchAPI<RecipeWithPairings>(`/api/recipes/${slug}/`),
    combinationNote: (titles: string[], signal?: AbortSignal) =>
      fetchAPI<{ note: string; source: "cache" | "generated" | "fallback" }>(
        "/api/recipes/combination-note/",
        {
          method: "POST",
          body: JSON.stringify({ titles }),
          signal,
        }
      ),
    myRecipes: {
      list: () => fetchWithAuth<UserRecipe[]>("/api/recipes/my-recipes/"),
      get: (id: number) => fetchWithAuth<UserRecipe>(`/api/recipes/my-recipes/${id}/`),
      create: (data: CreateUserRecipeData) =>
        fetchWithAuth<UserRecipe>("/api/recipes/my-recipes/create/", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: number, data: Partial<CreateUserRecipeData>) =>
        fetchWithAuth<UserRecipe>(`/api/recipes/my-recipes/${id}/`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: number) =>
        fetchWithAuth<void>(`/api/recipes/my-recipes/${id}/`, { method: "DELETE" }),
    },
  },
  auth: {
    login: (email: string, password: string) =>
      fetchAPI<LoginResponse>("/api/auth/token/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    refresh: () =>
      fetchAPI<{ access: string }>("/api/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    logout: () => fetchAPI<null>("/api/auth/logout/", { method: "POST" }),
    register: (data: RegisterData) =>
      fetchAPI<RegisterResponse>("/api/users/register/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verifyEmail: (token: string) =>
      fetchAPI<VerifyEmailResponse>(`/api/users/verify-email/?token=${token}`),
    resendVerification: (email: string) =>
      fetchAPI<{ message: string }>("/api/users/resend-verification/", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    googleAuth: (token: string) =>
      fetchAPI<{ access: string; user: User }>("/api/users/google/", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  },
  users: {
    me: () => fetchWithAuth<User>("/api/users/me/"),
    updateProfile: (data: Partial<Omit<User, "id" | "created_at">>) =>
      fetchWithAuth<User>("/api/users/me/", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    wishlist: {
      list: () => fetchWithAuth<WishlistItem[]>("/api/users/wishlist/"),
      add: (product_id: number) =>
        fetchWithAuth<WishlistItem>("/api/users/wishlist/", {
          method: "POST",
          body: JSON.stringify({ product_id }),
        }),
      remove: (id: number) =>
        fetchWithAuth<null>(`/api/users/wishlist/${id}/`, { method: "DELETE" }),
    },
  },
  cart: {
    get: () =>
      fetchWithAuth<{
        id: number;
        items: { id: number; product: Product; quantity: number }[];
        created_at: string;
        updated_at: string;
      }>("/api/orders/cart/"),
    addItem: (product_id: number, quantity: number) =>
      fetchWithAuth<{ id: number; items: { id: number; product: Product; quantity: number }[] }>(
        "/api/orders/cart/items/",
        {
          method: "POST",
          body: JSON.stringify({ product_id, quantity }),
        }
      ),
    removeItem: (product_id: number) =>
      fetchWithAuth<{ id: number; items: { id: number; product: Product; quantity: number }[] }>(
        "/api/orders/cart/items/",
        {
          method: "DELETE",
          body: JSON.stringify({ product_id }),
        }
      ),
    clear: () =>
      fetchWithAuth<{ id: number; items: [] }>("/api/orders/cart/clear/", { method: "POST" }),
  },
  b2b: {
    apply: (data: FormData) => fetchFormAPI<B2BProfile>("/api/users/b2b/apply/", data),
    status: () => fetchWithAuth<B2BProfile | { status: null }>("/api/users/b2b/status/"),
    prices: () => fetchWithAuth<{ price_list: BusinessPriceList | null }>("/api/users/b2b/prices/"),
    supply: {
      list: () => fetchWithAuth<BusinessSupplyAgreement[]>("/api/subscriptions/business/supply/"),
      create: (data: {
        name: string;
        frequency: "weekly" | "fortnightly" | "monthly";
        delivery_zone: number;
        delivery_address: string;
        receiving_contact_name: string;
        receiving_contact_phone: string;
        receiving_hours?: string;
        delivery_instructions?: string;
        items: Array<{ product_id: number; quantity: number; can_substitute?: boolean }>;
      }) =>
        fetchWithAuth<BusinessSupplyAgreement>("/api/subscriptions/business/supply/", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      action: (id: number, action: "pause" | "resume" | "cancel" | "skip") =>
        fetchWithAuth<BusinessSupplyAgreement>(
          `/api/subscriptions/business/supply/${id}/${action}/`,
          { method: "POST" }
        ),
      revise: (id: number, proposed_changes: Record<string, unknown>, customer_note: string) =>
        fetchWithAuth(`/api/subscriptions/business/supply/${id}/revisions/`, {
          method: "POST",
          body: JSON.stringify({ proposed_changes, customer_note }),
        }),
      initializePayment: (cycleId: number) =>
        fetchWithAuth<{ checkout_url: string; reference: string }>(
          `/api/subscriptions/business/supply/cycles/${cycleId}/payment/`,
          { method: "POST" }
        ),
      verifyPayment: (cycleId: number) =>
        fetchWithAuth<BusinessSupplyAgreement>(
          "/api/subscriptions/business/supply/payment/verify/",
          {
            method: "POST",
            body: JSON.stringify({ cycle_id: cycleId }),
          }
        ),
    },
    setupPassword: (uid: string, token: string, password: string) =>
      fetchAPI<{ message: string; access: string; user: import("@/types").User }>(
        "/api/users/b2b/setup-password/",
        { method: "POST", body: JSON.stringify({ uid, token, password }) }
      ),
  },
  subscriptions: {
    plans: (audience: "household" | "business" = "household") =>
      fetchAPI<SubscriptionPlan[]>(`/api/subscriptions/plans/?audience=${audience}`),
    zones: () => fetchAPI<DeliveryZone[]>("/api/subscriptions/zones/"),
    list: () => fetchWithAuth<FoodSubscription[]>("/api/subscriptions/"),
    create: (data: {
      name?: string;
      audience: "household" | "business";
      plan?: number | null;
      delivery_zone: number;
      delivery_address: string;
      contact_phone: string;
      payment_method: "card" | "mobile_money";
      items?: Array<{ product_id: number; quantity: number; can_substitute?: boolean }>;
    }) =>
      fetchWithAuth<FoodSubscription>("/api/subscriptions/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    action: (id: number, action: "pause" | "resume" | "cancel" | "skip") =>
      fetchWithAuth<FoodSubscription>(`/api/subscriptions/${id}/${action}/`, { method: "POST" }),
    initializePayment: (id: number) =>
      fetchWithAuth<{ checkout_url: string; reference: string }>(
        `/api/subscriptions/${id}/payment/`,
        { method: "POST" }
      ),
    verifyPayment: (reference?: string, weekId?: number) =>
      fetchWithAuth<FoodSubscription>("/api/subscriptions/payment/verify/", {
        method: "POST",
        body: JSON.stringify({ reference, week_id: weekId }),
      }),
    quotes: {
      list: () => fetchWithAuth<WholesaleQuote[]>("/api/subscriptions/business/quotes/"),
      create: (data: {
        requested_delivery_date?: string;
        is_recurring: boolean;
        customer_note?: string;
        items: Array<{
          product_id: number;
          quantity: number;
          requested_unit?: string;
          note?: string;
        }>;
      }) =>
        fetchWithAuth<WholesaleQuote>("/api/subscriptions/business/quotes/", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
  },
  sales: {
    validateCode: (code: string) =>
      fetchAPI<{ valid: boolean }>(`/api/sales/validate-code/?code=${encodeURIComponent(code)}`),
    me: () => fetchWithAuth<SalesRepProfile | { status: null }>("/api/sales/me/"),
    customers: () => fetchWithAuth<ReferredCustomer[]>("/api/sales/customers/"),
    commissions: () => fetchWithAuth<CommissionSummary>("/api/sales/commissions/"),
    addCustomer: (data: {
      first_name: string;
      last_name: string;
      phone_number: string;
      email?: string;
    }) =>
      fetchWithAuth<ReferredCustomer>("/api/sales/customers/add/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  orders: {
    create: (data: {
      items: { product_id: number; quantity: number }[];
      delivery_address: string;
      phone_number: string;
      house_number?: string;
      street_address: string;
      city: string;
      delivery_region: string;
      promo_code?: string;
      order_source?: string;
    }) =>
      fetchWithAuth<Order>("/api/orders/create/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createGuest: (data: {
      items: { product_id: number; quantity: number }[];
      delivery_address: string;
      guest_name: string;
      guest_phone: string;
      phone_number: string;
      house_number?: string;
      street_address: string;
      city: string;
      delivery_region: string;
      guest_email?: string;
      order_source: string;
      promo_code?: string;
    }) =>
      fetchAPI<Order & { guest_access_token: string }>("/api/orders/create/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    initializePayment: (reference: string) =>
      fetchWithAuth<{ checkout_url: string; reference: string }>(
        `/api/orders/${reference}/checkout/`,
        { method: "POST" }
      ),
    initializeGuestPayment: (reference: string, guestAccessToken: string) =>
      fetchAPI<{ checkout_url: string; reference: string }>(`/api/orders/${reference}/checkout/`, {
        method: "POST",
        body: JSON.stringify({ guest_access_token: guestAccessToken }),
      }),
    verifyPayment: (reference?: string, orderReference?: string, guestAccessToken?: string) =>
      fetchWithAuth<Order>("/api/orders/verify-payment/", {
        method: "POST",
        body: JSON.stringify({
          reference,
          order_reference: orderReference,
          guest_access_token: guestAccessToken,
        }),
      }),
    validatePromo: (code: string, order_amount: number) =>
      fetchWithAuth<PromoCode>("/api/orders/validate-promo/", {
        method: "POST",
        body: JSON.stringify({ code, order_amount }),
      }),
    myOrders: () => fetchWithAuth<Order[]>("/api/orders/my-orders/"),
    detail: (reference: string) => fetchWithAuth<Order>(`/api/orders/${reference}/`),
    downloadReceipt: (reference: string) => fetchBlobWithAuth(`/api/orders/${reference}/receipt/`),
    tracking: (token: string) =>
      fetchAPI<import("@/types").PublicOrderTracking>(
        `/api/orders/tracking/${encodeURIComponent(token)}/`,
        { cache: "no-store" }
      ),
  },
  notifications: {
    list: () => fetchWithAuth<NotificationResponse>("/api/notifications/"),
    markRead: (id: number) =>
      fetchWithAuth<AppNotification>(`/api/notifications/${id}/read/`, { method: "PATCH" }),
    markAllRead: () =>
      fetchWithAuth<{ marked: number }>("/api/notifications/mark-all-read/", { method: "POST" }),
    pushConfig: () =>
      fetchWithAuth<{
        enabled: boolean;
        public_key: string;
      }>("/api/notifications/push/config/"),
    subscribePush: (subscription: PushSubscriptionJSON) =>
      fetchWithAuth<{ subscribed: boolean; id: number }>("/api/notifications/push/subscription/", {
        method: "POST",
        body: JSON.stringify(subscription),
      }),
    unsubscribePush: (endpoint: string) =>
      fetchWithAuth<{ unsubscribed: boolean }>("/api/notifications/push/subscription/", {
        method: "DELETE",
        body: JSON.stringify({ endpoint }),
      }),
  },
};

export default api;
