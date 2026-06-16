"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Clock,
  FolderKanban,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/shared/empty-state"
import { ProjectStatusBadge, TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { ActivityItem } from "@/components/shared/activity-item"
import { ProjectFormModal } from "@/components/projects/project-form-modal"
import { getProjectById } from "@/data/dummyProjects"
import { getTasksByProject } from "@/data/dummyTasks"
import { getUserById } from "@/data/dummyUsers"
import { getActivityByProject } from "@/data/dummyLogs"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Project, TaskStatus } from "@/types"

function daysBetween(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000))
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | undefined>(() => getProjectById(params.id))
  const [modalOpen, setModalOpen] = useState(false)

  const tasks = useMemo(() => (project ? getTasksByProject(project.id) : []), [project])
  const activity = useMemo(
    () => (project ? getActivityByProject(project.id, project.managerId) : []),
    [project],
  )

  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="The project you are looking for doesn't exist or has been removed."
        action={
          <Link href="/projects" className={buttonVariants()}>
            Back to projects
          </Link>
        }
      />
    )
  }

  const manager = getUserById(project.managerId)
  const members = project.memberIds.map((id) => getUserById(id)).filter(Boolean)
  const canManage = user?.role === "admin" || user?.role === "manager"

  const statusCounts: Record<TaskStatus, number> = {
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">{project.description}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive [&_svg]:text-destructive"
              onClick={() => router.push("/projects")}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">Progress</h2>
              <span className="text-sm font-medium">{project.completion}%</span>
            </div>
            <Progress value={project.completion} />
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
              <Stat label="To Do" value={statusCounts.todo} />
              <Stat label="In Progress" value={statusCounts["in-progress"]} />
              <Stat label="Review" value={statusCounts.review} />
              <Stat label="Done" value={statusCounts.done} />
            </div>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">Tasks</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {tasks.length}
              </span>
            </div>
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No tasks in this project yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {tasks.map((t) => {
                  const assignee = getUserById(t.assigneeId)
                  const overdue = t.status !== "done" && isOverdue(t.deadline)
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/tasks/${t.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={assignee?.name ?? "?"} size="sm" role={assignee?.role} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{t.name}</p>
                            <span
                              className={cn(
                                "flex items-center gap-1 text-xs",
                                overdue ? "text-destructive" : "text-muted-foreground",
                              )}
                            >
                              <Clock className="size-3" />
                              {formatDate(t.deadline)}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <PriorityBadge priority={t.priority} />
                          <TaskStatusBadge status={t.status} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="font-heading text-sm font-semibold">Details</h2>
            <InfoRow icon={CalendarDays} label="Start date" value={formatDate(project.startDate)} />
            <InfoRow icon={CalendarRange} label="End date" value={formatDate(project.endDate)} />
            <InfoRow
              icon={Clock}
              label="Duration"
              value={`${daysBetween(project.startDate, project.endDate)} days`}
            />
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <span className="text-xs font-medium text-muted-foreground">Project manager</span>
              {manager && (
                <div className="flex items-center gap-2">
                  <Avatar name={manager.name} size="sm" role={manager.role} />
                  <div>
                    <p className="text-sm font-medium">{manager.name}</p>
                    <p className="text-xs text-muted-foreground">{manager.jobTitle}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="font-heading text-sm font-semibold">Team</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {members.length}
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {members.map((m) => (
                <li key={m!.id} className="flex items-center gap-2">
                  <Avatar name={m!.name} size="sm" role={m!.role} />
                  <div>
                    <p className="text-sm font-medium">{m!.name}</p>
                    <p className="text-xs text-muted-foreground">{m!.jobTitle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {activity.length > 0 && (
            <Card className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-semibold">Project activity</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {activity.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Manager activity shown first, then the team.</p>
              <ul className="flex flex-col gap-2">
                {activity.map((a) => (
                  <ActivityItem key={a.id} log={a} />
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <ProjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(p) => setProject(p)}
        project={project}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="font-heading text-xl font-semibold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
