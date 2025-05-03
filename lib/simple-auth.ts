import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { sql } from "./db"

// Session duration in seconds (24 hours)
const SESSION_DURATION = 24 * 60 * 60

export async function login(username: string, password: string) {
  try {
    // Query the database for the user
    const result = await sql`SELECT * FROM users WHERE username = ${username}`

    if (!result || result.length === 0) {
      return { success: false, message: "Invalid username or password" }
    }

    const user = result[0]

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return { success: false, message: "Invalid username or password" }
    }

    // Create a session token
    const sessionToken = crypto.randomUUID()

    // Store the session in a cookie
    cookies().set("auth-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
    })

    // Store user info in a cookie (non-sensitive)
    cookies().set("auth-user", JSON.stringify({ id: user.id, username: user.username }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
    })

    return { success: true, user: { id: user.id, username: user.username } }
  } catch (error) {
    console.error("Authentication error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function logout() {
  cookies().delete("auth-session")
  cookies().delete("auth-user")
}

export function getUser() {
  const userCookie = cookies().get("auth-user")

  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie.value)
  } catch {
    return null
  }
}

export function requireAuth() {
  const user = getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
