"use server"

import { login as loginUser, logout as logoutUser } from "./simple-auth"
import { seedAdminUserAlternative } from "./seed-admin"
import { initializeDatabase } from "./init-db"

// Initialize database and ensure admin user exists
try {
  await initializeDatabase()
  await seedAdminUserAlternative()
} catch (error) {
  console.error("Error initializing application:", error)
}

export async function login(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { success: false, message: "Username and password are required" }
  }

  const result = await loginUser(username, password)

  // Return the result instead of redirecting
  return result
}

export async function logout() {
  await logoutUser()
  return { success: true }
}
