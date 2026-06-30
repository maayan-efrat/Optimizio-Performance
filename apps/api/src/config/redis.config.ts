import { ConnectionOptions } from 'bullmq';

/**
 * Parses REDIS_URL (Upstash format: rediss://... or redis://...)
 * and returns BullMQ-compatible connection options.
 * Returns null when REDIS_URL is not set so callers can fall back to sync mode.
 */
export function getRedisConnection(): ConnectionOptions | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const tls = parsed.protocol === 'rediss:';
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: tls ? {} : undefined,
      maxRetriesPerRequest: null,
    } as ConnectionOptions;
  } catch {
    console.warn('[Redis] Invalid REDIS_URL — queue disabled, falling back to sync processing');
    return null;
  }
}
