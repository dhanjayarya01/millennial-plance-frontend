"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Search, History, Clock, Paperclip, CornerDownRight, Send, ExternalLink, FolderKanban, CalendarDays, Loader2 } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/shared/empty-state"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { TaskStatusBadge, PriorityBadge, ProjectStatusBadge } from "@/components/shared/status-badge"
import { useAuth } from "@/components/providers/auth-provider"
import { roleLegend, projectColor } from "@/lib/colors"
import { timeAgo, formatDate } from "@/lib/format"
import { notificationService } from "@/lib/notification-service"
import type { ActivityLog, User, Project, ProjectStatus, WorkLog, WorkLogReply, Task } from "@/types"
import { api, BackendAuditLog, BackendTask, BackendWorkLog, BackendWorkLogReply } from "@/lib/api"

const ENTITY_ORDER: ActivityLog["entity"][] = ["Project", "Task", "User"]

export default function ActivityLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [query, setQuery] = useState("")
  const [entity, setEntity] = useState("all")
  const [project, setProject] = useState("all")
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(30)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchTerm), 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    setVisibleCount(30)
  }, [query, entity, project])

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [replyText, setReplyText] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)

  const mapProjectStatus = (s: string): ProjectStatus => {
    const statusLower = s.toLowerCase().replace("_", "-")
    if (statusLower === "planning" || statusLower === "in-progress" || statusLower === "on-hold" || statusLower === "completed") {
      return statusLower as ProjectStatus
    }
    return "planning"
  }

  const mapAuditLog = (a: BackendAuditLog): ActivityLog => ({
    id: a.id,
    userId: a.userId,
    action: a.action,
    entity: (a.entity === "WorkLog" ? "Task" : a.entity) as any,
    entityName: a.entityName,
    timestamp: a.timestamp,
    oldValue: a.oldValue || "—",
    newValue: a.newValue || "—",
    projectId: a.projectId || undefined,
  })

  const mapTask = (t: BackendTask): Task => ({
    id: String(t.id),
    name: t.name,
    description: t.description || "",
    priority: (t.priority.toLowerCase() === "critical" ? "urgent" : t.priority.toLowerCase()) as any,
    status: t.status.toLowerCase().replace("_", "-") as any,
    deadline: t.deadline || "",
    projectId: String(t.projectId),
    assigneeId: t.employee ? String(t.employee.id) : "",
    assigneeIds: t.employees ? t.employees.map(e => String(e.id)) : (t.employee ? [String(t.employee.id)] : []),
    estimatedHours: t.estimatedHours || 0,
    createdById: t.createdBy ? String(t.createdBy.id) : "",
  })

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

  async function loadData() {
    try {
      const [logsRes, projectsRes, usersRes, tasksRes, workLogsRes] = await Promise.all([
        api.getAuditLogs(),
        api.getProjects(),
        api.getUsers(),
        api.getTasks(),
        api.getWorkLogs(),
      ])

      if (logsRes.success && projectsRes.success && usersRes.success && tasksRes.success && workLogsRes.success) {
        const mappedLogs = logsRes.data.map(mapAuditLog)

        const mappedUsers: User[] = usersRes.data.map((u) => ({
          id: String(u.id),
          name: u.fullName,
          email: u.email,
          password: "",
          role: (u.role === "ROLE_ADMIN" ? "admin" : u.role === "ROLE_PROJECT_MANAGER" ? "manager" : "employee") as any,
          avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
          jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
          department: "Engineering",
          status: (u.active ? "active" : "suspended") as any,
        }))

        const mappedProjects: Project[] = projectsRes.data.map((p) => ({
          id: String(p.id),
          name: p.name,
          description: p.description || "",
          startDate: p.startDate || "",
          endDate: p.endDate || "",
          status: mapProjectStatus(p.status),
          managerId: p.manager ? String(p.manager.id) : "",
          memberIds: p.assignedEmployees ? p.assignedEmployees.map((e) => String(e.id)) : [],
          completion: p.progressPercentage || 0,
        }))

        const mappedTasks = tasksRes.data.map(mapTask)
        const mappedWorkLogs = workLogsRes.data.map(mapWorkLog)

        setLogs(mappedLogs)
        setProjects(mappedProjects)
        setUsers(mappedUsers)
        setTasks(mappedTasks)
        setWorkLogs(mappedWorkLogs)
      }
    } catch (err) {
      console.error("Failed to load audit logs", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    return logs
      .filter((log) => {
        const userObj = users.find((u) => String(u.id) === String(log.userId))
        const userName = userObj ? userObj.name : "System"
        const haystack = `${userName} ${log.action} ${log.entity} ${log.entityName}`.toLowerCase()
        const matchesQuery = haystack.includes(query.toLowerCase())
        const matchesEntity = entity === "all" || log.entity === entity
        const matchesProject = project === "all" || String(log.projectId) === String(project)
        return matchesQuery && matchesEntity && matchesProject
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [logs, query, entity, project, users])

  const visibleFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  const groups = useMemo(() => {
    return ENTITY_ORDER.map((type) => ({
      type,
      logs: visibleFiltered.filter((l) => l.entity === type),
    })).filter((g) => g.logs.length > 0)
  }, [visibleFiltered])

  const isWorkLogAction = selectedLog ? (selectedLog.action === "logged_work" || selectedLog.action === "replied_to_worklog") : false

  const matchedWorkLog = useMemo(() => {
    if (!selectedLog) return null
    const logTask = tasks.find(t => t.name === selectedLog.entityName)
    
    if (selectedLog.action === "logged_work") {
      return workLogs.find(w => 
        String(w.authorId) === String(selectedLog.userId) &&
        (logTask ? String(w.taskId) === String(logTask.id) : true) &&
        (selectedLog.newValue.includes(String(w.hours)) || selectedLog.newValue.includes(w.message))
      )
    }
    
    if (selectedLog.action === "replied_to_worklog") {
      return workLogs.find(w => 
        w.replies?.some(r => String(r.authorId) === String(selectedLog.userId) && r.message === selectedLog.newValue)
      )
    }
    
    return null
  }, [selectedLog, workLogs, tasks])

  const matchedProject = useMemo(() => {
    if (!selectedLog || selectedLog.entity !== "Project") return null
    return projects.find(p => p.name === selectedLog.entityName || String(p.id) === String(selectedLog.projectId))
  }, [selectedLog, projects])

  const matchedTask = useMemo(() => {
    if (!selectedLog || selectedLog.entity !== "Task" || isWorkLogAction) return null
    return tasks.find(t => t.name === selectedLog.entityName && (selectedLog.projectId ? String(t.projectId) === String(selectedLog.projectId) : true))
  }, [selectedLog, tasks, isWorkLogAction])

  const logAuthor = useMemo(() => {
    if (!selectedLog) return null
    return users.find(u => String(u.id) === String(selectedLog.userId))
  }, [selectedLog, users])

  async function handleWorkLogReplySubmit(e: React.FormEvent, workLogId: string) {
    e.preventDefault()
    if (!replyText.trim() || submittingReply) return
    setSubmittingReply(true)
    try {
      const res = await api.createWorkLogReply(workLogId, replyText.trim())
      if (res.success && res.data) {
        const newReply = {
          id: String(res.data.id),
          authorId: String(res.data.authorId),
          message: res.data.message,
          timestamp: res.data.timestamp,
        }
        
        setWorkLogs((prev) =>
          prev.map((wl) => {
            if (wl.id === workLogId) {
              return {
                ...wl,
                replies: [...(wl.replies || []), newReply],
              }
            }
            return wl
          })
        )
        setReplyText("")

        const wlObj = workLogs.find(wl => wl.id === workLogId)
        const logTask = wlObj ? tasks.find(t => String(t.id) === String(wlObj.taskId)) : null
        const taskName = logTask?.name || "Task"
        const matchedProj = logTask ? projects.find(p => String(p.id) === String(logTask.projectId)) : null

        if (matchedProj) {
          const pmUser = users.find(u => u.id === matchedProj.managerId)
          const membersList = matchedProj.memberIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[]
          const projectMembers = [pmUser, ...membersList].filter(Boolean) as User[]
          const senderName = user?.name || "Someone"

          await Promise.all(
            projectMembers.map((m) => {
              const currentLoggedUser = users.find(u => u.email === user?.email || u.id === user?.id)
              if (m.id !== currentLoggedUser?.id) {
                return notificationService.sendSseNotification(
                  "New Work Log Reply",
                  `${senderName} replied to a work log on task "${taskName}": "${newReply.message}"`,
                  "green",
                  String(m.id)
                )
              }
              return Promise.resolve()
            })
          )
        }
      } else {
        alert("Failed to submit reply: " + res.message)
      }
    } catch (err: any) {
      console.error(err)
      alert("Error submitting reply: " + err.message)
    } finally {
      setSubmittingReply(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Activity Logs" description="A complete, color-coded audit trail across your workspace." />

      {/* Legends */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Role (avatar ring)</span>
          <div className="flex flex-wrap items-center gap-3">
            {roleLegend.map((r) => (
              <span key={r.role} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
                  style={{ backgroundColor: r.color, boxShadow: `0 0 0 2px ${r.color}` }}
                />
                {r.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Project (left border)</span>
          <div className="flex flex-wrap items-center gap-3">
            {projects.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 text-xs">
                <span className="h-3 w-1.5 rounded-full" style={{ backgroundColor: projectColor(p.id) }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity..."
            className="pl-9"
          />
        </div>
        <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="sm:w-40">
          <option value="all">All entities</option>
          {ENTITY_ORDER.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        <Select value={project} onChange={(e) => setProject(e.target.value)} className="sm:w-52">
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={History} title="No activity found" description="Try a different search or filter." />
      ) : (
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.scrollHeight - el.scrollTop <= el.clientHeight + 80) {
            setVisibleCount((c) => c + 20)
          }
        }}
        className="max-h-[600px] overflow-y-auto pr-1 flex flex-col gap-6 scrollbar-thin"
      >
        {groups.map((group) => (
          <section key={group.type} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold">{group.type}s</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {filtered.filter(l => l.entity === group.type).length}
              </span>
            </div>
            <ActivityTimeline users={users} customLogs={group.logs} onLogClick={setSelectedLog} />
          </section>
        ))}
        {visibleCount < filtered.length && (
          <div className="flex justify-center py-3">
            <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
      </div>
      )}

      {/* Details Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => {
          setSelectedLog(null)
          setReplyText("")
        }}
        title="Activity Details"
        className="max-w-2xl"
      >
        {selectedLog && (
          <div className="flex flex-col gap-5">
            {/* Header info */}
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <Avatar name={logAuthor?.name ?? "?"} src={logAuthor?.avatar} size="sm" role={logAuthor?.role} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {logAuthor?.name || "System"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {logAuthor ? `${logAuthor.jobTitle} · ${logAuthor.department}` : "System event"}
                </p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {timeAgo(selectedLog.timestamp)}
              </span>
            </div>

            {/* Entity and Action Details */}
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-3.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Entity:</span>
                <Badge variant="neutral">{selectedLog.entity}</Badge>
                <span className="font-medium text-foreground">{selectedLog.entityName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Action:</span>
                <span className="font-medium text-foreground capitalize">{selectedLog.action.replace("_", " ")}</span>
              </div>
              {selectedLog.projectId && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Project:</span>
                  <span className="font-medium text-primary">
                    {projects.find(p => String(p.id) === String(selectedLog.projectId))?.name || "Project"}
                  </span>
                </div>
              )}
            </div>

            {/* Case 1: Work Log Details */}
            {isWorkLogAction && (
              <div className="flex flex-col gap-4 border-t border-border pt-4">
                <h3 className="font-heading text-sm font-semibold text-foreground">Work Log Information</h3>
                {matchedWorkLog ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-6 rounded-lg bg-[var(--success)]/8 border border-[var(--success)]/15 p-3 text-sm">
                      <div className="flex items-center gap-1 text-[var(--success)] font-medium">
                        <Clock className="size-4" />
                        <span>{matchedWorkLog.hours} Hours Logged</span>
                      </div>
                      <div className="text-muted-foreground">
                        {formatDate(matchedWorkLog.timestamp)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Logged Message:</span>
                      <p className="rounded-lg border border-border bg-card p-3 text-sm leading-relaxed text-pretty">
                        {matchedWorkLog.message || "No description details."}
                      </p>
                    </div>

                    {matchedWorkLog.attachments && matchedWorkLog.attachments.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Attachments:</span>
                        <div className="flex flex-wrap gap-2">
                          {matchedWorkLog.attachments.map((file) => {
                            const isImage = file.match(/\.(jpeg|jpg|gif|png|webp)/i) || file.includes("image/upload");
                            return (
                              <a
                                key={file}
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-2 text-xs hover:bg-muted/70 transition-colors w-full sm:w-fit"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Paperclip className="size-3.5 text-muted-foreground" />
                                  <span className="truncate max-w-[200px] text-primary hover:underline">
                                    {file.substring(file.lastIndexOf("/") + 1) || "Attachment"}
                                  </span>
                                </div>
                                {isImage && (
                                  <img src={file} alt="attachment" className="mt-1 max-h-24 rounded object-cover" />
                                )}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Replies Thread */}
                    <div className="border-t border-border pt-4 flex flex-col gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">Comments & Replies:</span>
                      {matchedWorkLog.replies && matchedWorkLog.replies.length > 0 ? (
                        <ul className="flex flex-col gap-3 border-l-2 border-border pl-4">
                          {matchedWorkLog.replies.map((reply) => {
                            const replyAuthor = users.find((u) => String(u.id) === String(reply.authorId))
                            return (
                              <li key={reply.id} className="flex gap-2.5">
                                <Avatar name={replyAuthor?.name ?? "?"} src={replyAuthor?.avatar} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{replyAuthor?.name || "User"}</span>
                                    <span className="text-xs text-muted-foreground">{timeAgo(reply.timestamp)}</span>
                                  </div>
                                  <p className="text-sm leading-snug text-pretty">{reply.message}</p>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pl-2">No comments or replies yet.</p>
                      )}

                      <form onSubmit={(e) => handleWorkLogReplySubmit(e, matchedWorkLog.id)} className="mt-2 flex items-center gap-2">
                        <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                        />
                        <Button type="submit" size="sm" disabled={!replyText.trim() || submittingReply}>
                          {submittingReply && <Loader2 className="size-3 mr-1 animate-spin" />}
                          <Send className="size-3.5" />
                          Reply
                        </Button>
                      </form>
                    </div>

                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Loading or matched work log details not found.
                  </p>
                )}
              </div>
            )}

            {/* Case 2: Project Details */}
            {selectedLog.entity === "Project" && matchedProject && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="font-heading text-sm font-semibold text-foreground">Project Details</h3>
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/projects/${matchedProject.id}`} className="font-semibold text-primary hover:underline flex items-center gap-1 text-sm">
                      <FolderKanban className="size-4" />
                      {matchedProject.name}
                    </Link>
                    <ProjectStatusBadge status={matchedProject.status} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {matchedProject.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {formatDate(matchedProject.startDate)} - {formatDate(matchedProject.endDate)}
                    </span>
                    <span>Completion: {matchedProject.completion}%</span>
                  </div>
                  <Progress value={matchedProject.completion} className="h-1.5" />
                </Card>
              </div>
            )}

            {/* Case 3: Task Details (Regular Task change) */}
            {selectedLog.entity === "Task" && !isWorkLogAction && matchedTask && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="font-heading text-sm font-semibold text-foreground">Task Details</h3>
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/tasks/${matchedTask.id}`} className="font-semibold text-primary hover:underline text-sm">
                      {matchedTask.name}
                    </Link>
                    <div className="flex gap-1.5">
                      <PriorityBadge priority={matchedTask.priority} />
                      <TaskStatusBadge status={matchedTask.status} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {matchedTask.description || "No description details."}
                  </p>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                    <span>Deadline: {formatDate(matchedTask.deadline)}</span>
                    <span>Est: {matchedTask.estimatedHours}h</span>
                  </div>
                </Card>
              </div>
            )}

            {/* Change diff info */}
            {selectedLog.oldValue !== "—" || selectedLog.newValue !== "—" ? (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change Details:</span>
                <div className="flex flex-wrap items-center gap-2 text-sm bg-muted/20 border border-border/60 p-3 rounded-lg">
                  <span className="rounded bg-destructive/10 px-2.5 py-1 text-destructive font-medium line-through">
                    {selectedLog.oldValue}
                  </span>
                  <span className="text-muted-foreground font-semibold">{"->"}</span>
                  <span className="rounded bg-[var(--success)]/12 px-2.5 py-1 text-[var(--success)] font-medium">
                    {selectedLog.newValue}
                  </span>
                </div>
              </div>
            ) : null}

          </div>
        )}
      </Modal>
    </div>
  )
}
