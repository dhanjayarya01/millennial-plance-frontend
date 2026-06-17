"use client"

import { useEffect, useState } from "react"
import { ListChecks, CheckCircle2, CalendarClock, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { User, TaskPriority, TaskStatus, ActivityLog } from "@/types"
import { api, BackendTask, BackendUser } from "@/lib/api"

export function EmployeeDashboard({ user }: { user: User }) {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<BackendTask[]>([])
  const [users, setUsers] = useState<BackendUser[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksRes, usersRes] = await Promise.all([
          api.getTasks(),
          api.getUsers(),
        ])

        if (tasksRes.success && usersRes.success) {
          setTasks(tasksRes.data)
          setUsers(usersRes.data)

          // Generate activities for this employee
          const generatedActivities: ActivityLog[] = []
          tasksRes.data
            .filter((t) => t.employee && String(t.employee.id) === String(user.id))
            .forEach((t) => {
              if (t.status === "COMPLETED" || t.status === "DONE") {
                generatedActivities.push({
                  id: `t-complete-${t.id}`,
                  userId: String(user.id),
                  action: "completed",
                  entity: "Task",
                  entityName: t.name,
                  timestamp: t.deadline ? `${t.deadline}T16:00:00Z` : new Date().toISOString(),
                  oldValue: "in-progress",
                  newValue: "done",
                  projectId: String(t.projectId),
                })
              } else {
                generatedActivities.push({
                  id: `t-active-${t.id}`,
                  userId: String(user.id),
                  action: "updated status of",
                  entity: "Task",
                  entityName: t.name,
                  timestamp: new Date().toISOString(),
                  oldValue: "—",
                  newValue: t.status,
                  projectId: String(t.projectId),
                })
              }
            })
          setActivities(generatedActivities)
        }
      } catch (err) {
        console.error("Failed to load employee dashboard data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  // Filter tasks assigned to this employee
  const employeeTasks = tasks.filter((t) => t.employee && String(t.employee.id) === String(user.id))

  // Stats
  const assignedTasks = employeeTasks.length
  const completedTasksCount = employeeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length
  const dueSoon = employeeTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE" && t.deadline && !isOverdue(t.deadline)).length
  const overdue = employeeTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE" && t.deadline && isOverdue(t.deadline)).length

  // Map priority
  const mapPriority = (p: string): TaskPriority => {
    const pLower = p.toLowerCase()
    if (pLower === "critical") return "urgent"
    if (pLower === "low" || pLower === "medium" || pLower === "high" || pLower === "urgent") {
      return pLower as TaskPriority
    }
    return "medium"
  }

  // Map status
  const mapTaskStatus = (s: string): TaskStatus => {
    const sLower = s.toLowerCase().replace("_", "-")
    if (sLower === "todo" || sLower === "to-do") return "todo"
    if (sLower === "in-progress") return "in-progress"
    if (sLower === "review" || sLower === "in-review") return "review"
    if (sLower === "done" || sLower === "completed") return "done"
    return "todo"
  }

  // Active tasks sorted by deadline
  const active = employeeTasks
    .filter((t) => t.status !== "COMPLETED" && t.status !== "DONE")
    .map((t) => ({
      id: String(t.id),
      name: t.name,
      deadline: t.deadline || "",
      priority: mapPriority(t.priority),
      status: mapTaskStatus(t.status),
      projectId: String(t.projectId),
      projectName: t.projectName || "Unknown Project",
    }))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Tasks" value={assignedTasks} icon={ListChecks} />
        <StatCard label="Completed" value={completedTasksCount} icon={CheckCircle2} accent="success" />
        <StatCard label="Due Soon" value={dueSoon} icon={CalendarClock} accent="warning" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} accent="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Active Tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {active.map((t) => {
              const overdueFlag = isOverdue(t.deadline)
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.projectName}</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                  <span className={cn("hidden shrink-0 text-xs font-medium sm:block", overdueFlag ? "text-destructive" : "text-muted-foreground")}>
                    {formatDate(t.deadline)}
                  </span>
                </div>
              )
            })}
            {active.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No active tasks assigned to you.</p>
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
    </div>
  )
}
