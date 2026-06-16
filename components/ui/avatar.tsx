import type * as React from "react"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"
import { roleColor } from "@/lib/colors"
import type { Role } from "@/types"

interface AvatarProps extends React.ComponentProps<"div"> {
  name: string
  size?: "sm" | "md" | "lg"
  // When provided, draws a ring around the avatar in the role's color so a
  // person's role is recognizable anywhere it appears.
  role?: Role
}

const sizeMap = {
  sm: "size-7 text-[0.65rem]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
}

// Avatars render colored initials; the design avoids external avatar images.
function Avatar({ name, size = "md", role, className, style, ...props }: AvatarProps) {
  const ringStyle = role
    ? { boxShadow: `0 0 0 2px var(--card), 0 0 0 3.5px ${roleColor(role)}` }
    : undefined

  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/12 font-semibold text-primary select-none",
        sizeMap[size],
        className,
      )}
      style={{ ...ringStyle, ...style }}
      {...props}
    >
      {initials(name)}
    </div>
  )
}

export { Avatar }
