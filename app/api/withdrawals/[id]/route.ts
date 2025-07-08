import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    await Database.updateWithdrawalRequest(params.id, status)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update withdrawal request" }, { status: 500 })
  }
}
