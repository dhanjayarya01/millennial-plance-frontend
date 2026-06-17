"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import type { Project, ProjectStatus } from "@/types"
import { api, BackendProject, BackendUser } from "@/lib/api"

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (project: Project) => void
  project?: Project | null
}

const emptyForm = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "planning" as ProjectStatus,
  managerId: "",
  completion: 0,
}

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

export function ProjectFormModal({ open, onClose, onSave, project }: ProjectFormModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [managers, setManagers] = useState<BackendUser[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadManagers() {
      try {
        const res = await api.getUsers()
        if (res.success && res.data) {
          const mList = res.data.filter((u) => u.role === "ROLE_PROJECT_MANAGER")
          setManagers(mList)
          if (!project && mList.length > 0) {
            setForm((f) => ({ ...f, managerId: String(mList[0].id) }))
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    if (open) {
      loadManagers()
    }
  }, [open, project])

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        managerId: project.managerId,
        completion: project.completion,
      })
    } else {
      setForm(emptyForm)
    }
  }, [project, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        status: form.status.toUpperCase().replace("-", "_"),
        managerId: form.managerId ? Number(form.managerId) : null,
      }
      let savedProject: Project
      if (project) {
        const res = await api.updateProject(project.id, payload)
        savedProject = mapProject(res.data)
      } else {
        const res = await api.createProject(payload)
        savedProject = mapProject(res.data)
      }
      onSave(savedProject)
      onClose()
    } catch (err: any) {
      alert(err.message || "Failed to save project.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit Project" : "Create Project"}
      description="Define the project details and assign a manager."
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={submitting}>
            {submitting ? "Saving..." : project ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-name">Project name</Label>
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Atlas Web Platform"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this project about?"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-start">Start date</Label>
            <Input
              id="p-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-end">End date</Label>
            <Input
              id="p-end"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-status">Status</Label>
            <Select
              id="p-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-manager">Manager</Label>
            <Select
              id="p-manager"
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            >
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-completion">Completion ({form.completion}%)</Label>
          <input
            id="p-completion"
            type="range"
            min={0}
            max={100}
            value={form.completion}
            onChange={(e) => setForm({ ...form, completion: Number(e.target.value) })}
            className="accent-primary"
          />
        </div>
      </form>
    </Modal>
  )
}
