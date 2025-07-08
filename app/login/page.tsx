import { LoginForm } from "@/components/login-form"
import { isAuthenticated } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const authenticated = await isAuthenticated()

  if (authenticated) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Đăng nhập quản trị</h2>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
