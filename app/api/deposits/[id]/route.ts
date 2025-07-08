import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    await Database.updateDepositRequest(params.id, status)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update deposit request" }, { status: 500 })
  }
}
