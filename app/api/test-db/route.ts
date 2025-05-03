import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Simple query to test the database connection
    const result = await sql`SELECT 1 as test`
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
