import { dummyProjects } from "@/data/dummyProjects"
import { dummyTasks } from "@/data/dummyTasks"
import { dummyUsers } from "@/data/dummyUsers"
import { isOverdue } from "@/lib/format"

export function getAdminStats() {
  const tasks = dummyTasks
  return {
    totalProjects: dummyProjects.length,
    totalTasks: tasks.length,
    activeEmployees: dummyUsers.filter((u) => u.role === "employee" && u.status === "active").length,
    overdueTasks: tasks.filter((t) => t.status !== "done" && isOverdue(t.deadline)).length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
  }
}

export function getManagerStats(managerId: string) {
  const projects = dummyProjects.filter((p) => p.managerId === managerId)
  const projectIds = new Set(projects.map((p) => p.id))
  const tasks = dummyTasks.filter((t) => projectIds.has(t.projectId))
  return {
    projects,
    assignedProjects: projects.length,
    activeTasks: tasks.filter((t) => t.status !== "done").length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    upcomingDeadlines: tasks.filter((t) => t.status !== "done" && !isOverdue(t.deadline)).length,
    tasks,
  }
}

export function getEmployeeStats(userId: string) {
  const tasks = dummyTasks.filter((t) => t.assigneeId === userId)
  return {
    tasks,
    assignedTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    dueSoon: tasks.filter((t) => t.status !== "done" && !isOverdue(t.deadline)).length,
    overdue: tasks.filter((t) => t.status !== "done" && isOverdue(t.deadline)).length,
  }
}
