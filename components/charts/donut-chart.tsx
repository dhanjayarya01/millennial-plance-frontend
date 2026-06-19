import type { SeriesPoint } from "@/types"

interface DonutChartProps {
  data: SeriesPoint[]
}

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
]

// Dependency-free donut chart using stacked conic gradient segments.
export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  let cursor = 0
  const stops = data
    .map((d, i) => {
      const start = (cursor / total) * 100
      cursor += d.value
      const end = (cursor / total) * 100
      return `${colors[i % colors.length]} ${start}% ${end}%`
    })
    .join(", ")

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <div
        className="relative size-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-card">
          <span className="font-heading text-xl font-semibold">{total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
