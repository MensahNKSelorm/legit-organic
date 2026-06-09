import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://legitorganic.com'

  const staticPages = [
    '', '/products', '/blog', '/recipes',
    '/about', '/contact', '/privacy-policy', '/terms-of-service',
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  try {
    const [products, posts, recipes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog/`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recipes/`).then(r => r.json()),
    ])

    const productPages = (products || []).map((p: { slug: string; updated_at: string }) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const blogPages = (posts || []).map((p: { slug: string; updated_at?: string; created_at: string }) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at || p.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    const recipePages = (recipes || []).map((r: { slug: string; updated_at?: string; created_at: string }) => ({
      url: `${baseUrl}/recipes/${r.slug}`,
      lastModified: new Date(r.updated_at || r.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...productPages, ...blogPages, ...recipePages]
  } catch {
    return staticPages
  }
}
