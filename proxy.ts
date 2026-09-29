import { NextRequest, NextResponse } from 'next/server';
// import type { NextRequest } from 'next/request';

export default function middleware(request: NextRequest) {
  // 1. Get the cookie directly from the request headers
  const token = request.cookies.get('token')?.value; 

  // 2. Define the path you are trying to protect
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // 3. Redirect to login if a guest tries to access a protected page
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Redirect to dashboard if a logged-in user tries to visit login/signup
//   const isAuthRoute = ['/login', '/signup'].includes(request.nextUrl.pathname);
//   if (isAuthRoute && token) {
//     return NextResponse.redirect(new URL('/dashboard', request.url));
//   }

  return NextResponse.next();
}

// Limit the middleware to run only on specific routes (avoids static files/images)
export const config = {
  matcher: ['/dashboard/:path*', '/'],
};
// Use code with caution