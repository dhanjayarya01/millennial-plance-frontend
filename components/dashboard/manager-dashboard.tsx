import { FolderKanban, ListChecks, CheckCircle2, CalendarClock } from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LineChart } from "@/components/charts/line-chart"
import { getManagerStats } from "@/lib/stats"
import { weeklyCompletion, teamPerformance } from "@/data/dummyReports"
import { getUserById } from "@/data/dummyUsers"
import { getProjectById } from "@/data/dummyProjects"
import { ProjectStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { User } from "@/types"

export function ManagerDashboard({ user }: { user: User }) {
  const stats = getManagerStats(user.id)
  const upcoming = stats.tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Projects" value={stats.assignedProjects} icon={FolderKanban} />
        <StatCard label="Active Tasks" value={stats.activeTasks} icon={ListChecks} accent="warning" />
        <StatCard label="Completed Tasks" value={stats.completedTasks} icon={CheckCircle2} accent="success" />
        <StatCard label="Upcoming Deadlines" value={stats.upcomingDeadlines} icon={CalendarClock} accent="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={weeklyCompletion} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {stats.projects.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <Progress value={p.completion} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcoming.map((t) => {
              const overdue = isOverdue(t.deadline)
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{getProjectById(t.projectId)?.name}</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <span className={cn("shrink-0 text-xs font-medium", overdue ? "text-destructive" : "text-muted-foreground")}>
                    {formatDate(t.deadline)}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {teamPerformance.map((row) => {
              const member = getUserById(row.userId)
              return (
                <div key={row.userId} className="flex items-center gap-3">
                  <Avatar name={member?.name ?? "User"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member?.name}</p>
                    <Progress value={row.productivity} className="mt-1.5" />
                  </div>
                  <span className="w-10 text-right text-sm font-medium">{row.productivity}%</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
