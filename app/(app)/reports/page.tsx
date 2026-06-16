"use client"

import { TrendingUp, Clock, CheckCircle2, Target } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { DataTable, TableRow, TableCell } from "@/components/tables/data-table"
import {
  weeklyCompletion,
  projectProgress,
  taskStatusBreakdown,
  teamPerformance,
} from "@/data/dummyReports"
import { getUserById } from "@/data/dummyUsers"

export default function ReportsPage() {
  const totalCompleted = teamPerformance.reduce((s, r) => s + r.completed, 0)
  const totalHours = teamPerformance.reduce((s, r) => s + r.hoursLogged, 0)
  const avgProductivity = Math.round(
    teamPerformance.reduce((s, r) => s + r.productivity, 0) / teamPerformance.length,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Productivity, completion and team performance metrics." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tasks Completed" value={totalCompleted} icon={CheckCircle2} trend={11} accent="success" />
        <StatCard label="Hours Logged" value={totalHours} icon={Clock} trend={6} accent="primary" />
        <StatCard label="Avg Productivity" value={`${avgProductivity}%`} icon={TrendingUp} trend={4} accent="success" />
        <StatCard label="On-time Rate" value="87%" icon={Target} trend={-2} accent="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={weeklyCompletion} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={taskStatusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={projectProgress} unit="%" />
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Team Productivity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={[
              { label: "Member" },
              { label: "Completed" },
              { label: "In Progress" },
              { label: "Hours" },
              { label: "Productivity" },
            ]}
          >
            {teamPerformance.map((row) => {
              const member = getUserById(row.userId)
              return (
                <TableRow key={row.userId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={member?.name ?? "?"} size="sm" role={member?.role} />
                      <span className="text-sm font-medium">{member?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.completed}</TableCell>
                  <TableCell className="text-sm">{row.inProgress}</TableCell>
                  <TableCell className="text-sm">{row.hoursLogged}h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={row.productivity} className="w-24" />
                      <span className="text-sm font-medium">{row.productivity}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
