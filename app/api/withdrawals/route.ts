import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const withdrawals = await Database.getWithdrawalRequests()
    return NextResponse.json(withdrawals)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
  }
}
