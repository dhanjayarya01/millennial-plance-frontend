// Shared domain types for the project & task management system.

export type Role = "admin" | "manager" | "employee"

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  avatar: string
  jobTitle: string
  department: string
  status: "active" | "invited" | "suspended"
  verified?: boolean
}

export type ProjectStatus = "planning" | "in-progress" | "on-hold" | "completed"

export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: ProjectStatus
  managerId: string
  memberIds: string[]
  completion: number
}

export type TaskStatus = "todo" | "in-progress" | "review" | "done"
export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
  id: string
  name: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  deadline: string
  projectId: string
  assigneeId: string
  assigneeIds?: string[]
  estimatedHours: number
  createdById?: string
}

export interface WorkLogReply {
  id: string
  authorId: string
  message: string
  timestamp: string
}

export interface WorkLog {
  id: string
  authorId: string
  taskId: string
  message: string
  hours: number
  timestamp: string
  attachments: string[]
  replies: WorkLogReply[]
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  entity: "Project" | "Task" | "User"
  entityName: string
  timestamp: string
  oldValue: string
  newValue: string
  // Project this activity belongs to (omitted for workspace-level actions like
  // inviting a user). Drives the project color coding on activity items.
  projectId?: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: "deadline" | "overdue" | "mention" | "assignment" | "system"
  read: boolean
  timestamp: string
}

export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface SeriesPoint {
  label: string
  value: number
}

