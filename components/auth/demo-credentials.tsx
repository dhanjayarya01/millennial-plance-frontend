"use client"

import { Shield, UserCog, User } from "lucide-react"
import { cn } from "@/lib/utils"

const demos = [
  { role: "Admin", email: "admin@millennial.com", password: "Wwewwe12@", icon: Shield },
  { role: "Manager", email: "manager@test.com", password: "Wwewwe12@", icon: UserCog },
  { role: "Employee", email: "employee@test.com", password: "Wwewwe12@", icon: User },
]

interface DemoCredentialsProps {
  onPick: (email: string, password: string) => void
}

export function DemoCredentials({ onPick }: DemoCredentialsProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Demo accounts — click to autofill</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {demos.map((d) => {
          const Icon = d.icon
          return (
            <button
              key={d.role}
              type="button"
              onClick={() => onPick(d.email, d.password)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left transition-all",
                "hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="size-3.5 text-primary" />
                {d.role}
              </span>
              <span className="truncate text-xs text-muted-foreground">{d.email}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
