import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'auth',
  'cdn',
  'status',
  'mail',
]);

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';

  // Normalize hostname by removing port (e.g., "clickerbabu.localhost:3000" -> "clickerbabu.localhost")
  const cleanHost = hostname.split(':')[0].toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'business-online.in').toLowerCase();

  let subdomain: string | null = null;

  if (cleanHost.endsWith('.localhost')) {
    // Local testing: e.g. "clickerbabu.localhost"
    subdomain = cleanHost.replace('.localhost', '');
  } else if (cleanHost.endsWith(`.${rootDomain}`)) {
    // Production testing: e.g. "clickerbabu.business-online.in"
    subdomain = cleanHost.replace(`.${rootDomain}`, '');
  }

  // Support query param fallback for direct browser preview: ?tenant=clickerbabu
  const tenantParam = url.searchParams.get('tenant');
  if (!subdomain && tenantParam && (cleanHost === 'localhost' || cleanHost === rootDomain || cleanHost === `www.${rootDomain}`)) {
    if (url.pathname === '/' || url.pathname === '') {
      return NextResponse.rewrite(new URL(`/s/${encodeURIComponent(tenantParam)}`, request.url));
    }
  }

  // If request has a valid merchant subdomain
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    // Rewrite path to /s/[subdomain]
    if (url.pathname === '/' || url.pathname === '') {
      return NextResponse.rewrite(new URL(`/s/${encodeURIComponent(subdomain)}`, request.url));
    }
    // Allow static assets, images, and API routes to pass through
    if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next') && !url.pathname.includes('.')) {
      return NextResponse.rewrite(new URL(`/s/${encodeURIComponent(subdomain)}${url.pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.svg|robots.txt|sitemap.xml).*)',
  ],
};
