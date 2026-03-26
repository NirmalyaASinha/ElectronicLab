import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Protected routes that require authentication
    const protectedRoutes = ['/student', '/faculty', '/admin'];
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    // Not logged in
    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based protection
    if (session && session.user) {
      const role = (session.user as { id?: string; role?: string; department?: string })?.role;

      if (role === 'STUDENT' && pathname.startsWith('/faculty')) {
        return NextResponse.redirect(new URL('/student', req.url));
      }

      if (role === 'STUDENT' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/student', req.url));
      }

      if (role === 'FACULTY' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/faculty', req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: ['/student/:path*', '/faculty/:path*', '/admin/:path*', '/api/:path*'],
};
