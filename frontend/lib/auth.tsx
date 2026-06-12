'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { User, B2BProfile } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isB2B: boolean
  b2bProfile: B2BProfile | null
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>
  googleLogin: (token: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  refreshB2B: () => Promise<void>
  resendVerification: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [b2bProfile, setB2bProfile] = useState<B2BProfile | null>(null)
  const router = useRouter()

  const refreshB2B = useCallback(async () => {
    try {
      const data = await api.b2b.status()
      setB2bProfile('id' in data ? (data as B2BProfile) : null)
    } catch {
      setB2bProfile(null)
    }
  }, [])

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    api.users
      .me()
      .then((u) => {
        setUser(u)
        refreshB2B()
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setIsLoading(false))
  }, [refreshB2B])

  const login = useCallback(
    async (email: string, password: string) => {
      const { access, refresh } = await api.auth.login(email, password)
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      const userData = await api.users.me()
      setUser(userData)
      refreshB2B()
      router.push('/profile')
    },
    [router, refreshB2B]
  )

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string
    ) => {
      const { user: userData, access, refresh } = await api.auth.register({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: password,
      })
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setUser(userData)
      router.push(`/check-email?email=${encodeURIComponent(email)}`)
    },
    [router]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setB2bProfile(null)
    router.push('/')
  }, [router])

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null))
  }, [])

  const googleLogin = useCallback(
    async (token: string) => {
      const data = await api.auth.googleAuth(token)
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setUser(data.user)
      refreshB2B()
      router.push('/profile')
    },
    [router, refreshB2B]
  )

  const resendVerification = useCallback(async () => {
    await api.auth.resendVerification()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isB2B: b2bProfile?.status === 'approved',
        b2bProfile,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshB2B,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
