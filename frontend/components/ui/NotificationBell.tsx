'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api, API_BASE } from '@/lib/api'
import type { AppNotification } from '@/types'

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  )
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2"
      fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

interface NotificationBellProps {
  isTransparent: boolean
}

export default function NotificationBell({ isTransparent }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.notifications.list()
      setNotifications(data.results)
      setUnreadCount(data.unread_count)
    } catch {
      // silently ignore — the 60s poll will retry
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount, then poll every 60s (no websockets yet)
  useEffect(() => {
    Promise.resolve().then(fetchNotifications)
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown when clicking outside — same pattern as the account
  // dropdown in Navbar.tsx
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleNotificationClick = useCallback(async (n: AppNotification) => {
    setOpen(false)
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      try {
        await api.notifications.markRead(n.id)
      } catch {
        // navigation below should still proceed even if marking read failed
      }
    }
    if (n.link) {
      // Notification links point at Django admin pages (/admin/...), which are
      // served by the backend host — a different origin from this Next.js app.
      // router.push() only performs client-side navigation within this app's
      // own route tree, so it can neither reach a different origin nor resolve
      // a path Next has no matching page for. A full page navigation to the
      // absolute backend URL is required instead.
      window.open(`${API_BASE}${n.link}`, '_self')
    }
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.notifications.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // ignore — next poll will reconcile
    }
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className={[
          'relative w-9 h-9 rounded-full flex items-center justify-center transition-colors',
          isTransparent
            ? 'hover:bg-white/15'
            : 'text-[#0D3B2A] dark:text-white hover:bg-[#F5F0E6] dark:hover:bg-gray-700',
        ].join(' ')}
        style={isTransparent ? { color: '#ffffff' } : undefined}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
            style={{ backgroundColor: '#F4C430', color: '#0D3B2A' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-mist-white border-[#E6D8BD] rounded-xl shadow-lg z-50 dark:bg-[#1f2937] dark:border-[#374151] overflow-hidden"
          style={{ width: 320, maxHeight: 400, overflowY: 'auto', borderWidth: '0.5px', borderStyle: 'solid' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F5F0E6] dark:border-[#374151] sticky top-0 bg-mist-white dark:bg-[#1f2937]">
            <span className="text-xs font-semibold text-[#0D3B2A] dark:text-white">Notifications</span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium"
              style={{ color: '#2E7D32', border: 'none', background: 'none' }}
            >
              Mark all read
            </button>
          </div>

          {loading && (
            <div className="p-8 text-center text-sm text-[#9ca3af]">Loading…</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="p-8 text-center text-sm text-[#9ca3af]">No notifications yet</div>
          )}

          {!loading && notifications.map((n, idx) => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={[
                'w-full text-left px-4 py-3 transition-colors hover:bg-[#FAF7F0] dark:hover:bg-[#111827]',
                !n.is_read ? 'bg-[#F5F0E6] dark:bg-[#111827]' : '',
              ].join(' ')}
              style={{
                borderBottom: idx !== notifications.length - 1 ? '0.5px solid #F5F0E6' : undefined,
                cursor: 'pointer',
              }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: n.is_read ? '#9ca3af' : '#F4C430' }}
                />
                <div className="min-w-0 flex-1">
                  <p className={[
                    'text-sm',
                    n.is_read
                      ? 'font-normal text-[#0D3B2A] dark:text-[#d1d5db]'
                      : 'font-bold text-[#0D3B2A] dark:text-white',
                  ].join(' ')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[11px] text-[#9ca3af] mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
