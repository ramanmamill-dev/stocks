# StockSignal AI – Chunk-wise Development Plan

**Purpose:** Break the product spec into executable development chunks so the team can build, test, and ship incrementally.

---

## How to Use This Document

- Each **Chunk** is a standalone, deliverable unit of work.
- Complete chunks in order (Chunk 1 → Chunk 12).
- Each chunk has: **Goal**, **Tasks**, **Files to Create/Edit**, **Acceptance Criteria**, and **Dependencies**.
- After completing a chunk, run `npm run lint && npm run typecheck` before moving to the next.

---

## Chunk 1: Foundation & Environment Setup

**Goal:** Get the Next.js app running locally with TypeScript, Tailwind, and linting.

**Tasks:**
1. Initialize Next.js 14 project with App Router and TypeScript.
2. Install and configure Tailwind CSS.
3. Set up ESLint and Prettier.
4. Create `.env.example` with all required variables.
5. Verify `npm run dev` starts without errors.

**Files to Create/Edit:**
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `next.config.js`
- `.eslintrc.json`
- `.env.example`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

**Acceptance Criteria:**
- `npm run dev` serves the app at `localhost:3000`
- `npm run lint` passes
- `npm run typecheck` passes
- Tailwind classes render correctly

**Dependencies:** None

---

## Chunk 2: Shared Types & Utilities

**Goal:** Define the TypeScript types and helper functions used across the app.

**Tasks:**
1. Create type definitions for `StockQuote`, `SignalResult`, `MarketStatus`.
2. Create symbol validation and sanitization utilities.
3. Create price formatting utilities (decimal precision).
4. Create timezone utility functions (UTC ↔ IST).

**Files to Create/Edit:**
- `src/types/stock.ts`
- `src/types/signal.ts`
- `src/lib/utils.ts` (new)
- `src/lib/validators.ts` (new)

**Acceptance Criteria:**
- All types compile without errors
- `sanitizeSymbol('RELIANCE.NS')` returns `'RELIANCE.NS'`
- `sanitizeSymbol('reliance.ns')` returns `'RELIANCE.NS'`
- `sanitizeSymbol('INVALID!')` throws error
- `formatPrice(1234.5, 'RELIANCE.NS')` returns `'1234.50'`

**Dependencies:** Chunk 1

---

## Chunk 3: Market Status Service

**Goal:** Implement accurate market open/close detection for IST timezone, including weekends and holidays.

**Tasks:**
1. Implement `isMarketOpen()` using `Intl.DateTimeFormat` for IST conversion.
2. Add market holidays list for current and next year.
3. Write unit tests for boundary conditions (9:15, 15:30, weekends, holidays).

**Files to Create/Edit:**
- `src/services/market/status.ts`
- `src/services/market/holidays.ts` (new)
- `src/services/market/__tests__/status.test.ts` (new)

**Acceptance Criteria:**
- Returns `OPEN` at 09:30 IST on a weekday
- Returns `CLOSED` at 09:14 IST on a weekday
- Returns `CLOSED` on Saturday/Sunday
- Returns `CLOSED` on a holiday (e.g., 2026-01-26)
- All unit tests pass

**Dependencies:** Chunk 2

---

## Chunk 4: API Infrastructure

**Goal:** Create the API route structure and database clients.

**Tasks:**
1. Create Supabase client singleton.
2. Create Upstash Redis client singleton.
3. Create `/api/health` endpoint.
4. Create `/api/market/status` endpoint.
5. Set up CORS headers on all API routes.

**Files to Create/Edit:**
- `src/lib/supabase.ts`
- `src/lib/redis.ts`
- `src/app/api/health/route.ts`
- `src/app/api/market/status/route.ts`
- `src/middleware.ts` (new, for CORS)

**Acceptance Criteria:**
- `GET /api/health` returns `{ status: 'ok', timestamp: '...' }`
- `GET /api/market/status` returns `{ open: boolean, message: string, timestamp: '...' }`
- CORS headers present on all responses
- Supabase and Redis clients initialize without errors (even with dummy env vars)

**Dependencies:** Chunk 2

---

## Chunk 5: Data Layer – Yahoo Finance Integration

**Goal:** Fetch live and historical stock data from Yahoo Finance with resilience.

**Tasks:**
1. Implement `getLiveQuote(symbol)` using `yahoo-finance2`.
2. Implement `getHistoricalData(symbol, timeframe)` with interval mapping.
3. Add exponential backoff wrapper for API calls.
4. Add Redis caching layer (5-minute TTL for quotes, 1-hour for historical).
5. Implement fallback chain: yfinance → Indian-Stock-Market-API → cache.

