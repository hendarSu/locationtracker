import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/track", "/api"]
  const isPublicPath = publicPaths.some((pp) => path === pp || path.startsWith(`${pp}/`))

  // Get the session cookie
  const authSession = request.cookies.get("auth-session")
  const authUser = request.cookies.get("auth-user")

  // If the path is public, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // If the user is not logged in and trying to access a protected route, redirect to login
  if ((!authSession || !authUser) && !isPublicPath) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // If the user is logged in and trying to access login page, redirect to dashboard
  if (authSession && authUser && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
