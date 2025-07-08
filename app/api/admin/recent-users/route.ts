import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get the 10 most recent users
    const users = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt?.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
      }))
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
