const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function getMediaUrl(image: string | null | undefined, fallback?: string): string {
  if (!image) return fallback || ''

  // Localhost development — proxy through Next.js to avoid private IP block
  if (image.startsWith('http://localhost:8000/media/')) {
    return image.replace('http://localhost:8000/media/', '/api/media/')
  }
  if (image.startsWith('http://127.0.0.1:8000/media/')) {
    return image.replace('http://127.0.0.1:8000/media/', '/api/media/')
  }

  // Already a full external HTTPS URL (production) — use as-is
  // Next.js Image handles https://api.legitorganic.com/media/ directly
  // since it's in remotePatterns in next.config.ts
  if (image.startsWith('https://')) return image

  // Relative /media/ path
  if (image.startsWith('/media/')) {
    return `${API_BASE}/media/${image.replace('/media/', '')}`
  }

  return image
}
