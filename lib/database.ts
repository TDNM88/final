import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

export interface Customer {
  _id?: ObjectId
  username: string
  password?: string
  balance: number
  frozenBalance: number
  loginInfo: string
  fullName: string
  isActive: boolean
  isVerified: boolean
  isBetLocked: boolean
  isWithdrawLocked: boolean
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  createdAt: Date
  updatedAt: Date
}

export interface DepositRequest {
  _id?: ObjectId
  customerId: ObjectId
  customerName: string
  amount: number
  status: "pending" | "approved" | "rejected"
  billUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface WithdrawalRequest {
  _id?: ObjectId
  customerId: ObjectId
  customerName: string
  amount: number
  receivedAmount: number
  bankName: string
  accountNumber: string
  accountHolder: string
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
}

export interface TradingOrder {
  _id?: ObjectId
  customerId: ObjectId
  customerName: string
  sessionId: string
  type: "up" | "down"
  amount: number
  result: number
  createdAt: Date
}

export class Database {
  static async getCustomers() {
    const client = await clientPromise
    const db = client.db("trading")
    return await db.collection<Customer>("customers").find({}).toArray()
  }

  static async createCustomer(customer: Omit<Customer, "_id" | "createdAt" | "updatedAt">) {
    const client = await clientPromise
    const db = client.db("trading")
    const now = new Date()
    return await db.collection<Customer>("customers").insertOne({
      ...customer,
      createdAt: now,
      updatedAt: now,
    })
  }

  static async updateCustomer(id: string, updates: Partial<Customer>) {
    const client = await clientPromise
    const db = client.db("trading")
    return await db
      .collection<Customer>("customers")
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...updates, updatedAt: new Date() } })
  }

  static async deleteCustomer(id: string) {
    const client = await clientPromise
    const db = client.db("trading")
    return await db.collection<Customer>("customers").deleteOne({ _id: new ObjectId(id) })
  }

  static async getDepositRequests() {
    const client = await clientPromise
    const db = client.db("trading")
    return await db.collection<DepositRequest>("depositRequests").find({}).sort({ createdAt: -1 }).toArray()
  }

  static async updateDepositRequest(id: string, status: "approved" | "rejected") {
    const client = await clientPromise
    const db = client.db("trading")
    return await db
      .collection<DepositRequest>("depositRequests")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
  }

  static async getWithdrawalRequests() {
    const client = await clientPromise
    const db = client.db("trading")
    return await db.collection<WithdrawalRequest>("withdrawalRequests").find({}).sort({ createdAt: -1 }).toArray()
  }

  static async updateWithdrawalRequest(id: string, status: "approved" | "rejected") {
    const client = await clientPromise
    const db = client.db("trading")
    return await db
      .collection<WithdrawalRequest>("withdrawalRequests")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
  }

  static async getTradingOrders() {
    const client = await clientPromise
    const db = client.db("trading")
    return await db.collection<TradingOrder>("tradingOrders").find({}).sort({ createdAt: -1 }).toArray()
  }

  static async createTradingOrder(order: Omit<TradingOrder, "_id" | "createdAt">) {
    const client = await clientPromise
    const db = client.db("trading")
    return await db.collection<TradingOrder>("tradingOrders").insertOne({
      ...order,
      createdAt: new Date(),
    })
  }
}
