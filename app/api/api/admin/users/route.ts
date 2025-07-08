import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import UserModel, { IUser } from '@/models/User';

// Hàm lấy danh sách người dùng
export async function GET(req: Request) {
  try {
    // Check authentication
    const isAdmin = await isAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
    }

    // Get search parameters from query string
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    
    const status = searchParams.get('status') || 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 100;
    
    // Connect to database
    const client = await clientPromise;
    await client.connect();
    
    // Xây dựng query
    let query: any = {};
    
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
    
    
    // Truy vấn database
    const users = await UserModel.find(query)
      .select('-password -verification') // Không trả về mật khẩu và thông tin xác minh nhạy cảm
      .limit(limit)
      .lean() // Chuyển đổi sang plain JavaScript object
      .lean();
    
    // Nếu không có dữ liệu trong database, tạo dữ liệu mẫu
    if (users.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No users found in database, returning mock data');
      return NextResponse.json({ users: generateMockUsers(50) });
    }

    return NextResponse.json({ users });
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
    // Check admin authentication
    const isAdmin = await isAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
    }

    // Get data from request body
    const body = await req.json();
    const { userId, active } = body;

    if (!userId || active === undefined) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }
    
    // Connect to database
    const client = await clientPromise;
    await client.connect();

    // Find and update user status
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 'status.active': active },
      { new: true }
    ).select('-password -verification');
    
    if (!user) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
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
    const isAdmin = await isAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
    }

    // Get data from request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'Thiếu ID người dùng' }, { status: 400 });
    }

    // Connect to database
    const client = await clientPromise;
    await client.connect();

    // Find and delete user
    const deletedUser = await UserModel.findByIdAndDelete(userId).select('-password');

    if (!deletedUser) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Xóa người dùng thành công',
      user: deletedUser
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Lỗi khi xóa người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Hàm tạo dữ liệu mẫu khi chưa có database hoặc database trống
function generateMockUsers(count: number) {
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const randomId = Math.random().toString(36).substring(2, 10);
    const isVerified = Math.random() > 0.3;
    const isActive = Math.random() > 0.2;
    const isBetLocked = Math.random() > 0.8;
    const isWithdrawLocked = Math.random() > 0.7;
    
    users.push({
      _id: `user_${randomId}`,
      username: `user${i}`,
      fullName: `Người dùng ${i}`,
      email: `user${i}@example.com`,
      phoneNumber: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      loginInfo: `192.168.1.${Math.floor(Math.random() * 255)}`,
      balance: {
        available: Math.floor(Math.random() * 10000000),
        frozen: Math.floor(Math.random() * 1000000)
      },
      bank: {
        name: ['ACB', 'Vietcombank', 'BIDV', 'Techcombank'][Math.floor(Math.random() * 4)],
        accountNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        accountHolder: `NGUYEN VAN ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
      },
      verification: {
        verified: isVerified,
        cccdFront: isVerified,
        cccdBack: isVerified
      },
      status: {
        active: isActive,
        betLocked: isBetLocked,
        withdrawLocked: isWithdrawLocked
      }
    });
  }
  
  return users;
}
function connectToDatabase() {
  throw new Error('Function not implemented.');
}

function getUserFromRequest(request: Request) {
  throw new Error('Function not implemented.');
}

