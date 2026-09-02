# StockSignal AI – Full Product Specification

**Enterprise-Grade Web App for NSE & BSE Stock Analysis**

> Built on 100% Free & Open Source APIs | Optimized for Render.com Free Tier | Market Closed Fallback (EOD Data)

---

## 1. Overview

StockSignal AI is a professional, Bloomberg-style web application that provides real-time predictive stock analysis (**Strong Buy, Buy, Hold, Sell, Strong Sell**) for NSE and BSE listed stocks.

It operates on a hybrid selection model (Type to Search & Click to Explore) and delivers analysis across **1m, 5m, 15m, 1h, and 1d** timeframes. When the market is closed, the UI automatically switches to **End-of-Day (EOD)** static data mode, ensuring users always see the last known closing price.

## 2. Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Signals** | Strong Buy / Buy / Hold / Sell / Strong Sell with Confidence Score (0-100) |
| **Market Status Detection** | Automatically detects market open/close based on IST. Shows "Closed – EOD Data" banner when applicable. |
| **EOD Fallback** | Fetches and displays the last closing price (Previous Close / Last Traded Price) when the market is down. |
| **Multiple Timeframes** | 1m, 5m, 15m, 1h, 1d intervals (with clear labels if closed). |
| **Professional Charts** | Candlestick, RSI, MACD, Volume, Bollinger Bands, Moving Averages. |
| **Stock Screener** | 20+ filters (Signal, P/E, ROE, D/E, RSI, Market Cap, Sector). |
| **Smart Search** | Fuzzy search with ⌘K shortcut. |
| **Watchlist** | Save favorite stocks with live signal badges. |
| **AI Reasoning** | Natural language summary explaining the "why" behind each signal. |

## 3. Data Sources – 100% Free APIs

We use **free and open-source** third-party libraries. **No official NSE/BSE APIs** (which are paid).

