"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { dummyUsers } from "@/data/dummyUsers"
import { dummyProjects } from "@/data/dummyProjects"
import type { Task, TaskPriority, TaskStatus } from "@/types"

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Task) => void
  task?: Task | null
}

const emptyForm = {
  name: "",
  description: "",
  priority: "medium" as TaskPriority,
  status: "todo" as TaskStatus,
  deadline: "",
  projectId: "p-1",
  assigneeId: "u-3",
  estimatedHours: 8,
}

export function TaskFormModal({ open, onClose, onSave, task }: TaskFormModalProps) {
  const [form, setForm] = useState(emptyForm)

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      id: task?.id ?? `t-${Date.now()}`,
      ...form,
      estimatedHours: Number(form.estimatedHours),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit Task" : "Create Task"}
      description="Capture the work, priority and ownership."
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="task-form">
            {task ? "Save changes" : "Create task"}
          </Button>
        </>
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
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              {dummyProjects.map((p) => (
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
              {dummyUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
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
