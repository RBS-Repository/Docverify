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

export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const url = new URL(request.url);
    const userIdFilter = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Base query for documents
    let documentsQuery = adminDb.collection('documents');
    
    // Add filters if provided
    if (userIdFilter) {
      documentsQuery = documentsQuery.where('userId', '==', userIdFilter);
    }
    
    // Add pagination
    documentsQuery = documentsQuery.orderBy('createdAt', 'desc').limit(limit).offset(offset);
    
    // Execute the query
    const documentsSnapshot = await documentsQuery.get();
    
    // Process the documents
    const documents = [];
    for (const doc of documentsSnapshot.docs) {
      const data = doc.data();
      
      // Get user information for each document
      let userData = { email: 'Unknown' };
      if (data.userId) {
        try {
          const userRecord = await adminAuth.getUser(data.userId);
          userData = {
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
          };
        } catch (error) {
          console.error(`Error fetching user for document ${doc.id}:`, error);
        }
      }
      
      documents.push({
        id: doc.id,
        ...data,
        user: userData,
      });
    }
    
    // Get total count for pagination
    const totalCountSnapshot = userIdFilter 
      ? await adminDb.collection('documents').where('userId', '==', userIdFilter).count().get()
      : await adminDb.collection('documents').count().get();
    
    const totalCount = totalCountSnapshot.data().count;
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      documents,
      pagination: {
        total: totalCount,
        pages: totalPages,
        currentPage: page,
        limit,
      }
    });
  } catch (error) {
    console.error('Admin documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 