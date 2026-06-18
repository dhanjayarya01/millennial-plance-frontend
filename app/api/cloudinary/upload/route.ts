import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type
    const base64Data = buffer.toString("base64")
    const fileUri = `data:${mimeType};base64,${base64Data}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: "millennial_attachments",
      resource_type: "auto",
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      name: file.name,
    })
  } catch (err: any) {
    console.error("Cloudinary upload error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
