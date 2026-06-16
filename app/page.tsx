"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Logo } from "@/components/brand/logo"

// Entry point: routes users to their dashboard or the login screen.
export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(user ? "/dashboard" : "/login")
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    </div>
  )
}
