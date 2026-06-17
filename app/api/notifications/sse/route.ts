import { subscribe } from "@/lib/notification-store"

export const dynamic = "force-dynamic"

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribe((data) => {
        controller.enqueue(`data: ${data}\n\n`)
      })

      controller.enqueue("data: {\"type\":\"heartbeat\"}\n\n")

      const interval = setInterval(() => {
        try {
          controller.enqueue("data: {\"type\":\"heartbeat\"}\n\n")
        } catch (e) {
          clearInterval(interval)
        }
      }, 30000)

      return () => {
        clearInterval(interval)
        unsubscribe()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
