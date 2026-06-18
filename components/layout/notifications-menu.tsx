"use client"

import { useEffect, useState } from "react"
import { Bell, AlertTriangle, Clock, AtSign, UserPlus, Info, Check } from "lucide-react"
import { Dropdown } from "@/components/ui/dropdown"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/types"
import { useAuth } from "@/components/providers/auth-provider"

const typeIcon = {
  deadline: Clock,
  overdue: AlertTriangle,
  mention: AtSign,
  assignment: UserPlus,
  system: Info,
}

const typeColor = {
  deadline: "text-[var(--warning)]",
  overdue: "text-destructive",
  mention: "text-primary",
  assignment: "text-primary",
  system: "text-muted-foreground",
}

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

export function NotificationsMenu() {
  const { user } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
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
      if (!notif.read) {
        await fetch(`http://localhost:8081/api/worker/notifications/${id}/read`, {
          method: "PUT",
        })
      }
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)))
    } catch (err) {
      console.error("Error toggling read state:", err)
    }
  }

  return (
    <Dropdown
      contentClassName="w-80 p-0"
      trigger={
        <span className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[0.6rem] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </span>
      }
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Notifications</p>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Check className="size-3.5" />
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {items.map((n) => {
          const Icon = typeIcon[n.type]
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => toggleRead(n.id)}
              className={cn(
                "flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/50",
                !n.read && "bg-primary/[0.04]",
              )}
            >
              <Icon className={cn("mt-0.5 size-4.5 shrink-0", typeColor[n.type])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <p className="text-xs text-muted-foreground text-pretty">{n.message}</p>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">{timeAgo(n.timestamp)}</p>
              </div>
              {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </Dropdown>
  )
}
