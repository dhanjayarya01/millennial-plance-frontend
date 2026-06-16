import { dummyActivityLogs } from "@/data/dummyLogs"
import { getProjectById } from "@/data/dummyProjects"
import { ActivityItem } from "@/components/shared/activity-item"

export function ActivityTimeline({ limit }: { limit?: number }) {
  const logs = [...dummyActivityLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  const visible = limit ? logs.slice(0, limit) : logs

  return (
    <ul className="flex flex-col gap-2">
      {visible.map((log) => (
        <ActivityItem
          key={log.id}
          log={log}
          href={log.projectId && getProjectById(log.projectId) ? `/projects/${log.projectId}` : undefined}
        />
      ))}
    </ul>
  )
}
