import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // For ICICI payment callback endpoint, allow all origins and methods
  if (pathname === '/api/payment/icici/return' || pathname.startsWith('/api/payment/')) {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // For actual requests, add CORS headers to response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    return response;
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/api/payment/:path*',
  ],
};
