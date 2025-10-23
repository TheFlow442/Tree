
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // If the user is on the root path and not going to the splash screen, redirect them to the splash screen.
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/splash', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - splash
     * - login
     */
    '/((?!api|_next/static|_next/image|favicon.ico|splash|login).*)',
    // We explicitly match the root path here to ensure the redirect to /splash happens.
    '/',
  ],
}
