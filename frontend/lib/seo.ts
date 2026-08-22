import type { Metadata } from 'next'

export const SITE_URL = 'https://legitorganic.com'
export const SITE_NAME = 'Legit Organic'
export const DEFAULT_SOCIAL_IMAGE = '/images/og-image.jpg'

export function absoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return new URL(path.startsWith('/') ? path : `/${path}`, SITE_URL).toString()
}

export function plainText(value: string | null | undefined, limit = 160): string {
  if (!value) return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'en_GH',
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: 'Fresh produce from Legit Organic' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  }
}

export function jsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

