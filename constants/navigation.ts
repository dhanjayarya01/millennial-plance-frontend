import type { NavItem, Role } from "@/types"

// Role-based sidebar navigation. `icon` maps to a lucide icon key in the sidebar.
export const navigationByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
    { label: "Users", href: "/users", icon: "users" },
    { label: "Projects", href: "/projects", icon: "folder-kanban" },
    { label: "Tasks", href: "/tasks", icon: "list-checks" },
    { label: "Reports", href: "/reports", icon: "bar-chart-3" },
    { label: "Activity Logs", href: "/activity-logs", icon: "history" },
    { label: "Settings", href: "/settings", icon: "settings" },
  ],
  manager: [
    { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
    { label: "My Projects", href: "/projects", icon: "folder-kanban" },
    { label: "Team Tasks", href: "/tasks", icon: "list-checks" },
    { label: "Work Logs", href: "/work-logs", icon: "clipboard-list" },
    { label: "Reports", href: "/reports", icon: "bar-chart-3" },
    { label: "Settings", href: "/settings", icon: "settings" },
  ],
  employee: [
    { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
    { label: "My Tasks", href: "/tasks", icon: "list-checks" },
    { label: "Work Logs", href: "/work-logs", icon: "clipboard-list" },
    { label: "Notifications", href: "/notifications", icon: "bell" },
    { label: "Settings", href: "/settings", icon: "settings" },
  ],
}

export const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  manager: "Project Manager",
  employee: "Employee",
}
