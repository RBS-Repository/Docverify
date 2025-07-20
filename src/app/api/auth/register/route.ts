import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse the request body
    const body = await request.json();
    const { uid, email, displayName, photoURL } = body;
    
    if (!uid || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ uid });
    
    if (existingUser) {
      // Update the existing user
      existingUser.lastLoginAt = new Date();
      if (displayName) existingUser.displayName = displayName;
      if (photoURL) existingUser.photoURL = photoURL;
      
      await existingUser.save();
      
      return NextResponse.json({
        success: true,
        message: 'User login recorded',
        user: existingUser
      });
    }
    
    // Create a new user
    const newUser = new User({
      uid,
      email,
      displayName: displayName || '',
      photoURL: photoURL || '',
    });
    
    await newUser.save();
    
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });
    
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    return NextResponse.json(
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    );
  }
} 