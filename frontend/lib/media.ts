const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function getMediaUrl(image: string | null | undefined, fallback?: string): string {
  if (!image) return fallback || ''
  if (image.startsWith('http://localhost:8000/media/')) {
    return image.replace('http://localhost:8000/media/', '/api/media/')
  }
  if (image.startsWith('http://127.0.0.1:8000/media/')) {
    return image.replace('http://127.0.0.1:8000/media/', '/api/media/')
  }
  if (image.startsWith(`${API_BASE}/media/`)) {
    return image.replace(`${API_BASE}/media/`, '/api/media/')
  }
  if (image.startsWith('/media/')) {
    return `/api/media/${image.replace('/media/', '')}`
  }
  return image
}