**Files to Create/Edit:**
- `src/services/yahoo-finance.ts`
- `src/services/indian-stock-market-api.ts` (new)
- `src/services/cache.ts` (new)
- `src/lib/redis.ts` (update)

**Acceptance Criteria:**
- `getLiveQuote('RELIANCE.NS')` returns `{ price, change, changePercent, ... }`
- Data is cached in Redis for 5 minutes
- On API failure, falls back to cache with stale warning
- Circuit breaker opens after 5 consecutive failures

**Dependencies:** Chunk 4

---

## Chunk 6: Technical Indicators Service

**Goal:** Calculate RSI, MACD, Bollinger Bands, and Moving Averages.

**Tasks:**
1. Implement `calculateRSI(prices, period)`.
2. Implement `calculateMACD(prices)`.
3. Implement `calculateBollingerBands(prices, period)`.
4. Implement `calculateMovingAverages(prices, periods)`.
5. Add unit tests with known values.

**Files to Create/Edit:**
- `src/services/technical-indicators.ts`
- `src/services/technical-indicators/__tests__/indicators.test.ts` (new)

**Acceptance Criteria:**
- RSI for a known dataset matches expected value (±0.01)
- MACD line crosses signal line correctly
- Bollinger Bands contain 95% of price data
- All unit tests pass

**Dependencies:** Chunk 2, Chunk 5

---

## Chunk 7: Signal Generation Service

**Goal:** Generate buy/sell/hold signals with confidence scores and AI reasoning.

**Tasks:**
1. Implement signal generation logic combining technical indicators.
2. Implement confidence scoring algorithm.
3. Add mock AI reasoning generator (to be replaced with real LLM later).
4. Implement `getTopSignals()` for dashboard.
5. Add Redis caching for signals (10-minute TTL).

**Files to Create/Edit:**
- `src/services/signals.ts`
- `src/services/ai-reasoning.ts` (new)

**Acceptance Criteria:**
- Returns one of: `STRONG_BUY`, `BUY`, `HOLD`, `SELL`, `STRONG_SELL`
- Confidence score is between 0-100
- Reasoning is a non-empty string
- Signals are cached in Redis

**Dependencies:** Chunk 6

---

## Chunk 8: Signal API Route

**Goal:** Create the `/api/signal/[symbol]` endpoint with market status awareness.

**Tasks:**
1. Implement symbol validation and sanitization.
2. Fetch quote and calculate signal.
3. Tag response with `marketStatus` (`OPEN`/`CLOSED`) and `isEOD` flag.
4. Zero out `change`/`changePercent` when market is closed.
5. Add error handling for invalid symbols, API failures.

**Files to Create/Edit:**
- `src/app/api/signal/[symbol]/route.ts`
- `src/app/api/signal/[symbol]/__tests__/route.test.ts` (new)

**Acceptance Criteria:**
- `GET /api/signal/RELIANCE.NS` returns valid signal response
- When market is closed, `quote.isEOD = true` and `quote.change = 0`
- Invalid symbol returns 400 with error message
- API failure returns 503 with retry suggestion

**Dependencies:** Chunk 3, Chunk 5, Chunk 7

---

## Chunk 9: Database Schema & Migrations

**Goal:** Set up Supabase database tables and RLS policies.

**Tasks:**
1. Create SQL migration for `watchlists` table.
2. Create SQL migration for `cached_signals` table.
3. Create SQL migration for `screener_presets` table.
4. Enable RLS on all tables.
5. Create Supabase client helper functions for CRUD operations.

**Files to Create/Edit:**
- `src/lib/supabase/migrations/001_watchlists.sql` (new)
- `src/lib/supabase/migrations/002_cached_signals.sql` (new)
- `src/lib/supabase/migrations/003_screener_presets.sql` (new)
- `src/lib/supabase/client.ts` (new)
- `src/lib/supabase/repositories/watchlist.ts` (new)
- `src/lib/supabase/repositories/signal-cache.ts` (new)

**Acceptance Criteria:**
- Tables exist in Supabase dashboard
- RLS policies prevent cross-user data access
- CRUD operations work via Supabase client

**Dependencies:** Chunk 4

---

## Chunk 10: Frontend – Layout & Routing

**Goal:** Build the app shell with header, market status banner, footer, and routing.

