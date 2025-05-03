import { sql } from "./db"

export async function migrateDatabase() {
  try {
    // Check if custom_title column exists
    const checkColumnResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tracking_links' AND column_name = 'custom_title'
    `

    // If the column doesn't exist, add the new columns
    if (checkColumnResult.length === 0) {
      console.log("Adding new columns to tracking_links table...")

      await sql`
        ALTER TABLE tracking_links 
        ADD COLUMN IF NOT EXISTS custom_title TEXT,
        ADD COLUMN IF NOT EXISTS custom_description TEXT,
        ADD COLUMN IF NOT EXISTS custom_content TEXT
      `

      console.log("Migration completed successfully")
    } else {
      console.log("Migration not needed, columns already exist")
    }

    return true
  } catch (error) {
    console.error("Error migrating database:", error)
    return false
  }
}
