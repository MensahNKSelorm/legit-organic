import type { Product, Category, BlogPost, BlogCategory, Recipe } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  products: {
    featured: () => fetchAPI<Product[]>('/api/products/featured/'),
    list: (params?: string) => fetchAPI<Product[]>(`/api/products/${params ? '?' + params : ''}`),
    detail: (slug: string) => fetchAPI<Product>(`/api/products/${slug}/`),
    categories: () => fetchAPI<Category[]>('/api/products/categories/'),
  },
  blog: {
    list: (params?: string) => fetchAPI<BlogPost[]>(`/api/blog/${params ? '?' + params : ''}`),
    detail: (slug: string) => fetchAPI<BlogPost>(`/api/blog/${slug}/`),
    categories: () => fetchAPI<BlogCategory[]>('/api/blog/categories/'),
  },
  recipes: {
    default: () => fetchAPI<Recipe[]>('/api/recipes/default/'),
    list: () => fetchAPI<Recipe[]>('/api/recipes/'),
    detail: (slug: string) => fetchAPI<Recipe>(`/api/recipes/${slug}/`),
  },
}

export default api
