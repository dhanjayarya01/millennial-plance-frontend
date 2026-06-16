import { ListChecks, CheckCircle2, CalendarClock, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmployeeStats } from "@/lib/stats"
import { getProjectById } from "@/data/dummyProjects"
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { User } from "@/types"

export function EmployeeDashboard({ user }: { user: User }) {
  const stats = getEmployeeStats(user.id)
  const active = stats.tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Tasks" value={stats.assignedTasks} icon={ListChecks} />
        <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} accent="success" />
        <StatCard label="Due Soon" value={stats.dueSoon} icon={CalendarClock} accent="warning" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Active Tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {active.map((t) => {
              const overdue = isOverdue(t.deadline)
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{getProjectById(t.projectId)?.name}</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                  <span className={cn("hidden shrink-0 text-xs font-medium sm:block", overdue ? "text-destructive" : "text-muted-foreground")}>
                    {formatDate(t.deadline)}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline limit={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
