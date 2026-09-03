import { NextResponse } from 'next/server';
import { isMarketOpen } from '@/services/market/status';

export const runtime = 'nodejs';

export async function GET() {
  const status = isMarketOpen();

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
