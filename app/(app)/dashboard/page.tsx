"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { PageHeader } from "@/components/layout/page-header"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard"
import { roleLabels } from "@/constants/navigation"

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        description={`Here's what's happening across your workspace as ${roleLabels[user.role]}.`}
      />
      {user.role === "admin" && <AdminDashboard />}
      {user.role === "manager" && <ManagerDashboard user={user} />}
      {user.role === "employee" && <EmployeeDashboard user={user} />}
    </div>
  )
}