| Source | Type | Coverage | Auth Needed |
|--------|------|----------|-------------|
| **yfinance** | Library | Live & historical OHLC, fundamentals | ❌ No |
| **Indian-Stock-Market-API** | REST | Real-time prices, P/E, sector, market cap | ❌ No |
| **Breeze API** (optional) | WebSocket | Real-time OHLC (fallback for WebSocket) | ✅ ICICIdirect (free) |

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SINGLE WEB SERVICE                  │
│               (Render Free: 512MB RAM, 0.1 CPU)                │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + Tailwind + Lightweight Charts)              │
│  ├─ Header (Global Search, Market Status Banner)              │
│  ├─ Dashboard (Top Signals, Sector Heatmap)                   │
│  └─ Stock Detail (Candlestick Chart, Signal Card)             │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (/api/*)                                           │
│  ├─ /api/health                                                │
│  ├─ /api/market/status  → Checks IST time, returns OPEN/CLOSED│
│  ├─ /api/signal/[symbol] → Fetches data. If CLOSED, uses EOD.│
│  └─ /api/screener                                              │
├─────────────────────────────────────────────────────────────────┤
│  Services (Node.js)                                            │
│  ├─ yahoo-finance2 (price & historical)                       │
│  ├─ technicalindicators (RSI, MACD, BB)                       │
│  └─ MarketStatusService (isMarketOpen() helper)               │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   ┌───────────┐                  ┌───────────┐
   │ Supabase  │                  │  Upstash  │
   │ (Postgres)│                  │  Redis    │
   │ (500MB)   │                  │ (Cache)   │
   └───────────┘                  └───────────┘
```

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Frontend** | React, Tailwind CSS, Lightweight Charts |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Cache** | Upstash Redis |
| **Data APIs** | yahoo-finance2, Indian-Stock-Market-API |
| **Hosting** | Render.com Free Tier |

## 6. File Structure

```
stocksignal-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/
│   │   │   │   └── route.ts
│   │   │   ├── market/
│   │   │   │   └── status/
│   │   │   │       └── route.ts
│   │   │   ├── signal/
│   │   │   │   └── [symbol]/
│   │   │   │       └── route.ts
│   │   │   └── screener/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── MarketStatusBanner.tsx
│   │   │   └── Footer.tsx
│   │   ├── charts/
│   │   │   ├── CandlestickChart.tsx
│   │   │   ├── RSIChart.tsx
│   │   │   ├── MACDChart.tsx
│   │   │   └── VolumeChart.tsx
│   │   ├── signals/
│   │   │   ├── SignalCard.tsx
│   │   │   └── SignalBadge.tsx
│   │   ├── screener/
│   │   │   └── ScreenerPanel.tsx
│   │   └── search/
│   │       └── SearchModal.tsx
│   ├── services/
│   │   ├── market/
│   │   │   └── status.ts
│   │   ├── yahoo-finance.ts
│   │   ├── technical-indicators.ts
│   │   └── signals.ts
│   ├── hooks/
│   │   ├── useMarketStatus.ts
│   │   ├── useStockSignal.ts
│   │   └── useWatchlist.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── redis.ts
│   └── types/
│       ├── stock.ts
│       └── signal.ts
├── public/
│   ├── favicon.ico
│   └── icons/
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 7. Database Schema (Supabase / PostgreSQL)

```sql
-- Watchlists
CREATE TABLE watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cached Signals (for performance)
CREATE TABLE cached_signals (
  symbol TEXT PRIMARY KEY,
  signal TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  timeframe TEXT NOT NULL,
  reasoning TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screener Presets
CREATE TABLE screener_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 8. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Upstash Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=
```

## 9. Core Code

### Market Status Service (`src/services/market/status.ts`)

```typescript
export function isMarketOpen(): { open: boolean; message: string } {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const day = istTime.getUTCDay();

  if (day === 0 || day === 6) {
    return { open: false, message: 'Market Closed (Weekend)' };
  }

  const marketOpenTime = 9 * 60 + 15;
  const marketCloseTime = 15 * 60 + 30;
  const currentMinutes = hours * 60 + minutes;

  if (currentMinutes >= marketOpenTime && currentMinutes < marketCloseTime) {
    return { open: true, message: 'Market Open' };
  } else {
    return { open: false, message: 'Market Closed (After Hours)' };
  }
}
```

### Signal API Route (`src/app/api/signal/[symbol]/route.ts`)

```typescript
import { isMarketOpen } from '@/services/market/status';

export async function GET(request, { params }) {
  const { open, message } = isMarketOpen();
  const quote = await getLiveQuote(symbol);

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
    ...signalResult,
  };
  return NextResponse.json(result);
}
```

### Market Status Banner (`src/components/layout/MarketStatusBanner.tsx`)

```typescript
export function MarketStatusBanner({ isOpen, message, lastUpdated }) {
  if (isOpen) return null;
  return (
    <div className="bg-[#F23645]/10 border-b border-[#F23645] text-center py-2 px-4 text-sm text-[#F23645]">
      <span className="font-medium">🔒 {message}</span>
      <span className="mx-2">·</span>
      <span>Showing Last Traded Price (EOD)</span>
      <span className="mx-2">·</span>
      <span className="text-[#787B86]">Updated: {new Date(lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
    </div>
  );
}
```

## 10. UI/UX Design

- **Theme**: Bloomberg-style dark/light professional interface
- **Color Palette**:
  - Primary Green: `#00B386`
  - Success: `#00E6A0`
  - Warning: `#F0B90B`
  - Danger: `#F23645`
  - Background: `#f8f9fc`
  - Surface: `#ffffff`
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Layout**: Responsive container with max-width 1100px
- **Components**: Cards, badges, tables, code blocks, blockquotes

## 11. Market Status Logic

- Checks IST timezone (UTC + 5:30)
- Market hours: 9:15 AM to 3:30 PM IST
- Weekend detection (Saturday/Sunday)
- After-hours detection
- Automatic EOD data fallback
- Visual banner when closed

**User Experience:**
- If the market is open, the banner is hidden, and real-time updates flow normally.
- If the market is closed, a prominent red/orange banner appears at the top of the app, and all charts/data are clearly marked with an "(EOD)" indicator.

## 12. Deployment (Render.com)

```yaml
services:
  - type: web
    name: stocksignal-ai
    runtime: node
    plan: free
    region: singapore
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
      - key: UPSTASH_REDIS_URL
        sync: false
      - key: UPSTASH_REDIS_TOKEN
        sync: false
    healthCheckPath: /api/health
    autoDeploy: true
```

## 13. Keep-Alive Strategy

Render free tier services sleep after 15 minutes. Use **cron-job.org** (free) to ping `/api/health` every 10 minutes.

## 14. UI Components

### Signal Badge Configuration

```typescript
const signalConfig = {
  STRONG_BUY: { label: 'STRONG BUY', color: 'bg-[#00E6A0] text-black' },
  BUY: { label: 'BUY', color: 'bg-[#00B386] text-white' },
  HOLD: { label: 'HOLD', color: 'bg-[#F0B90B] text-black' },
  SELL: { label: 'SELL', color: 'bg-[#F23645] text-white' },
  STRONG_SELL: { label: 'STRONG SELL', color: 'bg-[#FF2D4B] text-white' },
};
```

## 15. Disclaimer & Legal

> **⚠️ NOT FINANCIAL ADVICE**
>
> StockSignal AI provides AI-generated analysis for educational and research purposes only. Data is sourced from public APIs (yahoo-finance2) and may be delayed. **Past performance does not guarantee future results.**

## 16. Roadmap & Future Enhancements

| Phase | Milestones |
|-------|------------|
| **Phase 1 (MVP)** | Core signals, dashboard, EOD fallback, watchlist, search |
| **Phase 2** | Real-time WebSocket (Breeze API), portfolio tracker |
| **Phase 3** | Backtesting engine, custom alerts |

---

**Build with ❤️ for Indian retail investors.**

**Data-driven. Free. Enterprise-grade. EOD-Ready.**

*Document version 2.1 — September 2026*
