import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

interface DBSession {
  _id: ObjectId;
  sessionId?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: string;
  result?: string;
  [key: string]: any;
}

interface FormattedSession {
  _id: string;
  sessionId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  result?: string;
  [key: string]: any;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get the 10 most recent sessions
    const sessions = await db.collection<DBSession>('sessions')
      .find({})
      .sort({ startTime: -1 })
      .limit(10)
      .toArray();

    const formattedSessions: FormattedSession[] = [];

    for (const session of sessions) {
      const formattedSession: any = {};
      
      // Convert _id to string
      formattedSession._id = session._id.toString();
      
      // Copy other fields
      Object.entries(session).forEach(([key, value]) => {
        if (key !== '_id') {
          formattedSession[key] = value;
        }
      });

      // Safely format dates
      if (session.startTime) {
        const startTime = typeof session.startTime === 'string' 
          ? new Date(session.startTime)
          : session.startTime;
        if (startTime instanceof Date && !isNaN(startTime.getTime())) {
          formattedSession.startTime = startTime.toISOString();
        }
      }

      if (session.endTime) {
        const endTime = typeof session.endTime === 'string'
          ? new Date(session.endTime)
          : session.endTime;
        if (endTime instanceof Date && !isNaN(endTime.getTime())) {
          formattedSession.endTime = endTime.toISOString();
        }
      }
      
      formattedSessions.push(formattedSession);
    }

    return NextResponse.json({
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
