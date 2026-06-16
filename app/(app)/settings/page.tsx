"use client"

import { useState } from "react"
import { User as UserIcon, Palette, Lock, Bell, Sun, Moon, Check } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useTheme } from "@/components/providers/theme-provider"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar } from "@/components/ui/avatar"
import { roleLabels } from "@/constants/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "password", label: "Password", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
] as const

type TabKey = (typeof tabs)[number]["key"]

const prefs = [
  { key: "deadlines", label: "Deadline reminders", description: "Get notified before tasks are due." },
  { key: "assignments", label: "Task assignments", description: "When you're assigned to a new task." },
  { key: "mentions", label: "Mentions", description: "When someone mentions you in a work log." },
  { key: "reports", label: "Weekly reports", description: "A summary of your team's productivity." },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [tab, setTab] = useState<TabKey>("profile")
  const [saved, setSaved] = useState(false)
  const [enabledPrefs, setEnabledPrefs] = useState<Record<string, boolean>>({
    deadlines: true,
    assignments: true,
    mentions: true,
    reports: false,
  })

  if (!user) return null

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your profile, appearance and preferences." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.key ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col gap-6">
          {tab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <Avatar name={user.name} size="lg" role={user.role} />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[user.role]}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="s-name">Full name</Label>
                    <Input id="s-name" defaultValue={user.name} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="s-email">Email</Label>
                    <Input id="s-email" type="email" defaultValue={user.email} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="s-title">Job title</Label>
                    <Input id="s-title" defaultValue={user.jobTitle} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="s-dept">Department</Label>
                    <Input id="s-dept" defaultValue={user.department} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={save}>{saved ? <Check className="size-4" /> : null}{saved ? "Saved" : "Save changes"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the workspace looks.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => theme === "dark" && toggleTheme()}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                      theme === "light" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Sun className="size-5" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => theme === "light" && toggleTheme()}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                      theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Moon className="size-5" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "password" && (
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Use a strong, unique password.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cur-pass">Current password</Label>
                  <Input id="cur-pass" type="password" placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-pass">New password</Label>
                  <Input id="new-pass" type="password" placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="conf-pass">Confirm new password</Label>
                  <Input id="conf-pass" type="password" placeholder="••••••••" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={save}>{saved ? "Updated" : "Update password"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what you want to be notified about.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {prefs.map((p) => {
                  const on = enabledPrefs[p.key]
                  return (
                    <div key={p.key} className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-sm text-muted-foreground text-pretty">{p.description}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        onClick={() => setEnabledPrefs((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                        className={cn(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                          on ? "bg-primary" : "bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform",
                            on ? "translate-x-5" : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
