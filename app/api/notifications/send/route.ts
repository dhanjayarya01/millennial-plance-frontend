import { broadcast } from "@/lib/notification-store"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, urgency = "info" } = body

    broadcast({
      title,
      description,
      urgency,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
