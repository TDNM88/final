import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure upload directory exists
const uploadDir = join(process.cwd(), 'public/uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình cho API route này để cho phép file lớn
export const config = {
  api: {
    bodyParser: false, // Disable body parser để xử lý upload file lớn
  },
  maxDuration: 60, // Tăng thời gian tối đa của serverless function (cho Vercel)
};

// API xử lý upload file
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    // Process form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ message: 'Không tìm thấy file' }, { status: 400 });
    }

    // Validate document type
    if (!['front', 'back'].includes(type)) {
      return NextResponse.json({ message: 'Loại tài liệu không hợp lệ' }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Chỉ chấp nhận file ảnh' }, { status: 400 });
    }

    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Kích thước file không được vượt quá 5MB' }, { status: 400 });
    }

    try {
      // Save file to uploads directory
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = join(uploadDir, fileName);
      const fileUrl = `/uploads/${fileName}`;

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Get MongoDB connection
      const client = await clientPromise;
      const db = client.db();

      // Save document info to database
      try {
        const documentResult = await db.collection('user_documents').insertOne({
          type,
          url: fileUrl,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Trả về đường dẫn file
        return NextResponse.json({
          success: true,
          message: 'File uploaded successfully',
          url: fileUrl,
          type: type,
          documentId: documentResult.insertedId
        }, { status: 200 });
      } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { message: 'Lỗi khi lưu thông tin tài liệu' }, 
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi tải lên tài liệu: ' + (error instanceof Error ? error.message : 'Unknown error') }, 
      { status: 500 }
    );
  }
}
