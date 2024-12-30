// app/api/admin/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  // Clear the session cookie
  response.cookies.set({
    name: 'adminSession',
    value: '',
    expires: new Date(0),
    path: '/admin/login',
  });

  return response;
}