import { NextResponse } from 'next/server';
import { getCurrentSession, getNextSessions, isSessionActive } from '@/lib/sessionUtils';

// Lấy thông tin phiên hiện tại
export async function GET() {
  try {
    const currentSession = getCurrentSession();
    const nextSessions = getNextSessions(30); // Get next 30 sessions
    
    return NextResponse.json({
      currentSession: {
        ...currentSession,
        status: isSessionActive(currentSession) ? 'active' : 'inactive'
      },
      nextSessions: nextSessions.map(session => ({
        ...session,
        status: 'scheduled'
      })),
      serverTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cập nhật thông tin phiên (chỉ admin)
export async function POST(request: Request) {
  try {
    // Xác thực admin (đơn giản hóa cho ví dụ)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sessions are now managed automatically. No manual updates needed.'
    });
    
  } catch (error) {
    console.error('Error processing session request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
