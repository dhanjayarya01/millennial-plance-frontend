"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Role } from "@/types"
import { api, BackendUser } from "@/lib/api"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (data: {
    fullName: string
    username: string
    email: string
    password: string
    role: string
  }) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = "pms-auth-token"
const USER_KEY = "pms-auth-user"

function setCookie(name: string, value: string, days?: number) {
  let expires = ""
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = "; expires=" + date.toUTCString()
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"
}

function eraseCookie(name: string) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax"
}

function mapBackendRole(backendRole: string): Role {
  if (backendRole === "ROLE_ADMIN") return "admin"
  if (backendRole === "ROLE_PROJECT_MANAGER") return "manager"
  return "employee"
}

function mapBackendUser(u: BackendUser): User {
  return {
    id: String(u.id),
    name: u.fullName,
    email: u.email,
    password: "",
    role: mapBackendRole(u.role),
    avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
    jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
    department: "Engineering",
    status: u.active ? "active" : "suspended",
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        eraseCookie(TOKEN_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      if (response.success && response.data) {
        const { accessToken, user: backendUser } = response.data
        const mapped = mapBackendUser(backendUser)
        
        localStorage.setItem(TOKEN_KEY, accessToken)
        localStorage.setItem(USER_KEY, JSON.stringify(mapped))
        setCookie(TOKEN_KEY, accessToken, 7)
        
        setUser(mapped)
        return { ok: true }
      }
      return { ok: false, error: response.message || "Invalid credentials." }
    } catch (err: any) {
      return { ok: false, error: err.message || "An error occurred during sign in." }
    }
  }, [])

  const register = useCallback(async (data: {
    fullName: string
    username: string
    email: string
    password: string
    role: string
  }) => {
    try {
      const response = await api.register(data)
      if (response.success) {
        return { ok: true }
      }
      return { ok: false, error: response.message || "Registration failed." }
    } catch (err: any) {
      return { ok: false, error: err.message || "An error occurred during registration." }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    eraseCookie(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
