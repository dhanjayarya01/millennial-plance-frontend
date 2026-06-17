import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, subject, html } = body

    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || "no-reply@millennial.com"

    let transporter

    if (host && port && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        auth: {
          user,
          pass,
        },
      })
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })
      } catch (err) {
        console.log("=== EMAIL SENDING SIMULATION ===")
        console.log("To:", to)
        console.log("Subject:", subject)
        console.log("HTML:", html)
        console.log("================================")
        return NextResponse.json({ success: true, simulated: true })
      }
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
