import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/init-db"
import { seedAdminUserAlternative } from "@/lib/seed-admin"

export async function GET() {
  try {
    // Initialize database
    const dbInitialized = await initializeDatabase()

    // Seed admin user
    await seedAdminUserAlternative()

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
      dbInitialized,
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
