"use client"

import { Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { PriorityBadge } from "@/components/shared/status-badge"
import { getUserById } from "@/data/dummyUsers"
import { getProjectById } from "@/data/dummyProjects"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types"

const columns: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "todo", label: "To Do", dot: "bg-muted-foreground" },
  { status: "in-progress", label: "In Progress", dot: "bg-primary" },
  { status: "review", label: "Review", dot: "bg-[var(--warning)]" },
  { status: "done", label: "Done", dot: "bg-[var(--success)]" },
]

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const assignee = getUserById(task.assigneeId)
  const overdue = task.status !== "done" && isOverdue(task.deadline)
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className="flex flex-col gap-3 p-3.5 transition-all hover:shadow-md hover:border-ring/40">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-pretty">{task.name}</p>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{getProjectById(task.projectId)?.name}</p>
        <div className="flex items-center justify-between">
          <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3.5" />
            {formatDate(task.deadline)}
          </span>
          <Avatar name={assignee?.name ?? "?"} size="sm" role={assignee?.role} />
        </div>
      </Card>
    </button>
  )
}

export function KanbanBoard({ tasks, onSelect }: { tasks: Task[]; onSelect: (task: Task) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        return (
          <div key={col.status} className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
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
                <TaskCard key={t.id} task={t} onClick={() => onSelect(t)} />
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
