"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { cn } from "@/lib/utils"

interface MapViewProps {
  coordinates: Array<{
    lat: number
    lng: number
    label?: string
  }>
  className?: string
  zoom?: number
  height?: string
}

export function MapView({ coordinates, className, zoom = 15, height = "h-[300px]" }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      // Fix the "icon not found" issue in Leaflet
      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
      L.Marker.prototype.options.icon = defaultIcon

      // Create map instance
      mapInstanceRef.current = L.map(mapRef.current)

      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    if (coordinates.length === 0) {
      // Default view if no coordinates
      map.setView([0, 0], 2)
      return
    }

    // Add markers for all coordinates
    const bounds = L.latLngBounds([])
    coordinates.forEach((coord, index) => {
      const marker = L.marker([coord.lat, coord.lng]).addTo(map)

      if (coord.label) {
        marker.bindPopup(coord.label).openPopup()
      }

      bounds.extend([coord.lat, coord.lng])
    })

    // If only one marker, set view to that location with specified zoom
    if (coordinates.length === 1) {
      map.setView([coordinates[0].lat, coordinates[0].lng], zoom)
    } else {
      // Otherwise fit bounds to show all markers
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    // Cleanup function
    return () => {
      // We don't destroy the map here, just clean up markers if needed
    }
  }, [coordinates, zoom])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return <div ref={mapRef} className={cn(height, "w-full rounded-md", className)} />
}
