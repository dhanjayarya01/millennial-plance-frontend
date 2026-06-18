"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, Search, Moon, Sun, Settings, LogOut, User as UserIcon } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useTheme } from "@/components/providers/theme-provider"
import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from "@/components/ui/dropdown"
import { Avatar } from "@/components/ui/avatar"
import { roleLabels } from "@/constants/navigation"

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  if (!user) return null

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search projects, tasks, people..."
          className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <NotificationsMenu />

        <Dropdown
          className="ml-1"
          trigger={
            <span className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{roleLabels[user.role]}</span>
              </span>
            </span>
          }
        >
          {(close) => (
            <>
              <DropdownLabel>{user.email}</DropdownLabel>
              <DropdownSeparator />
              <Link href="/settings" onClick={close}>
                <DropdownItem>
                  <UserIcon />
                  Profile
                </DropdownItem>
              </Link>
              <Link href="/settings" onClick={close}>
                <DropdownItem>
                  <Settings />
                  Settings
                </DropdownItem>
              </Link>
              <DropdownSeparator />
              <DropdownItem
                onClick={() => {
                  close()
                  handleLogout()
                }}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive [&_svg]:text-destructive"
              >
                <LogOut />
                Sign out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  )
}
