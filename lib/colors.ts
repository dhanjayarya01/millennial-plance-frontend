import type { Role } from "@/types"

// Role-based colors. These are applied as a ring around a user's avatar so the
// person's role is identifiable at a glance anywhere in the app.
export const roleMeta: Record<Role, { label: string; color: string }> = {
  admin: { label: "Admin", color: "#e11d48" }, // rose
  manager: { label: "Manager", color: "#2563eb" }, // blue
  employee: { label: "Employee", color: "#16a34a" }, // green
}

export function roleColor(role: Role): string {
  return roleMeta[role].color
}

export const roleLegend = (Object.keys(roleMeta) as Role[]).map((role) => ({
  role,
  ...roleMeta[role],
}))

// Functional, data-driven palette used to distinguish projects at a glance.
// Activity items get an outer border in their project's color so a feed of
// mixed activity is easy to scan by project. Kept distinct from role colors.
const projectPalette = [
  "#0d9488", // teal
  "#d97706", // amber
  "#db2777", // pink
  "#0891b2", // cyan
  "#ea580c", // orange
  "#4f46e5", // indigo
  "#65a30d", // lime
  "#c026d3", // fuchsia
]

const projectColorCache = new Map<string, string>()

export function projectColor(projectId: string): string {
  const cached = projectColorCache.get(projectId)
  if (cached) return cached
  // Stable hash of the id so a project always maps to the same color.
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0
  }
  const color = projectPalette[hash % projectPalette.length]
  projectColorCache.set(projectId, color)
  return color
}
