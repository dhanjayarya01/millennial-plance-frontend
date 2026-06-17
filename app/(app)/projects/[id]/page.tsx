"use client"

import { useMemo, useState, useEffect } from "react"
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
  MessageSquare,
  Mail,
  Video,
  UserPlus,
  X,
  Search,
  Minus,
  Plus,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/shared/empty-state"
import { ProjectStatusBadge, TaskStatusBadge, PriorityBadge } from "@/components/shared/status-badge"
import { ProjectFormModal } from "@/components/projects/project-form-modal"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Project, ProjectStatus, Task, TaskPriority, TaskStatus, User, Role } from "@/types"
import { api, BackendProject, BackendTask } from "@/lib/api"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const mapProject = (p: BackendProject): Project => {
  const mapStatus = (s: string): ProjectStatus => {
    const statusLower = s.toLowerCase().replace("_", "-")
    if (statusLower === "planning" || statusLower === "in-progress" || statusLower === "on-hold" || statusLower === "completed") {
      return statusLower as ProjectStatus
    }
    return "planning"
  }

  return {
    id: String(p.id),
    name: p.name,
    description: p.description || "",
    startDate: p.startDate || "",
    endDate: p.endDate || "",
    status: mapStatus(p.status),
    managerId: p.manager ? String(p.manager.id) : "",
    memberIds: p.assignedEmployees ? p.assignedEmployees.map((e) => String(e.id)) : [],
    completion: p.progressPercentage || 0,
  }
}

const mapTask = (t: BackendTask): Task => {
  const mapPriority = (p: string): TaskPriority => {
    const pLower = p.toLowerCase()
    if (pLower === "low" || pLower === "medium" || pLower === "high" || pLower === "urgent") {
      return pLower as TaskPriority
    }
    return "medium"
  }

  const mapStatus = (s: string): TaskStatus => {
    const sLower = s.toLowerCase().replace("_", "-")
    if (sLower === "todo" || sLower === "in-progress" || sLower === "review" || sLower === "done") {
      return sLower as TaskStatus
    }
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
    estimatedHours: t.estimatedHours || 0,
  }
}

