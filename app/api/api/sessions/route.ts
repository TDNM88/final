import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Kết nối MongoDB
const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);
const dbName = 'trading';
const collectionName = 'sessions';

// Lấy thông tin phiên hiện tại
export async function GET() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const currentSession = await collection.findOne({
      status: 'active'
    }, {
      sort: { startTime: -1 }
    });
    
    if (!currentSession) {
      return NextResponse.json({ 
        error: 'No active session found',
        currentSession: null,
        nextSessions: []
      });
    }
    
    const nextSessions = await collection.find({
      status: 'scheduled',
      startTime: { $gt: new Date() }
    }).sort({ startTime: 1 }).limit(30).toArray();
    
    return NextResponse.json({
      currentSession,
      nextSessions,
      serverTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// Cập nhật thông tin phiên (chỉ admin)
export async function POST(request: Request) {
  try {
    const sessionData = await request.json();
    const { action } = sessionData;
    
    if (!['create', 'update', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    if (action === 'create') {
      // Đánh dấu tất cả các phiên cũ là đã kết thúc
      await collection.updateMany(
        { status: 'active' },
        { $set: { status: 'completed' }}
      );
      
      // Thêm phiên mới
      const result = await collection.insertOne({
        ...sessionData.session,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        success: true,
        sessionId: result.insertedId
      });
    }
    
    // Các action khác (update, end) có thể thêm sau
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
