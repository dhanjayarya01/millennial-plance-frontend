"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingUp, Clock, CheckCircle2, Target } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { DataTable, TableRow, TableCell } from "@/components/tables/data-table"
import { api, BackendTask, BackendWorkLog, BackendWorkLogReply, BackendProject } from "@/lib/api"
import type { Task, WorkLog, User, Project, TaskStatus, TaskPriority, ProjectStatus, Role } from "@/types"
import { isOverdue } from "@/lib/format"

export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksRes, logsRes, usersRes, projectsRes] = await Promise.all([
          api.getTasks(),
          api.getWorkLogs(),
          api.getUsers(),
          api.getProjects(),
        ])

        if (tasksRes.success && logsRes.success && usersRes.success && projectsRes.success) {
          const mapTaskStatus = (s: string): TaskStatus => {
            const sLower = s.toLowerCase().replace("_", "-")
            if (sLower === "todo" || sLower === "to-do") return "todo"
            if (sLower === "in-progress") return "in-progress"
            if (sLower === "review" || sLower === "in-review") return "review"
            if (sLower === "done" || sLower === "completed") return "done"
            return "todo"
          }

          const mapPriority = (p: string): TaskPriority => {
            const pLower = p.toLowerCase()
            if (pLower === "critical") return "urgent"
            if (pLower === "low" || pLower === "medium" || pLower === "high" || pLower === "urgent") {
              return pLower as TaskPriority
            }
            return "medium"
          }

          const mappedTasks = tasksRes.data.map((t): Task => ({
            id: String(t.id),
            name: t.name,
            description: t.description || "",
            priority: mapPriority(t.priority),
            status: mapTaskStatus(t.status),
            deadline: t.deadline || "",
            projectId: String(t.projectId),
            assigneeId: t.employee ? String(t.employee.id) : "",
            assigneeIds: t.employees ? t.employees.map(e => String(e.id)) : (t.employee ? [String(t.employee.id)] : []),
            estimatedHours: t.estimatedHours || 0,
            createdById: t.createdBy ? String(t.createdBy.id) : "",
          }))

          const mapReply = (r: any) => ({
            id: String(r.id),
            authorId: String(r.authorId),
            message: r.message,
            timestamp: r.timestamp,
          })

          const mappedWorkLogs = logsRes.data.map((w): WorkLog => ({
            id: String(w.id),
            authorId: String(w.authorId),
            taskId: String(w.taskId),
            message: w.message,
            hours: w.hours,
            timestamp: w.timestamp,
            attachments: w.attachments || [],
            replies: w.replies ? w.replies.map(mapReply) : [],
          }))

          const mappedUsers = usersRes.data.map((u): User => ({
            id: String(u.id),
            name: u.fullName,
            email: u.email,
            password: "",
            role: (u.role === "ROLE_ADMIN" ? "admin" : u.role === "ROLE_PROJECT_MANAGER" ? "manager" : "employee"),
            avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
            jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
            department: "Engineering",
            status: u.active ? "active" : "suspended",
          }))

          const mappedProjects = projectsRes.data.map((p): Project => ({
            id: String(p.id),
            name: p.name,
            description: p.description || "",
            startDate: p.startDate || "",
            endDate: p.endDate || "",
            status: p.status.toLowerCase().replace("_", "-") as ProjectStatus,
            managerId: p.manager ? String(p.manager.id) : "",
            memberIds: p.assignedEmployees ? p.assignedEmployees.map((e) => String(e.id)) : [],
            completion: p.progressPercentage || 0,
          }))

          setTasks(mappedTasks)
          setWorkLogs(mappedWorkLogs)
          setUsers(mappedUsers)
          setProjects(mappedProjects)
        }
      } catch (err) {
        console.error("Failed to load reports page data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const computedMetrics = useMemo(() => {
    // Stat 1: Tasks Completed
    const completedTasksCount = tasks.filter(t => t.status === "done").length

    // Stat 2: Hours Logged
    const totalHoursLogged = workLogs.reduce((sum, wl) => sum + wl.hours, 0)

    // Stat 3: Team Performance Rows & Avg Productivity
    const teamPerformanceList = users
      .filter(u => u.role === "employee")
      .map(u => {
        const userTasks = tasks.filter(t => t.assigneeIds?.includes(u.id) || t.assigneeId === u.id)
        const completed = userTasks.filter(t => t.status === "done").length
        const inProgress = userTasks.filter(t => t.status === "in-progress").length
        const userLogs = workLogs.filter(wl => String(wl.authorId) === String(u.id))
        const hoursLogged = userLogs.reduce((sum, wl) => sum + wl.hours, 0)
        const total = completed + inProgress
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
          userId: u.id,
          completed,
          inProgress,
          productivity,
          hoursLogged,
        }
      })

    const avgProductivity = teamPerformanceList.length > 0
      ? Math.round(teamPerformanceList.reduce((s, r) => s + r.productivity, 0) / teamPerformanceList.length)
      : 0

    // Stat 4: On-time Rate
    const onTimeTasks = tasks.filter(t => t.status === "done" && !isOverdue(t.deadline))
    const totalDone = tasks.filter(t => t.status === "done").length
    const onTimeRate = totalDone > 0 ? Math.round((onTimeTasks.length / totalDone) * 100) : 100

    // Task distribution
    const taskStatusBreakdown = [
      { label: "To Do", value: tasks.filter(t => t.status === "todo").length },
      { label: "In Progress", value: tasks.filter(t => t.status === "in-progress").length },
      { label: "Review", value: tasks.filter(t => t.status === "review").length },
      { label: "Done", value: tasks.filter(t => t.status === "done").length },
    ]

    // Line Chart weekly completion
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklyPoints = days.map(d => ({ label: d, value: 0 }))
    workLogs.forEach(wl => {
      try {
        const dayIndex = new Date(wl.timestamp).getDay()
        const dayName = days[dayIndex]
        const point = weeklyPoints.find(p => p.label === dayName)
        if (point) {
          point.value += wl.hours
        }
      } catch (e) {}
    })
    const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const weeklyCompletion = orderedDays.map(day => ({
      label: day,
      value: Math.round(weeklyPoints.find(p => p.label === day)?.value || 0)
    }))

    // Project Progress
    const projectProgressList = projects.map(p => ({
      label: p.name,
      value: p.completion,
    }))

    return {
      completedTasksCount,
      totalHoursLogged,
      avgProductivity,
      onTimeRate,
      taskStatusBreakdown,
      weeklyCompletion,
      projectProgressList,
      teamPerformanceList,
    }
  }, [tasks, workLogs, users, projects])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  const {
    completedTasksCount,
    totalHoursLogged,
    avgProductivity,
    onTimeRate,
    taskStatusBreakdown,
    weeklyCompletion,
    projectProgressList,
    teamPerformanceList,
  } = computedMetrics

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Productivity, completion and team performance metrics." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tasks Completed" value={completedTasksCount} icon={CheckCircle2} accent="success" />
        <StatCard label="Hours Logged" value={`${totalHoursLogged}h`} icon={Clock} accent="primary" />
        <StatCard label="Avg Productivity" value={`${avgProductivity}%`} icon={TrendingUp} accent="success" />
        <StatCard label="On-time Rate" value={`${onTimeRate}%`} icon={Target} accent="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Work Logging Trend (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={weeklyCompletion} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={taskStatusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Completion</CardTitle>
        </CardHeader>
        <CardContent>
          {projectProgressList.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No projects found.</p>
          ) : (
            <BarChart data={projectProgressList} unit="%" />
          )}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Team Productivity Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {teamPerformanceList.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No team performance data available.</p>
          ) : (
            <DataTable
              headers={[
                { label: "Member" },
                { label: "Completed" },
                { label: "In Progress" },
                { label: "Hours" },
                { label: "Productivity" },
              ]}
            >
              {teamPerformanceList.map((row) => {
                const member = users.find((u) => u.id === row.userId)
                return (
                  <TableRow key={row.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={member?.name ?? "?"} src={member?.avatar} size="sm" role={member?.role} />
                        <span className="text-sm font-medium">{member?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.completed}</TableCell>
                    <TableCell className="text-sm">{row.inProgress}</TableCell>
                    <TableCell className="text-sm">{row.hoursLogged}h</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={row.productivity} className="w-24" />
                        <span className="text-sm font-medium">{row.productivity}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </DataTable>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
