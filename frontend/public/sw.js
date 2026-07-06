const CACHE_NAME = 'legit-organic-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Never intercept API calls — always go to network
  if (event.request.url.includes('/api/')) return

  // For navigation requests (page loads), use network-first
  // with cache fallback so the shell loads offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/')
      )
    )
    return
  }

  // For static assets, use cache-first
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request)
    )
  )
})
