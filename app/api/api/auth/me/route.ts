import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/db"
import { parseToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    // Get token from cookie
    const cookies = request.headers.get("cookie") || ""
    const tokenMatch = cookies.match(/token=([^;]+)/)

    if (!tokenMatch) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 })
    }

    const token = tokenMatch[1]
    const tokenData = parseToken(token)

    if (!tokenData) {
      return NextResponse.json({ success: false, message: "Token không hợp lệ" }, { status: 401 })
    }

    // Check token expiry (7 days)
    const now = Date.now()
    const tokenAge = now - tokenData.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    if (tokenAge > maxAge) {
      return NextResponse.json({ success: false, message: "Token đã hết hạn" }, { status: 401 })
    }

    // Get user from database
    const db = await getMongoDb()
    if (!db) {
      throw new Error("Không thể kết nối cơ sở dữ liệu")
    }

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(tokenData.userId) },
      { projection: { password: 0 } }, // Don't return password
    )

    if (!user) {
      return NextResponse.json({ success: false, message: "Người dùng không tồn tại" }, { status: 404 })
    }

    // Check if user is still active
    if (!user.status?.active) {
      return NextResponse.json({ success: false, message: "Tài khoản đã bị khóa" }, { status: 401 })
    }

    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      role: user.role || "user",
      balance: user.balance || { available: 0, frozen: 0 },
      bank: user.bank || { name: "", accountNumber: "", accountHolder: "" },
      verification: user.verification || { verified: false, cccdFront: "", cccdBack: "" },
      status: user.status || { active: true, betLocked: false, withdrawLocked: false },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ success: false, message: "Lỗi hệ thống" }, { status: 500 })
  }
}
