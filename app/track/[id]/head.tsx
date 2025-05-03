"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getTrackingLinkById } from "@/lib/actions"

export default function Head() {
  const params = useParams()
  const trackingId = params.id as string
  const [title, setTitle] = useState("Location Tracker")
  const [description, setDescription] = useState("")

  useEffect(() => {
    const fetchTrackingLink = async () => {
      try {
        const link = await getTrackingLinkById(trackingId)
        if (link) {
          if (link.custom_title) {
            setTitle(link.custom_title)
          }
          if (link.custom_description) {
            setDescription(link.custom_description)
          }
        }
      } catch (error) {
        console.error("Error fetching tracking link:", error)
      }
    }

    fetchTrackingLink()
  }, [trackingId])

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </>
  )
}
