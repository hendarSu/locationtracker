import type React from "react"
import { getTrackingLinkById } from "@/lib/actions"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Get tracking link data
  const trackingLink = await getTrackingLinkById(params.id)

  // Default metadata
  const title = trackingLink?.custom_title || "Location Tracker"
  const description = trackingLink?.custom_description || "Please share your location"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  }
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children
}
