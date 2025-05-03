"use client"
import { cn } from "@/lib/utils"

interface StaticMapProps {
  coordinates: Array<{
    lat: number | string
    lng: number | string
    label?: string
  }>
  className?: string
  zoom?: number
  height?: string
  width?: number
}

export function StaticMap({ coordinates, className, zoom = 15, height = "h-[300px]", width = 600 }: StaticMapProps) {
  // Ensure coordinates are numbers
  const parsedCoordinates = coordinates.map((coord) => ({
    lat: typeof coord.lat === "string" ? Number.parseFloat(coord.lat) : coord.lat,
    lng: typeof coord.lng === "string" ? Number.parseFloat(coord.lng) : coord.lng,
    label: coord.label,
  }))

  // If no coordinates, show a placeholder
  if (parsedCoordinates.length === 0) {
    return (
      <div className={cn(height, "w-full bg-muted flex items-center justify-center rounded-md", className)}>
        <p className="text-muted-foreground">No location data available</p>
      </div>
    )
  }

  // For a single coordinate, center the map on that point
  if (parsedCoordinates.length === 1) {
    const { lat, lng } = parsedCoordinates[0]
    // Adjust the bounding box based on zoom level
    // Higher zoom = smaller area (more zoomed in)
    const zoomFactor = Math.pow(2, -zoom) * 0.5
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - zoomFactor}%2C${lat - zoomFactor}%2C${lng + zoomFactor}%2C${lat + zoomFactor}&layer=mapnik&marker=${lat}%2C${lng}`

    return (
      <div className={cn(height, "w-full rounded-md overflow-hidden", className)}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          title="Location Map"
          className="border-0"
        />
      </div>
    )
  }

  // For multiple coordinates, we'll use a static image with markers
  // Calculate the center and bounds
  let minLat = parsedCoordinates[0].lat
  let maxLat = parsedCoordinates[0].lat
  let minLng = parsedCoordinates[0].lng
  let maxLng = parsedCoordinates[0].lng

  parsedCoordinates.forEach((coord) => {
    minLat = Math.min(minLat, coord.lat)
    maxLat = Math.max(maxLat, coord.lat)
    minLng = Math.min(minLng, coord.lng)
    maxLng = Math.max(maxLng, coord.lng)
  })

  // Add some padding
  const latPadding = (maxLat - minLat) * 0.2
  const lngPadding = (maxLng - minLng) * 0.2

  minLat -= latPadding
  maxLat += latPadding
  minLng -= lngPadding
  maxLng += lngPadding

  // Create a map URL that shows all markers
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`

  // Add marker parameters for each coordinate
  const markerParams = parsedCoordinates.map((coord) => `&marker=${coord.lat}%2C${coord.lng}`).join("")

  return (
    <div className={cn(height, "w-full rounded-md overflow-hidden", className)}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl + markerParams}
        title="Location Map"
        className="border-0"
      />
    </div>
  )
}
