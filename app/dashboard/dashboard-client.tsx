"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Copy, LogOut, Send, Phone, MapPin, Clock, Search, Trash2, LinkIcon, FileText, Type } from "lucide-react"
import {
  generateTrackingLink,
  getRecentLocations,
  getTrackingStats,
  deleteLocationData,
  getAllTrackingLinks,
  deleteTrackingLink,
} from "@/lib/actions"
import { StaticMap } from "@/components/static-map"
import { logout } from "@/lib/auth-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Footer } from "@/components/footer"

interface User {
  id: string
  username: string
}

interface LocationData {
  id: number
  phone_number: string
  latitude: number | string
  longitude: number | string
  timestamp: string
  browser: string
}

interface TrackingStats {
  totalLinks: number
  totalLocations: number
  uniquePhones: number
  recentActivity: {
    date: string
    count: number
  }[]
}

interface TrackingLink {
  id: string
  phone_number: string
  created_by: string
  created_at: string
  location_count: number
  last_used: string | null
  custom_title?: string
  custom_description?: string
  custom_content?: string
}

interface DashboardClientProps {
  user: User
  initialLocations: LocationData[]
  initialStats: TrackingStats
  initialTrackingLinks?: TrackingLink[]
}

export default function DashboardClient({
  user,
  initialLocations,
  initialStats,
  initialTrackingLinks,
}: DashboardClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customSlug, setCustomSlug] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customContent, setCustomContent] = useState("")
  const [trackingLink, setTrackingLink] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentLocations, setRecentLocations] = useState<LocationData[]>(initialLocations)
  const [stats, setStats] = useState<TrackingStats>(initialStats)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>(initialTrackingLinks || [])
  const [deleteLocationId, setDeleteLocationId] = useState<number | null>(null)
  const [deleteTrackingId, setDeleteTrackingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [locations, trackingStats, links] = await Promise.all([
        getRecentLocations(),
        getTrackingStats(),
        getAllTrackingLinks(),
      ])
      setRecentLocations(locations)
      setStats(trackingStats)
      setTrackingLinks(links)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const link = await generateTrackingLink({
        phoneNumber,
        customSlug,
        customTitle: showAdvancedOptions ? customTitle : undefined,
        customDescription: showAdvancedOptions ? customDescription : undefined,
        customContent: showAdvancedOptions ? customContent : undefined,
      })

      setTrackingLink(link)
      toast({
        title: "Link generated successfully",
        description: "You can now share this link to track location",
      })
      // Refresh the data
      fetchData()
      // Clear the custom fields
      setCustomSlug("")
      if (showAdvancedOptions) {
        setCustomTitle("")
        setCustomDescription("")
        setCustomContent("")
      }
    } catch (error) {
      let errorMessage = "Please try again later"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast({
        title: "Error generating link",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingLink)
    toast({
      title: "Copied to clipboard",
      description: "The tracking link has been copied to your clipboard",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const filteredLocations = searchQuery
    ? recentLocations.filter(
        (loc) => loc.phone_number.includes(searchQuery) || formatDate(loc.timestamp).includes(searchQuery),
      )
    : recentLocations

  // Helper function to safely convert to number and format
  const formatCoordinate = (value: number | string): string => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return !isNaN(numValue) ? numValue.toFixed(6) : "0.000000"
  }

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
        setRecentLocations(recentLocations.filter((loc) => loc.id !== id))
        // Refresh data to update stats
        fetchData()
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

  const handleDeleteTrackingLink = async (id: string) => {
    setIsDeleting(true)
    try {
      const success = await deleteTrackingLink(id)
      if (success) {
        toast({
          title: "Tracking link deleted",
          description: "The tracking link and all associated location data have been deleted",
        })
        // Update the UI by removing the deleted tracking link
        setTrackingLinks(trackingLinks.filter((link) => link.id !== id))
        // Refresh data to update stats
        fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete tracking link",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting tracking link:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteTrackingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Location Tracker Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Logged in as <span className="font-medium">{user.username}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tracking Links</p>
                    <p className="text-3xl font-bold">{stats.totalLinks}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Locations</p>
                    <p className="text-3xl font-bold">{stats.totalLocations}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Phone Numbers</p>
                    <p className="text-3xl font-bold">{stats.uniquePhones}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today's Activity</p>
                    <p className="text-3xl font-bold">
                      {stats.recentActivity.find((a) => a.date === new Date().toISOString().split("T")[0])?.count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Generate Tracking Link</CardTitle>
              <CardDescription>Create a new tracking link for a phone number</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customSlug">Custom Link ID (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customSlug"
                      type="text"
                      placeholder="e.g., my-tracking-link"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to generate a random ID, or enter a custom ID for a more memorable link.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full"
                  >
                    {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
                  </Button>
                </div>

                {showAdvancedOptions && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="customTitle" className="flex items-center gap-2">
                        <Type className="h-4 w-4" /> Custom Page Title
                      </Label>
                      <Input
                        id="customTitle"
                        type="text"
                        placeholder="Enter custom page title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Customize the title shown on the tracking page.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customDescription" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Custom Description
                      </Label>
                      <Textarea
                        id="customDescription"
                        placeholder="Enter custom page description"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add a description that will appear below the title.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customContent" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Custom Content
                      </Label>
                      <RichTextEditor
                        value={customContent}
                        onChange={setCustomContent}
                        placeholder="Add custom content with text, images, and formatting..."
                        className="min-h-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add rich content with images and formatting that will appear on the tracking page.
                      </p>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Tracking Link"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>

              {trackingLink && (
                <div className="mt-6 space-y-2">
                  <Label>Your Tracking Link</Label>
                  <div className="flex items-center gap-2">
                    <Input value={trackingLink} readOnly />
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Share this link to track the location when clicked.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Tabs defaultValue="locations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="locations">Recent Locations</TabsTrigger>
                  <TabsTrigger value="links">Tracking Links</TabsTrigger>
                </TabsList>

                <TabsContent value="locations" className="mt-4">
                  <CardTitle>Recent Locations</CardTitle>
                  <CardDescription>Recently tracked locations from all devices</CardDescription>
                </TabsContent>

                <TabsContent value="links" className="mt-4">
                  <CardTitle>Tracking Links</CardTitle>
                  <CardDescription>All generated tracking links</CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs defaultValue="locations" className="w-full">
                <TabsContent value="locations">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by phone number or date"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {filteredLocations.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No matching results found" : "No location data available yet"}
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredLocations.map((location) => (
                        <div key={location.id} className="border rounded-lg p-3 flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">{location.phone_number}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDate(location.timestamp)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm">
                              {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <a href={`/profile/${location.phone_number}`}>View Profile</a>
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
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="links">
                  {trackingLinks.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No tracking links available yet</p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {trackingLinks.map((link) => (
                        <div key={link.id} className="border rounded-lg p-3 flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">{link.phone_number}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Created: {new Date(link.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <LinkIcon className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm font-medium">{link.id}</span>
                          </div>

                          {link.custom_title && (
                            <div className="flex items-center">
                              <Type className="h-4 w-4 mr-2 text-primary" />
                              <span className="text-sm">{link.custom_title}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-primary" />
                              <span className="text-sm">
                                {link.location_count} location{link.location_count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {link.last_used && (
                              <span className="text-xs text-muted-foreground">
                                Last used: {new Date(link.last_used).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                                const trackLink = `${baseUrl}/track/${link.id}`
                                navigator.clipboard.writeText(trackLink)
                                toast({
                                  title: "Copied to clipboard",
                                  description: "The tracking link has been copied to your clipboard",
                                })
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" /> Copy Link
                            </Button>

                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <a href={`/profile/${link.phone_number}`}>View Profile</a>
                            </Button>

                            <Dialog
                              open={deleteTrackingId === link.id}
                              onOpenChange={(open) => {
                                if (!open) setDeleteTrackingId(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteTrackingId(link.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Tracking Link</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this tracking link and all associated location data?
                                    This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteTrackingId(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteTrackingLink(link.id)}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter>
              <Button variant="outline" className="w-full" onClick={fetchData} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Map of recent locations */}
        {recentLocations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
              <CardDescription>Visual overview of all tracked locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full rounded-md overflow-hidden">
                <StaticMap
                  coordinates={recentLocations.map((loc) => ({
                    lat: typeof loc.latitude === "string" ? Number.parseFloat(loc.latitude) : loc.latitude,
                    lng: typeof loc.longitude === "string" ? Number.parseFloat(loc.longitude) : loc.longitude,
                    label: `${loc.phone_number} - ${formatDate(loc.timestamp)}`,
                  }))}
                  height="h-[400px]"
                  zoom={14}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