function daysBetween(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000))
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "manager" | "employee" | "members" | "current_employees">("all")

  useEffect(() => {
    async function loadData() {
      try {
        const [projectRes, tasksRes, usersRes] = await Promise.all([
          api.getProjectById(params.id),
          api.getTasks(),
          api.getUsers(),
        ])

        if (projectRes.success && tasksRes.success && usersRes.success) {
          const mapUserRole = (r: string): Role => {
            if (r === "ROLE_ADMIN") return "admin"
            if (r === "ROLE_PROJECT_MANAGER") return "manager"
            return "employee"
          }

          const uList = usersRes.data.map((u) => ({
            id: String(u.id),
            name: u.fullName,
            email: u.email,
            password: "",
            role: mapUserRole(u.role),
            avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
            jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
            department: "Engineering",
            status: u.active ? ("active" as const) : ("suspended" as const),
          }))

          setUsers(uList)
          setProject(mapProject(projectRes.data))
          
          const filteredTasks = tasksRes.data
            .filter((t) => String(t.projectId) === params.id)
            .map(mapTask)
          setTasks(filteredTasks)
        } else {
          setError("Project details not found.")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  async function handleDeleteProject() {
    if (!project) return
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      await api.deleteProject(project.id)
      router.push("/projects")
    } catch (err: any) {
      alert(err.message || "Failed to delete project.")
    }
  }

  async function handleAssignManager(managerId: string) {
    if (!project) return
    try {
      const res = await api.assignManager(project.id, managerId)
      if (res.success) {
        setProject(mapProject(res.data))
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign manager.")
    }
  }

  async function handleAddEmployee(employeeId: string) {
    if (!project) return
    try {
      const res = await api.assignEmployee(project.id, employeeId)
      if (res.success) {
        setProject(mapProject(res.data))
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign employee.")
    }
  }

  async function handleRemoveEmployee(employeeId: string) {
    if (!project) return
    try {
      const res = await api.removeEmployee(project.id, employeeId)
      if (res.success) {
        setProject(mapProject(res.data))
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove employee.")
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      let matchesRole = true
      if (roleFilter === "manager") matchesRole = u.role === "manager"
      else if (roleFilter === "employee") matchesRole = u.role === "employee"
      else if (roleFilter === "members") {
        matchesRole = project ? (project.managerId === u.id || project.memberIds.includes(u.id)) : false
      } else if (roleFilter === "current_employees") {
        matchesRole = project ? project.memberIds.includes(u.id) : false
      }
      
      return matchesSearch && matchesRole && u.role !== "admin"
    })
  }, [users, searchQuery, roleFilter, project])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (error || !project) {
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

  const manager = users.find((u) => u.id === project.managerId)
  const members = project.memberIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[]
  const canManage = user?.role === "admin" || user?.role === "manager"
  const isAdmin = user?.role === "admin"

  const statusCounts: Record<TaskStatus, number> = {
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  }

  const allEmails = [manager?.email, ...members.map((m) => m.email)].filter(Boolean).join(",")
  const emailLink = `mailto:${allEmails}?subject=Update on project: ${encodeURIComponent(project.name)}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-3" />
            </Link>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty pl-8">{project.description}</p>
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
              onClick={handleDeleteProject}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
                  const assignee = users.find((u) => u.id === t.assigneeId)
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

        <div className="flex flex-col gap-6">
          <Card
            className={cn(
              "flex flex-col gap-4 p-5 transition-all select-none shrink-0 h-[435px]",
              isAdmin && "cursor-pointer hover:border-primary/50"
            )}
            onClick={(e) => {
              if (isAdmin && !(e.target as HTMLElement).closest(".team-card-actions")) {
                setTeamModalOpen(true)
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="font-heading text-sm font-semibold">Team</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {members.length + (manager ? 1 : 0)}
                </span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTeamModalOpen(true)
                  }}
                  className="flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  aria-label="Manage team members"
                >
                  <UserPlus className="size-3.5" />
                </button>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {manager && (
                <li className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={manager.name} size="sm" role={manager.role} />
                    <div>
                      <p className="text-sm font-medium">{manager.name}</p>
                      <p className="text-xs text-muted-foreground">Project Manager (Leader)</p>
                    </div>
                  </div>
                  <Badge variant="default">Manager</Badge>
                </li>
              )}
            </ul>

            <ul className="flex flex-col gap-3 h-[110px] overflow-hidden shrink-0">
              {members.slice(0, 2).map((m) => (
                <li key={m.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={m.name} size="sm" role={m.role} />
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.jobTitle}</p>
                    </div>
                  </div>
                  <Badge variant="neutral">Employee</Badge>
                </li>
              ))}
            </ul>

            <div className="team-card-actions mt-auto flex flex-col gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => alert("Notifying all team members via Slack/Teams...")}
              >
                <MessageSquare className="size-3.5 text-primary" />
                Notify All
              </Button>
              <a href={emailLink} className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                  <Mail className="size-3.5 text-primary" />
                  Email All
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => alert("Redirecting to schedule team alignment meeting...")}
              >
                <Video className="size-3.5 text-primary" />
                Schedule Meeting
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <h2 className="font-heading text-sm font-semibold">Details</h2>
            <InfoRow icon={CalendarDays} label="Start date" value={formatDate(project.startDate)} />
            <InfoRow icon={CalendarRange} label="End date" value={formatDate(project.endDate)} />
            <InfoRow
              icon={Clock}
              label="Duration"
              value={`${daysBetween(project.startDate, project.endDate)} days`}
            />
          </Card>
        </div>
      </div>

      <ProjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(p) => setProject(p)}
        project={project}
      />

      <Modal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title="Manage Project Team"
        description="Search, filter, and assign a project manager and employee members."
        footer={
          <Button variant="outline" onClick={() => setTeamModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs focus-visible:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees</option>
              <option value="members">Current Members</option>
              <option value="current_employees">Current Employees</option>
            </select>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-border/80 rounded-lg divide-y divide-border">
            {filteredUsers.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No matching users found.</p>
            ) : (
              filteredUsers.map((u) => {
                const isCurrentManager = project.managerId === u.id
                const isCurrentMember = project.memberIds.includes(u.id)
                
                return (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} size="sm" role={u.role} />
                      <div>
                        <p className="text-xs font-semibold">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div>
                      {u.role === "manager" ? (
                        <Button
                          size="sm"
                          variant={isCurrentManager ? "default" : "outline"}
                          className="h-7 px-3 text-[10px]"
                          onClick={() => handleAssignManager(u.id)}
                        >
                          {isCurrentManager ? "Assigned" : "Assign Leader"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={isCurrentMember ? "destructive" : "outline"}
                          className="h-7 w-7 p-0"
                          onClick={() => isCurrentMember ? handleRemoveEmployee(u.id) : handleAddEmployee(u.id)}
                        >
                          {isCurrentMember ? <Minus className="size-3" /> : <Plus className="size-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Modal>
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
