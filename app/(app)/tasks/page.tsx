"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, LayoutGrid, Table2, ListChecks } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { DataTable, TableRow, TableCell } from "@/components/tables/data-table"
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TaskFormModal } from "@/components/tasks/task-form-modal"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, TaskPriority, TaskStatus, Project, ProjectStatus, User, Role } from "@/types"
import { api, BackendTask } from "@/lib/api"
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
  }
}

type View = "board" | "table"

export default function TasksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>("board")
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState<TaskPriority | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksRes, projectsRes, usersRes] = await Promise.all([
          api.getTasks(),
          api.getProjects(),
          api.getUsers(),
        ])

        if (tasksRes.success && projectsRes.success && usersRes.success) {
          const mapUserRole = (r: string): Role => {
            if (r === "ROLE_ADMIN") return "admin"
            if (r === "ROLE_PROJECT_MANAGER") return "manager"
            return "employee"
          }

          setTasks(tasksRes.data.map(mapTask))
          setProjects(projectsRes.data.map((p) => ({
            id: String(p.id),
            name: p.name,
            description: p.description || "",
            startDate: p.startDate || "",
            endDate: p.endDate || "",
            status: p.status.toLowerCase().replace("_", "-") as ProjectStatus,
            managerId: p.manager ? String(p.manager.id) : "",
            memberIds: p.assignedEmployees ? p.assignedEmployees.map((e) => String(e.id)) : [],
            completion: p.progressPercentage || 0,
          })))
          setUsers(usersRes.data.map((u) => ({
            id: String(u.id),
            name: u.fullName,
            email: u.email,
            password: "",
            role: mapUserRole(u.role),
            avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
            jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
            department: "Engineering",
            status: u.active ? "active" : "suspended",
          })))
        } else {
          setError("Failed to load task details.")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const scoped = useMemo(() => {
    if (!user) return []
    if (user.role === "employee") return tasks.filter((t) => t.assigneeId === user.id)
    return tasks
  }, [tasks, user])

  const filtered = useMemo(() => {
    return scoped.filter((t) => {
      const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase())
      const matchesPriority = priority === "all" || t.priority === priority
      return matchesQuery && matchesPriority
    })
  }, [scoped, query, priority])

  function handleSave(task: Task | null) {
    if (!task) return
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id)
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]
    })
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    const originalTasks = [...tasks]
    const taskObj = tasks.find((t) => t.id === taskId)
    if (!taskObj) return

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    try {
      await api.updateTaskStatus(taskId, newStatus)

      const projectObj = projects.find((p) => p.id === taskObj.projectId)
      if (projectObj) {
        const projectMembers = [
          users.find((u) => u.id === projectObj.managerId),
          ...projectObj.memberIds.map((mId) => users.find((u) => u.id === mId))
        ].filter(Boolean) as User[]

        await Promise.all(
          projectMembers.map((m) =>
            notificationService.sendSseNotification(
              "Task Status Updated",
              `Task "${taskObj.name}" status changed to "${newStatus}", please check`,
              "yellow",
              m.id
            )
          )
        )
      }
    } catch (err: any) {
      alert("Failed to update task status: " + err.message)
      setTasks(originalTasks)
    }
  }

  const title = user?.role === "employee" ? "My Tasks" : user?.role === "manager" ? "Team Tasks" : "Tasks"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description="Plan, prioritize and track tasks with a board or table view."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus />
            New Task
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className="pl-9" />
        </div>
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | "all")}
          className="lg:w-44"
        >
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              view === "board" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Table2 className="size-4" />
            Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found" description="Adjust your filters or create a new task." />
      ) : view === "board" ? (
        <KanbanBoard
          tasks={filtered}
          users={users}
          projects={projects}
          onSelect={(t) => router.push(`/tasks/${t.id}`)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <DataTable
          headers={[
            { label: "Task" },
            { label: "Project" },
            { label: "Assignee" },
            { label: "Priority" },
            { label: "Status" },
            { label: "Deadline" },
          ]}
        >
          {filtered.map((t) => {
            const assignee = users.find((u) => u.id === t.assigneeId)
            const project = projects.find((p) => p.id === t.projectId)
            const overdue = t.status !== "done" && isOverdue(t.deadline)
            return (
              <TableRow
                key={t.id}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">
                  <Link href={`/tasks/${t.id}`} className="text-left hover:text-primary">
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{project?.name || "Unknown Project"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={assignee?.name ?? "?"} src={assignee?.avatar} size="sm" role={assignee?.role} />
                    <span className="hidden text-sm sm:inline">{assignee?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={t.priority} />
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={t.status} />
                </TableCell>
                <TableCell className={cn("text-sm", overdue ? "text-destructive" : "text-muted-foreground")}>
                  {formatDate(t.deadline)}
                </TableCell>
              </TableRow>
            )
          })}
        </DataTable>
      )}

      <TaskFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} task={editing} />
    </div>
  )
}
