"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, History } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { roleLegend, projectColor } from "@/lib/colors"
import type { ActivityLog, User, Project, ProjectStatus } from "@/types"
import { api, BackendAuditLog } from "@/lib/api"

const ENTITY_ORDER: ActivityLog["entity"][] = ["Project", "Task", "User"]

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [entity, setEntity] = useState("all")
  const [project, setProject] = useState("all")
  const [loading, setLoading] = useState(true)

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

  async function loadData() {
    try {
      const [logsRes, projectsRes, usersRes] = await Promise.all([
        api.getAuditLogs(),
        api.getProjects(),
        api.getUsers(),
      ])

      if (logsRes.success && projectsRes.success && usersRes.success) {
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

        setLogs(mappedLogs)
        setProjects(mappedProjects)
        setUsers(mappedUsers)
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

  const groups = useMemo(() => {
    return ENTITY_ORDER.map((type) => ({
      type,
      logs: filtered.filter((l) => l.entity === type),
    })).filter((g) => g.logs.length > 0)
  }, [filtered])

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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.type} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm font-semibold">{group.type}s</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {group.logs.length}
                </span>
              </div>
              <ActivityTimeline users={users} customLogs={group.logs} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
