import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, subject, html } = body

    const apiKey = process.env.RESEND_API_KEY || "re_jh46LVYz_1pjYcC5gMrjsR1zcnueZhcB3"
    const from = process.env.EMAIL_FROM || "GetPlaced <noreply@getplaced.tech>"

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Resend API Key is not configured." }, { status: 500 })
    }

    console.log(`Sending email via Resend API to: ${to}, subject: ${subject}`);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Resend API failed: ${errorText}`)
    }

    const resData = await res.json()

    return NextResponse.json({
      success: true,
      messageId: resData.id,
    })
  } catch (e: any) {
    console.error("Error sending email via Resend:", e)
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
