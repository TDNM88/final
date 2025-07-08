import { AdminDashboard } from "@/components/admin-dashboard"
import { isAuthenticated } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect("/login")
  }

  return <AdminDashboard />
}
