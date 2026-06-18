"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useEffect, useMemo, useState } from "react"
import { Bell, AlertTriangle, Clock, AtSign, UserPlus, Info, Check, BellOff } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/types"

const typeIcon = {
  deadline: Clock,
  overdue: AlertTriangle,
  mention: AtSign,
  assignment: UserPlus,
  system: Info,
}

const typeColor = {
  deadline: "bg-[var(--warning)]/15 text-[var(--warning)]",
  overdue: "bg-destructive/12 text-destructive",
  mention: "bg-primary/10 text-primary",
  assignment: "bg-primary/10 text-primary",
  system: "bg-muted text-muted-foreground",
}

const filters = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
] as const

function mapWorkerNotification(notif: any): AppNotification {
  let mappedType: "deadline" | "overdue" | "mention" | "assignment" | "system" = "system";
  if (notif.type.startsWith("REMINDER_")) {
    mappedType = "deadline";
  } else if (notif.type === "OVERDUE" || notif.type === "OVERDUE_MANAGER") {
    mappedType = "overdue";
  }
  return {
    id: String(notif.id),
    title: notif.title,
    message: notif.message,
    type: mappedType,
    read: notif.read,
    timestamp: notif.createdAt,
  };
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all")
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      try {
        const res = await fetch(`http://localhost:8081/api/worker/notifications/user/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.map(mapWorkerNotification))
        }
      } catch (err) {
        console.error("Error fetching notifications:", err)
      }
    }

    fetchNotifications()

    const eventSource = new EventSource(`http://localhost:8081/api/worker/notifications/subscribe/${user.id}`)

    const handleNotification = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        const mapped = mapWorkerNotification(data)
        setItems((prev) => {
          if (prev.some((n) => n.id === mapped.id)) return prev
          return [mapped, ...prev]
        })
      } catch (err) {
        console.error("Error parsing real-time notification:", err)
      }
    }

    eventSource.addEventListener("notification", handleNotification)

    return () => {
      eventSource.removeEventListener("notification", handleNotification)
      eventSource.close()
    }
  }, [user])

  const filtered = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter],
  )

  async function markAllRead() {
    if (!user) return
    try {
      await fetch(`http://localhost:8081/api/worker/notifications/user/${user.id}/read-all`, {
        method: "PUT",
      })
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error("Error marking all read:", err)
    }
  }

  async function toggleRead(id: string) {
    const notif = items.find((n) => n.id === id)
    if (!notif) return

    try {
      const newReadState = !notif.read
      if (newReadState) {
        await fetch(`http://localhost:8081/api/worker/notifications/${id}/read`, {
          method: "PUT",
        })
      }
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: newReadState } : n)))
    } catch (err) {
      console.error("Error toggling read state:", err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You're all caught up."}
        actions={
          unread > 0 ? (
            <Button variant="outline" onClick={markAllRead}>
              <Check className="size-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-1 rounded-lg border border-border p-1 sm:w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none",
              filter === f.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {f.key === "unread" && unread > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-xs text-primary">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BellOff} title="Nothing here" description="You have no notifications in this view." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => {
            const Icon = typeIcon[n.type]
            return (
              <Card
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 transition-colors",
                  !n.read && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", typeColor[n.type])}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.timestamp)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRead(n.id)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  {n.read ? "Mark unread" : "Mark read"}
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
