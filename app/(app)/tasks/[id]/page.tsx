"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Clock, FolderKanban, Hourglass, ListChecks, Pencil } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { TaskFormModal } from "@/components/tasks/task-form-modal"
import { useAuth } from "@/components/providers/auth-provider"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, TaskPriority, TaskStatus, Project, ProjectStatus, User, Role } from "@/types"
import { api, BackendTask } from "@/lib/api"

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
  }
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [task, setTask] = useState<Task | undefined>(undefined)
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const taskRes = await api.getTaskById(params.id)
        if (taskRes.success && taskRes.data) {
          const tMapped = mapTask(taskRes.data)
          setTask(tMapped)

          const [projectRes, usersRes] = await Promise.all([
            api.getProjectById(tMapped.projectId),
            api.getUsers(),
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

  const assignee = users.find((u) => u.id === task.assigneeId)
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
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="font-heading text-sm font-semibold">Details</h2>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Assignee</span>
              {assignee && (
                <div className="flex items-center gap-2">
                  <Avatar name={assignee.name} size="sm" role={assignee.role} />
                  <div>
                    <p className="text-sm font-medium">{assignee.name}</p>
                    <p className="text-xs text-muted-foreground">{assignee.jobTitle}</p>
                  </div>
                </div>
              )}
            </div>
            <InfoRow
              icon={CalendarClock}
              label="Deadline"
              value={formatDate(task.deadline)}
              valueClassName={overdue ? "text-destructive" : undefined}
            />
            <InfoRow icon={Hourglass} label="Estimated" value={`${task.estimatedHours}h`} />
          </Card>
        </div>
      </div>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(t) => setTask(t)}
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
