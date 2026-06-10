import type {
  Product, ProductDetail, Category,
  BlogPost, BlogCategory,
  Recipe, RecipeWithPairings, UserRecipe,
  User, Order, PromoCode, WishlistItem,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/** Parse DRF error responses into a readable message. */
async function parseError(res: Response): Promise<never> {
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  if (typeof data.detail === 'string') throw new Error(data.detail)
  if (typeof data.message === 'string') throw new Error(data.message)
  const first = Object.values(data).flat().find((v): v is string => typeof v === 'string')
  throw new Error(first || `API error: ${res.status}`)
}

// ---------------------------------------------------------------------------
// Public fetcher — used by server components
// ---------------------------------------------------------------------------

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) await parseError(res)
  return res.json()
}

// ---------------------------------------------------------------------------
// Authenticated fetcher — client-only, with auto token-refresh on 401
// ---------------------------------------------------------------------------

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const buildHeaders = (token: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  })

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: buildHeaders(getAccessToken()),
  })

  // Attempt token refresh on 401
  if (res.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (refreshRes.ok) {
        const { access } = await refreshRes.json() as { access: string }
        localStorage.setItem('access_token', access)
        res = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: buildHeaders(access),
        })
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        throw new Error('Session expired. Please log in again.')
      }
    }
  }

  if (!res.ok) await parseError(res)
  if (res.status === 204) return null as T
  return res.json()
}

// ---------------------------------------------------------------------------
// Types for auth endpoints
// ---------------------------------------------------------------------------

export interface LoginResponse { access: string; refresh: string }
export interface RegisterResponse { user: User; access: string; refresh: string }
export interface RegisterData {
  email: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
}

export interface CreateUserRecipeData {
  name: string
  description?: string
  base_recipe_ids?: number[]
  ingredients: {
    name: string
    product_id?: number | null
    quantity: string
    unit: string
    notes?: string
    order?: number
  }[]
}

// ---------------------------------------------------------------------------
// API object
// ---------------------------------------------------------------------------

export const api = {
  products: {
    featured: () => fetchAPI<Product[]>('/api/products/featured/'),
    list: (params?: string) => fetchAPI<Product[]>(`/api/products/${params ? '?' + params : ''}`),
    detail: (slug: string) => fetchAPI<ProductDetail>(`/api/products/${slug}/`),
    categories: () => fetchAPI<Category[]>('/api/products/categories/'),
    search: (query: string) => fetchAPI<{
      query: string
      results: Product[]
      related: Product[]
      has_results: boolean
    }>(`/api/products/search/?q=${encodeURIComponent(query)}`),
  },
  blog: {
    list: (params?: string) => fetchAPI<BlogPost[]>(`/api/blog/${params ? '?' + params : ''}`),
    detail: (slug: string) => fetchAPI<BlogPost>(`/api/blog/${slug}/`),
    categories: () => fetchAPI<BlogCategory[]>('/api/blog/categories/'),
  },
  recipes: {
    default: () => fetchAPI<Recipe[]>('/api/recipes/default/'),
    list: () => fetchAPI<Recipe[]>('/api/recipes/'),
    detail: (slug: string) => fetchAPI<RecipeWithPairings>(`/api/recipes/${slug}/`),
    myRecipes: {
      list: () => fetchWithAuth<UserRecipe[]>('/api/recipes/my-recipes/'),
      get: (id: number) => fetchWithAuth<UserRecipe>(`/api/recipes/my-recipes/${id}/`),
      create: (data: CreateUserRecipeData) =>
        fetchWithAuth<UserRecipe>('/api/recipes/my-recipes/create/', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: number, data: Partial<CreateUserRecipeData>) =>
        fetchWithAuth<UserRecipe>(`/api/recipes/my-recipes/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: number) =>
        fetchWithAuth<void>(`/api/recipes/my-recipes/${id}/`, { method: 'DELETE' }),
    },
  },
  auth: {
    login: (email: string, password: string) =>
      fetchAPI<LoginResponse>('/api/auth/token/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    refresh: (refresh: string) =>
      fetchAPI<{ access: string }>('/api/auth/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      }),
    register: (data: RegisterData) =>
      fetchAPI<RegisterResponse>('/api/users/register/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyEmail: (token: string) =>
      fetchAPI<{ message: string }>(`/api/users/verify-email/?token=${token}`),
    resendVerification: () =>
      fetchWithAuth<{ message: string }>('/api/users/resend-verification/', { method: 'POST' }),
    googleAuth: (token: string) =>
      fetchAPI<{ access: string; refresh: string; user: User }>('/api/users/google/', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },
  users: {
    me: () => fetchWithAuth<User>('/api/users/me/'),
    updateProfile: (data: Partial<Omit<User, 'id' | 'created_at'>>) =>
      fetchWithAuth<User>('/api/users/me/', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    wishlist: {
      list: () => fetchWithAuth<WishlistItem[]>('/api/users/wishlist/'),
      add: (product_id: number) =>
        fetchWithAuth<WishlistItem>('/api/users/wishlist/', {
          method: 'POST',
          body: JSON.stringify({ product_id }),
        }),
      remove: (id: number) =>
        fetchWithAuth<null>(`/api/users/wishlist/${id}/`, { method: 'DELETE' }),
    },
  },
  cart: {
    get: () => fetchWithAuth<{ id: number; items: { id: number; product: Product; quantity: number }[]; created_at: string; updated_at: string }>('/api/orders/cart/'),
    addItem: (product_id: number, quantity: number) =>
      fetchWithAuth<{ id: number; items: { id: number; product: Product; quantity: number }[] }>('/api/orders/cart/items/', {
        method: 'POST',
        body: JSON.stringify({ product_id, quantity }),
      }),
    removeItem: (product_id: number) =>
      fetchWithAuth<{ id: number; items: { id: number; product: Product; quantity: number }[] }>('/api/orders/cart/items/', {
        method: 'DELETE',
        body: JSON.stringify({ product_id }),
      }),
    clear: () => fetchWithAuth<{ id: number; items: [] }>('/api/orders/cart/clear/', { method: 'POST' }),
  },
  orders: {
    create: (data: {
      items: { product_id: number; quantity: number }[]
      delivery_address: string
      promo_code?: string
      order_source?: string
    }) =>
      fetchWithAuth<Order>('/api/orders/create/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createGuest: (data: {
      items: { product_id: number; quantity: number }[]
      delivery_address: string
      guest_name: string
      guest_phone: string
      guest_email?: string
      order_source: string
      promo_code?: string
    }) =>
      fetchAPI<Order>('/api/orders/create/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyPayment: (reference: string) =>
      fetchWithAuth<Order>('/api/orders/verify-payment/', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      }),
    validatePromo: (code: string, order_amount: number) =>
      fetchWithAuth<PromoCode>('/api/orders/validate-promo/', {
        method: 'POST',
        body: JSON.stringify({ code, order_amount }),
      }),
    myOrders: () => fetchWithAuth<Order[]>('/api/orders/my-orders/'),
    detail: (reference: string) => fetchWithAuth<Order>(`/api/orders/${reference}/`),
  },
}

export default api
