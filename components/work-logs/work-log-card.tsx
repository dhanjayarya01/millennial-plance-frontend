"use client"

import { useState } from "react"
import { Paperclip, Clock, CornerDownRight, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUserById } from "@/data/dummyUsers"
import { getProjectById } from "@/data/dummyProjects"
import { dummyTasks } from "@/data/dummyTasks"
import { timeAgo } from "@/lib/format"
import type { WorkLog, WorkLogReply, User, Task, Project } from "@/types"

export function WorkLogCard({
  log,
  currentUserId,
  onReply,
  users = [],
  tasks = [],
  projects = [],
}: {
  log: WorkLog
  currentUserId: string
  onReply: (logId: string, reply: WorkLogReply) => void
  users?: User[]
  tasks?: Task[]
  projects?: Project[]
}) {
  const author = users.find((u) => String(u.id) === String(log.authorId)) || getUserById(log.authorId)
  const task = tasks.find((t) => String(t.id) === String(log.taskId)) || dummyTasks.find((t) => t.id === log.taskId)
  const project = task ? (projects.find((p) => String(p.id) === String(task.projectId)) || getProjectById(task.projectId)) : undefined
  const [draft, setDraft] = useState("")

  function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    onReply(log.id, {
      id: `wr-${Date.now()}`,
      authorId: currentUserId,
      message: draft.trim(),
      timestamp: new Date().toISOString(),
    })
    setDraft("")
  }

  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <Avatar name={author?.name ?? "?"} src={author?.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{author?.name}</span>
            <span className="text-xs text-muted-foreground">logged work on</span>
            <span className="text-sm font-medium">{task?.name ?? "Task"}</span>
            <span className="text-xs text-muted-foreground">· {timeAgo(log.timestamp)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {project && <Badge variant="neutral">{project.name}</Badge>}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {log.hours}h logged
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-pretty">{log.message}</p>

          {log.attachments && log.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {log.attachments.map((file) => {
                const isImage = file.match(/\.(jpeg|jpg|gif|png|webp)/i) || file.includes("image/upload");
                return (
                  <a
                    key={file}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-2 text-xs hover:bg-muted/70 transition-colors"
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
          )}

          {log.replies && log.replies.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3 border-l-2 border-border pl-4">
              {log.replies.map((reply) => {
                const replyAuthor = users.find((u) => String(u.id) === String(reply.authorId)) || getUserById(reply.authorId)
                return (
                  <li key={reply.id} className="flex gap-2.5">
                    <Avatar name={replyAuthor?.name ?? "?"} src={replyAuthor?.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{replyAuthor?.name}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(reply.timestamp)}</span>
                      </div>
                      <p className="text-sm leading-snug text-pretty">{reply.message}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <form onSubmit={submitReply} className="mt-4 flex items-center gap-2">
            <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply..."
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <Send className="size-3.5" />
              Reply
            </Button>
          </form>
        </div>
      </div>
    </Card>
  )
}
