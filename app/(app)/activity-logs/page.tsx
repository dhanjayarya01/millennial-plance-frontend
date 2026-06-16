"use client"

import { useMemo, useState } from "react"
import { Search, History } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ActivityItem } from "@/components/shared/activity-item"
import { dummyActivityLogs } from "@/data/dummyLogs"
import { dummyProjects, getProjectById } from "@/data/dummyProjects"
import { getUserById } from "@/data/dummyUsers"
import { roleLegend, projectColor } from "@/lib/colors"
import type { ActivityLog } from "@/types"

const ENTITY_ORDER: ActivityLog["entity"][] = ["Project", "Task", "User"]

export default function ActivityLogsPage() {
  const [query, setQuery] = useState("")
  const [entity, setEntity] = useState("all")
  const [project, setProject] = useState("all")

  const filtered = useMemo(() => {
    return dummyActivityLogs
      .filter((log) => {
        const user = getUserById(log.userId)
        const haystack = `${user?.name} ${log.action} ${log.entity} ${log.entityName}`.toLowerCase()
        const matchesQuery = haystack.includes(query.toLowerCase())
        const matchesEntity = entity === "all" || log.entity === entity
        const matchesProject = project === "all" || log.projectId === project
        return matchesQuery && matchesEntity && matchesProject
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [query, entity, project])

  // Group the filtered activity by entity type so the feed reads as
  // "all entities, with their activity" while still color coded by project.
  const groups = useMemo(() => {
    return ENTITY_ORDER.map((type) => ({
      type,
      logs: filtered.filter((l) => l.entity === type),
    })).filter((g) => g.logs.length > 0)
  }, [filtered])

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
            {dummyProjects.map((p) => (
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
          {dummyProjects.map((p) => (
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
              <ul className="flex flex-col gap-2">
                {group.logs.map((log) => (
                  <ActivityItem
                    key={log.id}
                    log={log}
                    href={log.projectId && getProjectById(log.projectId) ? `/projects/${log.projectId}` : undefined}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
