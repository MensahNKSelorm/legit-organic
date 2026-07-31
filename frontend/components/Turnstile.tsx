'use client'

import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget.
 *
 * Enabled only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. When unset (current
 * dev + production until keys are provisioned) the component renders nothing and
 * signup proceeds without a token — mirroring the backend, which only enforces
 * Turnstile once its secret key is configured.
 *
 * The token is single-use and expires; on expiry/error the parent is notified
 * with null so it can disable submission and (via a remount `key`) re-render a
 * fresh challenge.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
export const TURNSTILE_ENABLED = !!TURNSTILE_SITE_KEY

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

// Shared, deduplicated load promise. Kept at module scope so concurrent widgets
// share one script request. On failure it is cleared (and the dead <script>
// removed) so a later Retry issues a genuinely new request rather than awaiting a
// load/error event that has already fired on a stale element.
let loadPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      // Remove the failed element and reset the cache so Retry starts clean.
      script.remove()
      loadPromise = null
      reject(new Error('turnstile load failed'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export default function Turnstile({
  onToken,
  onError,
}: {
  onToken: (token: string | null) => void
  onError?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_ENABLED) return
    let cancelled = false

    const resetWidget = () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetId.current)
        } catch {
          /* widget gone; parent can remount via key */
        }
      }
    }

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => onToken(token),
          // Expiry/timeout: invalidate the token AND present a fresh challenge so
          // the user is never stuck with a stale, unsolvable widget.
          'expired-callback': () => {
            onToken(null)
            resetWidget()
          },
          'timeout-callback': () => {
            onToken(null)
            resetWidget()
          },
          // Hard error (challenge failed to run): surface to the parent so it can
          // show a message + retry control.
          'error-callback': () => {
            onToken(null)
            onError?.()
          },
        })
      })
      .catch(() => {
        // Script failed to load — the widget will never render, so the parent
        // must be told to offer a retry instead of leaving submit disabled.
        onToken(null)
        onError?.()
      })

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current)
        } catch {
          /* widget already gone */
        }
      }
    }
    // onToken/onError are stable (state setter + stable callback) — run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!TURNSTILE_ENABLED) return null
  return <div ref={containerRef} className="flex justify-center" />
}
