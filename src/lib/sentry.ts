export const dynamic = 'force-dynamic';

export async function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  try {
    const { init } = await import('@sentry/nextjs');
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  } catch {
    console.warn('Sentry not installed. Error tracking disabled.');
  }
}

export async function captureError(error: Error, context?: Record<string, unknown>) {
  try {
    const sentryModule = await import('@sentry/nextjs');
    sentryModule.captureException(error, {
      tags: {
        environment: process.env.NODE_ENV,
      },
      ...(context ? { contexts: { context } } : {}),
    });
  } catch {
    console.error('[ERROR]', error.message, context);
  }
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  endpoint: string;
  duration: number;
  message?: string;
  data?: Record<string, unknown>;
}

export function logRequest(entry: LogEntry): void {
  if (process.env.NODE_ENV === 'development') {
    const { timestamp, level, endpoint, duration, message, data } = entry;
    const line = `[${timestamp}] [${level.toUpperCase()}] ${endpoint} - ${duration}ms${message ? ` - ${message}` : ''}`;
    if (level === 'error') {
      console.error(line, data);
    } else if (level === 'warn') {
      console.warn(line, data);
    } else {
      console.log(line, data);
    }
  }
}
