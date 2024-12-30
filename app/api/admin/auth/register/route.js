// app/api/admin/auth/register/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    console.log('Registration attempt with data:', { ...body, password: '[REDACTED]' });

    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Please provide all required fields: name, email, and password'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format');
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid email address'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      console.log('Email already exists:', email);
      return NextResponse.json({
        success: false,
        message: 'Email already registered'
      }, { status: 400 });
    }

    // Create new user
    const adminUser = await AdminUser.create({
      name,
      email,
      password
    });

    console.log('User created successfully:', adminUser._id);

    const response = NextResponse.json({
      success: true,
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
      }
    }, { status: 201 });

    // Set session cookie
    response.cookies.set({
      name: 'adminSession',
      value: adminUser._id.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Registration failed: ' + (error.message || 'Unknown error')
    }, { status: 400 });
  }
}