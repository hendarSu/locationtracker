import { getRecentLocations, getTrackingStats, getAllTrackingLinks } from "@/lib/actions"
import { requireAuth } from "@/lib/simple-auth"
import DashboardClient from "./dashboard-client"

export default async function Dashboard() {
  // This will redirect to login if not authenticated
  const user = requireAuth()

  // Fetch initial data
  const [recentLocations, stats, trackingLinks] = await Promise.all([
    getRecentLocations(),
    getTrackingStats(),
    getAllTrackingLinks(),
  ])

  return (
    <DashboardClient
      user={user}
      initialLocations={recentLocations}
      initialStats={stats}
      initialTrackingLinks={trackingLinks}
    />
  )
}
