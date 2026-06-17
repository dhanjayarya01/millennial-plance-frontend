"use client"

import { useEffect, useState } from "react"
import { Trash2, Pencil } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/format"
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
  const [isEditing, setIsEditing] = useState(true)

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
      setIsEditing(false)
    } else {
      setForm(emptyForm)
      setIsEditing(true)
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
      title={task ? (isEditing ? "Edit Task" : "Task Details") : "Create Task"}
      description={task ? (isEditing ? "Capture the work, priority and ownership." : "View task assignment, priority, status and timeline.") : "Capture the work, priority and ownership."}
      footer={
        !isEditing ? (
          <div className="flex w-full justify-end">
            <Button variant="outline" onClick={onClose} type="button">
              Close
            </Button>
          </div>
        ) : (
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
        )
      }
    >
      {!isEditing && task ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end -mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 px-3 text-xs"
            >
              <Pencil className="size-3.5 mr-1.5" />
              Edit Task
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Task Name</span>
            <h3 className="text-base font-semibold text-foreground">{form.name}</h3>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Description</span>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
              {form.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Priority</span>
              <div className="mt-0.5">
                <PriorityBadge priority={form.priority} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</span>
              <div className="mt-0.5">
                <TaskStatusBadge status={form.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Project</span>
              <span className="text-sm font-medium text-foreground">{projects.find(p => String(p.id) === form.projectId)?.name || "Unknown Project"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Assignee</span>
              <span className="text-sm font-medium text-foreground">{allowedUsers.find(u => String(u.id) === form.assigneeId)?.fullName || "Unassigned"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Deadline</span>
              <span className="text-sm text-foreground">{form.deadline ? formatDate(form.deadline) : "No deadline"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Estimated Hours</span>
              <span className="text-sm text-foreground">{form.estimatedHours} hours</span>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </Modal>
  )
}
