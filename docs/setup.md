# Setup Guide — StockSignal AI

A detailed guide for setting up StockSignal AI locally and in production.

---

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [Environment Variables](#2-environment-variables)
3. [Supabase Setup](#3-supabase-setup)
4. [Upstash Redis Setup](#4-upstash-redis-setup)
5. [Development Workflow](#5-development-workflow)
6. [Production Deployment](#6-production-deployment)
7. [Testing](#7-testing)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Local Development Setup

### Prerequisites

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js     | 18.x LTS        |
| npm         | 9.x             |
| Git         | 2.30             |

### Install

```bash
# Clone the repository
git clone https://github.com/<your-username>/stocks.git
cd stocks

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

The API routes are available at:
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/market/status`
- `http://localhost:3000/api/signal/RELIANCE.NS`

---

## 2. Environment Variables

Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | [supabase.com](https://supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key | Supabase project settings |
| `UPSTASH_REDIS_URL` | Upstash Redis endpoint URL | [upstash.com](https://upstash.com) |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis authentication token | Upstash console |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | None |
| `NEXT_PUBLIC_APP_URL` | Application URL (for CORS) | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_NAME` | Display name for the site | `StockSignal AI` |
| `NEXT_PUBLIC_COUNTRY` | Country code | `IN` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for releases | None |

---

## 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **Project Settings → API** to get:
   - `SUPABASE_URL` (copy to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` public key (copy to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Navigate to **SQL Editor** and run the migration files:

```sql
-- Run migrations from src/lib/supabase/migrations/
-- Migration 001: watchlists table
CREATE TABLE watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration 002: cached_signals table
CREATE TABLE cached_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  reasoning TEXT,
  indicators JSONB,
  timeframe TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Migration 003: screener_presets table
CREATE TABLE screener_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. Enable Row Level Security (RLS) on all tables and add policies as described in the [Security section of the spec](README.md#179-security).

---

## 4. Upstash Redis Setup

1. Go to [upstash.com](https://upstash.com) and sign up (no credit card required).
2. Create a Redis database in your preferred region.
3. Copy the **REST URL** and **Token** to your `.env.local`:

```env
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

The Redis cache is used for:
- Quote caching (5-minute TTL)
- Historical data caching (1-hour TTL)
- Signal result caching (10-minute TTL)
- Circuit breaker state (in-memory, resets after 1 minute)

---

## 5. Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

### Chunk-based Development

This project follows a chunk-based development plan. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for details.

```bash
# Example workflow for a new chunk
git checkout -b feat/chunk-XX-name
# ... implement changes ...
npm run lint && npm run typecheck && npm run test
npm run build
git commit -m "feat(chunk-XX): description"
git push origin feat/chunk-XX-name
gh pr create
```

---

## 6. Production Deployment

### Deploy to Render.com (Recommended)

The project includes a `render.yaml` configuration for Render.com's free tier.

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) and create a **Web Service**.
3. Connect your GitHub repository.
4. Render will auto-detect the `render.yaml` configuration.
5. Set the environment variables in the Render dashboard (marked as `sync: false` in `render.yaml`).

### Key Production Settings

- **Region**: Singapore (closest to India for low latency)
- **Plan**: Free (512MB RAM, 0.1 CPU)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### Keep-Alive Configuration

To prevent the free tier from sleeping, set up a health check cron job:

1. Go to [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - URL: `https://<your-app>.onrender.com/api/health`
   - Frequency: Every 10 minutes
   - During business hours: 9 AM - 4 PM IST

---

## 7. Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/path/to/test.test.ts

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```
e2e/
├── search.spec.ts              # E2E tests (full flow)

src/
├── app/api/__tests__/
│   ├── health.test.ts          # API integration tests
│   ├── market-status.test.ts
│   └── screener.test.ts
├── lib/__tests__/
│   ├── utils.test.ts           # Unit tests for utilities
│   └── validators.test.ts      # Unit tests for validation
├── lib/supabase/repositories/__tests__/
│   ├── signal-cache.test.ts    # Repository tests
│   └── watchlist.test.ts
├── services/__tests__/
│   ├── ai-reasoning.test.ts    # Unit tests for AI reasoning
│   ├── cache.test.ts           # Unit tests for cache/circuit breaker
│   ├── signals.test.ts         # Unit tests for signal generation
│   └── yahoo-finance.test.ts   # Unit tests for data fetching
└── services/market/__tests__/
    ├── circuit.test.ts         # Unit tests for circuit detection
    └── status.test.ts          # Unit tests for market status
```

### Coverage Target

- **Statements**: ≥ 80%
- **Branches**: ≥ 80%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

### Mocking Strategy

- **Redis/Supabase**: Mocked via `vi.mock()` with factory functions
- **Yahoo Finance**: Mocked at the module level to avoid network calls
- **Time**: Use `Intl.DateTimeFormat` with explicit timezone for deterministic tests

---

## 8. Troubleshooting

### "Cannot find module" errors after pulling

```bash
npm install
```

### Redis connection errors

Ensure `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` are set correctly. The app will still work without Redis (degraded performance, no caching).

### Supabase connection errors

Verify that:
1. The Supabase URL and key are correct
2. RLS policies are configured (the app works without auth for public data)
3. Tables are created via migrations

### Yahoo Finance rate limiting

If you see `YahooFinanceError: Failed after 4 attempts`, the API is rate-limited. The app automatically falls back to:
1. Cached data in Redis (if available)
2. Indian-Stock-Market-API (secondary source)
3. Stale cache with warning

### Build fails with "out of memory"

The Next.js build requires at least 1GB RAM. For local builds with limited memory:

```bash
NODE_OPTIONS="--max-old-space-size=512" npm run build
```

### Port 3000 already in use

```bash
# Kill the process on port 3000
npx kill-port 3000
# or
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```