**Tasks:**
1. Implement `Header` component with logo and search trigger.
2. Implement `MarketStatusBanner` component.
3. Implement `Footer` component.
4. Set up client-side routing for `/stock/[symbol]` page.
5. Add global CSS with design tokens.

**Files to Create/Edit:**
- `src/components/layout/Header.tsx`
- `src/components/layout/MarketStatusBanner.tsx`
- `src/components/layout/Footer.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/stock/[symbol]/page.tsx` (new)

**Acceptance Criteria:**
- Header shows logo and search button
- Banner shows "Market Closed" when `isMarketOpen()` returns false
- Footer renders at bottom of every page
- Navigating to `/stock/RELIANCE.NS` loads stock detail page

**Dependencies:** Chunk 1, Chunk 3

---

## Chunk 11: Frontend – Stock Detail Page

**Goal:** Build the main stock analysis view with charts and signal card.

**Tasks:**
1. Implement `CandlestickChart` using Lightweight Charts.
2. Implement `RSIChart`, `MACDChart`, `VolumeChart`.
3. Implement `SignalCard` with signal badge and confidence score.
4. Implement timeframe selector (1m, 5m, 15m, 1h, 1d).
5. Fetch data from `/api/signal/[symbol]` and render.

**Files to Create/Edit:**
- `src/components/charts/CandlestickChart.tsx`
- `src/components/charts/RSIChart.tsx`
- `src/components/charts/MACDChart.tsx`
- `src/components/charts/VolumeChart.tsx`
- `src/components/signals/SignalCard.tsx`
- `src/components/signals/SignalBadge.tsx`
- `src/app/stock/[symbol]/page.tsx`
- `src/hooks/useStockSignal.ts`

**Acceptance Criteria:**
- Candlestick chart renders with OHLC data
- RSI, MACD, Volume charts render below main chart
- Signal badge shows correct color for signal type
- Timeframe selector updates chart data
- EOD banner appears when market is closed

**Dependencies:** Chunk 8, Chunk 10

---

## Chunk 12: Frontend – Search & Watchlist

**Goal:** Implement fuzzy search modal and watchlist functionality.

**Tasks:**
1. Implement `SearchModal` with `⌘K` / `Ctrl+K` shortcut.
2. Integrate Fuse.js for fuzzy search on stock list.
3. Implement watchlist CRUD via Supabase.
4. Implement `useWatchlist` hook.
5. Show watchlist in sidebar or dropdown.

**Files to Create/Edit:**
- `src/components/search/SearchModal.tsx`
- `src/hooks/useWatchlist.ts`
- `src/lib/supabase/repositories/watchlist.ts` (update)
- `src/app/page.tsx` (add watchlist UI)

**Acceptance Criteria:**
- Pressing `⌘K` opens search modal
- Typing "RELI" shows RELIANCE.NS in results
- Clicking result navigates to stock page
- Adding stock to watchlist persists in Supabase
- Watchlist shows live signal badges

**Dependencies:** Chunk 9, Chunk 11

---

## Chunk 13: Screener Page

**Goal:** Build the stock screener with filters and results table.

**Tasks:**
1. Implement `ScreenerPanel` component with filter dropdowns.
2. Create `/api/screener` endpoint.
3. Implement screener logic in `src/services/signals.ts`.
4. Add pagination and sorting to results.

**Files to Create/Edit:**
- `src/components/screener/ScreenerPanel.tsx`
- `src/app/screener/page.tsx` (new)
- `src/app/api/screener/route.ts`
- `src/services/signals.ts` (update)

**Acceptance Criteria:**
- Filtering by "Buy" signal shows only BUY/STRONG_BUY stocks
- Filtering by P/E range works correctly
- Results table shows symbol, name, signal, price, confidence
- Pagination works for 100+ results

**Dependencies:** Chunk 7, Chunk 12

---

## Chunk 14: Deployment Configuration

**Goal:** Configure Render.com deployment and keep-alive.

**Tasks:**
1. Finalize `render.yaml` with all environment variables.
2. Set up cron-job.org to ping `/api/health` every 10 minutes.
3. Configure custom domain (if applicable).
4. Test production build locally with `npm run build && npm start`.

**Files to Create/Edit:**
- `render.yaml`
- `.env.example` (finalize)

**Acceptance Criteria:**
- `npm run build` succeeds without errors
- App starts correctly on Render free tier
- Health check endpoint responds within 5 seconds
- Service does not sleep during business hours (9 AM - 4 PM IST)

