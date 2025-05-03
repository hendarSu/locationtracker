import { neon } from "@neondatabase/serverless"

// Create a SQL client with the database URL
const sql = neon(process.env.DATABASE_URL!)

// Helper function for SQL queries using tagged template literals
export async function query(queryText: string, params: any[] = []) {
  try {
    // Convert the traditional query with params to a tagged template literal
    // This is necessary because neon uses tagged templates, not query method
    let paramIndex = 0
    const preparedQuery = queryText.replace(/\$\d+/g, () => `$${++paramIndex}`)

    // Execute the query with the neon client
    const result = await sql.raw(preparedQuery, ...params)
    return result.rows
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Export the raw sql client for direct use with tagged templates
export { sql }
