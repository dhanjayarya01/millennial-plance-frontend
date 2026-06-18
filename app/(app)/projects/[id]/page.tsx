"use client"

import { useMemo, useState, useEffect, useRef } from "react"
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
import { TaskFormModal } from "@/components/tasks/task-form-modal"
import { notificationService } from "@/lib/notification-service"
import { formatDate, isOverdue } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Project, ProjectStatus, Task, TaskPriority, TaskStatus, User, Role, WorkLog, WorkLogReply } from "@/types"
import { api, BackendProject, BackendTask, BackendWorkLog, BackendWorkLogReply } from "@/lib/api"
import { Modal } from "@/components/ui/modal"
import { WorkLogCard } from "@/components/work-logs/work-log-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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

const mapReply = (r: BackendWorkLogReply): WorkLogReply => ({
  id: String(r.id),
  authorId: String(r.authorId),
  message: r.message,
  timestamp: r.timestamp,
})

const mapWorkLog = (w: BackendWorkLog): WorkLog => ({
  id: String(w.id),
  authorId: String(w.authorId),
  taskId: String(w.taskId),
  message: w.message,
  hours: w.hours,
  timestamp: w.timestamp,
  attachments: w.attachments || [],
  replies: w.replies ? w.replies.map(mapReply) : [],
})

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
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetLink, setMeetLink] = useState("")
  const [meetingSubmitting, setMeetingSubmitting] = useState(false)
  const [notifyModalOpen, setNotifyModalOpen] = useState(false)
  const [notifyTitle, setNotifyTitle] = useState("")
  const [notifyDesc, setNotifyDesc] = useState("")
  const [notifyUrgency, setNotifyUrgency] = useState<"green" | "yellow" | "red">("green")
  const [notifySubmitting, setNotifySubmitting] = useState(false)

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  const [hasReminder, setHasReminder] = useState(true)
  const [reminderMins, setReminderMins] = useState(1)
  const [reminderSecs, setReminderSecs] = useState(0)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLUListElement>(null)
  const [allProjects, setAllProjects] = useState<BackendProject[]>([])
  const [projectWorkLogs, setProjectWorkLogs] = useState<WorkLog[]>([])
  
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "manager" | "employee" | "members" | "current_employees">("all")

  const sortedTasks = useMemo(() => {
    const priorityWeight = (p: TaskPriority) => {
      if (p === "urgent") return 4
      if (p === "high") return 3
      if (p === "medium") return 2
      return 1
    }
    return [...tasks].sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
  }, [tasks])

  async function handleTaskDrop(draggedIdx: number, targetIdx: number) {
    if (draggedIdx === targetIdx) return

    const reordered = [...sortedTasks]
    const [draggedTask] = reordered.splice(draggedIdx, 1)

    const targetTask = reordered[targetIdx]
    let newPriority = draggedTask.priority

    if (targetTask) {
      const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"]
      const draggedWeight = priorities.indexOf(draggedTask.priority)
      const targetWeight = priorities.indexOf(targetTask.priority)

      if (targetIdx < draggedIdx) {
        if (draggedWeight < targetWeight) {
          newPriority = targetTask.priority
        }
      } else {
        if (draggedWeight > targetWeight) {
          newPriority = targetTask.priority
        }
      }
    }

    reordered.splice(targetIdx, 0, { ...draggedTask, priority: newPriority })
    setTasks(reordered)

    if (newPriority !== draggedTask.priority) {
      try {
        const payload = {
          name: draggedTask.name,
          description: draggedTask.description,
          priority: newPriority === "urgent" ? "CRITICAL" : newPriority.toUpperCase(),
          status: draggedTask.status === "todo"
            ? "TO_DO"
            : draggedTask.status === "in-progress"
            ? "IN_PROGRESS"
            : draggedTask.status === "review"
            ? "IN_REVIEW"
            : "COMPLETED",
          deadline: draggedTask.deadline,
          estimatedHours: draggedTask.estimatedHours,
          employeeId: draggedTask.assigneeId ? Number(draggedTask.assigneeId) : null,
          employeeIds: draggedTask.assigneeIds ? draggedTask.assigneeIds.map(Number) : [],
        }
        await api.updateTask(draggedTask.id, payload)
        
        const projectMembers = [manager, ...members].filter(Boolean) as any[]
        await Promise.all(
          projectMembers.map((m) =>
            notificationService.sendSseNotification(
              "Task Priority Updated",
              `Task "${draggedTask.name}" changed to ${newPriority} priority, please check`,
              "yellow",
              String(m.id)
            )
          )
        )

        loadData()
      } catch (err: any) {
        alert("Failed to update task priority: " + err.message)
        loadData()
      }
    }
  }

  async function loadData() {
    try {
      const [projectRes, tasksRes, usersRes, allProjectsRes, workLogsRes] = await Promise.all([
        api.getProjectById(params.id),
        api.getTasks(),
        api.getUsers(),
        api.getProjects(),
        api.getWorkLogs(),
      ])

      if (allProjectsRes.success) {
        setAllProjects(allProjectsRes.data)
      }

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

        const taskIds = new Set(filteredTasks.map((t) => String(t.id)))
        if (workLogsRes.success && workLogsRes.data) {
          const mappedLogs = workLogsRes.data
            .map(mapWorkLog)
            .filter((log) => taskIds.has(String(log.taskId)))
          setProjectWorkLogs(mappedLogs)
        }
      } else {
        setError("Project details not found.")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params.id])

  useEffect(() => {
    if (teamModalOpen) {
      setIsEditingTeam(false)
    }
  }, [teamModalOpen])

  const renderUserProjectStatus = (uId: string, uRole: string) => {
    if (uRole !== "employee" && uRole !== "manager") return null

    const assigned = uRole === "employee"
      ? allProjects.filter((p) => p.assignedEmployees?.some((e) => String(e.id) === uId))
      : allProjects.filter((p) => p.manager && String(p.manager.id) === uId)

    if (assigned.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 border border-rose-500/20 ml-2">
          Ideal
        </span>
      )
    }

    const p = assigned[0]
    const rawName = p.name
    const truncatedName = rawName.length > 15 ? rawName.slice(0, 15) + "..." : rawName
    const teamSize = (p.assignedEmployees?.length || 0) + (p.manager ? 1 : 0)
    const managerName = p.manager ? p.manager.fullName : "Unassigned"

    return (
      <div className="relative group inline-block ml-2 select-none">
        <span className="cursor-help inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
          @{truncatedName}
        </span>
        <div className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-2 w-56 -translate-x-1/2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all origin-bottom rounded-lg border border-border bg-popover p-2.5 text-popover-foreground shadow-lg text-[11px] leading-relaxed">
          <div className="font-semibold text-foreground border-b border-border/60 pb-1 mb-1">{rawName}</div>
          <div>
            <span className="text-muted-foreground">Manager: </span>
            <span className="text-foreground font-medium">{managerName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Team Size: </span>
            <span className="text-foreground font-medium">{teamSize} members</span>
          </div>
          <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-popover border-r border-b border-border rotate-45" />
        </div>
      </div>
    )
  }

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

  async function handleWorkLogReply(logId: string, reply: WorkLogReply) {
    try {
      const res = await api.createWorkLogReply(logId, reply.message)
      if (res.success && res.data) {
        setProjectWorkLogs((prev) =>
          prev.map((log) => {
            if (log.id === logId) {
              return {
                ...log,
                replies: [...(log.replies || []), mapReply(res.data)],
              }
            }
            return log
          })
        )

        // Find work log to identify the task name and members to notify
        const logItem = projectWorkLogs.find((l) => l.id === logId)
        const targetTask = tasks.find((t) => t.id === logItem?.taskId)
        const taskName = targetTask?.name || "Task"

        // Send SSE notification to all project members
        const projectMembers = [manager, ...members].filter(Boolean) as User[]
        const senderName = user?.name || "Someone"
        await Promise.all(
          projectMembers.map((m) => {
            if (m.id !== user?.id) {
              return notificationService.sendSseNotification(
                "New Work Log Reply",
                `${senderName} replied to a work log on task "${taskName}": "${reply.message}"`,
                "green",
                String(m.id)
              )
            }
            return Promise.resolve()
          })
        )
      } else {
        alert("Failed to post reply: " + res.message)
      }
    } catch (err: any) {
      console.error(err)
      alert("Error posting reply: " + err.message)
    }
  }

  async function handleAssignManager(managerId: string) {
    if (!project) return
    try {
      const res = await api.assignManager(project.id, managerId)
      if (res.success) {
        setProject(mapProject(res.data))
        const mgrUser = users.find((u) => u.id === managerId)
        const assignerName = user?.name || "Administrator"
        const assignerRole = user?.role || "admin"
        notificationService.sendSseNotification(
          "Project Assigned",
          `${assignerName} (${assignerRole}), assigned you to ${project.name} project, please check the task section or your email for more detail`,
          "green",
          managerId
        )
        if (mgrUser?.email) {
          notificationService.sendEmail(
            mgrUser.email,
            `Assigned as Project Manager: ${project.name}`,
            `<p>Hello ${mgrUser.name},</p>
             <p>You have been assigned as the Project Manager for the project <strong>${project.name}</strong> by <strong>${assignerName} (${assignerRole})</strong>.</p>
             <p><strong>Project Details:</strong></p>
             <ul>
               <li><strong>Project Name:</strong> ${project.name}</li>
               <li><strong>Description:</strong> ${project.description || "No description provided"}</li>
               <li><strong>Start Date:</strong> ${project.startDate}</li>
               <li><strong>End Date:</strong> ${project.endDate}</li>
             </ul>
             <p>Please check the project section in the app for more details.</p>`
          )
        }
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
        const empUser = users.find((u) => u.id === employeeId)
        const assignerName = user?.name || "Administrator"
        const assignerRole = user?.role || "admin"
        notificationService.sendSseNotification(
          "Project Assigned",
          `${assignerName} (${assignerRole}), assigned you to ${project.name} project, please check the task section or your email for more detail`,
          "green",
          employeeId
        )
        if (empUser?.email) {
          notificationService.sendEmail(
            empUser.email,
            `Assigned to Project: ${project.name}`,
            `<p>Hello ${empUser.name},</p>
             <p>You have been assigned to the project <strong>${project.name}</strong> by <strong>${assignerName} (${assignerRole})</strong>.</p>
             <p><strong>Project Details:</strong></p>
             <ul>
               <li><strong>Project Name:</strong> ${project.name}</li>
               <li><strong>Description:</strong> ${project.description || "No description provided"}</li>
               <li><strong>Start Date:</strong> ${project.startDate}</li>
               <li><strong>End Date:</strong> ${project.endDate}</li>
             </ul>
             <p>Please check the project section in the app for more details.</p>`
          )
        }
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
        const empUser = users.find((u) => u.id === employeeId)
        notificationService.sendSseNotification(
          "Member Removed",
          `You have been removed from project "${project.name}"`,
          "red",
          employeeId
        )
        if (empUser?.email) {
          notificationService.sendEmail(
            empUser.email,
            `Removed from Project: ${project.name}`,
            `<p>Hello ${empUser.name},</p><p>You have been removed from the project: <strong>${project.name}</strong>.</p>`
          )
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove employee.")
    }
  }

  async function handleNotifyAll() {
    if (!project) return
    setNotifyTitle(`Project Broadcast: ${project.name}`)
    setNotifyDesc("")
    setNotifyUrgency("green")
    setNotifyModalOpen(true)
  }

  async function handleSendNotifyAll(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    const recipients = [manager, ...members].filter(Boolean) as any[]
    if (recipients.length === 0) {
      alert("No team members to notify.")
      return
    }
    setNotifySubmitting(true)
    try {
      const assignerName = user?.name || "Administrator"
      const assignerRole = user?.role || "admin"
      await Promise.all(
        recipients.map((recipient) =>
          notificationService.sendSseNotification(
            notifyTitle,
            `From ${assignerName} (${assignerRole}): ${notifyDesc}`,
            notifyUrgency,
            String(recipient.id)
          )
        )
      )
      setNotifyModalOpen(false)
      alert(`SSE notification broadcasted to all ${recipients.length} team members!`)
    } catch (err) {
      console.error(err)
      alert("Failed to send SSE notification.")
    } finally {
      setNotifySubmitting(false)
    }
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !meetingTitle || !meetingTime || !meetLink) return
    setMeetingSubmitting(true)
    try {
      const recipientIds = [manager?.id, ...members.map((m) => m.id)].filter(Boolean).map(String).join(",")
      const recipientEmails = [manager?.email, ...members.map((m) => m.email)].filter(Boolean).join(",")
      
      let reminderTimeStr = null
      if (hasReminder) {
        const dt = new Date(meetingTime)
        const offsetMs = (reminderMins * 60 + reminderSecs) * 1000
        const reminderDt = new Date(dt.getTime() - offsetMs)
        reminderTimeStr = reminderDt.toISOString()
      }

      const res = await fetch("http://localhost:8081/api/worker/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle,
          meetLink,
          meetingTime: new Date(meetingTime).toISOString(),
          projectId: Number(project.id),
          recipientIds,
          recipientEmails,
          reminderTime: reminderTimeStr
        })
      })

      if (res.ok) {
        setMeetingModalOpen(false)
        setMeetingTitle("")
        setMeetingTime("")
        alert("Meeting successfully scheduled and notifications sent to the team!")
      } else {
        alert("Failed to schedule meeting.")
      }
    } catch (err) {
      console.error("Error scheduling meeting:", err)
      alert("Error scheduling meeting.")
    } finally {
      setMeetingSubmitting(false)
    }
  }

  async function handleEmailAll(e: React.MouseEvent) {
    e.preventDefault()
    if (!project) return
    setEmailSubject(`Broadcast update for project: ${project.name}`)
    setEmailBody("")
    setEmailModalOpen(true)
  }

  async function handleSendEmailAll(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    const recipients = [manager, ...members].filter(Boolean) as any[]
    const emails = recipients.map((r) => r.email).filter(Boolean) as string[]
    if (emails.length === 0) {
      alert("No team members to email.")
      return
    }
    setEmailSubmitting(true)
    try {
      const assignerName = user?.name || "Administrator"
      const assignerRole = user?.role || "admin"
      await Promise.all(
        recipients.map((recipient) =>
          notificationService.sendEmail(
            recipient.email,
            emailSubject,
            `<p>Hello ${recipient.name},</p>
             <p>This is a project-wide email broadcast update regarding project <strong>${project.name}</strong> from <strong>${assignerName} (${assignerRole})</strong>.</p>
             <hr/>
             <p>${emailBody.replace(/\n/g, "<br/>")}</p>`
          )
        )
      )
      setEmailModalOpen(false)
      alert(`Emails successfully dispatched to all ${emails.length} team members!`)
    } catch (err) {
      console.error(err)
      alert("Failed to send emails.")
    } finally {
      setEmailSubmitting(false)
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
          <Card className="flex flex-col gap-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">Progress</h2>
              <span className="text-sm font-medium">{project.completion}%</span>
            </div>
            <Progress value={project.completion} />
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-2.5 sm:grid-cols-4">
              <Stat label="To Do" value={statusCounts.todo} />
              <Stat label="In Progress" value={statusCounts["in-progress"]} />
              <Stat label="Review" value={statusCounts.review} />
              <Stat label="Done" value={statusCounts.done} />
            </div>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm font-semibold">Tasks</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {tasks.length}
                </span>
              </div>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTask(null)
                    setTaskModalOpen(true)
                  }}
                  className="h-7 px-2 text-[11px]"
                >
                  <Plus className="size-3 mr-1" />
                  Add Task
                </Button>
              )}
            </div>
            {sortedTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No tasks in this project yet.</p>
            ) : (
              <ul
                ref={containerRef}
                className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1"
                onDragLeave={() => setDragOverIndex(null)}
              >
                {(() => {
                  let highUrgentCount = 0
                  return sortedTasks.map((t, index) => {
                    const assignee = users.find((u) => u.id === t.assigneeId)
                    const overdue = t.status !== "done" && isOverdue(t.deadline)
                    
                    let cardStyle: React.CSSProperties = {}
                    if (t.priority === "urgent") {
                      const darkRedR = Math.max(127, 185 - highUrgentCount * 15)
                      const darkRedG = Math.max(20, 28 - highUrgentCount * 2)
                      const darkRedB = Math.max(20, 28 - highUrgentCount * 2)
                      const opacity = Math.max(0.6, 1 - highUrgentCount * 0.08)
                      cardStyle = {
                        borderColor: `rgba(${darkRedR}, ${darkRedG}, ${darkRedB}, ${opacity})`,
                        borderWidth: "1.75px"
                      }
                      highUrgentCount++
                    } else if (t.priority === "high") {
                      const r = Math.min(250, 220 + highUrgentCount * 8)
                      const g = Math.min(200, 38 + highUrgentCount * 25)
                      const b = Math.min(200, 38 + highUrgentCount * 25)
                      const opacity = Math.max(0.5, 0.85 - highUrgentCount * 0.08)
                      cardStyle = {
                        borderColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                        borderWidth: "1.5px"
                      }
                      highUrgentCount++
                    } else if (t.priority === "medium") {
                      cardStyle = {
                        borderColor: "rgba(228, 200, 30, 0.6)",
                        borderWidth: "1.5px"
                      }
                    } else {
                      cardStyle = {}
                    }

                    return (
                      <li
                        key={t.id}
                        draggable={canManage}
                        onDragStart={(e) => {
                          if (canManage) {
                            setDraggedIndex(index)
                          }
                        }}
                        onDragOver={(e) => {
                          if (canManage) {
                            e.preventDefault()
                            setDragOverIndex(index)
                            const container = containerRef.current
                            if (container) {
                              const rect = container.getBoundingClientRect()
                              const relativeY = e.clientY - rect.top
                              if (relativeY < 60) {
                                container.scrollBy({ top: -10, behavior: "auto" })
                              } else if (rect.height - relativeY < 60) {
                                container.scrollBy({ top: 10, behavior: "auto" })
                              }
                            }
                          }
                        }}
                        onDrop={(e) => {
                          if (canManage) {
                            setDragOverIndex(null)
                            handleTaskDrop(draggedIndex!, index)
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedIndex(null)
                          setDragOverIndex(null)
                        }}
                        onClick={(e) => {
                          if (canManage) {
                            e.preventDefault()
                            setSelectedTask(t)
                            setTaskModalOpen(true)
                          }
                        }}
                        style={cardStyle}
                        className={cn(
                          "flex flex-col gap-3 rounded-xl bg-card p-4 transition-all shadow-sm hover:shadow cursor-pointer select-none border border-border",
                          draggedIndex === index && "opacity-40",
                          dragOverIndex === index && draggedIndex !== index && "border-dashed border-primary bg-primary/5 scale-[0.98]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground truncate max-w-[70%]">
                            {t.name}
                          </h3>
                          <div className="flex gap-1 shrink-0">
                            <PriorityBadge priority={t.priority} />
                            <TaskStatusBadge status={t.status} />
                          </div>
                        </div>

                        {t.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 truncate">
                            {t.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <Avatar name={assignee?.name ?? "?"} src={assignee?.avatar} size="sm" role={assignee?.role} />
                            <span className="truncate font-medium text-foreground">
                              {assignee ? assignee.name : "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                            <Clock className="size-3" />
                            <span>{formatDate(t.deadline)}</span>
                          </div>
                        </div>
                      </li>
                    )
                  })
                })()}
              </ul>
            )}
          </Card>

          {/* Project Work Logs Feed */}
          <div className="flex flex-col gap-4 mt-6">
            <h2 className="font-heading text-sm font-semibold">Work Logs & Progress ({projectWorkLogs.length})</h2>
            <div className="max-h-[600px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
              {projectWorkLogs.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground text-sm">
                  Work logs will be shown here
                </Card>
              ) : (
                projectWorkLogs.map((log) => (
                  <WorkLogCard
                    key={log.id}
                    log={log}
                    currentUserId={user?.id || ""}
                    onReply={handleWorkLogReply}
                    users={users}
                    tasks={tasks}
                    projects={project ? [project] : []}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card
            className={cn(
              "flex flex-col gap-4 p-5 transition-all select-none shrink-0",
              canManage && "cursor-pointer hover:border-primary/50"
            )}
            onClick={(e) => {
              if (canManage && !(e.target as HTMLElement).closest(".team-card-actions")) {
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
              {canManage && (
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
                    <Avatar name={manager.name} src={manager.avatar} size="sm" role={manager.role} />
                    <div>
                      <p className="text-sm font-medium">{manager.name}</p>
                      <p className="text-xs text-muted-foreground">Project Manager (Leader)</p>
                    </div>
                  </div>
                  <Badge variant="default">Manager</Badge>
                </li>
              )}
            </ul>

            <ul className="flex flex-col gap-3 shrink-0">
              {members.slice(0, 2).map((m) => (
                <li key={m.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={m.name} src={m.avatar} size="sm" role={m.role} />
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.jobTitle}</p>
                    </div>
                  </div>
                  <Badge variant="neutral">Employee</Badge>
                </li>
              ))}
            </ul>

            <div className="team-card-actions mt-2 flex flex-col gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleNotifyAll}
              >
                <MessageSquare className="size-3.5 text-primary" />
                Notify All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleEmailAll}
              >
                <Mail className="size-3.5 text-primary" />
                Email All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => {
                  setMeetingTitle("")
                  setMeetingTime("")
                  setMeetLink(`https://meet.google.com/${Math.random().toString(36).substring(2,5)}-${Math.random().toString(36).substring(2,6)}-${Math.random().toString(36).substring(2,5)}`)
                  setMeetingModalOpen(true)
                }}
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

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onSave={() => {
          loadData()
        }}
        task={selectedTask}
        defaultProjectId={project.id}
      />

      <Modal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title={isEditingTeam ? "Manage Project Team" : "Project Team Details"}
        description={isEditingTeam ? "Search, filter, and assign a project manager and employee members." : "Current manager and assigned employee members for this project."}
        footer={
          <Button variant="outline" onClick={() => setTeamModalOpen(false)}>
            Close
          </Button>
        }
      >
        {!isEditingTeam ? (
          <div className="flex flex-col gap-4">
            {canManage && (
              <div className="flex justify-end -mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingTeam(true)}
                  className="h-8 px-3 text-xs"
                >
                  <Pencil className="size-3.5 mr-1.5" />
                  Edit Team
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Manager (Leader)</h3>
              {manager ? (
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/10">
                  <Avatar name={manager.name} src={manager.avatar} size="sm" role={manager.role} />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{manager.name}</div>
                    <div className="text-[10px] text-muted-foreground">{manager.email}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic p-2.5">No manager assigned yet.</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Employees ({members.length})</h3>
              <div className="max-h-[250px] overflow-y-auto border border-border/80 rounded-lg divide-y divide-border bg-card">
                {members.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground italic">No employees assigned yet.</p>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5">
                      <Avatar name={m.name} src={m.avatar} size="sm" role={m.role} />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
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
                        <Avatar name={u.name} src={u.avatar} size="sm" role={u.role} />
                        <div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                            <span>{u.name}</span>
                            {renderUserProjectStatus(u.id, u.role)}
                          </div>
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
                            disabled={!isAdmin}
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
        )}
      </Modal>

      <Modal
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        title="Schedule Project Meeting"
        description="Schedule a team alignment meeting. Recipients will receive direct alerts and emails immediately, plus a reminder before the meeting start time if configured."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMeetingModalOpen(false)} disabled={meetingSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateMeeting} disabled={meetingSubmitting || !meetingTitle || !meetingTime || !meetLink}>
              {meetingSubmitting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meet-title">Meeting Title</Label>
            <Input id="meet-title" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Team Alignment Meeting..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meet-time">Meeting Time & Date</Label>
            <Input id="meet-time" type="datetime-local" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meet-url">Meeting Link</Label>
            <div className="flex gap-2">
              <Input id="meet-url" value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." required />
              <Button type="button" variant="outline" onClick={() => setMeetLink(`https://meet.google.com/${Math.random().toString(36).substring(2,5)}-${Math.random().toString(36).substring(2,6)}-${Math.random().toString(36).substring(2,5)}`)}>
                Regen
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="set-reminder"
              type="checkbox"
              checked={hasReminder}
              onChange={(e) => setHasReminder(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="set-reminder" className="text-xs cursor-pointer">Set Reminder Alert</Label>
          </div>

          {hasReminder && (
            <div className="flex flex-col gap-1.5 bg-muted/30 p-3 rounded-lg border border-border/40">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reminder Time Offset</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <Label htmlFor="rem-mins" className="text-[10px] text-muted-foreground">Minutes before</Label>
                  <Input
                    id="rem-mins"
                    type="number"
                    min={0}
                    value={reminderMins}
                    onChange={(e) => setReminderMins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Label htmlFor="rem-secs" className="text-[10px] text-muted-foreground">Seconds before</Label>
                  <Input
                    id="rem-secs"
                    type="number"
                    min={0}
                    max={59}
                    value={reminderSecs}
                    onChange={(e) => setReminderSecs(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {meetingTime && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Reminder will trigger on:{" "}
                  <span className="font-semibold text-foreground">
                    {new Date(new Date(meetingTime).getTime() - (reminderMins * 60 + reminderSecs) * 1000).toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="Broadcast SSE Notification"
        description="Send a real-time notification to all team members assigned to this project."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setNotifyModalOpen(false)} disabled={notifySubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSendNotifyAll} disabled={notifySubmitting || !notifyTitle || !notifyDesc}>
              {notifySubmitting ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendNotifyAll} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="broadcast-title">Notification Title</Label>
            <Input id="broadcast-title" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="Notification title..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="broadcast-desc">Description</Label>
            <Textarea id="broadcast-desc" value={notifyDesc} onChange={(e) => setNotifyDesc(e.target.value)} placeholder="Message content..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="broadcast-urgency">Urgency Level</Label>
            <Select id="broadcast-urgency" value={notifyUrgency} onChange={(e) => setNotifyUrgency(e.target.value as any)}>
              <option value="green">Green (Low / Info)</option>
              <option value="yellow">Yellow (Medium / Warning)</option>
              <option value="red">Red (High / Urgent)</option>
            </Select>
          </div>
        </form>
      </Modal>

      <Modal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Compose Broadcast Email"
        description="Compose an email update to be sent to all team members assigned to this project."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEmailModalOpen(false)} disabled={emailSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSendEmailAll} disabled={emailSubmitting || !emailSubject || !emailBody}>
              {emailSubmitting ? "Sending..." : "Send Email"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendEmailAll} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="broadcast-subject">Subject</Label>
            <Input id="broadcast-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject line..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="broadcast-body">Body Message</Label>
            <Textarea id="broadcast-body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email content..." required />
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-heading text-lg font-semibold leading-none">{value}</span>
      <span className="text-[11px] text-muted-foreground leading-none">{label}</span>
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
