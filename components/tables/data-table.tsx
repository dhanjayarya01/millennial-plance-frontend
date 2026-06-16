import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DataTableProps {
  headers: { label: string; className?: string }[]
  children: ReactNode
  className?: string
}

// Responsive table shell with sticky header styling. Rows are passed as children.
export function DataTable({ headers, children, className }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {headers.map((h) => (
              <th
                key={h.label}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                  h.className,
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-muted/30", className)}>{children}</tr>
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>
}
