"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Clock, FolderKanban, Hourglass, ListChecks, Pencil } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { WorkLogCard } from "@/components/work-logs/work-log-card"
import { TaskFormModal } from "@/components/tasks/task-form-modal"
import { useAuth } from "@/components/providers/auth-provider"
import { getTaskById } from "@/data/dummyTasks"
import { getProjectById } from "@/data/dummyProjects"
import { getUserById } from "@/data/dummyUsers"
import { getWorkLogsByTask } from "@/data/dummyLogs"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task, WorkLog, WorkLogReply } from "@/types"

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [task, setTask] = useState<Task | undefined>(() => getTaskById(params.id))
  const [modalOpen, setModalOpen] = useState(false)
  const [logs, setLogs] = useState<WorkLog[]>(() => getWorkLogsByTask(params.id))

  const project = useMemo(() => (task ? getProjectById(task.projectId) : undefined), [task])

  if (!task) {
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

  const assignee = getUserById(task.assigneeId)
  const overdue = task.status !== "done" && isOverdue(task.deadline)
  const canManage = user?.role === "admin" || user?.role === "manager"

  function addReply(logId: string, reply: WorkLogReply) {
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, replies: [...l.replies, reply] } : l)))
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/tasks"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to tasks
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{task.name}</h1>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          {project && (
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
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
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-2 p-5">
            <h2 className="font-heading text-sm font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {task.description || "No description provided."}
            </p>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold">Work logs</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {logs.length}
              </span>
            </div>
            {logs.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No work logs yet"
                description="Progress updates for this task will appear here."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {logs.map((log) => (
                  <WorkLogCard key={log.id} log={log} currentUserId={user?.id ?? ""} onReply={addReply} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side column */}
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
            <InfoRow
              icon={Clock}
              label="Logged"
              value={`${logs.reduce((sum, l) => sum + l.hours, 0)}h`}
            />
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
