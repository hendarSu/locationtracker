import { redirect } from "next/navigation"
import { getUser } from "@/lib/simple-auth"

export default function Home() {
  const user = getUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }

  // This will never be rendered
  return null
}
