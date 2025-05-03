import { sql } from "./db"

export async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create tracking_links table if it doesn't exist with new fields
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_links (
        id VARCHAR(255) PRIMARY KEY,
        phone_number VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        custom_title TEXT,
        custom_description TEXT,
        custom_content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create location_data table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS location_data (
        id SERIAL PRIMARY KEY,
        tracking_id VARCHAR(255) NOT NULL,
        phone_number VARCHAR(255) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        browser TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}
