import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/messages',
  '/contracts',
  '/proposals',
  '/earnings',
  '/payments',
  '/jobs/new',
  '/jobs/mine',
  '/talent',
  '/reviews',
  '/admin',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth token in cookies
  const token = request.cookies.get('detrust-auth-token')?.value;
  
  // For protected routes, redirect to login if not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // For auth routes, redirect to dashboard if already authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|fonts).*)',
  ],
};
