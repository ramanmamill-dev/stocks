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

## 17. Robustness & Edge Cases

This section covers production-grade resilience for Indian stock market specifics and free-tier infrastructure limits.

### 17.1 Market Holidays Calendar

The market status service must account for Indian trading holidays beyond weekends.

**Holiday Sources:**
- NSE official holiday list (published annually): `https://www.nseindia.com/regulatory/listingObligations`
- BSE holiday calendar: `https://www.bseindia.com/markets/market-static.aspx?pageable_id=230`

**Implementation:**
```typescript
const MARKET_HOLIDAYS_2026 = [
  '2026-01-26', // Republic Day
  '2026-03-02', // Mahashivratri
  '2026-03-18', // Holi
  '2026-03-25', // Ram Navami
  '2026-04-14', // Dr. Ambedkar Jayanti / Mahavir Jayanti
  '2026-04-30', // Mahavir Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-06-08', // Bakri Id / Eid al-Adha
  '2026-08-15', // Independence Day
  '2026-08-18', // Janmashtami
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-12', // Dussehra
  '2026-11-01', // Diwali (Laxmi Pujan)
  '2026-11-04', // Diwali (Bali Pratipada)
  '2026-11-05', // Gurunanak Jayanti
  '2026-12-25', // Christmas
];
```

**Logic:**
```typescript
export function isMarketOpen(): { open: boolean; message: string } {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dateStr = istDate.toISOString().split('T')[0];
  const day = istDate.getUTCDay();

  if (day === 0 || day === 6) {
    return { open: false, message: 'Market Closed (Weekend)' };
  }

  if (MARKET_HOLIDAYS_2026.includes(dateStr)) {
    return { open: false, message: `Market Closed (Holiday: ${dateStr})` };
  }

  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketOpenTime = 9 * 60 + 15;
  const marketCloseTime = 15 * 60 + 30;

  if (currentMinutes >= marketOpenTime && currentMinutes < marketCloseTime) {
    return { open: true, message: 'Market Open' };
  }

  return { open: false, message: 'Market Closed (After Hours)' };
}
```

### 17.2 Symbol Normalization

**NSE vs BSE Suffixes:**
- NSE symbols end with `.NS` (e.g., `RELIANCE.NS`)
- BSE symbols end with `.BO` (e.g., `RELIANCE.BO`)

**Validation Rules:**
```typescript
const SYMBOL_REGEX = /^[A-Z0-9]{1,20}\.(NS|BO)$/;

function sanitizeSymbol(input: string): string {
  const cleaned = input.toUpperCase().trim();
  if (!SYMBOL_REGEX.test(cleaned)) {
    throw new Error(`Invalid symbol format: ${input}. Expected format: SYMBOL.NS or SYMBOL.BO`);
  }
  return cleaned;
}
```

**Edge Cases:**
- **Delisted stocks**: yfinance returns empty data. Detect and show “Symbol delisted or invalid”.
- **Corporate actions**: Splits/bonuses/dividends cause price discontinuities. Use adjusted close prices (`Adj Close`) for all historical calculations.
- **Duplicate listings**: Some stocks trade on both NSE and BSE. Allow user to select exchange explicitly.

### 17.3 Circuit Filters

Indian stocks have price bands (circuit limits) of 5%, 10%, or 20% depending on stock category.

**Detection:**
```typescript
function checkCircuit(previousClose: number, currentPrice: number, limit: number = 20): { hit: boolean; direction: 'upper' | 'lower' | null } {
  const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
  if (changePercent >= limit) return { hit: true, direction: 'upper' };
  if (changePercent <= -limit) return { hit: true, direction: 'lower' };
  return { hit: false, direction: null };
}
```

**UI Display:**
- Show “🔴 Upper Circuit” or “🟢 Lower Circuit” badge
- Disable trading/signal updates when circuit is hit (price is locked)

### 17.4 API Rate Limiting & Resilience

**Problem:** yfinance throttles after ~10 requests/min. Indian-Stock-Market-API has undocumented rate limits.

**Solutions:**

**Exponential Backoff:**
```typescript
async function fetchWithBackoff<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      const delay = Math.min(1000 * Math.pow(2, i), 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Circuit Breaker:**
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold && Date.now() - this.lastFailure < this.timeout) {
      throw new Error('Circuit breaker open - API temporarily unavailable');
    }
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      throw error;
    }
  }
}
```

**Fallback Chain:**
1. Primary: yfinance
2. Secondary: Indian-Stock-Market-API
3. Tertiary: Upstash Redis cache (max 5 min TTL)
4. Final: Display last known cached data with “Data may be stale” warning

### 17.5 Data Staleness Policy

