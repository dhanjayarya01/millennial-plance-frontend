// Aggregated mock metrics used across dashboards, reports and charts.

export interface SeriesPoint {
  label: string
  value: number
}

export interface TeamPerformanceRow {
  userId: string
  completed: number
  inProgress: number
  productivity: number // percentage 0-100
  hoursLogged: number
}

export const taskStatusBreakdown: SeriesPoint[] = [
  { label: "To Do", value: 4 },
  { label: "In Progress", value: 5 },
  { label: "Review", value: 2 },
  { label: "Done", value: 3 },
]

export const weeklyCompletion: SeriesPoint[] = [
  { label: "Mon", value: 6 },
  { label: "Tue", value: 9 },
  { label: "Wed", value: 5 },
  { label: "Thu", value: 12 },
  { label: "Fri", value: 8 },
  { label: "Sat", value: 3 },
  { label: "Sun", value: 2 },
]

export const projectProgress: SeriesPoint[] = [
  { label: "Atlas Web", value: 64 },
  { label: "Mobile v2", value: 38 },
  { label: "Design Sys", value: 12 },
  { label: "Warehouse", value: 45 },
  { label: "Support", value: 27 },
]

export const teamPerformance: TeamPerformanceRow[] = [
  { userId: "u-3", completed: 18, inProgress: 3, productivity: 92, hoursLogged: 142 },
  { userId: "u-5", completed: 14, inProgress: 2, productivity: 81, hoursLogged: 128 },
  { userId: "u-6", completed: 21, inProgress: 1, productivity: 95, hoursLogged: 156 },
  { userId: "u-8", completed: 11, inProgress: 4, productivity: 74, hoursLogged: 118 },
  { userId: "u-7", completed: 6, inProgress: 2, productivity: 63, hoursLogged: 64 },
]
