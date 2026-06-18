"use client"

import { useEffect, useState } from "react"
import { FolderKanban, ListChecks, Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { ProjectStatusBadge } from "@/components/shared/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { api, BackendProject, BackendTask, BackendUser } from "@/lib/api"
import { isOverdue } from "@/lib/format"
import type { ProjectStatus, ActivityLog } from "@/types"

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<BackendProject[]>([])
  const [tasks, setTasks] = useState<BackendTask[]>([])
  const [users, setUsers] = useState<BackendUser[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, tasksRes, usersRes] = await Promise.all([
          api.getProjects(),
          api.getTasks(),
          api.getUsers(),
        ])

        if (projectsRes.success && tasksRes.success && usersRes.success) {
          setProjects(projectsRes.data)
          setTasks(tasksRes.data)
          setUsers(usersRes.data)

          // Dynamically generate real activities from projects and tasks to show in the timeline
          const generatedActivities: ActivityLog[] = []
          
          // Project creations & updates
          projectsRes.data.forEach((p) => {
            generatedActivities.push({
              id: `p-create-${p.id}`,
              userId: p.manager ? String(p.manager.id) : "u-1",
              action: "created",
              entity: "Project",
              entityName: p.name,
              timestamp: p.startDate ? `${p.startDate}T09:00:00Z` : new Date().toISOString(),
              oldValue: "—",
              newValue: p.status,
              projectId: String(p.id),
            })
            if (p.status.toLowerCase() === "completed") {
              generatedActivities.push({
                id: `p-complete-${p.id}`,
                userId: p.manager ? String(p.manager.id) : "u-1",
                action: "completed",
                entity: "Project",
                entityName: p.name,
                timestamp: p.endDate ? `${p.endDate}T17:00:00Z` : new Date().toISOString(),
                oldValue: "planning",
                newValue: "completed",
                projectId: String(p.id),
              })
            }
          })

          // Task assignments & completions
          tasksRes.data.forEach((t) => {
            if (t.employee) {
              generatedActivities.push({
                id: `t-assign-${t.id}`,
                userId: "u-1",
                action: "assigned",
                entity: "Task",
                entityName: t.name,
                timestamp: new Date().toISOString(),
                oldValue: "—",
                newValue: t.employee.fullName,
                projectId: String(t.projectId),
              })
            }
            if (t.status.toLowerCase().replace("_", "") === "completed" || t.status.toLowerCase() === "done") {
              generatedActivities.push({
                id: `t-complete-${t.id}`,
                userId: t.employee ? String(t.employee.id) : "u-3",
                action: "completed",
                entity: "Task",
                entityName: t.name,
                timestamp: t.deadline ? `${t.deadline}T16:00:00Z` : new Date().toISOString(),
                oldValue: "in-progress",
                newValue: "done",
                projectId: String(t.projectId),
              })
            }
          })

          setActivities(generatedActivities)
        }
      } catch (err) {
        console.error("Failed to load admin dashboard data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  // Calculate stats
  const totalProjects = projects.length
  const totalTasks = tasks.length
  const activeEmployees = users.filter((u) => u.role === "ROLE_EMPLOYEE" && u.active).length
  const overdueTasks = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE" && t.deadline && isOverdue(t.deadline)).length
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length

  // Task Status breakdown
  const todoCount = tasks.filter((t) => t.status === "TO_DO" || t.status === "TODO").length
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length
  const reviewCount = tasks.filter((t) => t.status === "IN_REVIEW" || t.status === "REVIEW").length
  const doneCount = completedTasks
  const taskStatusBreakdown = [
    { label: "To Do", value: todoCount },
    { label: "In Progress", value: inProgressCount },
    { label: "Review", value: reviewCount },
    { label: "Done", value: doneCount },
  ]

  // Weekly Completion breakdown (based on task deadlines of completed tasks)
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const weeklyCompletion = weekdays.map((day) => {
    const value = tasks.filter((t) => {
      if (t.status !== "COMPLETED" && t.status !== "DONE") return false
      if (!t.deadline) return false
      const weekdayStr = new Date(t.deadline).toLocaleDateString("en-US", { weekday: "short" })
      return weekdayStr === day
    }).length
    return { label: day, value }
  })

  // Projects progress for chart (BarChart)
  const projectProgress = projects.map((p) => ({
    label: p.name.length > 12 ? p.name.substring(0, 10) + "..." : p.name,
    value: Math.round(p.progressPercentage || 0),
  })).slice(0, 5)

  // Team performance (productivity based on task completion percentage)
  const teamPerformance = users
    .filter((u) => u.role === "ROLE_EMPLOYEE")
    .map((u) => {
      const userTasks = tasks.filter((t) => t.employee && t.employee.id === u.id)
      const completed = userTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length
      const total = userTasks.length
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0
      return {
        userId: String(u.id),
        name: u.fullName,
        role: u.role,
        avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
        productivity,
      }
    })
    .sort((a, b) => b.productivity - a.productivity)
    .slice(0, 5)

  const mappedUsers = users.map((u) => ({
    id: String(u.id),
    name: u.fullName,
    email: u.email,
    password: "",
    role: (u.role === "ROLE_ADMIN" ? "admin" : u.role === "ROLE_PROJECT_MANAGER" ? "manager" : "employee") as any,
    avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
    jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
    department: "Engineering",
    status: (u.active ? "active" : "suspended") as any,
  }))

  const mapStatus = (s: string): ProjectStatus => {
    const statusLower = s.toLowerCase().replace("_", "-")
    if (statusLower === "planning" || statusLower === "in-progress" || statusLower === "on-hold" || statusLower === "completed") {
      return statusLower as ProjectStatus
    }
    return "planning"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Projects" value={totalProjects} icon={FolderKanban} trend={0} />
        <StatCard label="Total Tasks" value={totalTasks} icon={ListChecks} trend={0} accent="primary" />
        <StatCard label="Active Employees" value={activeEmployees} icon={Users} trend={0} accent="success" />
        <StatCard label="Overdue Tasks" value={overdueTasks} icon={AlertTriangle} trend={0} accent="destructive" />
        <StatCard label="Completed" value={completedTasks} icon={CheckCircle2} trend={0} accent="success" />
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
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <ProjectStatusBadge status={mapStatus(p.status)} />
                    <span className="w-9 text-right text-muted-foreground">{Math.round(p.progressPercentage || 0)}%</span>
                  </div>
                </div>
                <Progress value={p.progressPercentage || 0} />
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No projects found.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline limit={5} users={mappedUsers} customLogs={activities} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {projectProgress.length > 0 ? (
              <BarChart data={projectProgress} unit="%" />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No data available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {teamPerformance.map((row) => (
              <div key={row.userId} className="flex items-center gap-3">
                <Avatar name={row.name} src={row.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <Progress value={row.productivity} className="mt-1.5" />
                </div>
                <span className="w-10 text-right text-sm font-medium">{row.productivity}%</span>
              </div>
            ))}
            {teamPerformance.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No employees found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
