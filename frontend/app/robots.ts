import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/profile', '/my-recipes', '/order-confirmation'],
      },
    ],
    sitemap: 'https://legitorganic.com/sitemap.xml',
  }
}
