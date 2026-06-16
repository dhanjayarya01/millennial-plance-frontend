"use client"

import { useMemo, useState } from "react"
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
import { dummyTasks } from "@/data/dummyTasks"
import { getProjectById } from "@/data/dummyProjects"
import { getUserById } from "@/data/dummyUsers"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, TaskPriority } from "@/types"

type View = "board" | "table"

export default function TasksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(dummyTasks)
  const [view, setView] = useState<View>("board")
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState<TaskPriority | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

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

  function handleSave(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id)
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]
    })
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

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found" description="Adjust your filters or create a new task." />
      ) : view === "board" ? (
        <KanbanBoard tasks={filtered} onSelect={(t) => router.push(`/tasks/${t.id}`)} />
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
            const assignee = getUserById(t.assigneeId)
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
                <TableCell className="text-muted-foreground">{getProjectById(t.projectId)?.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={assignee?.name ?? "?"} size="sm" role={assignee?.role} />
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
