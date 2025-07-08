import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { cookies } from 'next/headers';
import { WithId, Document, ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth';

interface IUser {
  _id: ObjectId;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  balance?: {
    available: number;
    frozen: number;
  };
  status: {
    active: boolean;
    betLocked: boolean;
    withdrawLocked: boolean;
  };
  verification?: {
    verified: boolean;
    cccdFront?: boolean;
    cccdBack?: boolean;
  };
  createdAt?: Date;
  lastLogin?: Date;
  role?: string;
}

type User = WithId<IUser>;

// Hàm lấy danh sách người dùng
export async function GET(req: Request) {
  try {
    // Check admin authentication
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Get search parameters from query string
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 100;
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Xây dựng query
    const query: any = {};
    
    // Tìm kiếm theo username hoặc fullName
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status
    if (status !== 'all') {
      query['status.active'] = (status === 'active');
    }
    
    // Get users from database with proper typing
    const usersCursor = db.collection<IUser>('users')
      .find(query, {
        projection: {
          password: 0, // Exclude password
          verification: 0 // Exclude verification details
        }
      })
      .limit(limit);
      
    const users = await usersCursor.toArray();
    
    // Insert mock users if none found and in development mode
    if (users.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No users found, inserting mock data...');
      const mockUsers = generateMockUsers(10);
      if (mockUsers.length > 0) {
        await db.collection<IUser>('users').insertMany(mockUsers);
        const newUsers = await db.collection<IUser>('users')
          .find({})
          .project({
            password: 0,
            verification: 0
          })
          .toArray();
        return NextResponse.json(newUsers);
      }
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Lỗi khi lấy danh sách người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// API cập nhật trạng thái người dùng
export async function PUT(req: Request) {
  try {
    // Helper function to get database connection
    async function getDb() {
      try {
        const client = await clientPromise;
        return client.db();
      } catch (error) {
        console.error('Database connection error:', error);
        throw new Error('Không thể kết nối cơ sở dữ liệu');
      }
    }

    // Check admin authentication
    const session = cookies().get('admin-session')?.value;
    if (session !== 'authenticated') {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Get data from request body
    const body = await req.json();
    const { userId, active } = body;

    if (!userId || active === undefined) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }
    
    // Connect to database
    const db = await getDb();

    // Update user status
    const result = await db.collection<IUser>('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { 'status.active': active } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
    // Remove sensitive data
    const { password, verification, ...user } = result as any;
    
    return NextResponse.json({ 
      message: 'Cập nhật trạng thái thành công',
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { message: 'Lỗi khi cập nhật trạng thái người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// API xóa người dùng
export async function DELETE(req: Request) {
  try {
    // Check admin authentication
    const session = cookies().get('admin-session')?.value;
    if (session !== 'authenticated') {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Get data from request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'Thiếu ID người dùng' }, { status: 400 });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Find and delete user
    const deletedUser = await db.collection<IUser>('users').findOneAndDelete({ _id: new ObjectId(userId) });

    if (!deletedUser) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Xóa người dùng thành công',
      user: deletedUser
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Lỗi khi xóa người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Hàm tạo dữ liệu mẫu khi chưa có database hoặc database trống
function generateMockUsers(count: number): IUser[] {
  const users: IUser[] = [];
  
  for (let i = 1; i <= count; i++) {
    const isVerified = Math.random() > 0.3;
    const isActive = Math.random() > 0.2;
    const isBetLocked = Math.random() > 0.8;
    const isWithdrawLocked = Math.random() > 0.7;
    
    const user: IUser = {
      _id: new ObjectId(),
      username: `user${i}`,
      fullName: `Người dùng ${i}`,
      email: `user${i}@example.com`,
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdAt: new Date(),
      lastLogin: new Date(),
      status: {
        active: isActive,
        betLocked: isBetLocked,
        withdrawLocked: isWithdrawLocked
      },
      verification: {
        verified: isVerified,
        cccdFront: isVerified,
        cccdBack: isVerified
      },
      role: 'user'
    };
    
    users.push(user);
  }
  
  return users;
}
