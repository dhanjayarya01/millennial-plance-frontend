import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
  accent?: "primary" | "success" | "warning" | "destructive"
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-[var(--success)]/12 text-[var(--success)]",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
  destructive: "bg-destructive/12 text-destructive",
}

export function StatCard({ label, value, icon: Icon, trend, accent = "primary" }: StatCardProps) {
  const positive = (trend ?? 0) >= 0
  return (
    <Card className="p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", accentMap[accent])}>
          <Icon className="size-5" />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              positive ? "text-[var(--success)]" : "text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-heading text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  )
}
