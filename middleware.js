import { NextResponse } from 'next/server';

export async function middleware(request) {
  const session = request.cookies.get('adminSession')?.value;
  const { pathname } = request.nextUrl;

  // Define protected and public paths
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/admin/auth';
  const isApiRoute = pathname.startsWith('/api');

  // Skip middleware for API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  // If accessing auth page while already authenticated
  if (isAuthPage && session) {
    try {
      // Verify session is valid by checking with the auth endpoint
      const response = await fetch(new URL('/api/admin/auth/check', request.url), {
        headers: {
          Cookie: `adminSession=${session}`
        }
      });
      
      const data = await response.json();
      
      if (data.authenticated) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    } catch (error) {
      // If session check fails, continue to auth page
      return NextResponse.next();
    }
  }

  // If accessing protected route
  if (isAdminRoute && !isAuthPage) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/auth', request.url));
    }

    try {
      // Verify session is valid
      const response = await fetch(new URL('/api/admin/auth/check', request.url), {
        headers: {
          Cookie: `adminSession=${session}`
        }
      });
      
      const data = await response.json();
      
      if (!data.authenticated) {
        throw new Error('Invalid session');
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};