```typescript
interface StalenessPolicy {
  maxAgeMinutes: number;
  warningThresholdMinutes: number;
}

const STALENESS_POLICY: Record<string, StalenessPolicy> = {
  live: { maxAgeMinutes: 5, warningThresholdMinutes: 2 },
  eod: { maxAgeMinutes: 1440, warningThresholdMinutes: 720 }, // 24 hours
  holiday: { maxAgeMinutes: 2880, warningThresholdMinutes: 1440 }, // 48 hours
};
```

**UI Display:**
- If data age > warningThreshold: Show yellow warning “Data is X minutes old”
- If data age > maxAge: Show red error “Data unavailable. Please try again later.”

### 17.6 Decimal Precision & Formatting

Indian stocks have varying decimal places:
- Large caps (Nifty 50): 2 decimal places
- Some stocks: 1 decimal place (e.g., `TATASTEEL`)
- Some stocks: 0 decimal places (penny stocks)

**Formatting:**
```typescript
function formatPrice(price: number, symbol: string): string {
  const precision = getDecimalPlaces(symbol); // Fetch from instrument master
  return price.toFixed(precision);
}

function getDecimalPlaces(symbol: string): number {
  const largeCaps = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
  if (largeCaps.includes(symbol.replace('.NS', '').replace('.BO', ''))) return 2;
  return 2; // Default; fetch from instrument master in production
}
```

**Lot Size Display:**
- Show “1 lot = X shares” in stock detail view
- Calculate position value as `price * lotSize`

### 17.7 Error States & UX

**Required UI States:**
1. **Skeleton Loaders** — Shimmer effect while fetching signal data
2. **Empty States** — “No stocks match your screener criteria” with suggested filters
3. **API Down Banner** — Global banner when primary API is unreachable
4. **Retry Mechanism** — Auto-retry 3x with exponential backoff, then manual retry button
5. **Toast Notifications** — Success/error toasts for watchlist actions, signal updates

**Example Error Banner:**
```tsx
{apiStatus === 'down' && (
  <div className="bg-yellow-50 border-b border-yellow-200 text-center py-2 px-4 text-sm text-yellow-800">
    ⚠️ Data API is temporarily unavailable. Showing cached data from {lastUpdated}.
    <button onClick={retry} className="ml-2 underline">Retry</button>
  </div>
)}
```

### 17.8 Timezone Discipline

**Bug Fix:** The current `isMarketOpen()` implementation adds UTC offset to `getTime()` and then calls `getUTCHours()`, which produces incorrect results.

**Correct Implementation:**
```typescript
export function isMarketOpen(): { open: boolean; message: string } {
  const now = new Date();
  
  // Convert to IST using Intl API (handles DST, leap seconds)
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const day = istTime.getDay();

  if (day === 0 || day === 6) {
    return { open: false, message: 'Market Closed (Weekend)' };
  }

  const currentMinutes = hours * 60 + minutes;
  const marketOpenTime = 9 * 60 + 15;
  const marketCloseTime = 15 * 60 + 30;

  if (currentMinutes >= marketOpenTime && currentMinutes < marketCloseTime) {
    return { open: true, message: 'Market Open' };
  }

  return { open: false, message: 'Market Closed (After Hours)' };
}
```

**Rules:**
- All server-side timestamps: UTC
- All client-side displays: Convert to IST using `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`
- API responses: ISO 8601 with `Z` suffix (e.g., `2026-09-02T09:30:00Z`)

### 17.9 Security

**Input Sanitization:**
```typescript
function sanitizeSymbol(symbol: string): string {
  if (!/^[A-Z0-9]{1,20}\.(NS|BO)$/.test(symbol.toUpperCase().trim())) {
    throw new Error('Invalid symbol');
  }
  return symbol.toUpperCase().trim();
}
```

**API Route Protection:**
- CORS: `Access-Control-Allow-Origin: https://yourdomain.com` (not `*`)
- Rate Limiting: 100 requests/15min per IP using Upstash Redis
- Input Validation: Reject symbols > 20 chars, special chars except `.`
- No PII in logs: Strip user agents, IP addresses after 7 days

**Supabase Security:**
- Enable RLS on all tables
- `watchlists`: User can only read/write own rows (`auth.uid() = user_id`)
- `cached_signals`: Read-only for authenticated users, write only via service role

### 17.10 Accessibility (WCAG 2.1 AA)

**Keyboard Navigation:**
- `⌘K` / `Ctrl+K` opens search modal
- `Escape` closes modal
- `Tab` cycles through results
- `Enter` selects stock
- Focus trap inside modal (Tab cycles within modal only)

