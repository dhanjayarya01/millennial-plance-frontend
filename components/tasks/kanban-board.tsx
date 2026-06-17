"use client"

import { Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { PriorityBadge } from "@/components/shared/status-badge"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus, User, Project } from "@/types"

const columns: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "todo", label: "To Do", dot: "bg-muted-foreground" },
  { status: "in-progress", label: "In Progress", dot: "bg-primary" },
  { status: "review", label: "Review", dot: "bg-[var(--warning)]" },
  { status: "done", label: "Done", dot: "bg-[var(--success)]" },
]

function TaskCard({
  task,
  users,
  projects,
  onClick,
  onDragStart,
}: {
  task: Task
  users: User[]
  projects: Project[]
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  const overdue = task.status !== "done" && isOverdue(task.deadline)
  const assignee = users.find((u) => u.id === task.assigneeId)
  const project = projects.find((p) => p.id === task.projectId)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="w-full text-left cursor-grab active:cursor-grabbing"
    >
      <Card
        className="flex flex-col gap-3 p-3.5 transition-all hover:shadow-md hover:border-ring/40 bg-card select-none"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-pretty">{task.name}</p>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{project?.name || "Unknown Project"}</p>
        <div className="flex items-center justify-between">
          <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3.5" />
            {formatDate(task.deadline)}
          </span>
          <Avatar name={assignee?.name ?? "?"} size="sm" role={assignee?.role} />
        </div>
      </Card>
    </div>
  )
}

export function KanbanBoard({
  tasks,
  users,
  projects,
  onSelect,
  onStatusChange,
}: {
  tasks: Task[]
  users: User[]
  projects: Project[]
  onSelect: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        return (
          <div
            key={col.status}
            className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3 min-h-[350px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const taskId = e.dataTransfer.getData("text/plain")
              if (taskId) {
                onStatusChange(taskId, col.status)
              }
            }}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", col.dot)} />
                <span className="text-sm font-medium">{col.label}</span>
              </div>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {colTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  users={users}
                  projects={projects}
                  onClick={() => onSelect(t)}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                />
              ))}
              {colTasks.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">No tasks</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
