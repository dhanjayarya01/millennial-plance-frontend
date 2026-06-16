import type { SeriesPoint } from "@/data/dummyReports"

interface LineChartProps {
  data: SeriesPoint[]
}

// Dependency-free SVG area/line chart.
export function LineChart({ data }: LineChartProps) {
  const width = 100
  const height = 40
  const max = Math.max(...data.map((d) => d.value), 1)
  const step = width / (data.length - 1 || 1)

  const points = data.map((d, i) => ({
    x: i * step,
    y: height - (d.value / max) * (height - 4) - 2,
  }))

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const area = `${line} L ${width} ${height} L 0 ${height} Z`

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Weekly completion trend"
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#area-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((d) => (
          <span key={d.label} className="text-xs text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
