import { NextResponse } from 'next/server';
import { isMarketOpen } from '@/services/market/status';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const { symbol } = params;
  const { open, message } = isMarketOpen();
  
  // Placeholder for actual quote fetching logic
  const quote = { price: 0, change: 0, changePercent: 0 };

  const result = {
    symbol,
    marketStatus: open ? 'OPEN' : 'CLOSED',
    marketMessage: message,
    quote: {
      price: quote.price,
      change: open ? quote.change : 0,
      changePercent: open ? quote.changePercent : 0,
      isEOD: !open,
      lastUpdated: new Date().toISOString(),
    },
  };
  return NextResponse.json(result);
}
