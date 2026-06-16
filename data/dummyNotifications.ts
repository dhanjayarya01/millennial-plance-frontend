import type { AppNotification } from "@/types"

export const dummyNotifications: AppNotification[] = [
  {
    id: "n-1",
    title: "Task due soon",
    message: "“Set up CI pipeline” is due in 1 day.",
    type: "deadline",
    read: false,
    timestamp: "2025-06-14T08:00:00Z",
  },
  {
    id: "n-2",
    title: "Task overdue",
    message: "“Accessibility audit” is past its deadline.",
    type: "overdue",
    read: false,
    timestamp: "2025-06-14T07:30:00Z",
  },
  {
    id: "n-3",
    title: "New assignment",
    message: "Priya assigned you to “AI search prototype”.",
    type: "assignment",
    read: false,
    timestamp: "2025-06-13T16:10:00Z",
  },
  {
    id: "n-4",
    title: "Mentioned in a work log",
    message: "Daniel mentioned you in a comment.",
    type: "mention",
    read: true,
    timestamp: "2025-06-13T11:45:00Z",
  },
  {
    id: "n-5",
    title: "Weekly report ready",
    message: "Your team's productivity report is available.",
    type: "system",
    read: true,
    timestamp: "2025-06-12T09:00:00Z",
  },
]
