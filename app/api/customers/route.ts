import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const customers = await Database.getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await Database.createCustomer(body)
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
