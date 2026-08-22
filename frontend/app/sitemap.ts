import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://legitorganic.com'
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const staticPages: MetadataRoute.Sitemap = [
    { path: '', changeFrequency: 'daily' as const, priority: 1 },
    { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/subscriptions', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/b2b', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/recipes', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/terms-of-service', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/photo-credits', changeFrequency: 'yearly' as const, priority: 0.1 },
  ].map(({ path, ...entry }) => ({ url: `${baseUrl}${path}`, ...entry }))

  const list = <T,>(payload: T[] | { results?: T[] }): T[] =>
    Array.isArray(payload) ? payload : payload.results || []

  const validDate = (value?: string) => {
    if (!value) return undefined
    const date = new Date(value)
    return Number.isNaN(date.valueOf()) ? undefined : date
  }

  try {
    const [products, posts, recipes] = await Promise.all([
      fetch(`${apiUrl}/api/products/`).then(r => {
        if (!r.ok) throw new Error('Products sitemap request failed')
        return r.json()
      }),
      fetch(`${apiUrl}/api/blog/`).then(r => {
        if (!r.ok) throw new Error('Blog sitemap request failed')
        return r.json()
      }),
      fetch(`${apiUrl}/api/recipes/`).then(r => {
        if (!r.ok) throw new Error('Recipes sitemap request failed')
        return r.json()
      }),
    ])

    const productPages = list<{ slug: string; updated_at?: string }>(products).map(p => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: validDate(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const blogPages = list<{ slug: string; updated_at?: string; published_at?: string; created_at?: string }>(posts).map(p => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: validDate(p.updated_at || p.published_at || p.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    const recipePages = list<{ slug: string; updated_at?: string; published_at?: string; created_at?: string }>(recipes).map(r => ({
      url: `${baseUrl}/recipes/${r.slug}`,
      lastModified: validDate(r.updated_at || r.published_at || r.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...blogPages, ...recipePages]
  } catch {
    return staticPages
  }
}
