import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip public assets and the login page itself
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/login' || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check for the presence of the authentication token
  const token = request.cookies.get('auth-token')

  // Redirection: If no token exists, send everyone to /login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in: If user has token and is trying to hit login, send to home
  if (token && pathname === '/login') {
    return NextResponse.next() // Alternatively redirect to home, but logic above handles exclusion
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all protected application routes:
     * - The root home page (/)
     * - Employee management portals
     * - Organization management
     * - RVSF management
     */
    '/',
    '/employee/:path*',
    '/organization/:path*',
    '/rvsf/:path*',
  ],
}
