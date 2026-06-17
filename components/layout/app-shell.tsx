"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { Logo } from "@/components/brand/logo"

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(400, startWidth + (moveEvent.clientX - startX)))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} width={sidebarWidth} onResize={handleResize} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <Breadcrumbs />
            <div className="animate-fade-in">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
