"use client"

import { useMemo, useState } from "react"
import { Bell, AlertTriangle, Clock, AtSign, UserPlus, Info, Check, BellOff } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { dummyNotifications } from "@/data/dummyNotifications"
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

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>(dummyNotifications)
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all")
  const unread = items.filter((n) => !n.read).length

  const filtered = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter],
  )

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function toggleRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)))
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
