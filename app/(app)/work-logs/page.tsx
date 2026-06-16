"use client"

import { useState } from "react"
import { Plus, ClipboardList, Send, Paperclip } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/shared/empty-state"
import { WorkLogCard } from "@/components/work-logs/work-log-card"
import { dummyWorkLogs } from "@/data/dummyLogs"
import { dummyTasks } from "@/data/dummyTasks"
import type { WorkLog, WorkLogReply } from "@/types"

export default function WorkLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkLog[]>(dummyWorkLogs)
  const [taskId, setTaskId] = useState(dummyTasks[0]?.id ?? "")
  const [hours, setHours] = useState(1)
  const [message, setMessage] = useState("")

  if (!user) return null

  function addReply(logId: string, reply: WorkLogReply) {
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, replies: [...l.replies, reply] } : l)))
  }

  function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    const newLog: WorkLog = {
      id: `w-${Date.now()}`,
      authorId: user!.id,
      taskId,
      message: message.trim(),
      hours: Number(hours),
      timestamp: new Date().toISOString(),
      attachments: [],
      replies: [],
    }
    setLogs((prev) => [newLog, ...prev])
    setMessage("")
    setHours(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Work Logs" description="Share progress updates, log hours and discuss work in threads." />

      <Card className="p-5">
        <form onSubmit={addLog} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="w-task">Task</Label>
              <Select id="w-task" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                {dummyTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="w-hours">Hours worked</Label>
              <Input
                id="w-hours"
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="w-message">Update</Label>
            <Textarea
              id="w-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm">
              <Paperclip className="size-3.5" />
              Attach file
            </Button>
            <Button type="submit" disabled={!message.trim()}>
              <Send className="size-4" />
              Post update
            </Button>
          </div>
        </form>
      </Card>

      {logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No work logs yet" description="Post your first update to start the thread." />
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <WorkLogCard key={log.id} log={log} currentUserId={user.id} onReply={addReply} />
          ))}
        </div>
      )}
    </div>
  )
}
