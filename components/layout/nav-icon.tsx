import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListChecks,
  BarChart3,
  History,
  Settings,
  ClipboardList,
  Bell,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "folder-kanban": FolderKanban,
  "list-checks": ListChecks,
  "bar-chart-3": BarChart3,
  history: History,
  settings: Settings,
  "clipboard-list": ClipboardList,
  bell: Bell,
}

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? LayoutDashboard
  return <Icon className={className} />
}
