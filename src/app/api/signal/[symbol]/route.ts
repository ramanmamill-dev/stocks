import { NextResponse } from 'next/server';
import { isMarketOpen } from '@/services/market/status';
import { sanitizeSymbol, InvalidSymbolError } from '@/lib/validators';
import { getLiveQuote } from '@/services/yahoo-finance';
import { generateSignal } from '@/services/signals';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = sanitizeSymbol(params.symbol);
    const market = isMarketOpen();

    let quote;
    try {
      quote = await getLiveQuote(symbol);
    } catch {
      return NextResponse.json(
        {
          error: 'Unable to fetch quote data. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          retryable: true,
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!market.open) {
      quote = {
        ...quote,
        change: 0,
        changePercent: 0,
        isEOD: true,
      };
    }

    const signal = await generateSignal(symbol);

    return NextResponse.json(
      {
        symbol,
        marketStatus: market.open ? 'OPEN' : 'CLOSED',
        marketMessage: market.message,
        marketReason: market.reason ?? null,
        quote: {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          previousClose: quote.previousClose,
          dayHigh: quote.dayHigh,
          dayLow: quote.dayLow,
          volume: quote.volume,
          isEOD: quote.isEOD,
          lastUpdated: quote.lastUpdated,
        },
        signal: {
          type: signal.signal,
          confidence: signal.confidence,
          reasoning: signal.reasoning,
          indicators: signal.indicators,
          generatedAt: signal.generatedAt,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof InvalidSymbolError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        retryable: true,
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
