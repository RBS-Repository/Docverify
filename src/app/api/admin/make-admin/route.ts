import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Helper function to check if the request is from an admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user ID
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user is an admin
    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get the target user ID from the request body
    const { targetUserId } = await request.json();
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }
    
    // Check if the target user exists
    try {
      await adminAuth.getUser(targetUserId);
    } catch (error) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update the user's admin status in Firestore
    await adminDb.collection('users').doc(targetUserId).set({
      isAdmin: true,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }, { merge: true });
    
    return NextResponse.json({ 
      success: true,
      message: 'User has been granted admin privileges'
    });
  } catch (error) {
    console.error('Make admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 