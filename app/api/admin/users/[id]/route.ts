import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user from the request
    // This assumes you have a middleware that verifies the admin token
    // and adds the user to the request object
    
    // Parse the request body
    const { fullName, email, phone, status } = await request.json();
    const userId = params.id;

    // Input validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get MongoDB connection
    const db = await getMongoDb();
    if (!db) {
      throw new Error('Could not connect to database');
    }

    // Prepare update data
    const updateData: any = {
      $set: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(status !== undefined && { 'status.active': status.active }),
        updatedAt: new Date()
      }
    };

    // Update user in database
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      updateData
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get updated user to return
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } } // Exclude password from response
    );

    // Format the response to match the Customer type
    const responseData = {
      ...updatedUser,
      _id: updatedUser?._id.toString(),
      status: {
        active: updatedUser?.status?.active || false,
        betLocked: updatedUser?.status?.betLocked || false,
        withdrawLocked: updatedUser?.status?.withdrawLocked || false
      },
      // Ensure these fields are properly typed
      balance: {
        available: updatedUser?.balance?.available || 0,
        frozen: updatedUser?.balance?.frozen || 0
      },
      // Convert MongoDB dates to ISO strings
      ...(updatedUser?.createdAt && { 
        createdAt: typeof updatedUser.createdAt === 'string' 
          ? new Date(updatedUser.createdAt) 
          : updatedUser.createdAt 
      }),
      ...(updatedUser?.lastLogin && { 
        lastLogin: typeof updatedUser.lastLogin === 'string'
          ? new Date(updatedUser.lastLogin)
          : updatedUser.lastLogin
      })
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
