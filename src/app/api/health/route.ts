import { NextResponse } from 'next/server';
import { logRequest } from '@/lib/sentry';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  let memoryUsage: Record<string, number> | undefined;
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    memoryUsage = {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    };
  }

  const uptime = typeof process !== 'undefined' ? process.uptime() : 0;

  const healthData = {
    status: 'ok' as const,
    timestamp,
    memory: memoryUsage,
    uptime: Math.round(uptime),
  };

  const duration = Date.now() - startTime;
  logRequest({
    timestamp,
    level: 'info',
    endpoint: '/api/health',
    duration,
    message: 'Health check OK',
  });

  return NextResponse.json(healthData, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
