import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';

export async function POST(request) {
  await dbConnect();

  try {
    const { email, password } = await request.json();

    const adminUser = await AdminUser.findOne({ email }).select('+password');
    if (!adminUser || !(await adminUser.matchPassword(password))) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        }
      },
      { status: 200 }
    );

    // Set session data in cookies
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}