"use client"

import { useRef, useState, type ReactNode } from "react"
import { useClickOutside } from "@/hooks/use-click-outside"
import { cn } from "@/lib/utils"

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: "start" | "end"
  className?: string
  contentClassName?: string
}

// Minimal, accessible-enough dropdown built without extra dependencies.
export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
  contentClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)
  const close = () => setOpen(false)

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center outline-none"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-48 origin-top rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-fade-in",
            align === "end" ? "right-0" : "left-0",
            contentClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        "[&_svg]:size-4 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{children}</div>
}
