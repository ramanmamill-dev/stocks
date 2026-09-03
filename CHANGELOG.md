# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - September 2026

### Overview
Full release of StockSignal AI — enterprise-grade web app for NSE & BSE stock analysis with real-time predictive signals.

### Added

#### Core Features
- **Real-time stock signals** — Strong Buy, Buy, Hold, Sell, Strong Sell with confidence scores (0-100)
- **Market status detection** — Accurate IST-based open/close with weekend and holiday awareness
- **EOD fallback** — Displays previous closing price when market is closed
- **Multi-timeframe analysis** — 1m, 5m, 15m, 1h, 1d intervals
- **Professional charts** — Candlestick, RSI, MACD, Volume, Bollinger Bands, Moving Averages (via Lightweight Charts)
- **Stock screener** — 20+ filters including signal type, P/E ratio, ROE, debt-to-equity, RSI, market cap, sector
- **Smart search** — Fuzzy search with `⌘K` / `Ctrl+K` shortcut (via Fuse.js)
- **Watchlist** — Save favorite stocks with live signal badges (via Supabase)
- **AI reasoning** — Natural language explanation of signal generation

#### Technical Features
- **Circuit breaker** — Automatic failure detection after 5 consecutive API errors
- **Exponential backoff** — Retry mechanism with configurable retries (default: 3)
- **Redis caching** — 5-minute TTL for quotes, 1-hour for historical data, 10-minute for signals
- **Fallback chain** — yfinance → Indian-Stock-Market-API → Redis cache → stale data warning
- **PWA support** — Installable web app with service worker and manifest
- **Accessibility** — WCAG 2.1 AA compliance with ARIA labels and keyboard navigation
- **Error boundaries** — React error boundaries for graceful failure handling
- **Skeleton loaders** — Shimmer effects during data fetch
- **Staleness indicators** — Data age warnings with configurable policies
- **Circuit detection UI** — Upper/lower circuit badges with severity levels

#### API Endpoints
- `GET /api/health` — Health check with memory usage and uptime
- `GET /api/market/status` — Current market open/closed status with IST timezone
- `GET /api/signal/[symbol]` — Stock signal with quote and technical indicators
- `GET /api/screener` — Stock screener with filters, sorting, and pagination

#### Infrastructure
- **Render.com deployment** — Optimized for free tier (512MB RAM, 0.1 CPU)
- **Keep-alive cron** — Health check ping every 10 minutes via cron-job.org
- **CORS support** — Configurable allowed origins
- **Sentry integration** — Error tracking with environment-based sampling

### Changed

#### Chunk 1: Foundation
- Initialized Next.js 14 project with App Router and TypeScript
- Configured Tailwind CSS with design tokens
- Set up ESLint and Prettier

#### Chunk 2: Shared Types & Utilities
- Added `StockQuote`, `SignalResult`, `MarketStatus` types
- Added symbol validation and sanitization (strict `.NS`/`.BO` format)
- Added price formatting with symbol-specific decimal precision
- Added timezone utilities (UTC ↔ IST)

#### Chunk 3: Market Status Service
- Implemented `isMarketOpen()` using `Intl.DateTimeFormat` for IST conversion
- Added 2026 Indian market holidays list
- Comprehensive boundary testing (9:15, 15:30, weekends, holidays)

#### Chunk 4: API Infrastructure
- Created Supabase and Upstash Redis client singletons
- Added `/api/health` and `/api/market/status` endpoints
- CORS middleware with configurable origins

#### Chunk 5: Data Layer
- Implemented `getLiveQuote()` using `yahoo-finance2`
- Implemented `getHistoricalData()` with interval/range mapping
- Added exponential backoff wrapper (3 retries, up to 8s delay)
- Redis caching layer (5min quotes, 1hr historical)
- Fallback chain: yfinance → Indian-Stock-Market-API → cache

#### Chunk 6: Technical Indicators
- `calculateRSI()` — Relative Strength Index (period 14)
- `calculateMACD()` — Moving Average Convergence Divergence
- `calculateBollingerBands()` — Middle band ± 2 standard deviations
- `calculateMovingAverages()` — SMA for multiple periods

#### Chunk 7-8: Signal Generation & API
- Combined technical indicators for signal score
- Confidence scoring algorithm (0-100)
- Signal thresholds: STRONG_BUY (80-99), BUY (60-79), HOLD (40-59), SELL (20-39), STRONG_SELL (0-19)
- EOD tagging when market is closed
- Zeroed change/changePercent when market closed

#### Chunk 9-12: Database & Frontend
- Supabase tables: `watchlists`, `cached_signals`, `screener_presets` with RLS
- React client components for layout, charts, signals, search, watchlist
- Next.js App Router with server-side rendering

#### Chunk 13: Screener Page
- Filterable stock screener with pagination and sorting
- `/api/screener` endpoint with signal, sector, PE, and exchange filters

#### Chunk 14: Deployment Configuration
- Finalize `render.yaml` with all environment variables
- Cron-job.org health check setup
- Production build verification

#### Chunk 15: Monitoring & Observability
- Sentry SDK for error tracking
- Structured logging in API routes (timestamp, level, endpoint, duration)
- Enhanced `/api/health` with system metrics (memory, uptime)
- Configurable error alerts

#### Chunk 16: Polish & Edge Cases
- Circuit filter detection and UI badge
- Data staleness warnings (2-minute warning threshold)
- Skeleton loaders and React error boundaries
- PWA manifest and service worker
- Timezone bug fixes (IST conversion accuracy)
- ARIA labels and focus trap support
- `appleWebApp` and `themeColor` metadata

#### Chunk 17: Testing & QA
- **272 tests** across 16 test files (unit, integration, E2E)
- 90.58% statement coverage (target: 80%)
- 91.4% branch coverage
- 96.77% function coverage
- Integration tests for all API routes
- Unit tests for all services and utilities
- Repository tests for Supabase data layer
- E2E tests for full signal flow and error handling

### Fixed
- N/A (initial release)

### Removed
- N/A (initial release)

---

## [0.9.0] - Pre-release (Chunks 1-16)
- All 16 development chunks completed and merged incrementally
- 21 PRs merged to main (PRs #2-#19)
- 37 unit tests (pre-Chunk 17)
