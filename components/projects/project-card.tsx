"use client"

import Link from "next/link"
import { CalendarDays, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { ProjectStatusBadge } from "@/components/shared/status-badge"
import { Dropdown, DropdownItem } from "@/components/ui/dropdown"
import { formatDate } from "@/lib/format"
import type { Project, User } from "@/types"

interface ProjectCardProps {
  project: Project
  users: User[]
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, users, onEdit, onDelete }: ProjectCardProps) {
  const manager = users.find((u) => u.id === project.managerId)
  const members = project.memberIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[]

  return (
    <Card className="flex flex-col gap-4 p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        <Dropdown
          trigger={
            <span className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreVertical className="size-4" />
            </span>
          }
        >
          {(close) => (
            <>
              <DropdownItem
                onClick={() => {
                  close()
                  onEdit(project)
                }}
              >
                <Pencil />
                Edit
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close()
                  onDelete(project.id)
                }}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive [&_svg]:text-destructive"
              >
                <Trash2 />
                Delete
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>

      <Link href={`/projects/${project.id}`} className="group">
        <h3 className="font-heading font-semibold leading-tight text-balance transition-colors group-hover:text-primary">
          {project.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground text-pretty">{project.description}</p>
      </Link>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium text-foreground">{project.completion}%</span>
        </div>
        <Progress value={project.completion} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Avatar name={manager?.name ?? "?"} src={manager?.avatar} size="sm" role={manager?.role} title={manager ? `Manager: ${manager.name}` : undefined} />
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m) => (
              <Avatar key={m.id} name={m.name} src={m.avatar} size="sm" role={m.role} className="ring-2 ring-card" />
            ))}
            {members.length > 3 && (
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[0.65rem] font-medium text-muted-foreground ring-2 ring-card">
                +{members.length - 3}
              </span>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatDate(project.endDate)}
        </span>
      </div>
    </Card>
  )
}
