import { ActivityItem } from "@/components/shared/activity-item"
import type { ActivityLog, User } from "@/types"

export function ActivityTimeline({
  limit,
  users = [],
  customLogs = [],
  onLogClick,
}: {
  limit?: number
  users?: User[]
  customLogs?: ActivityLog[]
  onLogClick?: (log: ActivityLog) => void
}) {
  const logs = [...customLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  const visible = limit ? logs.slice(0, limit) : logs

  return (
    <ul className="flex flex-col gap-2">
      {visible.map((log) => (
        <ActivityItem
          key={log.id}
          log={log}
          users={users}
          href={onLogClick ? undefined : (log.projectId ? `/projects/${log.projectId}` : undefined)}
          onClick={onLogClick}
        />
      ))}
    </ul>
  )
}
