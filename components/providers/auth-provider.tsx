"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { dummyUsers } from "@/data/dummyUsers"
import type { User } from "@/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "pms-auth-user-id"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore the mock session from localStorage on first load.
  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY)
    if (id) {
      const found = dummyUsers.find((u) => u.id === id) ?? null
      setUser(found)
    }
    setLoading(false)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const match = dummyUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    )
    if (!match) {
      return { ok: false, error: "Invalid email or password." }
    }
    localStorage.setItem(STORAGE_KEY, match.id)
    setUser(match)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
