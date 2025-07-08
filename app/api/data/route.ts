import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(); // Thay 'your_database_name' bằng tên database của bạn
    
    // Lấy dữ liệu từ collection 'your_collection'
    const data = await db.collection('your_collection').find({}).toArray();
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db(); // Thay 'your_database_name' bằng tên database của bạn
    
    // Thêm dữ liệu mới vào collection
    const result = await db.collection('your_collection').insertOne(data);
    
    return NextResponse.json({ 
      message: 'Data added successfully',
      id: result.insertedId 
    });
  } catch (error) {
    console.error('Error adding data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
