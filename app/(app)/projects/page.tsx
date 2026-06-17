"use client"

import { useMemo, useState, useEffect } from "react"
import { Plus, Search, FolderKanban } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectFormModal } from "@/components/projects/project-form-modal"
import type { Project, ProjectStatus } from "@/types"
import { api, BackendProject } from "@/lib/api"

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

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<ProjectStatus | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.getProjects()
        if (res.success && res.data) {
          setProjects(res.data.map(mapProject))
        } else {
          setError(res.message || "Failed to load projects.")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.")
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  const scoped = useMemo(() => {
    if (!user) return []
    if (user.role === "manager") return projects.filter((p) => p.managerId === user.id)
    if (user.role === "employee") return projects.filter((p) => p.memberIds.includes(user.id))
    return projects
  }, [projects, user])

  const filtered = useMemo(() => {
    return scoped.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || p.status === status
      return matchesQuery && matchesStatus
    })
  }, [scoped, query, status])

  function handleSave(project: Project) {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id)
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev]
    })
  }

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const canManage = user?.role === "admin" || user?.role === "manager"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.role === "manager" ? "My Projects" : "Projects"}
        description="Track progress, ownership and timelines across your projects."
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus />
              New Project
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | "all")}
          className="sm:w-48"
        >
          <option value="all">All statuses</option>
          <option value="planning">Planning</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Try adjusting your filters or create a new project to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={(proj) => {
                setEditing(proj)
                setModalOpen(true)
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        project={editing}
      />
    </div>
  )
}
