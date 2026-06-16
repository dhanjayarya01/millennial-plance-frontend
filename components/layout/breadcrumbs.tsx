"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { getProjectById } from "@/data/dummyProjects"
import { getTaskById } from "@/data/dummyTasks"

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  projects: "Projects",
  tasks: "Tasks",
  reports: "Reports",
  "activity-logs": "Activity Logs",
  "work-logs": "Work Logs",
  notifications: "Notifications",
  settings: "Settings",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground">
        <Home className="size-3.5" />
      </Link>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/")
        const isLast = i === segments.length - 1
        let label = labelMap[seg] ?? seg
        const parent = segments[i - 1]
        if (parent === "projects") label = getProjectById(seg)?.name ?? label
        if (parent === "tasks") label = getTaskById(seg)?.name ?? label
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
