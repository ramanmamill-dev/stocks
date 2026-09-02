import { NextResponse } from 'next/server';
import { isMarketOpen } from '@/services/market/status';

export const runtime = 'edge';

export async function GET() {
  const { open, message } = isMarketOpen();
  
  return NextResponse.json({
    open,
    message,
    timestamp: new Date().toISOString(),
  });
}
