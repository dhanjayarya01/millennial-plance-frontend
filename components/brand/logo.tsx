import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showName?: boolean
}

export function Logo({ className, showName = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Layers className="size-4.5" />
      </div>
      {showName && (
        <span className="font-heading text-lg font-semibold tracking-tight">Plance</span>
      )}
    </div>
  )
}
