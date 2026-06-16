import type { ActivityLog, WorkLog } from "@/types"

export const dummyWorkLogs: WorkLog[] = [
  {
    id: "w-1",
    authorId: "u-3",
    taskId: "t-1",
    message:
      "Wired up the session context and added route guards. Login redirect now respects the user role.",
    hours: 4,
    timestamp: "2025-06-13T09:30:00Z",
    attachments: ["auth-flow.pdf"],
    replies: [
      {
        id: "wr-1",
        authorId: "u-2",
        message: "Nice progress. Can you add a loading state on the login button?",
        timestamp: "2025-06-13T10:05:00Z",
      },
      {
        id: "wr-2",
        authorId: "u-3",
        message: "Done, pushed the change.",
        timestamp: "2025-06-13T10:40:00Z",
      },
    ],
  },
  {
    id: "w-2",
    authorId: "u-6",
    taskId: "t-2",
    message: "Finished the stat card and progress bar components. Ready for review.",
    hours: 3,
    timestamp: "2025-06-13T13:15:00Z",
    attachments: ["widgets-preview.png"],
    replies: [],
  },
  {
    id: "w-3",
    authorId: "u-8",
    taskId: "t-7",
    message: "ETL job for the orders table is running. Validating row counts next.",
    hours: 5,
    timestamp: "2025-06-12T16:45:00Z",
    attachments: [],
    replies: [
      {
        id: "wr-3",
        authorId: "u-2",
        message: "Great, ping me when validation is complete.",
        timestamp: "2025-06-12T17:20:00Z",
      },
    ],
  },
  {
    id: "w-4",
    authorId: "u-3",
    taskId: "t-4",
    message: "Implemented the conflict resolution strategy for offline edits.",
    hours: 6,
    timestamp: "2025-06-11T11:00:00Z",
    attachments: ["sync-diagram.png"],
    replies: [],
  },
]

export function getWorkLogsByTask(taskId: string): WorkLog[] {
  return dummyWorkLogs.filter((w) => w.taskId === taskId)
}

