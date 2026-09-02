import { redis } from '@/lib/redis';

export const QUOTE_TTL_SECONDS = 300; // 5 minutes
export const HISTORICAL_TTL_SECONDS = 3600; // 1 hour

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60_000; // 1 minute

let failureCount = 0;
let circuitOpen = false;
let lastFailureTime = 0;

function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;
  if (Date.now() - lastFailureTime > CIRCUIT_BREAKER_RESET_MS) {
    circuitOpen = false;
    failureCount = 0;
    return false;
  }
  return true;
}

function recordFailure(): void {
  failureCount++;
  lastFailureTime = Date.now();
  if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpen = true;
  }
}

function recordSuccess(): void {
  failureCount = 0;
  circuitOpen = false;
}

export interface CacheResult<T> {
  data: T | null;
  stale: boolean;
  source: 'cache' | 'fresh' | 'stale-cache';
}

export async function getCached<T>(key: string): Promise<CacheResult<T>> {
  if (isCircuitOpen()) {
    try {
      const data = await redis.get<T>(key);
      return { data: data ?? null, stale: true, source: 'stale-cache' };
    } catch {
      return { data: null, stale: true, source: 'stale-cache' };
    }
  }

  try {
    const data = await redis.get<T>(key);
    if (data != null) {
      recordSuccess();
      return { data, stale: false, source: 'cache' };
    }
    return { data: null, stale: false, source: 'fresh' };
  } catch {
    recordFailure();
    return { data: null, stale: false, source: 'fresh' };
  }
}

export async function setCached<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  if (isCircuitOpen()) return;

  try {
    await redis.set(key, data, { ex: ttlSeconds });
    recordSuccess();
  } catch {
    recordFailure();
  }
}

export function quoteCacheKey(symbol: string): string {
  return `quote:${symbol}`;
}

export function historicalCacheKey(symbol: string, timeframe: string): string {
  return `historical:${symbol}:${timeframe}`;
}

export function getCircuitBreakerState(): { open: boolean; failures: number } {
  return { open: isCircuitOpen(), failures: failureCount };
}
