import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("pms-auth-token")?.value
  const { pathname } = request.nextUrl

  const isPublicPath = pathname === "/login" || pathname === "/forgot-password"

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
