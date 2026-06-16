import type { Project } from "@/types"

export const dummyProjects: Project[] = [
  {
    id: "p-1",
    name: "Atlas Web Platform",
    description: "Rebuild the customer-facing web platform with a new design system.",
    startDate: "2025-01-06",
    endDate: "2025-06-30",
    status: "in-progress",
    managerId: "u-2",
    memberIds: ["u-3", "u-5", "u-6"],
    completion: 64,
  },
  {
    id: "p-2",
    name: "Mobile App v2",
    description: "Native iOS and Android release with offline-first architecture.",
    startDate: "2025-02-01",
    endDate: "2025-08-15",
    status: "in-progress",
    managerId: "u-4",
    memberIds: ["u-3", "u-8"],
    completion: 38,
  },
  {
    id: "p-3",
    name: "Billing Migration",
    description: "Migrate billing to a new provider with zero downtime.",
    startDate: "2024-11-10",
    endDate: "2025-03-01",
    status: "completed",
    managerId: "u-2",
    memberIds: ["u-5", "u-8"],
    completion: 100,
  },
  {
    id: "p-4",
    name: "Design System 3.0",
    description: "Unify product surfaces under a single component library.",
    startDate: "2025-03-01",
    endDate: "2025-09-01",
    status: "planning",
    managerId: "u-4",
    memberIds: ["u-6", "u-3"],
    completion: 12,
  },
  {
    id: "p-5",
    name: "Data Warehouse",
    description: "Centralize analytics pipelines into a unified warehouse.",
    startDate: "2025-01-20",
    endDate: "2025-05-30",
    status: "on-hold",
    managerId: "u-2",
    memberIds: ["u-8", "u-5"],
    completion: 45,
  },
  {
    id: "p-6",
    name: "Support Portal",
    description: "Self-service help center with AI-assisted search.",
    startDate: "2025-04-01",
    endDate: "2025-10-01",
    status: "in-progress",
    managerId: "u-4",
    memberIds: ["u-6", "u-7", "u-3"],
    completion: 27,
  },
]

export function getProjectById(id: string): Project | undefined {
  return dummyProjects.find((p) => p.id === id)
}
