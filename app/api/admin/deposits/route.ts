import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth';

// API để lấy danh sách yêu cầu nạp tiền (dành cho Admin)
export async function GET(req: NextRequest) {
  try {
    // Xác thực admin
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    // Create a cookie store from the request headers
    const cookies = cookieHeader.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
      return cookies;
    }, {} as Record<string, string>);

    // Check if admin is authenticated
    if (cookies['admin-session'] !== 'authenticated') {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    // Kết nối DB
    const db = await getMongoDb();

    // Parse query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const skip = (page - 1) * limit;

    // Tạo filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    // Pipeline aggregation để lấy thông tin người dùng
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          proofImage: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1,
          'userDetails._id': 1,
          'userDetails.username': 1,
          'userDetails.fullName': 1,
          'userDetails.phone': 1
        }
      }
    ];

    const deposits = await db.collection('deposits').aggregate(pipeline).toArray();

    // Lấy tổng số bản ghi để phân trang
    const total = await db.collection('deposits').countDocuments(filter);

    return NextResponse.json({
      deposits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu nạp tiền' }, { status: 500 });
  }
}

// API để phê duyệt hoặc từ chối yêu cầu nạp tiền
export async function PUT(req: NextRequest) {
  try {
    // Xác thực admin
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    // Create a cookie store from the request headers
    const cookies = cookieHeader.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
      return cookies;
    }, {} as Record<string, string>);

    // Check if admin is authenticated
    if (cookies['admin-session'] !== 'authenticated') {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    // Kết nối DB
    const db = await getMongoDb();

    // Parse request body
    const { depositId, status, notes } = await req.json();

    if (!depositId || !status) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    // Lấy thông tin yêu cầu nạp tiền
    let deposit;
    try {
      deposit = await db.collection('deposits').findOne({ _id: new ObjectId(depositId) });
      if (!deposit) {
        return NextResponse.json({ message: 'Không tìm thấy yêu cầu nạp tiền' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error finding deposit:', error);
      return NextResponse.json({ message: 'Lỗi khi tìm kiếm yêu cầu nạp tiền' }, { status: 500 });
    }

    // Nếu yêu cầu đã được xử lý
    if (deposit.status !== 'pending') {
      return NextResponse.json({ message: 'Yêu cầu này đã được xử lý' }, { status: 400 });
    }

    // Cập nhật trạng thái yêu cầu
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'approved') {
      // Nếu phê duyệt, cập nhật số dư người dùng
      await db.collection('users').updateOne(
        { _id: deposit.user },
        { $inc: { 'balance.available': deposit.amount } }
      );
    }

    // Cập nhật trạng thái yêu cầu
    await db.collection('deposits').updateOne(
      { _id: new ObjectId(depositId) },
      {
        $set: {
          ...updateData,
          notes: notes || ''
        }
      }
    );

    // Lấy thông tin cập nhật để trả về
    const updatedDeposit = await db.collection('deposits').findOne({ _id: new ObjectId(depositId) });

    return NextResponse.json({
      message: `Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} yêu cầu nạp tiền`,
      deposit: updatedDeposit
    });

  } catch (error) {
    console.error('Error processing deposit request:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi khi xử lý yêu cầu nạp tiền' }, { status: 500 });
  }
}
