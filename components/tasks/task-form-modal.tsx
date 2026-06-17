"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import type { Task, TaskPriority, TaskStatus, ProjectStatus } from "@/types"
import { api, BackendTask, BackendProject, BackendUser } from "@/lib/api"

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Task | null) => void
  task?: Task | null
  defaultProjectId?: string
}

const emptyForm = {
  name: "",
  description: "",
  priority: "medium" as TaskPriority,
  status: "todo" as TaskStatus,
  deadline: "",
  projectId: "",
  assigneeId: "",
  estimatedHours: 8,
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
    estimatedHours: t.estimatedHours || 0,
  }
}

export function TaskFormModal({ open, onClose, onSave, task, defaultProjectId }: TaskFormModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [projects, setProjects] = useState<BackendProject[]>([])
  const [users, setUsers] = useState<BackendUser[]>([])
  const [submitting, setSubmitting] = useState(false)

  const selectedProject = projects.find((p) => String(p.id) === form.projectId)
  const allowedUsers = selectedProject?.assignedEmployees || []

  useEffect(() => {
    async function loadResources() {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          api.getProjects(),
          api.getUsers(),
        ])
        if (projectsRes.success && usersRes.success) {
          setProjects(projectsRes.data)
          setUsers(usersRes.data)
          
          if (!task) {
            const initialProjectId = defaultProjectId || (projectsRes.data.length > 0 ? String(projectsRes.data[0].id) : "")
            setForm((f) => ({
              ...f,
              projectId: initialProjectId,
              assigneeId: "",
            }))
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    if (open) {
      loadResources()
    }
  }, [open, task, defaultProjectId])

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name,
        description: task.description,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        estimatedHours: task.estimatedHours,
      })
    } else {
      setForm(emptyForm)
    }
  }, [task, open])

  async function handleDelete() {
    if (!task) return
    if (!confirm("Are you sure you want to delete this task?")) return
    setSubmitting(true)
    try {
      await api.deleteTask(task.id)
      onSave(null)
      onClose()
    } catch (err: any) {
      alert(err.message || "Failed to delete task.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        priority: form.priority === "urgent" ? "CRITICAL" : form.priority.toUpperCase(),
        status: form.status === "todo"
          ? "TO_DO"
          : form.status === "in-progress"
          ? "IN_PROGRESS"
          : form.status === "review"
          ? "IN_REVIEW"
          : "COMPLETED",
        deadline: form.deadline,
        estimatedHours: Number(form.estimatedHours),
        employeeId: form.assigneeId ? Number(form.assigneeId) : null,
      }
      let savedTask: Task
      if (task) {
        const res = await api.updateTask(task.id, payload)
        savedTask = mapTask(res.data)
      } else {
        const res = await api.createTask(form.projectId, payload)
        savedTask = mapTask(res.data)
      }
      onSave(savedTask)
      onClose()
    } catch (err: any) {
      alert(err.message || "Failed to save task.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit Task" : "Create Task"}
      description="Capture the work, priority and ownership."
      footer={
        <div className="flex w-full items-center justify-between">
          {task ? (
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} type="button" disabled={submitting}>
              <Trash2 className="size-4 mr-1.5" />
              Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} type="button" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" disabled={submitting}>
              {submitting ? "Saving..." : task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-name">Task name</Label>
          <Input
            id="t-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Build authentication flow"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-desc">Description</Label>
          <Textarea
            id="t-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add task details..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-priority">Priority</Label>
            <Select
              id="t-priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-status">Status</Label>
            <Select
              id="t-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-project">Project</Label>
            <Select
              id="t-project"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value, assigneeId: "" })}
              disabled={!!task}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-assignee">Assignee</Label>
            <Select
              id="t-assignee"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {allowedUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-deadline">Deadline</Label>
            <Input
              id="t-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-hours">Estimated hours</Label>
            <Input
              id="t-hours"
              type="number"
              min={1}
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