**Dependencies:** All previous chunks

---

## Chunk 15: Monitoring & Observability

**Goal:** Add error tracking, logging, and alerting.

**Tasks:**
1. Set up Sentry for error tracking.
2. Add structured logging to API routes.
3. Create `/api/health` response with system metrics.
4. Set up Render alerts for memory/CPU/errors.

**Files to Create/Edit:**
- `src/lib/sentry.ts` (new)
- `src/app/api/health/route.ts` (update)
- `src/middleware.ts` (update with logging)

**Acceptance Criteria:**
- Sentry captures API errors in development
- Logs include timestamp, level, endpoint, duration
- Health check returns `{ status, timestamp, memory, uptime }`
- Email alert sent if health check fails 3x in 5 minutes

**Dependencies:** Chunk 14

---

## Chunk 16: Polish & Edge Cases

**Goal:** Handle robustness edge cases from Section 17.

**Tasks:**
1. Add circuit filter detection and UI badge.
2. Add data staleness warnings.
3. Implement skeleton loaders and error boundaries.
4. Add PWA manifest and service worker.
5. Fix timezone bugs in all components.
6. Add accessibility attributes (ARIA labels, focus trap).

**Files to Create/Edit:**
- `src/services/market/circuit.ts` (new)
- `src/components/error-boundary.tsx` (new)
- `src/components/skeleton/SignalCardSkeleton.tsx` (new)
- `public/manifest.json` (new)
- `public/sw.js` (new)
- All existing components (accessibility updates)

**Acceptance Criteria:**
- Circuit badge appears when stock hits upper/lower circuit
- Stale data warning shows after 2 minutes
- Skeleton loaders display during data fetch
- App is installable as PWA
- All interactive elements are keyboard accessible
- Lighthouse accessibility score > 90

**Dependencies:** Chunks 1-15

---

## Chunk 17: Testing & QA

**Goal:** Achieve 80%+ test coverage and pass E2E flows.

**Tasks:**
1. Write unit tests for all services (target: 80% coverage).
2. Write integration tests for all API routes.
3. Write E2E tests for search, watchlist, and market status flows.
4. Run Lighthouse audit and fix issues.
5. Perform manual QA on mobile viewports.

**Files to Create/Edit:**
- `src/services/__tests__/` (new)
- `src/app/api/__tests__/` (new)
- `e2e/search.spec.ts` (new)
- `e2e/watchlist.spec.ts` (new)
- `e2e/market-status.spec.ts` (new)

**Acceptance Criteria:**
- `npm run test` passes with >80% coverage
- All E2E tests pass in headless Chromium
- Lighthouse performance > 85, accessibility > 90, best practices > 85
- No console errors in production build

**Dependencies:** Chunk 16

---

## Chunk 18: Documentation & Launch

**Goal:** Finalize docs and prepare for launch.

**Tasks:**
1. Update README with setup instructions and screenshots.
2. Add CONTRIBUTING.md with dev workflow.
3. Add CHANGELOG.md.
4. Create demo video/GIF for README.
5. Tag v1.0.0 release.

**Files to Create/Edit:**
- `README.md` (update)
- `CONTRIBUTING.md` (new)
- `CHANGELOG.md` (new)
- `docs/setup.md` (new)

**Acceptance Criteria:**
- README has clear setup steps
- New developer can clone and run in <5 minutes
- CHANGELOG lists all features and fixes
- Git tag `v1.0.0` is created

**Dependencies:** Chunk 17

---

## Quick Reference: Chunk Dependencies

```
Chunk 1  →  Chunk 2  →  Chunk 3  →  Chunk 4  →  Chunk 5  →  Chunk 6
                                                             ↓
Chunk 7  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ↑
    ↓                                                         |
Chunk 8  →  Chunk 10  →  Chunk 11  →  Chunk 12  →  Chunk 13  |
    ↓              ↓              ↓              ↓             |
Chunk 9  →  (parallel)    (parallel)    (parallel)           |
    ↓                                                        |
Chunk 14  →  Chunk 15  →  Chunk 16  →  Chunk 17  →  Chunk 18
```

**Parallel tracks after Chunk 8:**
- Track A: Chunk 9 (Database)
- Track B: Chunk 10 (Layout)
- Track C: Chunk 11 (Stock Detail)
- Track D: Chunk 12 (Search/Watchlist)

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Run lint
npm run lint

# Type check
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

---

*Document version 1.0 — September 2026*
