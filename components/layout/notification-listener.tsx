"use client"

import { useEffect, useState } from "react"
import { Bell, Mail, X } from "lucide-react"

interface NotificationData {
  title: string
  description: string
  urgency: "green" | "yellow" | "red"
  timestamp?: string
  isEmail?: boolean
}

export function NotificationListener() {
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null)

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/sse")

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "heartbeat") return

        setActiveNotification({
          title: data.title,
          description: data.description,
          urgency: data.urgency,
          timestamp: data.timestamp,
          isEmail: data.isEmail || false,
        })
      } catch (err) {
        console.error("Error parsing SSE event data:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE connection error, retrying...", err)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  if (!activeNotification) return null

  const urgencyBorder = {
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    yellow: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
    red: "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100",
  }[activeNotification.urgency]

  const urgencyIconBg = {
    green: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    yellow: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    red: "bg-rose-500/20 text-rose-600 dark:text-rose-400",
  }[activeNotification.urgency]

  return (
    <div className="fixed bottom-5 right-5 z-[999] max-w-sm w-full animate-fade-in-up">
      <div className={`flex flex-col gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${urgencyBorder}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${urgencyIconBg}`}>
              {activeNotification.isEmail ? <Mail className="size-4" /> : <Bell className="size-4" />}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                {activeNotification.isEmail ? "Email Dispatch" : "SSE Notification"}
              </p>
              <h3 className="text-sm font-semibold">{activeNotification.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveNotification(null)}
            className="rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Close notification"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{activeNotification.description}</p>
      </div>
    </div>
  )
}
