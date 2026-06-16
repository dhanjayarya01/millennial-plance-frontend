"use client"

import { useMemo, useState } from "react"
import { Search, Users as UsersIcon, Plus, Mail } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { DataTable, TableRow, TableCell } from "@/components/tables/data-table"
import { dummyUsers } from "@/data/dummyUsers"
import { roleLabels } from "@/constants/navigation"
import type { Role } from "@/types"

const statusVariant = {
  active: "success",
  invited: "warning",
  suspended: "destructive",
} as const

export default function UsersPage() {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<Role | "all">("all")

  const filtered = useMemo(() => {
    return dummyUsers.filter((u) => {
      const matchesQuery =
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      const matchesRole = role === "all" || u.role === role
      return matchesQuery && matchesRole
    })
  }, [query, role])

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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value as Role | "all")} className="sm:w-44">
          <option value="all">All roles</option>
          <option value="admin">Administrator</option>
          <option value="manager">Project Manager</option>
          <option value="employee">Employee</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Try a different search or filter." />
      ) : (
        <DataTable
          headers={[
            { label: "Name" },
            { label: "Role" },
            { label: "Department" },
            { label: "Status" },
            { label: "", className: "w-12" },
          ]}
        >
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} role={u.role} />
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={u.role === "admin" ? "default" : "neutral"}>{roleLabels[u.role]}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.department}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[u.status]} className="capitalize">
                  {u.status}
                </Badge>
              </TableCell>
              <TableCell>
                <a
                  href={`mailto:${u.email}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Email ${u.name}`}
                >
                  <Mail className="size-4" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </div>
  )
}
