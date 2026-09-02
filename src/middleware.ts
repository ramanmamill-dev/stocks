import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/sentry';

export const config = {
  matcher: '/api/:path*',
};

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || '',
  'http://localhost:3000',
].filter(Boolean);

function getOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*';
}

export async function middleware(request: NextRequest) {
  const { method, nextUrl } = request;
  const origin = getOrigin(request);
  const endpoint = nextUrl.pathname;
  const startTime = Date.now();

  if (method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    preflight.headers.set('Access-Control-Allow-Origin', origin);
    preflight.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    preflight.headers.set('Access-Control-Max-Age', '86400');

    const duration = Date.now() - startTime;
    logRequest({
      timestamp: new Date().toISOString(),
      level: 'debug',
      endpoint,
      duration,
      message: 'CORS preflight',
    });

    return preflight;
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const duration = Date.now() - startTime;
  const status = response.status;
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

  logRequest({
    timestamp: new Date().toISOString(),
    level,
    endpoint,
    duration,
    message: `${method} ${endpoint} - ${status}`,
  });

  return response;
}
