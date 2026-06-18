"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { Search, Users as UsersIcon, Plus, Mail, Trash2, Bell } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { DataTable, TableRow, TableCell } from "@/components/tables/data-table"
import { roleLabels } from "@/constants/navigation"
import type { Role, User } from "@/types"
import { api, BackendUser, BackendProject } from "@/lib/api"
import { useAuth } from "@/components/providers/auth-provider"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const statusVariant = {
  active: "success",
  invited: "warning",
  suspended: "destructive",
} as const

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<Role | "all">("all")
  const [allProjects, setAllProjects] = useState<BackendProject[]>([])

  const [visibleCount, setVisibleCount] = useState(10)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchTerm)
    }, 450)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    setVisibleCount(10)
  }, [query, role])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
      setVisibleCount((prev) => prev + 10)
    }
  }

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [sseModalOpen, setSseModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  const [sseTitle, setSseTitle] = useState("")
  const [sseDesc, setSseDesc] = useState("")
  const [sseUrgency, setSseUrgency] = useState<"green" | "yellow" | "red">("green")

  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          api.getUsers(),
          api.getProjects()
        ])

        if (projectsRes.success) {
          setAllProjects(projectsRes.data)
        }

        if (usersRes.success && usersRes.data) {
          const mapped = usersRes.data.map((u: BackendUser) => {
            const mapRole = (r: string): Role => {
              if (r === "ROLE_ADMIN") return "admin"
              if (r === "ROLE_PROJECT_MANAGER") return "manager"
              return "employee"
            }
            return {
              id: String(u.id),
              name: u.fullName,
              email: u.email,
              password: "",
              role: mapRole(u.role),
              avatar: u.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
              jobTitle: u.role === "ROLE_ADMIN" ? "Administrator" : u.role === "ROLE_PROJECT_MANAGER" ? "Project Manager" : "Software Engineer",
              department: "Engineering",
              status: u.active ? ("active" as const) : ("suspended" as const),
              verified: u.verified,
            }
          })
          setUsers(mapped)
        } else {
          setError(usersRes.message || "Failed to load users.")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const renderUserProjectStatus = (uId: string, uRole: string) => {
    if (uRole !== "employee" && uRole !== "manager") return null

    const assigned = uRole === "employee"
      ? allProjects.filter((p) => p.assignedEmployees?.some((e) => String(e.id) === uId))
      : allProjects.filter((p) => p.manager && String(p.manager.id) === uId)

    if (assigned.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 border border-rose-500/20 ml-2">
          Ideal
        </span>
      )
    }

    const p = assigned[0]
    const rawName = p.name
    const truncatedName = rawName.length > 15 ? rawName.slice(0, 15) + "..." : rawName
    const teamSize = (p.assignedEmployees?.length || 0) + (p.manager ? 1 : 0)
    const managerName = p.manager ? p.manager.fullName : "Unassigned"

    return (
      <div className="relative group inline-block ml-2 select-none">
        <span className="cursor-help inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
          @{truncatedName}
        </span>
        <div className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-2 w-56 -translate-x-1/2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all origin-bottom rounded-lg border border-border bg-popover p-2.5 text-popover-foreground shadow-lg text-[11px] leading-relaxed">
          <div className="font-semibold text-foreground border-b border-border/60 pb-1 mb-1">{rawName}</div>
          <div>
            <span className="text-muted-foreground">Manager: </span>
            <span className="text-foreground font-medium">{managerName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Team Size: </span>
            <span className="text-foreground font-medium">{teamSize} members</span>
          </div>
          <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-popover border-r border-b border-border rotate-45" />
        </div>
      </div>
    )
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      const matchesRole = role === "all" || u.role === role
      return matchesQuery && matchesRole
    })
  }, [users, query, role])

  async function handleRoleChange(userId: string, newRole: Role) {
    try {
      const dbRoleMap = {
        admin: "ROLE_ADMIN",
        manager: "ROLE_PROJECT_MANAGER",
        employee: "ROLE_EMPLOYEE",
      }
      const res = await api.updateUserRole(userId, dbRoleMap[newRole])
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      }
    } catch (err: any) {
      alert(err.message || "Failed to update user role.")
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      const res = await api.deleteUser(userId)
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete user.")
    }
  }

  async function handleVerifyUser(userId: string) {
    try {
      const res = await api.verifyUser(userId)
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, verified: true } : u))
        )
        alert("User successfully verified!")
      }
    } catch (err: any) {
      alert(err.message || "Failed to verify user.")
    }
  }

  async function handleSendSse(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setSubmitting(true)
    try {
      await api.sendCustomSse(selectedUser.id, {
        title: sseTitle,
        description: `From ${currentUser?.name || "Administrator"}: ${sseDesc}`,
        urgency: sseUrgency
      })
      setSseTitle("")
      setSseDesc("")
      setSseUrgency("green")
      setSseModalOpen(false)
      setSelectedUser(null)
      alert("SSE notification broadcasted successfully!")
    } catch (err: any) {
      alert("Failed to send SSE notification.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await api.sendCustomEmail(selectedUser.id, {
        subject: emailSubject,
        body: emailBody
      })
      if (res.success) {
        setEmailSubject("")
        setEmailBody("")
        setEmailModalOpen(false)
        setSelectedUser(null)
        alert(`Email successfully dispatched to ${selectedUser.email}!`)
      } else {
        alert("Failed to send email.")
      }
    } catch (err: any) {
      alert("Error sending email.")
    } finally {
      setSubmitting(false)
    }
  }

  const isAdmin = currentUser?.role === "admin"
  const isManager = currentUser?.role === "manager"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage team members, roles and access across the workspace."
        actions={
          <Button>
            <Plus />
            Invite User
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value as Role | "all")} className="sm:w-44">
          <option value="all">All roles</option>
          <option value="admin">Administrator</option>
          <option value="manager">Project Manager</option>
          <option value="employee">Employee</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try a different search or filter." />
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="max-h-[600px] overflow-y-auto pr-1"
        >
          <DataTable
            headers={[
              { label: "Name" },
              { label: "Role" },
              { label: "Department" },
              { label: "Status" },
              { label: "Actions", className: "w-24 text-right" },
            ]}
          >
            {filtered.slice(0, visibleCount).map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatar} role={u.role} />
                    <div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>{u.name}</span>
                        {renderUserProjectStatus(u.id, u.role)}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="admin">Administrator</option>
                      <option value="manager">Project Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  ) : (
                    <Badge variant={u.role === "admin" ? "default" : "neutral"}>{roleLabels[u.role]}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.department}</TableCell>
                <TableCell>
                  {!u.verified ? (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyUser(u.id)}
                      className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                    >
                      Verify
                    </Button>
                  ) : (
                    <Badge variant={statusVariant[u.status]} className="capitalize">
                      {u.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u)
                        setEmailSubject("")
                        setEmailBody("")
                        setEmailModalOpen(true)
                      }}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Email ${u.name}`}
                    >
                      <Mail className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u)
                        setSseTitle("")
                        setSseDesc("")
                        setSseUrgency("green")
                        setSseModalOpen(true)
                      }}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Notify ${u.name}`}
                    >
                      <Bell className="size-4" />
                    </button>
                    {(isAdmin || isManager) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
          {visibleCount < filtered.length && (
            <div className="flex justify-center py-4">
              <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}
        </div>
      )}

      <Modal
        open={sseModalOpen}
        onClose={() => setSseModalOpen(false)}
        title="Send SSE Notification"
        description={selectedUser ? `Send a real-time notification to ${selectedUser.name}` : ""}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSseModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSendSse} disabled={submitting || !sseTitle || !sseDesc}>
              {submitting ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendSse} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sse-title">Title</Label>
            <Input id="sse-title" value={sseTitle} onChange={(e) => setSseTitle(e.target.value)} placeholder="Notification title..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sse-desc">Description</Label>
            <Textarea id="sse-desc" value={sseDesc} onChange={(e) => setSseDesc(e.target.value)} placeholder="Message content..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sse-urgency">Urgency Level</Label>
            <Select id="sse-urgency" value={sseUrgency} onChange={(e) => setSseUrgency(e.target.value as any)}>
              <option value="green">Green (Low / Info)</option>
              <option value="yellow">Yellow (Medium / Warning)</option>
              <option value="red">Red (High / Urgent)</option>
            </Select>
          </div>
        </form>
      </Modal>

      <Modal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Compose Email"
        description={selectedUser ? `Send a direct email to ${selectedUser.name} (${selectedUser.email})` : ""}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEmailModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={submitting || !emailSubject || !emailBody}>
              {submitting ? "Sending..." : "Send Email"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-to">Recipient</Label>
            <Input id="email-to" value={selectedUser?.email || ""} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject line..." required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-body">Body Message</Label>
            <Textarea id="email-body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email content..." required />
          </div>
        </form>
      </Modal>
    </div>
  )
}

