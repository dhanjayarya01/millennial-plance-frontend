import Link from "next/link"
import type { ActivityLog, User } from "@/types"
import { getUserById } from "@/data/dummyUsers"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"
import { projectColor } from "@/lib/colors"
import { cn } from "@/lib/utils"

const entityVariant: Record<ActivityLog["entity"], "default" | "neutral" | "warning"> = {
  Project: "default",
  Task: "warning",
  User: "neutral",
}

export function ActivityItem({
  log,
  href,
  className,
  users = [],
  onClick,
}: {
  log: ActivityLog
  href?: string
  className?: string
  users?: User[]
  onClick?: (log: ActivityLog) => void
}) {
  const user = users.find((u) => String(u.id) === String(log.userId)) || getUserById(log.userId)
  const accent = log.projectId ? projectColor(log.projectId) : "var(--border)"
  const hasChange = log.oldValue !== "—" || log.newValue !== "—"

  const content = (
    <>
      <Avatar name={user?.name ?? "?"} src={user?.avatar} size="sm" role={user?.role} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-pretty">
          <span className="font-medium">{user?.name ?? "Unknown"}</span>{" "}
          <span className="text-muted-foreground">{log.action}</span>{" "}
          <Badge variant={entityVariant[log.entity]} className="align-middle">
            {log.entity}
          </Badge>{" "}
          <span className="font-medium">{log.entityName}</span>
        </p>
        {hasChange && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
              {log.oldValue}
            </span>
            <span className="text-muted-foreground">{"->"}</span>
            <span className="rounded bg-[var(--success)]/12 px-1.5 py-0.5 text-[var(--success)]">
              {log.newValue}
            </span>
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
      </div>
    </>
  )

  const baseClass = cn(
    "flex items-start text-left w-full gap-3 rounded-lg border border-l-4 border-border bg-card p-3 transition-colors",
    (href || onClick) && "hover:bg-muted/50 cursor-pointer select-none",
    className,
  )

  if (href) {
    return (
      <li>
        <Link href={href} className={baseClass} style={{ borderLeftColor: accent }}>
          {content}
        </Link>
      </li>
    )
  }

  if (onClick) {
    return (
      <li>
        <button type="button" onClick={() => onClick(log)} className={baseClass} style={{ borderLeftColor: accent }}>
          {content}
        </button>
      </li>
    )
  }

  return (
    <li className={baseClass} style={{ borderLeftColor: accent }}>
      {content}
    </li>
  )
}
