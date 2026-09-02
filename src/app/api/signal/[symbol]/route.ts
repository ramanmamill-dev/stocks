import { NextResponse } from 'next/server';
import { isMarketOpen } from '@/services/market/status';
import { sanitizeSymbol, InvalidSymbolError } from '@/lib/validators';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = sanitizeSymbol(params.symbol);
    const market = isMarketOpen();

    // Placeholder quote (chunk 5 will replace with real yfinance call).
    const raw = { price: 0, change: 0, changePercent: 0, previousClose: 0 };

    return NextResponse.json(
      {
        symbol,
        marketStatus: market.open ? 'OPEN' : 'CLOSED',
        marketMessage: market.message,
        marketReason: market.reason ?? null,
        quote: {
          symbol,
          price: raw.price,
          change: market.open ? raw.change : 0,
          changePercent: market.open ? raw.changePercent : 0,
          previousClose: raw.previousClose,
          isEOD: !market.open,
          lastUpdated: new Date().toISOString(),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof InvalidSymbolError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
