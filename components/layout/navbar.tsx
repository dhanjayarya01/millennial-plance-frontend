"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, Search, Moon, Sun, Settings, LogOut, User as UserIcon, Folder, CheckSquare } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useTheme } from "@/components/providers/theme-provider"
import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from "@/components/ui/dropdown"
import { Avatar } from "@/components/ui/avatar"
import { roleLabels } from "@/constants/navigation"
import api, { type BackendProject, type BackendTask, type BackendUser } from "@/lib/api"

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<BackendProject[]>([])
  const [tasks, setTasks] = useState<BackendTask[]>([])
  const [users, setUsers] = useState<BackendUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return
        }
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleFocus = async () => {
    setIsOpen(true)
    if (hasLoaded || isLoading) return
    setIsLoading(true)
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getUsers()
      ])
      if (projectsRes.success) setProjects(projectsRes.data)
      if (tasksRes.success) setTasks(tasksRes.data)
      if (usersRes.success) setUsers(usersRes.data)
      setHasLoaded(true)
    } catch (err) {
      console.error("Error loading search data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = useMemo(() => {
    if (searchQuery.trim().length < 2) return []
    const q = searchQuery.toLowerCase()
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    )
  }, [projects, searchQuery])

  const filteredTasks = useMemo(() => {
    if (searchQuery.trim().length < 2) return []
    const q = searchQuery.toLowerCase()
    return tasks.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    )
  }, [tasks, searchQuery])

  const filteredUsers = useMemo(() => {
    if (searchQuery.trim().length < 2) return []
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  const handleItemClick = (href: string) => {
    setSearchQuery("")
    setIsOpen(false)
    router.push(href)
  }

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  if (!user) return null

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

      <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          name="globalSearch"
          aria-label="Search all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search projects, tasks, people... (Press '/' to focus)"
          className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30"
        />
        {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-1.5 w-full h-80 flex flex-col rounded-lg border border-border bg-popover p-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
            {isLoading && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Loading search catalog...
              </div>
            )}
            {!isLoading && searchQuery.trim().length < 2 && (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Type at least 2 characters to search...
              </div>
            )}
            {!isLoading && searchQuery.trim().length >= 2 && 
             filteredProjects.length === 0 && 
             filteredTasks.length === 0 && 
             filteredUsers.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
                No matches found for <span className="font-semibold text-foreground ml-1">"{searchQuery}"</span>
              </div>
            )}
            
            {!isLoading && searchQuery.trim().length >= 2 && (
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {filteredProjects.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Projects ({filteredProjects.length})
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {filteredProjects.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => handleItemClick(`/projects/${p.id}`)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <Folder className="size-4 text-primary/80 shrink-0" />
                            <span className="truncate font-medium">{p.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {filteredTasks.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-border/40 mt-1 pt-1.5">
                      Tasks ({filteredTasks.length})
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {filteredTasks.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => handleItemClick(`/tasks/${t.id}`)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <CheckSquare className="size-4 text-primary/80 shrink-0" />
                            <span className="truncate font-medium">{t.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground capitalize">
                              {t.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {filteredUsers.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-border/40 mt-1 pt-1.5">
                      People ({filteredUsers.length})
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {filteredUsers.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => handleItemClick(`/users`)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <UserIcon className="size-4 text-primary/80 shrink-0" />
                            <span className="truncate font-medium">{u.fullName}</span>
                            <span className="truncate text-xs text-muted-foreground ml-auto">
                              {u.role}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
