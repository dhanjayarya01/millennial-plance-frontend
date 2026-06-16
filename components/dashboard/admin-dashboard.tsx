import { FolderKanban, ListChecks, Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { getAdminStats } from "@/lib/stats"
import { dummyProjects } from "@/data/dummyProjects"
import { taskStatusBreakdown, weeklyCompletion, projectProgress, teamPerformance } from "@/data/dummyReports"
import { getUserById } from "@/data/dummyUsers"
import { ProjectStatusBadge } from "@/components/shared/status-badge"
import { Avatar } from "@/components/ui/avatar"

export function AdminDashboard() {
  const stats = getAdminStats()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Projects" value={stats.totalProjects} icon={FolderKanban} trend={8} />
        <StatCard label="Total Tasks" value={stats.totalTasks} icon={ListChecks} trend={12} accent="primary" />
        <StatCard label="Active Employees" value={stats.activeEmployees} icon={Users} trend={4} accent="success" />
        <StatCard label="Overdue Tasks" value={stats.overdueTasks} icon={AlertTriangle} trend={-3} accent="destructive" />
        <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} trend={15} accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={weeklyCompletion} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={taskStatusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {dummyProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <ProjectStatusBadge status={p.status} />
                    <span className="w-9 text-right text-muted-foreground">{p.completion}%</span>
                  </div>
                </div>
                <Progress value={p.completion} />
              </div>
            ))}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={projectProgress} unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {teamPerformance.map((row) => {
              const user = getUserById(row.userId)
              return (
                <div key={row.userId} className="flex items-center gap-3">
                  <Avatar name={user?.name ?? "User"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user?.name}</p>
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
