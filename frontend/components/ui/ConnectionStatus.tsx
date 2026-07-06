'use client'
import { useEffect, useState } from 'react'

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Show "back online" briefly then hide
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3000)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '10px 20px',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        background: isOnline ? '#2E7D32' : '#333333',
        color: '#FAF7F0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      {isOnline ? 'Back online' : "No internet connection — form submissions unavailable"}
    </div>
  )
}
