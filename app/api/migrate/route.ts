import { NextResponse } from "next/server"
import { migrateDatabase } from "@/lib/migrate-db"

export async function GET() {
  try {
    const migrationResult = await migrateDatabase()

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      migrationResult,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
