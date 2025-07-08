"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Simple in-memory user store (in production, use a database)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123", // In production, this should be hashed
}

export async function login(username: string, password: string) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const cookieStore = await cookies()
    cookieStore.set("admin-session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return { success: true }
  }
  return { success: false, error: "Invalid credentials" }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("admin-session")
  redirect("/login")
}

export async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin-session")
  return session?.value === "authenticated"
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (currentPassword !== ADMIN_CREDENTIALS.password) {
    return { success: false, error: "Current password is incorrect" }
  }

  // In production, you would update the password in the database
  // For this demo, we'll just return success
  return { success: true }
}
