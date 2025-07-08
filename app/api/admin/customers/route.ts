import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const customers = await db.collection('users')
      .find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .project({
        _id: 1,
        username: 1,
        email: 1,
        balance: 1,
        status: 1,
        createdAt: 1
      })
      .toArray();
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
