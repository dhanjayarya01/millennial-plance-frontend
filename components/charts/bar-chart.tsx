import type { SeriesPoint } from "@/types"

interface BarChartProps {
  data: SeriesPoint[]
  unit?: string
}

// Simple, dependency-free vertical bar chart.
export function BarChart({ data, unit }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex h-48 items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="group relative w-full rounded-t-md bg-primary/80 transition-all duration-500 hover:bg-primary"
              style={{ height: `${(d.value / max) * 100}%` }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[0.65rem] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                {d.value}
                {unit}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
