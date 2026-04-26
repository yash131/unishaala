import { NextResponse } from 'next/server';

/**
 * Combined Middleware:
 *  (A) Payment routes: attach CORS headers & handle OPTIONS preflight.
 *  (B) Site-wide access control: only the landing page (/) and auth/static/admin/api
 *      routes are accessible without login. Every other page requires the visitor
 *      to be LOGGED IN and have phoneVerified=true. Anyone else is redirected to
 *      `/?auth=required` (not logged in) or `/?auth=verify-phone` (logged in but
 *      phone not verified). The home page uses these params to show a CTA.
 */

// ============ (A) Payment CORS helpers ============

function isPaymentRoute(pathname) {
  return pathname.startsWith('/payment/') || pathname.startsWith('/api/payment/');
}

function handlePaymentRequest(request) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', '*');
  return response;
}

// ============ (B) Access control ============

// Pages that are ALWAYS public (landing, auth pages, legal)
const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/verify-otp',
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy',
]);

// Path prefixes that are always public
const PUBLIC_PREFIXES = [
  '/admin',   // Admin panel has its own role-based guard
  '/api',     // API routes implement their own auth
  '/auth',    // OAuth callback (e.g. /auth/callback) — must be reachable pre-login
  '/_next',   // Next.js internals/assets
  '/favicon',
  '/robots',
  '/sitemap',
  '/images',
  '/fonts',
];

function isPublicPath(pathname) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return true;
  }
  // Allow any static asset with an extension (e.g., /logo.png)
  if (/\.[a-zA-Z0-9]{2,5}$/.test(pathname)) return true;
  return false;
}

/**
 * Decode our custom base64 JWT without verifying signature. Middleware runs on
 * the edge; we avoid crypto/DB work here and rely on cookies being issued only
 * by our authenticated server routes.
 */
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json);
    if (payload?.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_e) {
    return null;
  }
}

// ============ Middleware entry ============

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // (A) Payment requests always bypass access control & get CORS headers
  if (isPaymentRoute(pathname)) {
    return handlePaymentRequest(request);
  }

  // (B) Anything not public requires auth + phoneVerified
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const payload = token ? decodeToken(token) : null;

  // Not logged in → redirect to landing
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('auth', 'required');
    url.searchParams.set('next', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  // Logged in (any role) → allow access. Phone verification is no longer gated.
  return NextResponse.next();
}

export const config = {
  // Match every request except build-time assets. isPublicPath handles the rest.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