export const dummyActivityLogs: ActivityLog[] = [
  // --- Atlas Web Platform (p-1) ---
  {
    id: "a-1",
    userId: "u-2",
    action: "updated completion on",
    entity: "Project",
    entityName: "Atlas Web Platform",
    timestamp: "2025-06-14T08:12:00Z",
    oldValue: "55%",
    newValue: "64%",
    projectId: "p-1",
  },
  {
    id: "a-2",
    userId: "u-2",
    action: "assigned",
    entity: "Task",
    entityName: "Set up CI pipeline",
    timestamp: "2025-06-14T08:02:00Z",
    oldValue: "—",
    newValue: "Marcus Lee",
    projectId: "p-1",
  },
  {
    id: "a-3",
    userId: "u-3",
    action: "changed status on",
    entity: "Task",
    entityName: "Build authentication flow",
    timestamp: "2025-06-14T07:50:00Z",
    oldValue: "todo",
    newValue: "in-progress",
    projectId: "p-1",
  },
  {
    id: "a-4",
    userId: "u-6",
    action: "moved to review",
    entity: "Task",
    entityName: "Design dashboard widgets",
    timestamp: "2025-06-13T16:20:00Z",
    oldValue: "in-progress",
    newValue: "review",
    projectId: "p-1",
  },
  {
    id: "a-5",
    userId: "u-5",
    action: "logged 8h on",
    entity: "Task",
    entityName: "Set up CI pipeline",
    timestamp: "2025-06-13T11:05:00Z",
    oldValue: "0h",
    newValue: "8h",
    projectId: "p-1",
  },

  // --- Mobile App v2 (p-2) ---
  {
    id: "a-6",
    userId: "u-4",
    action: "updated completion on",
    entity: "Project",
    entityName: "Mobile App v2",
    timestamp: "2025-06-14T06:30:00Z",
    oldValue: "32%",
    newValue: "38%",
    projectId: "p-2",
  },
  {
    id: "a-7",
    userId: "u-3",
    action: "changed status on",
    entity: "Task",
    entityName: "Offline sync engine",
    timestamp: "2025-06-13T13:45:00Z",
    oldValue: "todo",
    newValue: "in-progress",
    projectId: "p-2",
  },
  {
    id: "a-8",
    userId: "u-8",
    action: "completed",
    entity: "Task",
    entityName: "Analytics event schema",
    timestamp: "2025-06-13T12:05:00Z",
    oldValue: "review",
    newValue: "done",
    projectId: "p-2",
  },

  // --- Design System 3.0 (p-4) ---
  {
    id: "a-9",
    userId: "u-4",
    action: "created",
    entity: "Project",
    entityName: "Design System 3.0",
    timestamp: "2025-06-13T15:10:00Z",
    oldValue: "—",
    newValue: "planning",
    projectId: "p-4",
  },
  {
    id: "a-10",
    userId: "u-6",
    action: "changed status on",
    entity: "Task",
    entityName: "Empty state illustrations",
    timestamp: "2025-06-13T14:00:00Z",
    oldValue: "todo",
    newValue: "in-progress",
    projectId: "p-4",
  },
  {
    id: "a-11",
    userId: "u-4",
    action: "assigned",
    entity: "Task",
    entityName: "Component tokens",
    timestamp: "2025-06-12T10:15:00Z",
    oldValue: "—",
    newValue: "Emma Wilson",
    projectId: "p-4",
  },

  // --- Data Warehouse (p-5) ---
  {
    id: "a-12",
    userId: "u-2",
    action: "changed status on",
    entity: "Project",
    entityName: "Data Warehouse",
    timestamp: "2025-06-11T14:20:00Z",
    oldValue: "in-progress",
    newValue: "on-hold",
    projectId: "p-5",
  },
  {
    id: "a-13",
    userId: "u-8",
    action: "moved to review",
    entity: "Task",
    entityName: "Warehouse ETL jobs",
    timestamp: "2025-06-11T13:00:00Z",
    oldValue: "in-progress",
    newValue: "review",
    projectId: "p-5",
  },

  // --- Support Portal (p-6) ---
  {
    id: "a-14",
    userId: "u-4",
    action: "updated completion on",
    entity: "Project",
    entityName: "Support Portal",
    timestamp: "2025-06-12T09:55:00Z",
    oldValue: "21%",
    newValue: "27%",
    projectId: "p-6",
  },
  {
    id: "a-15",
    userId: "u-2",
    action: "assigned",
    entity: "Task",
    entityName: "Accessibility audit",
    timestamp: "2025-06-12T09:40:00Z",
    oldValue: "—",
    newValue: "Liam Patel",
    projectId: "p-6",
  },
  {
    id: "a-16",
    userId: "u-3",
    action: "changed status on",
    entity: "Task",
    entityName: "AI search prototype",
    timestamp: "2025-06-12T08:30:00Z",
    oldValue: "todo",
    newValue: "in-progress",
    projectId: "p-6",
  },

  // --- Billing Migration (p-3) ---
  {
    id: "a-17",
    userId: "u-2",
    action: "marked complete",
    entity: "Project",
    entityName: "Billing Migration",
    timestamp: "2025-06-10T17:00:00Z",
    oldValue: "in-progress",
    newValue: "completed",
    projectId: "p-3",
  },
  {
    id: "a-18",
    userId: "u-5",
    action: "completed",
    entity: "Task",
    entityName: "Payment webhooks",
    timestamp: "2025-06-10T16:30:00Z",
    oldValue: "review",
    newValue: "done",
    projectId: "p-3",
  },

  // --- Workspace-level (no project) ---
  {
    id: "a-19",
    userId: "u-1",
    action: "invited",
    entity: "User",
    entityName: "Liam Patel",
    timestamp: "2025-06-13T18:30:00Z",
    oldValue: "—",
    newValue: "invited",
  },
  {
    id: "a-20",
    userId: "u-1",
    action: "changed role of",
    entity: "User",
    entityName: "Sofia Reyes",
    timestamp: "2025-06-11T09:15:00Z",
    oldValue: "employee",
    newValue: "manager",
  },
]

export function getActivityByEntityName(entityName: string): ActivityLog[] {
  return dummyActivityLogs.filter((a) => a.entityName === entityName)
}

// Activities for a project, ordered with the project manager's actions first
// (most recent first), followed by everyone else (most recent first).
export function getActivityByProject(projectId: string, managerId?: string): ActivityLog[] {
  return dummyActivityLogs
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => {
      if (managerId) {
        const aManager = a.userId === managerId ? 0 : 1
        const bManager = b.userId === managerId ? 0 : 1
        if (aManager !== bManager) return aManager - bManager
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
}
