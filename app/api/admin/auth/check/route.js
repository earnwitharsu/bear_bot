import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await dbConnect();

  try {
    const sessionId = request.cookies.get('adminSession')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { authenticated: false, message: 'No session found' },
        { status: 401 }
      );
    }

    const adminUser = await AdminUser.findById(sessionId);
    if (!adminUser) {
      // Clear invalid session cookie
      const response = NextResponse.json(
        { authenticated: false, message: 'Invalid session' },
        { status: 401 }
      );
      
      response.cookies.set({
        name: 'adminSession',
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Session validation failed' },
      { status: 401 }
    );
  }
}