**ARIA Labels:**
```tsx
<div 
  role="img" 
  aria-label="Candlestick chart showing RELIANCE price movement over 1 day"
>
  <CandlestickChart />
</div>
```

**Color Contrast:**
- Signal badges must meet 4.5:1 contrast ratio
- Red banner on white: Use `#F23645` with bold text (passes WCAG AA)
- Green signal on white: Use `#00B386` with white text (passes WCAG AA)

**Screen Reader Announcements:**
```tsx
<div aria-live="polite" className="sr-only">
  {signalChange && `Signal updated to ${signal} with ${confidence}% confidence`}
</div>
```

### 17.11 Offline / PWA

**Service Worker Caching:**
```typescript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('stocksignal-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json',
      ]);
    })
  );
});
```

**Features:**
- Cache watchlist data locally (IndexedDB)
- Show offline banner when `navigator.onLine === false`
- Install prompt for desktop/mobile

### 17.12 Brokerage & Tax Calculations (Phase 2)

When portfolio tracking is added, include realistic Indian market costs:

**Cost Components:**
| Component | Rate | Notes |
|-----------|------|-------|
| STT (Securities Transaction Tax) | 0.1% | On buy + sell |
| Brokerage | 0.05% | Max ₹20 per order (discount brokers) |
| GST | 18% | On brokerage |
| Stamp Duty | 0.015% | On buy side only |
| DP Charges | ₹15.93 | Per scrip per day (sell side) |

**Example Calculation:**
```typescript
function calculateNetProfit(buyPrice: number, sellPrice: number, quantity: number): number {
  const turnover = (buyPrice + sellPrice) * quantity;
  const stt = turnover * 0.001;
  const brokerage = Math.min(turnover * 0.0005, 40);
  const gst = brokerage * 0.18;
  const stampDuty = buyPrice * quantity * 0.00015;
  const dpCharges = 15.93;
  
  const totalCost = stt + brokerage + gst + stampDuty + dpCharges;
  const grossProfit = (sellPrice - buyPrice) * quantity;
  
  return grossProfit - totalCost;
}
```

### 17.13 Testing Strategy

**Unit Tests:**
- `isMarketOpen()`: Test weekends, holidays, pre-market, post-market, exact boundary times (9:15, 15:30)
- `sanitizeSymbol()`: Valid symbols, invalid symbols, edge cases (empty, 21 chars, lowercase)
- `checkCircuit()`: Upper circuit, lower circuit, no circuit
- `formatPrice()`: 0 decimal, 1 decimal, 2 decimal places

**Integration Tests:**
- `/api/signal/[symbol]`: Mock yfinance, test OPEN vs CLOSED response structure
- `/api/market/status`: Verify IST conversion accuracy
- Fallback chain: Simulate primary API failure, verify secondary API is called

**E2E Tests (Playwright):**
- Search flow: Open app → press `⌘K` → type “RELI” → select RELIANCE.NS
- Watchlist flow: Add stock → verify badge appears → remove stock → verify badge disappears
- Market closed flow: Mock closed market → verify EOD banner appears

### 17.14 Monitoring & Observability

**Render Metrics:**
- Memory usage (alert if > 450MB / 512MB limit)
- CPU usage (alert if > 0.08 / 0.1 CPU)
- Response time p95 (alert if > 3000ms)
- Error rate (alert if > 5%)

**Application Metrics:**
- API latency per endpoint (store in Upstash Redis sorted set)
- yfinance API error rate (circuit breaker trigger count)
- Cache hit rate (Redis `INFO stats`)
- Active users (unique IPs per hour)

**Error Tracking:**
- Sentry free tier (5K events/month): Capture API route errors, unhandled rejections
- Custom logging: `[timestamp] [level] [endpoint] [symbol] [message] [duration_ms]`

**Alerting:**
- PagerDuty / Email if Render health check fails 3x in 5 minutes
- Slack webhook for daily summary: API calls, error rate, cache hit rate

### 17.15 Legal & Compliance

**SEBI Regulations:**
- Display SEBI registration number if providing investment advice
- Ensure data is not presented as “real-time” if delayed (>15 min for NSE)
- Include “Investments are subject to market risks” disclaimer on every page

**Data Vendor Attribution:**
- Yahoo Finance terms require attribution: “Data provided by Yahoo Finance”
- Indian-Stock-Market-API: Check license for commercial use

**Privacy Policy:**
- Watchlist data stored in Supabase (user-specific)
- No PII collected beyond email (if auth added)
- GDPR/DPDP compliant data deletion endpoint

---

**Build with ❤️ for Indian retail investors.**

**Data-driven. Free. Enterprise-grade. EOD-Ready.**

*Document version 2.1 — September 2026*
