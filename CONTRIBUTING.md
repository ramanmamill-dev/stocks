# Contributing to StockSignal AI

Thank you for your interest in contributing! This document outlines the development workflow and guidelines.

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git** >= 2.30
- **GitHub CLI** (`gh`) — for PR creation
- A Supabase account (for local development)
- An Upstash Redis account (for caching)

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/stocks.git
cd stocks

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Upstash credentials

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

## Development Workflow

### Daily Workflow

```bash
# Start from clean main
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feat/your-feature-name

# Develop and test
npm run dev        # development server
npm run test       # run tests
npm run lint       # lint check
npm run typecheck  # type check

# Commit (follow conventional commits)
git commit -m "feat(scope): add your feature"

# Push and create PR
git push origin feat/your-feature-name
gh pr create --title "feat(scope): your feature" --body "..."
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add support for X
fix(scope): resolve bug in Y
chore(scope): update dependency Z
docs: update README with new instructions
test: add unit tests for circuit breaker
```

### Branch Naming

- `feat/feature-name` — new features
- `fix/bug-name` — bug fixes
- `chore/description` — maintenance
- `docs/section` — documentation

### Code Style

- **TypeScript** — strict mode enabled
- **ESLint** — `npm run lint` must pass before pushing
- **Prettier** — auto-formatted on commit (see `.prettierrc` if present)
- **Tailwind CSS** — use existing color palette and component patterns

### Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Target: minimum 80% coverage (statements, branches, functions, lines)
```

Test files should be placed alongside the code they test:
- Unit tests: `src/services/__tests__/*.test.ts`
- API tests: `src/app/api/__tests__/*.test.ts`
- E2E tests: `e2e/*.spec.ts`

### Chunk-based Development

This project follows a chunk-based development plan:
1. Complete chunks in order (Chunk 1 → Chunk 18)
2. Each chunk is branched and merged via PR before proceeding
3. Run `npm run lint && npm run typecheck && npm run test && npm run build` before merging

### Before Submitting a PR

- [ ] Tests pass (`npm run test`)
- [ ] Coverage >= 80% for changed files
- [ ] Lint passes (`npm run lint`)
- [ ] Typecheck passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] Mobile responsiveness verified
- [ ] Accessibility (keyboard nav, ARIA labels) verified

## Project Structure

```
stocks/
├── src/
│   ├── app/
│   │   ├── api/          # API routes (App Router)
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities, Supabase, Redis clients
│   ├── services/         # Business logic services
│   └── types/            # TypeScript type definitions
├── e2e/                  # End-to-end tests
├── public/               # Static assets, PWA manifest, service worker
├── scripts/              # Utility scripts
├── render.yaml           # Render.com deployment config
├── vitest.config.ts      # Test configuration
├── next.config.js        # Next.js configuration
└── package.json
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `UPSTASH_REDIS_URL` | Yes | Upstash Redis URL |
| `UPSTASH_REDIS_TOKEN` | Yes | Upstash Redis token |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `NEXT_PUBLIC_APP_URL` | No | App URL for CORS configuration |

## Getting Help

- Check the [Setup Guide](./docs/setup.md) for detailed instructions
- Review the [Architecture](./README.md#4-architecture) section
- Open an issue if you find a bug
