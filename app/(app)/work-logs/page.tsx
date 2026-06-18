"use client"

import { useEffect, useState } from "react"
import { Plus, ClipboardList, Send, Paperclip } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/shared/empty-state"
import { WorkLogCard } from "@/components/work-logs/work-log-card"
import type { WorkLog, WorkLogReply, Task, TaskPriority, TaskStatus, User, Project, ProjectStatus } from "@/types"
import { api, BackendWorkLog, BackendWorkLogReply, BackendTask } from "@/lib/api"

export default function WorkLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [taskId, setTaskId] = useState("")
  const [hours, setHours] = useState(1)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const mapPriority = (p: string): TaskPriority => {
    const pLower = p.toLowerCase()
    if (pLower === "critical") return "urgent"
    if (pLower === "low" || pLower === "medium" || pLower === "high" || pLower === "urgent") {
      return pLower as TaskPriority
    }
    return "medium"
  }

  const mapTaskStatus = (s: string): TaskStatus => {
    const sLower = s.toLowerCase().replace("_", "-")
    if (sLower === "todo" || sLower === "to-do") return "todo"
    if (sLower === "in-progress") return "in-progress"
    if (sLower === "review" || sLower === "in-review") return "review"
    if (sLower === "done" || sLower === "completed") return "done"
    return "todo"
  }

  const mapTask = (t: BackendTask): Task => ({
    id: String(t.id),
    name: t.name,
    description: t.description || "",
    priority: mapPriority(t.priority),
    status: mapTaskStatus(t.status),
    deadline: t.deadline || "",
    projectId: String(t.projectId),
    assigneeId: t.employee ? String(t.employee.id) : "",
    estimatedHours: t.estimatedHours || 0,
  })

  const mapReply = (r: BackendWorkLogReply): WorkLogReply => ({
    id: String(r.id),
    authorId: String(r.authorId),
    message: r.message,
    timestamp: r.timestamp,
  })

  const mapWorkLog = (w: BackendWorkLog): WorkLog => ({
    id: String(w.id),
    authorId: String(w.authorId),
    taskId: String(w.taskId),
    message: w.message,
    hours: w.hours,
    timestamp: w.timestamp,
    attachments: w.attachments || [],
    replies: w.replies ? w.replies.map(mapReply) : [],
  })

  const mapProjectStatus = (s: string): ProjectStatus => {
    const statusLower = s.toLowerCase().replace("_", "-")
    if (statusLower === "planning" || statusLower === "in-progress" || statusLower === "on-hold" || statusLower === "completed") {
      return statusLower as ProjectStatus
    }
    return "planning"
  }

  async function loadData() {
    try {
      const [logsRes, tasksRes, projectsRes, usersRes] = await Promise.all([
        api.getWorkLogs(),
        api.getTasks(),
        api.getProjects(),
        api.getUsers(),
      ])
      if (logsRes.success && tasksRes.success && projectsRes.success && usersRes.success) {
        const mappedLogs = logsRes.data.map(mapWorkLog)
        const mappedTasks = tasksRes.data.map(mapTask)
        
        const mappedUsers: User[] = usersRes.data.map((u) => ({
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

        const mappedProjects: Project[] = projectsRes.data.map((p) => ({
          id: String(p.id),
          name: p.name,
          description: p.description || "",
          startDate: p.startDate || "",
          endDate: p.endDate || "",
          status: mapProjectStatus(p.status),
          managerId: p.manager ? String(p.manager.id) : "",
          memberIds: p.assignedEmployees ? p.assignedEmployees.map((e) => String(e.id)) : [],
          completion: p.progressPercentage || 0,
        }))

        setLogs(mappedLogs)
        setTasks(mappedTasks)
        setUsers(mappedUsers)
        setProjects(mappedProjects)

        if (mappedTasks.length > 0) {
          setTaskId(mappedTasks[0].id)
        }
      }
    } catch (err) {
      console.error("Failed to load work logs data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  if (!user) return null

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  async function addReply(logId: string, reply: WorkLogReply) {
    try {
      const res = await api.createWorkLogReply(logId, reply.message)
      if (res.success) {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId ? { ...l, replies: [...l.replies, mapReply(res.data)] } : l
          )
        )
      }
    } catch (err: any) {
      alert("Failed to reply: " + err.message)
    }
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    try {
      const res = await api.createWorkLog({
        taskId: Number(taskId),
        message: message.trim(),
        hours: Number(hours),
      })
      if (res.success) {
        setLogs((prev) => [mapWorkLog(res.data), ...prev])
        setMessage("")
        setHours(1)
      }
    } catch (err: any) {
      alert("Failed to create log: " + err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Work Logs" description="Share progress updates, log hours and discuss work in threads." />

      <Card className="p-5">
        <form onSubmit={addLog} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="w-task">Task</Label>
              <Select id="w-task" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="w-hours">Hours worked</Label>
              <Input
                id="w-hours"
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="w-message">Update</Label>
            <Textarea
              id="w-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm">
              <Paperclip className="size-3.5" />
              Attach file
            </Button>
            <Button type="submit" disabled={!message.trim()}>
              <Send className="size-4" />
              Post update
            </Button>
          </div>
        </form>
      </Card>

      {logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No work logs yet" description="Post your first update to start the thread." />
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <WorkLogCard
              key={log.id}
              log={log}
              currentUserId={user.id}
              onReply={addReply}
              users={users}
              tasks={tasks}
              projects={projects}
            />
          ))}
        </div>
      )}
    </div>
  )
}
