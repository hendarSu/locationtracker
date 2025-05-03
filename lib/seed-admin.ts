import bcrypt from "bcryptjs"
import { query, sql } from "./db"

export async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await query("SELECT * FROM users WHERE username = $1", ["Administrator"])

    if (existingUser && existingUser.length > 0) {
      console.log("Admin user already exists")
      return
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("Adm1nTr4ck3r1995!", 10)

    // Insert the admin user
    await query("INSERT INTO users (username, password_hash) VALUES ($1, $2)", ["Administrator", passwordHash])

    console.log("Admin user created successfully")
  } catch (error) {
    console.error("Error seeding admin user:", error)
    // Don't throw the error, just log it to prevent app startup issues
  }
}

// Alternative implementation using tagged templates directly
export async function seedAdminUserAlternative() {
  try {
    // Check if admin user already exists
    const existingUser = await sql`SELECT * FROM users WHERE username = 'Administrator'`

    if (existingUser && existingUser.length > 0) {
      console.log("Admin user already exists")
      return
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("Adm1nTr4ck3r1995!", 10)

    // Insert the admin user
    await sql`INSERT INTO users (username, password_hash) VALUES ('Administrator', ${passwordHash})`

    console.log("Admin user created successfully")
  } catch (error) {
    console.error("Error seeding admin user:", error)
    // Don't throw the error, just log it to prevent app startup issues
  }
}
