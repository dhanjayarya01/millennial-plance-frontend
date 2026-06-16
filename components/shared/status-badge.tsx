import { Badge } from "@/components/ui/badge"
import type { ProjectStatus, TaskStatus, TaskPriority } from "@/types"

const projectStatusMap: Record<ProjectStatus, { label: string; variant: "default" | "neutral" | "success" | "warning" | "destructive" }> = {
  planning: { label: "Planning", variant: "neutral" },
  "in-progress": { label: "In Progress", variant: "default" },
  "on-hold": { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
}

const taskStatusMap: Record<TaskStatus, { label: string; variant: "default" | "neutral" | "success" | "warning" | "destructive" }> = {
  todo: { label: "To Do", variant: "neutral" },
  "in-progress": { label: "In Progress", variant: "default" },
  review: { label: "Review", variant: "warning" },
  done: { label: "Done", variant: "success" },
}

const priorityMap: Record<TaskPriority, { label: string; variant: "default" | "neutral" | "success" | "warning" | "destructive" }> = {
  low: { label: "Low", variant: "neutral" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "destructive" },
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { label, variant } = projectStatusMap[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, variant } = taskStatusMap[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, variant } = priorityMap[priority]
  return <Badge variant={variant}>{label}</Badge>
}
