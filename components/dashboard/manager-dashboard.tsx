"use client"

import { useEffect, useState } from "react"
import { FolderKanban, ListChecks, CheckCircle2, CalendarClock } from "lucide-react"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LineChart } from "@/components/charts/line-chart"
import { ProjectStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { User, ProjectStatus, TaskPriority, TaskStatus, Task } from "@/types"
import { api, BackendProject, BackendTask, BackendUser } from "@/lib/api"

export function ManagerDashboard({ user }: { user: User }) {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<BackendProject[]>([])
  const [tasks, setTasks] = useState<BackendTask[]>([])
  const [users, setUsers] = useState<BackendUser[]>([])

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
        }
      } catch (err) {
        console.error("Failed to load manager dashboard data", err)
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

  // Filter manager projects
  const managerProjects = projects.filter((p) => p.manager && String(p.manager.id) === String(user.id))
  const projectIds = new Set(managerProjects.map((p) => p.id))
  const managerTasks = tasks.filter((t) => projectIds.has(t.projectId))

  // Stats
  const assignedProjects = managerProjects.length
  const activeTasks = managerTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE").length
  const completedTasksCount = managerTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length
  const upcomingDeadlines = managerTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE" && t.deadline && !isOverdue(t.deadline)).length

  // Map priorities
  const mapPriority = (p: string): TaskPriority => {
    const pLower = p.toLowerCase()
    if (pLower === "critical") return "urgent"
    if (pLower === "low" || pLower === "medium" || pLower === "high" || pLower === "urgent") {
      return pLower as TaskPriority
    }
    return "medium"
  }

  // Upcoming manager tasks list
  const upcoming = managerTasks
    .filter((t) => t.status !== "COMPLETED" && t.status !== "DONE")
    .map((t) => ({
      id: String(t.id),
      name: t.name,
      deadline: t.deadline || "",
      priority: mapPriority(t.priority),
      projectName: t.projectName || "Unknown Project",
    }))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5)

  // Weekly Task Completion (based on task deadlines of completed tasks)
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const weeklyCompletion = weekdays.map((day) => {
    const value = managerTasks.filter((t) => {
      if (t.status !== "COMPLETED" && t.status !== "DONE") return false
      if (!t.deadline) return false
      const weekdayStr = new Date(t.deadline).toLocaleDateString("en-US", { weekday: "short" })
      return weekdayStr === day
    }).length
    return { label: day, value }
  })

  // Employee Performance in manager's projects
  const teamPerformance = users
    .filter((u) => u.role === "ROLE_EMPLOYEE")
    .map((u) => {
      const userTasks = managerTasks.filter((t) => t.employee && t.employee.id === u.id)
      const completed = userTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length
      const total = userTasks.length
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0
      return {
        userId: String(u.id),
        name: u.fullName,
        avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
        productivity,
      }
    })
    .filter((u) => {
      // Show employees who have tasks in this manager's projects
      return managerTasks.some((t) => t.employee && t.employee.id === Number(u.userId))
    })
    .sort((a, b) => b.productivity - a.productivity)
    .slice(0, 5)

  const mapStatus = (s: string): ProjectStatus => {
    const statusLower = s.toLowerCase().replace("_", "-")
    if (statusLower === "planning" || statusLower === "in-progress" || statusLower === "on-hold" || statusLower === "completed") {
      return statusLower as ProjectStatus
    }
    return "planning"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Projects" value={assignedProjects} icon={FolderKanban} />
        <StatCard label="Active Tasks" value={activeTasks} icon={ListChecks} accent="warning" />
        <StatCard label="Completed Tasks" value={completedTasksCount} icon={CheckCircle2} accent="success" />
        <StatCard label="Upcoming Deadlines" value={upcomingDeadlines} icon={CalendarClock} accent="primary" />
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
            {managerProjects.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <ProjectStatusBadge status={mapStatus(p.status)} />
                </div>
                <Progress value={p.progressPercentage || 0} />
              </div>
            ))}
            {managerProjects.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No projects assigned to you.</p>
            )}
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
                    <p className="truncate text-xs text-muted-foreground">{t.projectName}</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  <span className={cn("shrink-0 text-xs font-medium", overdue ? "text-destructive" : "text-muted-foreground")}>
                    {formatDate(t.deadline)}
                  </span>
                </div>
              )
            })}
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming tasks.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
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
              <p className="text-sm text-muted-foreground py-4 text-center">No employees have assigned tasks in your projects.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
