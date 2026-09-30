import { NextRequest, NextResponse } from 'next/server';
// import type { NextRequest } from 'next/request';

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value; 
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // 1. If trying to access dashboard without a token, redirect to home
  if (isDashboardRoute && !token) {
    const response = NextResponse.redirect(new URL('/', request.url));
    // Prevent edge caching of the redirect
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  // 2. Allow the request to proceed normally, but disable middleware caching 
  // so it reads newly set cross-domain cookies instantly without failing
  const response = NextResponse.next();
  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};