"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Monitor, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { StaticMap } from "@/components/static-map"
import { useState } from "react"
import { deleteLocationData } from "@/lib/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Footer } from "@/components/footer"

interface LocationData {
  id: number
  phone_number: string
  latitude: number | string
  longitude: number | string
  timestamp: string
  browser: string
}

interface ProfileClientProps {
  phoneNumber: string
  locationHistory: LocationData[]
  isAuthenticated: boolean
}

export default function ProfileClient({ phoneNumber, locationHistory, isAuthenticated }: ProfileClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [deleteLocationId, setDeleteLocationId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [locationData, setLocationData] = useState<LocationData[]>(locationHistory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Helper function to safely convert to number and format
  const formatCoordinate = (value: number | string): string => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return !isNaN(numValue) ? numValue.toFixed(6) : "0.000000"
  }

  const backLink = isAuthenticated ? "/dashboard" : "/"

  const handleDeleteLocation = async (id: number) => {
    setIsDeleting(true)
    try {
      const success = await deleteLocationData(id)
      if (success) {
        toast({
          title: "Location deleted",
          description: "The location data has been deleted successfully",
        })
        // Update the UI by removing the deleted location
        setLocationData(locationData.filter((loc) => loc.id !== id))
      } else {
        toast({
          title: "Error",
          description: "Failed to delete location data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteLocationId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="container mx-auto py-10 px-4 flex-grow">
        <Button variant="ghost" className="mb-4" asChild>
          <a href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {isAuthenticated ? "Dashboard" : "Home"}
          </a>
        </Button>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Location Profile for {phoneNumber}</CardTitle>
            <CardDescription>View all location data captured for this phone number</CardDescription>
          </CardHeader>
          {locationData.length > 0 && (
            <div className="mb-6 px-4">
              <StaticMap
                coordinates={locationData.map((loc) => ({
                  lat: typeof loc.latitude === "string" ? Number.parseFloat(loc.latitude) : loc.latitude,
                  lng: typeof loc.longitude === "string" ? Number.parseFloat(loc.longitude) : loc.longitude,
                  label: `Captured on: ${formatDate(loc.timestamp)}`,
                }))}
                height="h-[400px]"
                zoom={15}
              />
            </div>
          )}
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : locationData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No location data found for this phone number</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Total records: {locationData.length}</p>

                {locationData.map((location) => (
                  <Card key={location.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium">Coordinates</p>
                            <p className="text-sm text-muted-foreground">
                              Lat: {formatCoordinate(location.latitude)}, Lng: {formatCoordinate(location.longitude)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium">Timestamp</p>
                            <p className="text-sm text-muted-foreground">{formatDate(location.timestamp)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 sm:col-span-2">
                          <Monitor className="h-4 w-4 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium">Browser</p>
                            <p className="text-sm text-muted-foreground break-all">{location.browser}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a
                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Google Maps
                          </a>
                        </Button>

                        <Dialog
                          open={deleteLocationId === location.id}
                          onOpenChange={(open) => {
                            if (!open) setDeleteLocationId(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteLocationId(location.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Location Data</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this location data? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteLocationId(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteLocation(location.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
