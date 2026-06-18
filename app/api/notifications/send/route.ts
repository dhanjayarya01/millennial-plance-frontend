import { broadcast } from "@/lib/notification-store"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, urgency = "info", userId } = body

    if (userId) {
      console.log(`Forwarding notification for user ${userId} to worker service...`);
      const workerRes = await fetch("http://localhost:8081/api/worker/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          title,
          message: description,
          type: urgency === "red" ? "OVERDUE" : urgency === "yellow" ? "REMINDER_24H" : "REMINDER_48H"
        })
      })

      if (!workerRes.ok) {
        throw new Error(`Worker notification service failed: ${await workerRes.text()}`)
      }
    } else {
      broadcast({
        title,
        description,
        urgency,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("Error sending notification:", e)
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
