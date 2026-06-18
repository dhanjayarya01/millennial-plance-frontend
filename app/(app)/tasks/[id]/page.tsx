"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Clock, FolderKanban, Hourglass, ListChecks, Pencil, Paperclip, Loader2, Plus, Trash2, Check } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { TaskFormModal } from "@/components/tasks/task-form-modal"
import { useAuth } from "@/components/providers/auth-provider"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, TaskPriority, TaskStatus, Project, ProjectStatus, User, Role, WorkLog, WorkLogReply } from "@/types"
import { api, BackendTask, BackendWorkLog, BackendWorkLogReply } from "@/lib/api"
import { WorkLogCard } from "@/components/work-logs/work-log-card"
import { notificationService } from "@/lib/notification-service"

const mapTask = (t: BackendTask): Task => {
  const mapPriority = (p: string): TaskPriority => {
    const pLower = p.toLowerCase()
    if (pLower === "critical") return "urgent"
    if (pLower === "low" || pLower === "medium" || pLower === "high" || pLower === "urgent") {
      return pLower as TaskPriority
    }
    return "medium"
  }

  const mapStatus = (s: string): TaskStatus => {
    const sLower = s.toLowerCase().replace("_", "-")
    if (sLower === "todo" || sLower === "to-do") return "todo"
    if (sLower === "in-progress") return "in-progress"
    if (sLower === "review" || sLower === "in-review") return "review"
    if (sLower === "done" || sLower === "completed") return "done"
    return "todo"
  }

  return {
    id: String(t.id),
    name: t.name,
    description: t.description || "",
    priority: mapPriority(t.priority),
    status: mapStatus(t.status),
    deadline: t.deadline || "",
    projectId: String(t.projectId),
    assigneeId: t.employee ? String(t.employee.id) : "",
    assigneeIds: t.employees ? t.employees.map(e => String(e.id)) : (t.employee ? [String(t.employee.id)] : []),
    estimatedHours: t.estimatedHours || 0,
    createdById: t.createdBy ? String(t.createdBy.id) : "",
  }
}

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

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [task, setTask] = useState<Task | undefined>(undefined)
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [logMessage, setLogMessage] = useState("")
  const [logHours, setLogHours] = useState<number>(1)
  const [logFile, setLogFile] = useState<File | null>(null)
  const [logFileUrl, setLogFileUrl] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [loggingWork, setLoggingWork] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const taskRes = await api.getTaskById(params.id)
        if (taskRes.success && taskRes.data) {
          const tMapped = mapTask(taskRes.data)
          setTask(tMapped)

          const [projectRes, usersRes, logsRes] = await Promise.all([
            api.getProjectById(tMapped.projectId),
            api.getUsers(),
            api.getWorkLogs(),
          ])

          if (projectRes.success) {
            setProject({
              id: String(projectRes.data.id),
              name: projectRes.data.name,
              description: projectRes.data.description || "",
              startDate: projectRes.data.startDate || "",
              endDate: projectRes.data.endDate || "",
              status: projectRes.data.status.toLowerCase().replace("_", "-") as ProjectStatus,
              managerId: projectRes.data.manager ? String(projectRes.data.manager.id) : "",
              memberIds: projectRes.data.assignedEmployees ? projectRes.data.assignedEmployees.map((e) => String(e.id)) : [],
              completion: projectRes.data.progressPercentage || 0,
            })
          }

          if (usersRes.success) {
            const mapUserRole = (r: string): Role => {
              if (r === "ROLE_ADMIN") return "admin"
              if (r === "ROLE_PROJECT_MANAGER") return "manager"
              return "employee"
            }
            setUsers(
              usersRes.data.map((u) => ({
                id: String(u.id),
                name: u.fullName,
                email: u.email,
                password: "",
                role: mapUserRole(u.role),
                avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
                jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
                department: "Engineering",
                status: u.active ? "active" : "suspended",
              })),
            )
          }

          if (logsRes.success && logsRes.data) {
            setWorkLogs(
              logsRes.data
                .map(mapWorkLog)
                .filter((w) => String(w.taskId) === String(tMapped.id))
            )
          }
        } else {
          setError("Task not found.")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Task not found"
        description="The task you are looking for doesn't exist or has been removed."
        action={
          <Link href="/tasks" className={buttonVariants()}>
            Back to tasks
          </Link>
        }
      />
    )
  }




  const isAssigned = task ? (task.assigneeIds?.includes(user?.id || "") || task.assigneeId === user?.id) : false
  const canLogWork = user ? (user.role === "admin" || user.role === "manager" || isAssigned) : false

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogFile(file)
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      if (data.success && data.url) {
        setLogFileUrl(data.url)
      } else {
        alert("Upload error: " + data.error)
      }
    } catch (err: any) {
      console.error(err)
      alert("Failed to upload attachment: " + err.message)
    } finally {
      setUploadingFile(false)
    }
  }

  async function handleLogWorkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !logMessage.trim() || logHours <= 0) return

    setLoggingWork(true)
    try {
      const payload = {
        taskId: Number(task.id),
        message: logMessage.trim(),
        hours: Number(logHours),
        attachmentUrl: logFileUrl || undefined,
      }

      const res = await api.createWorkLog(payload)
      if (res.success && res.data) {
        setWorkLogs((prev) => [mapWorkLog(res.data), ...prev])
        setLogMessage("")
        setLogHours(1)
        setLogFile(null)
        setLogFileUrl("")
        alert("Work log added successfully!")
      } else {
        alert("Failed to add work log: " + res.message)
      }
    } catch (err: any) {
      console.error(err)
      alert("Error adding work log: " + err.message)
    } finally {
      setLoggingWork(false)
    }
  }

  async function handleReply(logId: string, reply: WorkLogReply) {
    try {
      const res = await api.createWorkLogReply(logId, reply.message)
      if (res.success && res.data) {
        const mappedNewReply = mapReply(res.data)
        setWorkLogs((prev) =>
          prev.map((log) => {
            if (log.id === logId) {
              return {
                ...log,
                replies: [...(log.replies || []), mappedNewReply],
              }
            }
            return log
          })
        )

        // Find work log to identify the task name and members to notify
        const wlObj = workLogs.find(wl => wl.id === logId)
        const taskName = task?.name || "Task"
        if (project) {
          const pmUser = users.find(u => u.id === project.managerId)
          const membersList = project.memberIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[]
          const projectMembers = [pmUser, ...membersList].filter(Boolean) as User[]
          const senderName = user?.name || "Someone"

          await Promise.all(
            projectMembers.map((m) => {
              if (m.id !== user?.id) {
                return notificationService.sendSseNotification(
                  "New Work Log Reply",
                  `${senderName} replied to a work log on task "${taskName}": "${mappedNewReply.message}"`,
                  "green",
                  String(m.id)
                )
              }
              return Promise.resolve()
            })
          )
        }
      } else {
        alert("Failed to post reply: " + res.message)
      }
    } catch (err: any) {
      console.error(err)
      alert("Error posting reply: " + err.message)
    }
  }

  const assignee = users.find((u) => u.id === task.assigneeId)
  const assignees = users.filter((u) => task.assigneeIds?.includes(u.id) || u.id === task.assigneeId)
  const creator = users.find((u) => u.id === task.createdById)
  const overdue = task.status !== "done" && isOverdue(task.deadline)
  const canManage = user?.role === "admin" || user?.role === "manager"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/tasks"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-3" />
            </Link>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{task.name}</h1>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          {project && (
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary pl-8"
            >
              <FolderKanban className="size-4" />
              {project.name}
            </Link>
          )}
        </div>
        {canManage && (
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-2 p-5">
            <h2 className="font-heading text-sm font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {task.description || "No description provided."}
            </p>
          </Card>

          {/* Work Logs Feed */}
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-sm font-semibold">Work Logs & Progress ({workLogs.length})</h2>
            <div className="h-[400px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
              {workLogs.length === 0 ? (
                <Card className="h-full flex items-center justify-center text-center text-muted-foreground text-sm">
                  Work logs will be shown here
                </Card>
              ) : (
                workLogs.map((log) => (
                  <WorkLogCard
                    key={log.id}
                    log={log}
                    currentUserId={user?.id || ""}
                    onReply={handleReply}
                    users={users}
                    tasks={task ? [task] : []}
                    projects={project ? [project] : []}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="font-heading text-sm font-semibold border-b border-border/50 pb-2">Details & Ownership</h2>
            
            {/* Project Details */}
            {project && (() => {
              const pm = users.find(u => u.id === project.managerId)
              return (
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-muted-foreground">Project</span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-primary hover:underline flex items-center gap-1 text-sm mt-0.5"
                  >
                    <FolderKanban className="size-4" />
                    {project.name}
                  </Link>
                  <div className="mt-1 text-muted-foreground">
                    Timeline: {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </div>
                  {pm && (
                    <div className="mt-1 text-muted-foreground">
                      Manager: <span className="font-medium text-foreground">@{pm.name}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Created By */}
            <div className="flex flex-col gap-1 text-xs border-t border-border/50 pt-3">
              <span className="font-medium text-muted-foreground">Created By</span>
              {creator ? (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={creator.name} src={creator.avatar} size="sm" role={creator.role} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{creator.name}</p>
                    <p className="text-xs text-muted-foreground leading-none mt-0.5">{creator.jobTitle}</p>
                  </div>
                </div>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">System</span>
              )}
            </div>

            {/* Assignees List */}
            <div className="flex flex-col gap-1 text-xs border-t border-border/50 pt-3">
              <span className="font-medium text-muted-foreground">Assigned Team Members ({assignees.length})</span>
              {assignees.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-1">Unassigned</p>
              ) : (
                <div className="flex flex-col gap-2.5 mt-1.5">
                  {assignees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <Avatar name={emp.name} src={emp.avatar} size="sm" role={emp.role} />
                      <div>
                        <p className="text-sm font-medium leading-tight">{emp.name}</p>
                        <p className="text-xs text-muted-foreground leading-none mt-0.5">{emp.jobTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline & Estimates */}
            <div className="flex flex-col gap-2 border-t border-border/50 pt-3 mt-1">
              <InfoRow
                icon={CalendarClock}
                label="Deadline"
                value={formatDate(task.deadline)}
                valueClassName={overdue ? "text-destructive font-semibold animate-pulse" : undefined}
              />
              <InfoRow icon={Hourglass} label="Estimated Effort" value={`${task.estimatedHours}h`} />
            </div>
          </Card>
        </div>
      </div>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(t) => setTask(t || undefined)}
        task={task}
      />
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Clock
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className={cn("text-sm font-medium", valueClassName)}>{value}</span>
    </div>
  )
}
