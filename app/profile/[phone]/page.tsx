import { getLocationHistory } from "@/lib/actions"
import { getUser } from "@/lib/simple-auth"
import ProfileClient from "./profile-client"

export default async function ProfilePage({ params }: { params: { phone: string } }) {
  const phoneNumber = params.phone
  const user = getUser()
  const locationHistory = await getLocationHistory(phoneNumber)

  return <ProfileClient phoneNumber={phoneNumber} locationHistory={locationHistory} isAuthenticated={!!user} />
}
